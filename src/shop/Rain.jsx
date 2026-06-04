import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Cyberpunk rain — N short line streaks falling inside an XZ box around the
// scene. Each streak is two vertices (top + bottom) in a single BufferGeometry,
// rendered as LineSegments. Per-streak speed variance prevents the whole field
// from falling in lockstep (which made it look like horizontal bars sweeping
// down). dt is clamped so a big frame hitch (tab unfocus, GC pause) doesn't
// teleport every streak below ground and respawn them as one sheet.
export default function Rain({
  count = 2000,
  area = 10,         // half-size of the XZ box rain falls in
  height = 8,        // top of rain volume in meters
  speed = 14,        // base m/s downward — each streak gets 0.7x–1.3x of this
  windX = 0.4,       // m/s horizontal drift (positive = +X)
  streakLength = 0.25,
  color = '#aef6ff',
  opacity = 0.45,
}) {
  const ref = useRef();

  const { geometry, speeds } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 2 * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * area * 2;
      const y = Math.random() * height;
      const z = (Math.random() - 0.5) * area * 2;
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = y + streakLength;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z;
      speeds[i] = 0.7 + Math.random() * 0.6;
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: g, speeds };
  }, [count, area, height, streakLength]);

  useFrame((_, dt) => {
    const cdt = Math.min(dt, 0.05);
    const arr = geometry.attributes.position.array;
    const drift = cdt * windX;
    for (let i = 0; i < count; i++) {
      const idx = i * 6;
      const fall = cdt * speed * speeds[i];
      arr[idx + 0] += drift;
      arr[idx + 1] -= fall;
      arr[idx + 3] += drift;
      arr[idx + 4] -= fall;
      if (arr[idx + 4] < 0) {
        const x = (Math.random() - 0.5) * area * 2;
        const z = (Math.random() - 0.5) * area * 2;
        const yJitter = Math.random() * 0.5;
        arr[idx + 0] = x;
        arr[idx + 1] = height + streakLength + yJitter;
        arr[idx + 2] = z;
        arr[idx + 3] = x;
        arr[idx + 4] = height + yJitter;
        arr[idx + 5] = z;
        speeds[i] = 0.7 + Math.random() * 0.6;
      }
    }
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref} geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        toneMapped={false}
        depthWrite={false}
      />
    </lineSegments>
  );
}
