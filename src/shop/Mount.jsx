import { SHOP, FACES } from './layout.js';

// Wall mount helper. Place a child on a named wall using uv-style coords:
//   u: 0 = left edge of wall, 1 = right edge
//   v: 0 = floor, 1 = top of wall
// The child is positioned and rotated so it sits flush against the chosen face.
// Pass `offset` to push the child outward from the wall (positive = away from interior).
//
// Example:
//   <Mount face="front" u={0.2} v={0.7}>
//     <Sign text="OPEN" color="#ff2d75" />
//   </Mount>
export default function Mount({ face, u = 0.5, v = 0.5, offset = 0.02, children }) {
  const W = SHOP.width;
  const H = SHOP.height;
  const D = SHOP.depth;

  let position, rotation;

  if (face === 'front') {
    position = [(u - 0.5) * W, v * H, FACES.front.z + offset];
    rotation = [0, 0, 0];
  } else if (face === 'back') {
    position = [(0.5 - u) * W, v * H, FACES.back.z - offset];
    rotation = [0, Math.PI, 0];
  } else if (face === 'left') {
    position = [FACES.left.x - offset, v * H, (0.5 - u) * D];
    rotation = [0, -Math.PI / 2, 0];
  } else if (face === 'right') {
    position = [FACES.right.x + offset, v * H, (u - 0.5) * D];
    rotation = [0, Math.PI / 2, 0];
  } else if (face === 'roof') {
    position = [(u - 0.5) * W, FACES.roof.y + offset, (0.5 - v) * D];
    rotation = [-Math.PI / 2, 0, 0];
  } else {
    position = [0, 0, 0];
    rotation = [0, 0, 0];
  }

  return (
    <group position={position} rotation={rotation}>
      {children}
    </group>
  );
}
