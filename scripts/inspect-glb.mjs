// Quick GLB inspector — prints scene structure and accessor min/max so we
// know the model's bounding box without loading three.js in node.
import { readFileSync } from 'node:fs';

const path = process.argv[2];
if (!path) {
  console.error('usage: node inspect-glb.mjs <path.glb>');
  process.exit(1);
}

const buf = readFileSync(path);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

// Header
const magic = dv.getUint32(0, true);
const version = dv.getUint32(4, true);
const length = dv.getUint32(8, true);
if (magic !== 0x46546c67) throw new Error('Not a GLB');

// First chunk: JSON
const jsonChunkLen = dv.getUint32(12, true);
const jsonChunkType = dv.getUint32(16, true);
if (jsonChunkType !== 0x4e4f534a) throw new Error('Expected JSON chunk');
const jsonBytes = buf.subarray(20, 20 + jsonChunkLen);
const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

console.log('=== GLB info ===');
console.log('version:', version, 'length:', length);
console.log('asset:', gltf.asset);
console.log('scenes:', gltf.scenes?.length, 'nodes:', gltf.nodes?.length, 'meshes:', gltf.meshes?.length);
console.log('materials:', gltf.materials?.length, 'textures:', gltf.textures?.length, 'images:', gltf.images?.length);
console.log('animations:', gltf.animations?.length || 0);

// Compute bounding box across all POSITION accessors
const accessors = gltf.accessors || [];
let bbMin = [Infinity, Infinity, Infinity];
let bbMax = [-Infinity, -Infinity, -Infinity];
for (const m of gltf.meshes || []) {
  for (const prim of m.primitives) {
    const pIdx = prim.attributes?.POSITION;
    if (pIdx == null) continue;
    const a = accessors[pIdx];
    if (a?.min && a?.max) {
      for (let i = 0; i < 3; i++) {
        bbMin[i] = Math.min(bbMin[i], a.min[i]);
        bbMax[i] = Math.max(bbMax[i], a.max[i]);
      }
    }
  }
}
console.log('\n=== bounding box (model space) ===');
console.log('min:', bbMin);
console.log('max:', bbMax);
console.log('size:', bbMax.map((v, i) => (v - bbMin[i]).toFixed(3)));
console.log('center:', bbMax.map((v, i) => ((v + bbMin[i]) / 2).toFixed(3)));

// Top-level node names
console.log('\n=== top-level nodes ===');
for (const sceneIdx of (gltf.scenes?.[0]?.nodes || [])) {
  const n = gltf.nodes[sceneIdx];
  console.log(`- ${n.name || `(unnamed-${sceneIdx})`}${n.mesh != null ? ` [mesh ${n.mesh}]` : ''}${n.children ? ` (${n.children.length} children)` : ''}`);
}

// Material names (useful for spotting emissive parts we may want to tweak)
console.log('\n=== materials ===');
for (let i = 0; i < (gltf.materials || []).length; i++) {
  const mat = gltf.materials[i];
  const em = mat.emissiveFactor && mat.emissiveFactor.some(v => v > 0);
  console.log(`- [${i}] ${mat.name || '(unnamed)'}${em ? ' EMISSIVE' : ''}`);
}
