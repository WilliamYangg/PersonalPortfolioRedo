import { useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// Returns a function that checks whether a pointer event is hitting the
// target group through some occluding mesh (i.e. the back-of-the-building
// billboards being "clicked" through the wall). R3F's event system raycasts
// the whole scene, so we just confirm the first hit on the camera→point ray
// belongs to our own group. If something else is closer, treat the event as
// occluded and bail.
export function useOcclusionGuard() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster()).current;
  const dir = useRef(new THREE.Vector3()).current;

  return (e, group) => {
    if (!group) return false;
    dir.copy(e.point).sub(camera.position).normalize();
    raycaster.set(camera.position, dir);
    const hits = raycaster.intersectObject(scene, true);
    if (hits.length === 0) return false;
    const first = hits[0];
    // Walk parents to see if the first hit is part of our group.
    let obj = first.object;
    while (obj) {
      if (obj === group) return false;
      obj = obj.parent;
    }
    // First hit is some other mesh. If it's meaningfully closer than our
    // intersection, the billboard is hidden behind it — bail.
    return first.distance < e.distance - 0.05;
  };
}
