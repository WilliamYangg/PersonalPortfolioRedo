// All dimensions live here so the building, props, and camera stay in sync.
// Units are meters. The shop sits centered on the origin, footprint on y=0.
// Front face = +Z. Back face = -Z. Right side = +X. Left side = -X.

export const SHOP = {
  width: 5.0,    // X dimension
  depth: 4.0,    // Z dimension
  height: 3.0,   // Y dimension (interior height)
  wallThickness: 0.15,
  roofOverhang: 0.2,
  signBoardHeight: 0.6,
  signBoardOffset: 0.5, // how far above roof the sign rises
};

// Convenience accessors for placing things on each face.
// Use these to position wall-mounted signs/screens/Meshy props.
export const FACES = {
  front:  { z:  SHOP.depth / 2 + 0.01, normalY: 0 },           // +Z, faces camera at z=∞
  back:   { z: -SHOP.depth / 2 - 0.01, normalY: Math.PI },
  left:   { x: -SHOP.width / 2 - 0.01, normalY:  Math.PI / 2 },
  right:  { x:  SHOP.width / 2 + 0.01, normalY: -Math.PI / 2 },
  roof:   { y:  SHOP.height + 0.01 },
};
