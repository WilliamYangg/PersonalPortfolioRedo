import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Loads the Meshy-generated shop GLB and:
//   - scales it so the tallest axis ≈ targetHeight meters
//   - lifts it so the model's base sits on y=0
//   - enables shadow casting/receiving on every mesh inside
//
// If the model faces the wrong way after import, pass `rotationY` in radians
// (e.g. Math.PI to flip back-to-front).
export default function ShopMesh({ src = '/models/shop.glb', targetHeight = 3.0, rotationY = 0 }) {
  const { scene } = useGLTF(src);

  // Clone so we don't mutate the cached source if this component re-mounts.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Compute bounding box of the cloned scene to derive scale + base lift.
  const { scale, baseLift } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = targetHeight / size.y;
    const lift = -box.min.y * s;
    return { scale: s, baseLift: lift };
  }, [cloned, targetHeight]);

  // Tweak the shop's material so it doesn't read as flat grey. Approach:
  //   - lower roughness + a touch of metalness so it picks up rim light from
  //     the neon spill lights instead of swallowing it,
  //   - tiny violet emissive so unlit areas don't go pure black,
  //   - onBeforeCompile injects procedural noise that adds streaky grime + a
  //     three-zone color tint (teal / magenta / amber blobs). This is a
  //     shader-only fake — no extra geometry. Real geometric detail (vents,
  //     pipes, moss, AC unit) should still come from Meshy GLBs.
  useEffect(() => {
    cloned.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (!obj.material) return;

      const m = obj.material.clone();
      m.roughness = 0.7;
      m.metalness = 0.18;
      m.emissive = new THREE.Color(0x1a0e22);
      m.emissiveIntensity = 0.5;

      m.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>\nvarying vec3 vWorldPos;`,
          )
          .replace(
            '#include <worldpos_vertex>',
            `#include <worldpos_vertex>\nvWorldPos = worldPosition.xyz;`,
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
             varying vec3 vWorldPos;
             float hash(vec3 p) {
               p = fract(p * 0.3183099 + 0.1);
               p *= 17.0;
               return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
             }
             float vnoise(vec3 p) {
               vec3 i = floor(p);
               vec3 f = fract(p);
               f = f * f * (3.0 - 2.0 * f);
               return mix(
                 mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                     mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                     mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
                 f.z);
             }`,
          )
          .replace(
            '#include <map_fragment>',
            `#include <map_fragment>
             // Cache noise samples — reused below in roughnessmap_fragment.
             float n_grime = vnoise(vWorldPos * 8.0);
             float n_mid   = vnoise(vWorldPos * 2.3);
             float n_low   = vnoise(vWorldPos * 0.6);
             float vertical = smoothstep(2.5, 0.0, vWorldPos.y);

             // Zone tinting (teal / magenta / amber)
             vec3 zoneTint = mix(vec3(0.20, 0.55, 0.65), vec3(0.65, 0.20, 0.50), smoothstep(0.3, 0.7, n_low));
             zoneTint = mix(zoneTint, vec3(0.65, 0.45, 0.20), smoothstep(0.65, 0.85, n_mid));
             diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * zoneTint * 1.6, 0.4);

             // Vertical dirt streaks + speckle
             diffuseColor.rgb *= 1.0 - vertical * n_grime * 0.45;
             diffuseColor.rgb *= 0.82 + n_grime * 0.35;

             // Horizontal panel seams every 0.5m
             float seamY = abs(fract(vWorldPos.y * 2.0) - 0.5);
             diffuseColor.rgb *= 1.0 - smoothstep(0.04, 0.0, seamY) * 0.45;

             // Moss creep at the base — reuse n_grime for masking
             float mossMask = smoothstep(0.7, 0.0, vWorldPos.y)
                            * smoothstep(0.45, 0.8, n_grime);
             diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.18, 0.40, 0.14) * 3.0, mossMask * 0.7);

             // Rust patches (reuses n_mid)
             float rustMask = smoothstep(0.55, 0.85, n_mid) * smoothstep(2.4, 0.4, vWorldPos.y);
             diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.55, 0.22, 0.08) * 2.5, rustMask * 0.5);`,
          )
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>
             // Wet patches use n_low (already sampled above)
             float wet = smoothstep(0.62, 0.88, n_low);
             roughnessFactor *= 1.0 - 0.55 * wet;
             roughnessFactor = clamp(roughnessFactor + rustMask * 0.5, 0.0, 1.0);`,
          );
      };
      m.customProgramCacheKey = () => 'shopMat_v2';

      obj.material = m;
    });
  }, [cloned]);

  return (
    <primitive object={cloned} position={[0, baseLift, 0]} scale={scale} rotation={[0, rotationY, 0]} />
  );
}

useGLTF.preload('/models/shop.glb');
