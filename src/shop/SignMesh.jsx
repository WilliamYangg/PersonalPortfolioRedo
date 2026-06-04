import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { flickerFactor } from './flicker.js';
import { playHoverBillboard, playClickBillboard } from './audio.js';
import { useOcclusionGuard } from './useOcclusionGuard.js';

// A Meshy-generated sign / logo board that already has its artwork baked
// into the mesh. We just scale it, mount it, and crank its emissive so it
// reads as a glowing billboard against the dark scene.
//
// Assumes the model's thin axis is Z (model faces +Z). Use rotation prop to
// reorient if it came out facing a different direction.
//
// If onClick is provided, hovering bumps scale + emissive and changes the
// cursor so the user knows it's interactive.
export default function SignMesh({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  targetWidth = 1.0,
  emissiveIntensity = 2.2,
  hoverScale = 1.15,
  // Optional cyberpunk flicker on the sign's emissive glow.
  // Pass { frequency, amplitude, seed } to enable.
  flicker,
  onClick,
  ...rest
}) {
  const { scene } = useGLTF(src);
  const [hover, setHover] = useState(false);
  const groupRef = useRef();
  const interactive = typeof onClick === 'function';
  const isOccluded = useOcclusionGuard();

  // Snapshot the clone + its original unscaled size ONCE. Reading the bbox
  // on every render is unsafe: R3F mutates cloned.scale each render, so
  // Box3.setFromObject would return a size that already reflects the
  // previous render's scale — causing a runaway feedback loop where each
  // targetWidth change moves the size in the wrong direction.
  const { cloned, originalSize } = useMemo(() => {
    const c = scene.clone(true);
    c.scale.set(1, 1, 1);
    c.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(c);
    const s = new THREE.Vector3();
    box.getSize(s);
    return { cloned: c, originalSize: s };
  }, [scene]);

  const scale = useMemo(() => {
    if (!isFinite(originalSize.x) || originalSize.x <= 0) return 1;
    return targetWidth / originalSize.x;
  }, [originalSize, targetWidth]);

  useEffect(() => {
    cloned.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (!obj.material) return;
      const m = obj.material.clone();
      const hasEmissive =
        m.emissiveMap ||
        (m.emissive && m.emissive.r + m.emissive.g + m.emissive.b > 0);
      if (!hasEmissive) {
        m.emissive = new THREE.Color(0xffffff);
        m.emissiveMap = m.map;
      }
      m.userData.baseEmissive = emissiveIntensity;
      m.emissiveIntensity = emissiveIntensity;
      m.toneMapped = false;
      obj.material = m;
    });
  }, [cloned, emissiveIntensity]);

  // Smoothly lerp group scale + material emissive toward hover target.
  // Layered on top: an optional cyberpunk flicker multiplier.
  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const target = hover && interactive ? hoverScale : 1;
    const cur = groupRef.current.scale.x;
    const next = THREE.MathUtils.lerp(cur, target, Math.min(1, dt * 10));
    groupRef.current.scale.setScalar(next);

    const baseTarget = hover && interactive ? emissiveIntensity * 1.5 : emissiveIntensity;
    if (flicker) {
      // Hard cut — set directly, no lerp, so flicker drops are instant.
      const m = flickerFactor(
        state.clock.elapsedTime,
        flicker.frequency ?? 3,
        flicker.amplitude ?? 0.6,
        flicker.seed ?? 0,
      );
      const targetEm = baseTarget * m;
      cloned.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.material.emissiveIntensity = targetEm;
        }
      });
    } else {
      cloned.traverse((obj) => {
        if (obj.isMesh && obj.material) {
          obj.material.emissiveIntensity = THREE.MathUtils.lerp(
            obj.material.emissiveIntensity,
            baseTarget,
            Math.min(1, dt * 10),
          );
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={1}
      onClick={interactive ? (e) => {
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
          if (!prev) playHoverBillboard();
          return true;
        });
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (!interactive) return;
        setHover(false);
        document.body.style.cursor = 'default';
      }}
      {...rest}
    >
      <primitive object={cloned} scale={scale} />
    </group>
  );
}

useGLTF.preload('/models/dappalogo.glb');
