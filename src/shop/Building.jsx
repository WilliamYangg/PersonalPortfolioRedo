import { useMemo } from 'react';
import * as THREE from 'three';
import { SHOP } from './layout.js';

// Detailed cyberpunk storefront, hand-assembled.
// Procedural canvas textures give walls grime/seams without external assets.
// Geometry layers: base trim → wall panels (with recessed seams) → top trim
//                  + awning + door + window mullions + rooftop HVAC/antenna
//                  + side-wall conduits + vents + neon tube outline.

function makeConcreteTexture(w = 512, h = 512, opts = {}) {
  const {
    base = '#1a1330',
    grime = '#0a0418',
    streak = '#2a1850',
    seamColor = '#04020a',
    panelsX = 4,
    panelsY = 3,
    repeatX = 1,
    repeatY = 1,
  } = opts;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // base
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  // dirt blobs
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 6 + Math.random() * 40;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, grime + 'cc');
    g.addColorStop(1, grime + '00');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // vertical streaks (water stains)
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * w;
    const sw = 1 + Math.random() * 3;
    const sh = 40 + Math.random() * 220;
    const y = Math.random() * (h - sh);
    ctx.fillStyle = streak;
    ctx.fillRect(x, y, sw, sh);
  }
  ctx.globalAlpha = 1;

  // panel seams (recessed grid)
  ctx.strokeStyle = seamColor;
  ctx.lineWidth = 2;
  for (let i = 1; i < panelsX; i++) {
    const x = (i / panelsX) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = 1; i < panelsY; i++) {
    const y = (i / panelsY) * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // noise speckle
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 24;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRoughnessTexture(w = 512, h = 512) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#888';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 600; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const r = 4 + Math.random() * 30;
    const v = 80 + Math.random() * 120;
    ctx.fillStyle = `rgba(${v},${v},${v},0.4)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export default function Building() {
  const W = SHOP.width;
  const H = SHOP.height;
  const D = SHOP.depth;
  const T = SHOP.wallThickness;

  // Front-facade window cutout
  const winW = W * 0.5;
  const winH = H * 0.55;
  const winSillY = H * 0.2;
  const winTopY = winSillY + winH;
  const winHalfW = winW / 2;

  // One texture per face so panel scale reads at correct aspect.
  const tex = useMemo(
    () => ({
      front: makeConcreteTexture(512, 512, { panelsX: 5, panelsY: 4, repeatX: 1, repeatY: 1 }),
      side:  makeConcreteTexture(512, 512, { panelsX: 4, panelsY: 4, repeatX: 1, repeatY: 1 }),
      back:  makeConcreteTexture(512, 512, { panelsX: 5, panelsY: 4, base: '#150a26' }),
      trim:  makeConcreteTexture(256, 64,  { panelsX: 8, panelsY: 1, base: '#0a0418', grime: '#000000', seamColor: '#000000' }),
      rough: makeRoughnessTexture(),
    }),
    []
  );

  // Slight forward offset so trim/panels don't z-fight with wall.
  const eps = 0.001;
  const facadeZ = D / 2 - T / 2;

  return (
    <group name="shop-building">
      {/* ============================================================
          FOUNDATION + FLOOR SLAB (stoop)
         ============================================================ */}
      <mesh position={[0, T / 2, 0]} receiveShadow>
        <boxGeometry args={[W + 0.5, T, D + 0.5]} />
        <meshStandardMaterial color="#06030d" roughness={0.7} metalness={0.4} />
      </mesh>
      {/* Curb edge — slim emissive line at floor */}
      <mesh position={[0, T + 0.01, D / 2 + 0.22]}>
        <boxGeometry args={[W + 0.5, 0.015, 0.02]} />
        <meshStandardMaterial color="#ff2d75" emissive="#ff2d75" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>

      {/* ============================================================
          BACK WALL
         ============================================================ */}
      <mesh position={[0, H / 2, -D / 2 + T / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, T]} />
        <meshStandardMaterial map={tex.back} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>

      {/* ============================================================
          LEFT WALL + side detail (pipes, vent, AC unit)
         ============================================================ */}
      <mesh position={[-W / 2 + T / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, D]} />
        <meshStandardMaterial map={tex.side} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>
      {/* Vertical conduit pipes on left wall */}
      {[-0.6, -0.3, 1.0].map((z, i) => (
        <mesh key={`lp${i}`} position={[-W / 2 + 0.06, H * 0.55, z]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, H * 0.9, 10]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
      ))}
      {/* Pipe brackets */}
      {[-0.6, -0.3, 1.0].flatMap((z, i) =>
        [0.6, 1.6, 2.5].map((y, j) => (
          <mesh key={`lpb${i}-${j}`} position={[-W / 2 + 0.07, y, z]}>
            <boxGeometry args={[0.04, 0.06, 0.12]} />
            <meshStandardMaterial color="#2a2638" roughness={0.6} metalness={0.5} />
          </mesh>
        ))
      )}
      {/* Wall vent grille */}
      <group position={[-W / 2 + 0.02, 1.2, -1.2]}>
        <mesh>
          <boxGeometry args={[0.04, 0.35, 0.5]} />
          <meshStandardMaterial color="#0a0814" roughness={0.7} metalness={0.6} />
        </mesh>
        {[-0.12, -0.06, 0, 0.06, 0.12].map((y) => (
          <mesh key={y} position={[0.025, y, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.46]} />
            <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ============================================================
          RIGHT WALL + side detail (junction box, vent)
         ============================================================ */}
      <mesh position={[W / 2 - T / 2, H / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[T, H, D]} />
        <meshStandardMaterial map={tex.side} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>
      {/* Junction box on right wall */}
      <group position={[W / 2 - 0.02, 1.8, 1.0]}>
        <mesh castShadow>
          <boxGeometry args={[0.08, 0.28, 0.4]} />
          <meshStandardMaterial color="#181425" roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.05, 0, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.04]} />
          <meshStandardMaterial color="#ff2d75" emissive="#ff2d75" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      </group>
      {/* Conduit coming from junction box, running down */}
      <mesh position={[W / 2 - 0.06, 0.9, 1.0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.6, 8]} />
        <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* ============================================================
          FRONT FACADE — built around a window opening
         ============================================================ */}
      {/* Left jamb */}
      <mesh position={[-(winHalfW + (W / 2 - winHalfW) / 2), H / 2, facadeZ]} castShadow receiveShadow>
        <boxGeometry args={[W / 2 - winHalfW, H, T]} />
        <meshStandardMaterial map={tex.front} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>
      {/* Right jamb */}
      <mesh position={[winHalfW + (W / 2 - winHalfW) / 2, H / 2, facadeZ]} castShadow receiveShadow>
        <boxGeometry args={[W / 2 - winHalfW, H, T]} />
        <meshStandardMaterial map={tex.front} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>
      {/* Sill (below window) */}
      <mesh position={[0, winSillY / 2, facadeZ]} castShadow receiveShadow>
        <boxGeometry args={[winW, winSillY, T]} />
        <meshStandardMaterial map={tex.front} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>
      {/* Header (above window) */}
      <mesh position={[0, winTopY + (H - winTopY) / 2, facadeZ]} castShadow receiveShadow>
        <boxGeometry args={[winW, H - winTopY, T]} />
        <meshStandardMaterial map={tex.front} roughnessMap={tex.rough} roughness={1} metalness={0.15} />
      </mesh>

      {/* Base trim band across the bottom of the facade */}
      <mesh position={[0, 0.15, D / 2 + 0.01]}>
        <boxGeometry args={[W, 0.3, 0.04]} />
        <meshStandardMaterial map={tex.trim} roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Top trim band */}
      <mesh position={[0, H - 0.08, D / 2 + 0.01]}>
        <boxGeometry args={[W, 0.16, 0.05]} />
        <meshStandardMaterial map={tex.trim} roughness={0.6} metalness={0.5} />
      </mesh>

      {/* Window interior glow */}
      <mesh position={[0, winSillY + winH / 2, facadeZ - 0.03]}>
        <planeGeometry args={[winW - 0.08, winH - 0.08]} />
        <meshStandardMaterial
          color="#1a0220"
          emissive="#ff2d75"
          emissiveIntensity={0.7}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Window mullions (cross-bars) */}
      <mesh position={[0, winSillY + winH / 2, facadeZ - 0.02]}>
        <boxGeometry args={[winW - 0.08, 0.03, 0.02]} />
        <meshStandardMaterial color="#0a0814" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, winSillY + winH / 2, facadeZ - 0.02]}>
        <boxGeometry args={[0.03, winH - 0.08, 0.02]} />
        <meshStandardMaterial color="#0a0814" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Window neon-tube outline */}
      {[
        [winW, 0.04, 0, winSillY],
        [winW, 0.04, 0, winTopY],
        [0.04, winH, -winHalfW, winSillY + winH / 2],
        [0.04, winH,  winHalfW, winSillY + winH / 2],
      ].map(([w, h, x, y], i) => (
        <mesh key={`tube${i}`} position={[x, y, facadeZ + 0.03]}>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      ))}

      {/* ============================================================
          AWNING over the storefront
         ============================================================ */}
      <group position={[0, winTopY + 0.05, D / 2 + 0.45]}>
        {/* Main awning slab (tilted down at front edge) */}
        <mesh rotation={[-0.18, 0, 0]} castShadow>
          <boxGeometry args={[winW + 0.6, 0.06, 0.9]} />
          <meshStandardMaterial color="#0c0820" roughness={0.5} metalness={0.6} />
        </mesh>
        {/* Front edge emissive strip */}
        <mesh position={[0, -0.16, 0.42]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[winW + 0.6, 0.04, 0.02]} />
          <meshStandardMaterial color="#ff2d75" emissive="#ff2d75" emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
        {/* Awning support brackets */}
        {[-winHalfW + 0.1, winHalfW - 0.1].map((x, i) => (
          <mesh key={`br${i}`} position={[x, 0.08, -0.4]} rotation={[Math.PI / 4, 0, 0]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
          </mesh>
        ))}
        {/* Hanging chain-lights under awning */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = -winHalfW + (i + 0.5) * (winW / 9);
          return (
            <mesh key={`lt${i}`} position={[x, -0.18, 0.3]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshStandardMaterial color="#ffaa44" emissive="#ffaa44" emissiveIntensity={3} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      {/* ============================================================
          DOOR (right of the window) — set into the right jamb area
         ============================================================ */}
      {/* Door is on the right jamb, recessed slightly */}
      <group position={[winHalfW + (W / 2 - winHalfW) / 2, 0, facadeZ + 0.005]}>
        <mesh position={[0, 0.95, 0]}>
          <boxGeometry args={[0.55, 1.9, 0.05]} />
          <meshStandardMaterial color="#0a0612" roughness={0.6} metalness={0.5} />
        </mesh>
        {/* Door window (small porthole) */}
        <mesh position={[0, 1.5, 0.03]}>
          <boxGeometry args={[0.3, 0.3, 0.02]} />
          <meshStandardMaterial color="#1a0220" emissive="#00ffff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* Door handle */}
        <mesh position={[0.18, 0.95, 0.04]}>
          <boxGeometry args={[0.04, 0.12, 0.04]} />
          <meshStandardMaterial color="#888" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Door frame trim */}
        <mesh position={[0, 1.9, 0.01]}>
          <boxGeometry args={[0.6, 0.04, 0.04]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
      </group>

      {/* ============================================================
          ROOF
         ============================================================ */}
      <mesh position={[0, H + T / 2, 0]} castShadow>
        <boxGeometry args={[W + SHOP.roofOverhang, T, D + SHOP.roofOverhang]} />
        <meshStandardMaterial color="#04020a" roughness={0.9} />
      </mesh>
      {/* Parapet edge trim around the roof */}
      {[
        [0, H + T + 0.05, D / 2, W + SHOP.roofOverhang, 0.1, 0.06],
        [0, H + T + 0.05, -D / 2, W + SHOP.roofOverhang, 0.1, 0.06],
        [-W / 2, H + T + 0.05, 0, 0.06, 0.1, D + SHOP.roofOverhang],
        [W / 2, H + T + 0.05, 0, 0.06, 0.1, D + SHOP.roofOverhang],
      ].map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={`para${i}`} position={[x, y, z]}>
          <boxGeometry args={[sx, sy, sz]} />
          <meshStandardMaterial color="#0a0418" roughness={0.7} metalness={0.4} />
        </mesh>
      ))}

      {/* ============================================================
          ROOFTOP HVAC + ANTENNA + WATER TANK
         ============================================================ */}
      {/* Big HVAC box */}
      <group position={[-1.4, H + T + 0.3, -0.6]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.55, 0.8]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Fan grille on top */}
        <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
          <meshStandardMaterial color="#0a0814" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.25, 0.01, 16]} />
          <meshStandardMaterial color="#04020a" />
        </mesh>
        {/* Side grilles */}
        {[-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3].map((x) => (
          <mesh key={x} position={[x, -0.05, 0.41]}>
            <boxGeometry args={[0.04, 0.3, 0.01]} />
            <meshStandardMaterial color="#04020a" />
          </mesh>
        ))}
      </group>

      {/* Smaller AC condenser unit */}
      <group position={[1.5, H + T + 0.2, 0.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.4, 0.5]} />
          <meshStandardMaterial color="#181425" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.21, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.02, 12]} />
          <meshStandardMaterial color="#04020a" />
        </mesh>
      </group>

      {/* Cylindrical water tank on stilts */}
      <group position={[1.2, H + T + 0.6, -1.2]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.7, 16]} />
          <meshStandardMaterial color="#221c30" roughness={0.7} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
          <meshStandardMaterial color="#0a0814" />
        </mesh>
        {/* Stilts */}
        {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z], i) => (
          <mesh key={i} position={[x, -0.55, z]}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
            <meshStandardMaterial color="#0a0814" />
          </mesh>
        ))}
      </group>

      {/* Antenna mast with red blinker */}
      <group position={[-1.8, H + T, 0.9]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 1.8, 8]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.8} />
        </mesh>
        {/* Crossbar */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[0.5, 0.02, 0.02]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.02]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Red blinker at top */}
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshStandardMaterial color="#ff0030" emissive="#ff0030" emissiveIntensity={4} toneMapped={false} />
        </mesh>
      </group>

      {/* Rooftop sign-board with support posts (kept from before, restyled) */}
      <group position={[0, H + SHOP.signBoardOffset + SHOP.signBoardHeight / 2 + 0.1, D / 2 - 0.25]}>
        <mesh position={[-1.3, -SHOP.signBoardHeight / 2 - SHOP.signBoardOffset / 2, 0]} castShadow>
          <boxGeometry args={[0.06, SHOP.signBoardOffset, 0.06]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh position={[ 1.3, -SHOP.signBoardHeight / 2 - SHOP.signBoardOffset / 2, 0]} castShadow>
          <boxGeometry args={[0.06, SHOP.signBoardOffset, 0.06]} />
          <meshStandardMaterial color="#1a1828" roughness={0.5} metalness={0.7} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[3.0, SHOP.signBoardHeight, 0.1]} />
          <meshStandardMaterial color="#0a0420" emissive="#ff2d75" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>

      {/* Side-wall accent neon strips at street level */}
      {[
        [-W / 2 + T + 0.005, 0.18, 0, Math.PI / 2, '#ff2d75'],
        [ W / 2 - T - 0.005, 0.18, 0, -Math.PI / 2, '#00ffff'],
      ].map(([x, y, z, ry, c], i) => (
        <mesh key={`accent${i}`} position={[x, y, z]} rotation={[0, ry, 0]}>
          <planeGeometry args={[D - 0.3, 0.025]} />
          <meshBasicMaterial color={c} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
