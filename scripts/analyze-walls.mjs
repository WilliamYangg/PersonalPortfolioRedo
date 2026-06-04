// Read all vertex positions from a GLB and find planar surfaces by
// histogramming each axis. Wall planes show up as spikes.
//
// usage: node analyze-walls.mjs <path.glb> [scale]
//        (scale defaults to 1 — pass the runtime scale we apply, e.g. 1.58
//         for shop.glb at targetHeight=3.0)

import { readFileSync } from 'node:fs';

const path = process.argv[2];
const scale = parseFloat(process.argv[3] || '1');
if (!path) {
  console.error('usage: node analyze-walls.mjs <path.glb> [scale]');
  process.exit(1);
}

const buf = readFileSync(path);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);

if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('Not a GLB');

const jsonLen = dv.getUint32(12, true);
const jsonBytes = buf.subarray(20, 20 + jsonLen);
const gltf = JSON.parse(new TextDecoder().decode(jsonBytes));

// BIN chunk follows the JSON chunk
const binOffset = 20 + jsonLen;
const binChunkLen = dv.getUint32(binOffset, true);
const binStart = binOffset + 8;

const accessors = gltf.accessors;
const bufferViews = gltf.bufferViews;

function readPositions(accessorIndex) {
  const acc = accessors[accessorIndex];
  const bv = bufferViews[acc.bufferView];
  const offset = binStart + (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const count = acc.count;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    out[i] = dv.getFloat32(offset + i * 4, true);
  }
  return out;
}

// Concatenate all POSITION accessors
const all = [];
for (const m of gltf.meshes) {
  for (const p of m.primitives) {
    if (p.attributes?.POSITION != null) {
      const arr = readPositions(p.attributes.POSITION);
      for (let i = 0; i < arr.length; i++) all.push(arr[i] * scale);
    }
  }
}

console.log(`Total vertex coords: ${all.length} (${all.length / 3} verts)`);

// Bucket each axis into a histogram, find peak planes.
function analyzeAxis(axis, name) {
  const vals = [];
  for (let i = axis; i < all.length; i += 3) vals.push(all[i]);
  vals.sort((a, b) => a - b);

  const min = vals[0];
  const max = vals[vals.length - 1];
  const buckets = 80;
  const range = max - min;
  const hist = new Array(buckets).fill(0);
  for (const v of vals) {
    const b = Math.min(buckets - 1, Math.floor(((v - min) / range) * buckets));
    hist[b]++;
  }

  // Find top 5 spike buckets
  const indexed = hist.map((c, i) => ({
    pos: min + (i + 0.5) * (range / buckets),
    count: c,
  }));
  indexed.sort((a, b) => b.count - a.count);

  console.log(`\n--- ${name} axis ---`);
  console.log(`range: ${min.toFixed(3)} → ${max.toFixed(3)} (size ${(max - min).toFixed(3)})`);
  console.log(`percentiles 5/50/95/99: ${vals[Math.floor(vals.length * 0.05)].toFixed(3)}, ${vals[Math.floor(vals.length * 0.5)].toFixed(3)}, ${vals[Math.floor(vals.length * 0.95)].toFixed(3)}, ${vals[Math.floor(vals.length * 0.99)].toFixed(3)}`);
  console.log('top dense planes (likely walls/floors/ceilings):');
  for (let i = 0; i < 6; i++) {
    const e = indexed[i];
    console.log(`  ${name}=${e.pos.toFixed(3)}  (${e.count} verts in bucket)`);
  }
}

analyzeAxis(0, 'X');
analyzeAxis(1, 'Y');
analyzeAxis(2, 'Z');
