#!/usr/bin/env node
// Generate a single pixel-art sprite via PixelLab and save it as a PNG.
//
// Usage:
//   PIXELLAB_API_KEY=... node scripts/generate-sprite.mjs \
//     --name building-antenna \
//     --w 96 --h 320 \
//     --desc "cyberpunk skyscraper, neon lit windows, antenna on top, very tall, side view"
//
// Optional flags: --model pixflux|bitforge (default pixflux),
//                 --transparent (transparent background),
//                 --negative "blurry, photoreal" (negative prompt).

import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Load PIXELLAB_API_KEY from .env.local if not already set
if (!process.env.PIXELLAB_API_KEY) {
  try {
    const env = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
    for (const line of env.split('\n')) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {}
}
const KEY = process.env.PIXELLAB_API_KEY;
if (!KEY) {
  console.error('PIXELLAB_API_KEY not set. Add to .env.local or export it.');
  process.exit(1);
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((out, cur, i, all) => {
    if (cur.startsWith('--')) {
      const key = cur.slice(2);
      const next = all[i + 1];
      if (!next || next.startsWith('--')) out.push([key, true]);
      else out.push([key, next]);
    }
    return out;
  }, [])
);

const name = args.name;
const w = parseInt(args.w ?? '128', 10);
const h = parseInt(args.h ?? '128', 10);
const desc = args.desc;
const model = args.model ?? 'pixflux';
const transparent = !!args.transparent;
const negative = args.negative ?? null;

if (!name || !desc) {
  console.error('Need --name and --desc');
  process.exit(1);
}

const body = {
  description: desc,
  image_size: { width: w, height: h },
};
if (transparent) body.transparent_background = true;
if (negative) body.negative_description = negative;

const url = `https://api.pixellab.ai/v1/generate-image-${model}`;
console.log(`[pixellab] ${model} ${w}x${h} -> ${name}.png`);
const t0 = Date.now();
const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

if (!res.ok) {
  const txt = await res.text();
  console.error(`HTTP ${res.status}: ${txt.slice(0, 600)}`);
  process.exit(2);
}

const json = await res.json();
const dataUrl = json.image?.base64 ?? json.image?.image ?? '';
const b64 = dataUrl.replace(/^data:image\/png;base64,/, '');
if (!b64) {
  console.error('No base64 image in response:', JSON.stringify(json).slice(0, 400));
  process.exit(3);
}

await mkdir(resolve(ROOT, 'public/sprites'), { recursive: true });
const out = resolve(ROOT, `public/sprites/${name}.png`);
await writeFile(out, Buffer.from(b64, 'base64'));

const ms = Date.now() - t0;
const credits = json.usage?.credits ?? '?';
console.log(`  ✓ saved ${out} (${ms}ms, ${credits} credit)`);
