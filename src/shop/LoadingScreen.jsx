import { useProgress } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import { playHoverTerminal, playClickTerminal } from './audio.js';

const ACCENT = '#5cf2ff';

// Status phrases cycled while the bar fills. Each one stays for ~1.4s so
// they're readable, and they imply specific scene work happening rather
// than a generic "loading".
const PHRASES = [
  'COMPILING NEON',
  'WIRING SIGNAGE',
  'RENDERING RAIN',
  'LIGHTING SCENE',
  'SPAWNING BILLBOARDS',
  'BOOTING TERMINAL',
  'LOADING ASSETS',
];
const PHRASE_DURATION = 1.4; // seconds per phrase

// Fullscreen cyberpunk loading overlay. Mounts on top of the Canvas while
// drei's useProgress reports loaded < 100%. Once everything's loaded, shows
// a [ LET'S GO ] button that calls onEnter, which the parent uses to hide
// the overlay.
//
// We DON'T unmount as soon as progress hits 100 — we wait for the user to
// click the button, so the scene gets a moment to settle and the user
// controls when to enter.
export default function LoadingScreen({ onEnter }) {
  const { progress, active } = useProgress();
  // drei reports progress as (filesLoaded / totalFiles) * 100, so it jumps
  // in chunks (e.g. 0 → 20 → 100) instead of filling smoothly. We lerp the
  // *displayed* value toward the real progress at a capped fill rate so the
  // bar always reads as moving instead of stalling.
  const progressRef = useRef(0);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  const [shown, setShown] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    let last = start;
    // Two-speed fill: rocket 0 → 20 in ~50ms so the bar never reads "stalled
    // at 0", then a synthetic creep 20 → 80 over 5s so the bar always shows
    // progression even if drei is still on its first chunk. Past 80 we wait
    // for real progress to catch up.
    const FAST_FILL_PER_SEC = 400; // 0 → 20 in ~50ms
    const SYNTHETIC_CAP = 80;
    const SYNTHETIC_RAMP_SEC = 5; // 20 → 80 over 5s
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const elapsed = (now - start) / 1000;
      // Synthetic floor: 20 immediately, ramping to 80 over the next 5s.
      const synthetic = Math.min(
        SYNTHETIC_CAP,
        20 + Math.max(0, elapsed) * ((SYNTHETIC_CAP - 20) / SYNTHETIC_RAMP_SEC),
      );
      setShown((cur) => {
        // Target = whichever is higher: real progress or synthetic floor.
        const target = Math.max(progressRef.current, synthetic);
        if (cur >= target) return cur;
        // Under 20 we rocket up; past that we move at whatever rate keeps us
        // tracking the target without overshooting.
        const rate = cur < 20 ? FAST_FILL_PER_SEC : (SYNTHETIC_CAP - 20) / SYNTHETIC_RAMP_SEC + 5;
        return Math.min(cur + dt * rate, target, 100);
      });
      setPhraseIdx(Math.floor(elapsed / PHRASE_DURATION) % PHRASES.length);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // "Ready" = nothing actively loading AND we've reported 100. Small extra
  // delay before showing the button so the bar visibly hits 100.
  const ready = !active && shown >= 100;
  const [buttonReady, setButtonReady] = useState(false);
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setButtonReady(true), 250);
      return () => clearTimeout(t);
    }
  }, [ready]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: '#04020c',
        color: '#e9faff',
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Subtle animated grid backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(${ACCENT}11 1px, transparent 1px),
            linear-gradient(90deg, ${ACCENT}11 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle at center, black 0%, transparent 70%)',
        }}
      />
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
          mixBlendMode: 'overlay',
        }}
      />

      <div
        style={{
          position: 'relative',
          width: 'min(520px, 92vw)',
          padding: '40px 44px 36px',
          background: '#06031a',
          boxShadow: `inset 0 0 0 1px ${ACCENT}, 0 0 60px ${ACCENT}44`,
          clipPath:
            'polygon(0 14px, 14px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 28px 100%, 0 calc(100% - 28px))',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: '0.3em', color: ACCENT, opacity: 0.8 }}>
          // BOOTING
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: ACCENT,
            textShadow: `0 0 16px ${ACCENT}cc`,
            marginTop: 8,
            marginBottom: 28,
          }}
        >
          WILLIAM YANG
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: 'relative',
            height: 8,
            background: '#0a0625',
            border: `1px solid ${ACCENT}55`,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${Math.min(100, shown)}%`,
              background: `linear-gradient(90deg, ${ACCENT}88, ${ACCENT})`,
              boxShadow: `0 0 10px ${ACCENT}aa`,
              transition: 'width 200ms ease-out',
            }}
          />
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.25em',
            color: '#9fb8c4',
            marginBottom: 28,
          }}
        >
          {PHRASES[phraseIdx]} · {Math.floor(shown)}%
        </div>

        {/* Enter button — fades in once ready */}
        <button
          onClick={buttonReady ? () => { playClickTerminal(); onEnter(); } : undefined}
          disabled={!buttonReady}
          style={{
            background: buttonReady ? `${ACCENT}22` : 'transparent',
            border: `1px solid ${buttonReady ? ACCENT : `${ACCENT}33`}`,
            color: buttonReady ? ACCENT : `${ACCENT}55`,
            fontFamily: 'inherit',
            fontSize: 13,
            letterSpacing: '0.3em',
            padding: '12px 28px',
            cursor: buttonReady ? 'pointer' : 'default',
            opacity: buttonReady ? 1 : 0.4,
            transition: 'opacity 250ms ease-out, background 150ms ease-out, box-shadow 150ms ease-out',
            textShadow: buttonReady ? `0 0 10px ${ACCENT}aa` : 'none',
            boxShadow: buttonReady ? `0 0 16px ${ACCENT}44` : 'none',
          }}
          onMouseEnter={(e) => {
            if (!buttonReady) return;
            playHoverTerminal();
            e.currentTarget.style.background = `${ACCENT}44`;
            e.currentTarget.style.boxShadow = `0 0 24px ${ACCENT}88`;
          }}
          onMouseLeave={(e) => {
            if (!buttonReady) return;
            e.currentTarget.style.background = `${ACCENT}22`;
            e.currentTarget.style.boxShadow = `0 0 16px ${ACCENT}44`;
          }}
        >
          [ LET'S GO ]
        </button>

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: `${ACCENT}99`,
          }}
        >
          {buttonReady ? '> SYSTEM READY' : '> SYSTEM LOADING'}
        </div>
      </div>
    </div>
  );
}
