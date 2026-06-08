// Lightweight audio helpers. Each SFX has one preloaded "template" Audio
// element; on each play we clone it so the sound can overlap with itself.
// The background music is a single looping Audio that's kicked off on the
// first user gesture (browsers block autoplay-with-sound otherwise).

const enc = (p) => encodeURI(p);

const SRC = {
  bgRain: enc('/audio/rain.m4a'),
  // Billboard hover + click reuse the terminal hover sound for consistency.
  hoverBillboard: enc('/audio/hover sound terminal.mov'),
  clickBillboard: enc('/audio/hover sound terminal.mov'),
  hoverTerminal: enc('/audio/hover sound terminal.mov'),
  clickTerminal: enc('/audio/selected audio terminal.mov'),
};

const VOLUMES = {
  bgRain: 0.3,
  hoverBillboard: 0.35,
  clickBillboard: 0.5,
  hoverTerminal: 0.3,
  clickTerminal: 0.45,
};

// Leading silence in each source file (measured with afconvert + sample
// scan). We seek past it on every play so the SFX feels instant.
const OFFSETS = {
  hoverBillboard: 0.07,
  clickBillboard: 0.07,
  hoverTerminal: 0.07,
  clickTerminal: 0.08,
};

const templates = {};
function getTemplate(key) {
  if (!templates[key]) {
    const a = new Audio(SRC[key]);
    a.preload = 'auto';
    a.volume = VOLUMES[key] ?? 0.5;
    templates[key] = a;
  }
  return templates[key];
}

// Per-SFX rate limit. React StrictMode double-invokes state updaters, R3F's
// onPointerOver fires per descendant mesh, etc. — multiple sources can cause
// the same SFX to fire back-to-back within a frame. We cap to one per 80ms
// per key, which is well below human perception of "two sounds".
const lastPlayedAt = {};
const RATE_LIMIT_MS = 80;
let sfxMuted = false;

function playSfx(key) {
  if (sfxMuted) return;
  const now = performance.now();
  if (now - (lastPlayedAt[key] || 0) < RATE_LIMIT_MS) return;
  lastPlayedAt[key] = now;
  const t = getTemplate(key);
  // Cloning lets the sound overlap with itself if triggered rapidly.
  const n = t.cloneNode();
  n.volume = t.volume;
  const offset = OFFSETS[key] || 0;
  if (offset > 0) {
    // Set currentTime AFTER metadata is available, otherwise the seek can
    // be ignored on a fresh clone. If metadata is already loaded (common
    // because the template preloaded it), set immediately.
    if (n.readyState >= 1) {
      try { n.currentTime = offset; } catch {}
    } else {
      n.addEventListener('loadedmetadata', () => {
        try { n.currentTime = offset; } catch {}
      }, { once: true });
    }
  }
  n.play().catch(() => {});
}

export function playHoverBillboard() { playSfx('hoverBillboard'); }
export function playClickBillboard() { playSfx('clickBillboard'); }
export function playHoverTerminal()  { playSfx('hoverTerminal'); }
export function playClickTerminal()  { playSfx('clickTerminal'); }

// Background rain — single looping element, started on user gesture.
let bgAudio = null;
let musicMuted = false;

export function ensureBgMusic() {
  if (!bgAudio) {
    bgAudio = new Audio(SRC.bgRain);
    bgAudio.loop = true;
    bgAudio.volume = VOLUMES.bgRain;
    bgAudio.preload = 'auto';
  }
  if (!musicMuted && bgAudio.paused) {
    bgAudio.play().catch(() => {});
  }
}

export function setMusicMuted(muted) {
  musicMuted = muted;
  if (!bgAudio) return musicMuted;
  if (musicMuted) {
    bgAudio.pause();
  } else {
    bgAudio.volume = VOLUMES.bgRain;
    bgAudio.play().catch(() => {});
  }
  return musicMuted;
}
export function toggleMusicMute() { return setMusicMuted(!musicMuted); }
export function isMusicMuted() { return musicMuted; }

export function setSfxMuted(muted) { sfxMuted = muted; return sfxMuted; }
export function toggleSfxMute() { sfxMuted = !sfxMuted; return sfxMuted; }
export function isSfxMuted() { return sfxMuted; }
