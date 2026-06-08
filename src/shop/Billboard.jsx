import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import AdScreen from './AdScreen.jsx';
import { flickerFactor } from './flicker.js';
import { playHoverBillboard, playClickBillboard } from './audio.js';
import { useOcclusionGuard } from './useOcclusionGuard.js';

// Wall-mounted billboard. Loads a Meshy GLB (the frame/bezel/posts) and
// stamps an AdScreen (image or video plane) onto its front face.
//
// Usage:
//   <Billboard
//     src="/models/billboard-1.glb"
//     position={[-1.4, 1.8, 0]}     // world position of billboard center
//     rotation={[0, -Math.PI / 2, 0]} // face -X (left wall, for example)
//     targetWidth={1.2}              // billboard width in meters
//     screen={{
//       image: '/pictures/cbalogo.webp',
//       width: 0.85,
//       height: 0.85,
//       offset: [0, 0, 0.005],       // tweak if screen z-fights with bezel
//     }}
//   />
//
// The GLB is assumed to have its thin axis = Z (front facing +Z). If your
// billboard came out with a different orientation, rotate it via the
// rotation prop above, or pre-rotate via meshRotation.
export default function Billboard({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  meshRotation = [0, 0, 0],
  targetWidth = 1.0,
  // Optional. When provided, the mesh is stretched non-uniformly so X is
  // sized to targetWidth and Y to targetHeight (the bezel will look
  // distorted but the screen aspect changes to whatever you want).
  targetHeight,
  meshEmissiveIntensity = 1.6,
  // Squashes the mesh along its thin axis (model Z = "fatness"). 1 = no
  // change, 0.3 = 70% thinner. The screen offset's z is also scaled to
  // stay flush with the squashed bezel surface.
  depthScale = 1,
  // Optional cyberpunk flicker on the mesh emissive + screen emissive.
  // Pass { frequency, amplitude, seed } to enable.
  flicker,
  hoverScale,
  onClick,
  screen,
  ...rest
}) {
  const [hover, setHover] = useState(false);
  const groupRef = useRef();
  const interactive = hoverScale != null || typeof onClick === 'function';
  const { scene } = useGLTF(src);
  const isOccluded = useOcclusionGuard();

  // Snapshot clone + ORIGINAL (unscaled) bbox once. See SignMesh.jsx for
  // why reading bbox on every render causes a runaway feedback loop.
  const { cloned, originalSize, originalMaxZ } = useMemo(() => {
    const c = scene.clone(true);
    c.scale.set(1, 1, 1);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const s = new THREE.Vector3();
    box.getSize(s);
    return { cloned: c, originalSize: s, originalMaxZ: box.max.z };
  }, [scene]);

  const { scaleX, scaleY, frontZ } = useMemo(() => {
    if (!isFinite(originalSize.x) || originalSize.x <= 0) {
      return { scaleX: 1, scaleY: 1, frontZ: 0 };
    }
    const sx = targetWidth / originalSize.x;
    const sy = targetHeight != null ? targetHeight / originalSize.y : sx;
    return { scaleX: sx, scaleY: sy, frontZ: originalMaxZ * sx };
  }, [originalSize, originalMaxZ, targetWidth, targetHeight]);

  useEffect(() => {
    cloned.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      if (!o.material) return;
      const m = o.material.clone();
      const hasEmissive =
        m.emissiveMap ||
        (m.emissive && m.emissive.r + m.emissive.g + m.emissive.b > 0);
      if (!hasEmissive) {
        m.emissive = new THREE.Color(0xffffff);
        m.emissiveMap = m.map;
      }
      m.emissiveIntensity = meshEmissiveIntensity;
      m.toneMapped = false;
      o.material = m;
    });
  }, [cloned, meshEmissiveIntensity]);

  const rawOffset = screen?.offset || [0, 0, frontZ + 0.005];
  const offset = [rawOffset[0], rawOffset[1], rawOffset[2] * depthScale];
  const baseScreenEm = screen?.emissiveIntensity ?? 0.35;
  const screenGroupRef = useRef();

  useFrame((state, dt) => {
    if (groupRef.current && hoverScale != null) {
      const target = hover && interactive ? hoverScale : 1;
      const cur = groupRef.current.scale.x;
      const next = THREE.MathUtils.lerp(cur, target, Math.min(1, dt * 10));
      groupRef.current.scale.setScalar(next);
    }
    if (!flicker) return;
    const m = flickerFactor(
      state.clock.elapsedTime,
      flicker.frequency ?? 3,
      flicker.amplitude ?? 0.6,
      flicker.seed ?? 0,
    );
    cloned.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.emissiveIntensity = meshEmissiveIntensity * m;
      }
    });
    if (screenGroupRef.current) {
      screenGroupRef.current.traverse((o) => {
        if (o.isMesh && o.material) {
          o.material.emissiveIntensity = baseScreenEm * m;
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={typeof onClick === 'function' ? (e) => {
        if (isOccluded(e, groupRef.current)) return;
        playClickBillboard();
        onClick(e);
      } : undefined}
      onPointerOver={(e) => {
        if (!interactive) return;
        if (isOccluded(e, groupRef.current)) return;
        e.stopPropagation();
        // onPointerOver fires once per child mesh — only play the hover SFX
        // on the first enter (when we weren't already hovered).
        setHover((prev) => {
          if (!prev && typeof onClick === 'function') playHoverBillboard();
          return true;
        });
        if (typeof onClick === 'function') document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!interactive) return;
        setHover(false);
        if (typeof onClick === 'function') document.body.style.cursor = 'default';
      }}
      {...rest}
    >
      <primitive
        object={cloned}
        scale={[scaleX, scaleY, scaleX * depthScale]}
        rotation={meshRotation}
      />
      {screen && (
        <group position={offset} ref={screenGroupRef}>
          <AdScreen
            image={screen.image}
            video={screen.video}
            width={screen.width || targetWidth * 0.7}
            height={screen.height || targetWidth * 0.7}
            bezel={false}
            emissiveIntensity={baseScreenEm}
            fit={screen.fit}
          />
        </group>
      )}
    </group>
  );
}

useGLTF.preload('/models/billboard-1.glb');
