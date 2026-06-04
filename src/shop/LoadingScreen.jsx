import { useProgress } from '@react-three/drei';
import { useEffect, useState } from 'react';
import { playHoverTerminal, playClickTerminal } from './audio.js';

const ACCENT = '#5cf2ff';

// Status phrases cycled while the bar fills. Each one stays for ~1.4s so
// they're readable, and they imply specific scene work happening rather
// than a generic "loading".
//
// IMPORTANT: the count here drives the CSS animation (steps(N), 1.4s × N).
// If you add/remove phrases, update PHRASE_COUNT below too.
const PHRASES = [
  'COMPILING NEON',
  'WIRING SIGNAGE',
  'RENDERING RAIN',
  'LIGHTING SCENE',
  'SPAWNING BILLBOARDS',
  'BOOTING TERMINAL',
  'LOADING ASSETS',
];
const PHRASE_COUNT = PHRASES.length;
const PHRASE_DURATION = 1.4; // seconds per phrase
const CYCLE_DURATION = PHRASE_COUNT * PHRASE_DURATION; // total loop length

// Fullscreen cyberpunk loading overlay. Mounts on top of the Canvas while
// drei's useProgress reports loaded < 100%. Once everything's loaded, shows
// a [ LET'S GO ] button that calls onEnter, which the parent uses to hide
// the overlay.
//
// We DON'T unmount as soon as progress hits 100 — we wait for the user to
// click the button, so the scene gets a moment to settle and the user
// controls when to enter.
//
// Animation is driven by CSS, not requestAnimationFrame. The reason: while
// the GLTF loader is parsing the 200+ MB of .glb files, the main JS thread
// is blocked, so rAF callbacks pause and React can't re-render. CSS
// animations run on the compositor thread and keep ticking smoothly through
// the blockage — the bar continues filling and phrases keep cycling even
// when JS is frozen.
export default function LoadingScreen({ onEnter }) {
  const { active } = useProgress();

  // The button doesn't fade in immediately once loading finishes — we give
  // the bar a moment to visibly fill to 100 first.
  const [buttonReady, setButtonReady] = useState(false);
  useEffect(() => {
    if (!active) {
      const t = setTimeout(() => setButtonReady(true), 500);
      return () => clearTimeout(t);
    }
  }, [active]);

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

        {/* Progress bar — CSS animation fills from 0 → 80% over 5s and
            holds. Once loading finishes, the `done` class snaps the bar to
            100% and lets the CSS transition smooth from wherever it was. */}
        <div
          style={{
            position: 'relative',
            height: 8,
            background: '#0a0625',
            border: `1px solid ${ACCENT}55`,
            marginBottom: 14,
            overflow: 'hidden',
          }}
        >
          <div
            className={`load-bar${active ? '' : ' done'}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              background: `linear-gradient(90deg, ${ACCENT}88, ${ACCENT})`,
              boxShadow: `0 0 10px ${ACCENT}aa`,
            }}
          />
        </div>
        {/* Phrase cycler — masked viewport with the stack of phrases below
            it, translated by a CSS animation in discrete 1.4s steps. Same
            reason as the bar: CSS keeps moving even when JS is locked. */}
        <div
          style={{
            height: '1.6em',
            lineHeight: '1.6em',
            overflow: 'hidden',
            fontSize: 11,
            letterSpacing: '0.25em',
            color: '#9fb8c4',
            marginBottom: 28,
          }}
        >
          <div className="phrase-stack">
            {PHRASES.map((p) => (
              <div key={p} style={{ height: '1.6em' }}>{p}</div>
            ))}
          </div>
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

      <style>{`
        .load-bar {
          width: 0%;
          animation: loadBarFill 5s cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
          transition: width 0.5s ease-out;
        }
        .load-bar.done {
          animation: none;
          width: 100%;
        }
        @keyframes loadBarFill {
          0%   { width: 0%; }
          1%   { width: 20%; }
          100% { width: 80%; }
        }
        .phrase-stack {
          animation: cyclePhrases ${CYCLE_DURATION}s steps(${PHRASE_COUNT}, jump-end) infinite;
        }
        @keyframes cyclePhrases {
          from { transform: translateY(0); }
          to   { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
}
