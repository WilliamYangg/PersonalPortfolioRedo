import { useThree, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// Quick zoom-in intro that runs when `active` flips true. Snaps the camera
// to a far position, then lerps it toward the rest pose. Calls onComplete
// when it gets close enough. Mounts inside <Canvas>.
//
// While active, the parent should disable OrbitControls so the lerp isn't
// fighting the user.
export default function CameraIntro({ active, rest, onComplete }) {
  const { camera } = useThree();
  const startedRef = useRef(false);
  const restVec = useRef(new THREE.Vector3()).current;
  restVec.set(rest[0], rest[1], rest[2]);

  useFrame((_, dt) => {
    if (!active) {
      startedRef.current = false;
      return;
    }
    if (!startedRef.current) {
      // Snap to a far-out starting pose along the rest direction so the
      // motion reads as "rushing in toward the shop."
      camera.position.set(rest[0] * 2.6, rest[1] + 3.5, rest[2] * 2.8);
      startedRef.current = true;
    }
    camera.position.lerp(restVec, Math.min(1, dt * 2.2));
    camera.lookAt(0, 1, 0);
    if (camera.position.distanceTo(restVec) < 0.04) {
      camera.position.copy(restVec);
      onComplete?.();
    }
  });

  return null;
}
