import { useEffect } from 'react';
import { PROJECTS } from './projectData.js';

// Cyberpunk project modal — fixed HTML overlay that sits on top of the R3F
// Canvas. Rendered conditionally from Shop.jsx when a sign/billboard is
// clicked. ESC closes. Click outside the panel closes.
export default function ProjectModal({ slug, onClose, backLabel = '< BACK' }) {
  useEffect(() => {
    if (!slug) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slug, onClose]);

  if (!slug) return null;
  const p = PROJECTS[slug];
  if (!p) return null;

  const accent = p.accent || '#5cf2ff';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(circle at center, rgba(8,2,18,0.15) 0%, rgba(0,0,0,0.35) 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        zIndex: 1000,
        animation: 'modalFadeIn 180ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: 'min(520px, 92vw)',
          padding: '28px 32px 32px',
          background: 'linear-gradient(180deg, rgba(10,4,24,0.95) 0%, rgba(4,2,12,0.95) 100%)',
          border: `1px solid ${accent}`,
          color: '#e9faff',
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          boxShadow: `0 0 60px ${accent}55, inset 0 0 30px ${accent}22`,
          clipPath:
            'polygon(0 12px, 12px 0, calc(100% - 24px) 0, 100% 24px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 24px 100%, 0 calc(100% - 24px))',
        }}
      >
        {/* Scanline overlay — purely visual */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px)',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Header bar with corner ticks */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: `1px solid ${accent}55`,
            paddingBottom: 10,
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.25em',
                color: `${accent}`,
                opacity: 0.8,
              }}
            >
              // PROJECT_FILE
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: accent,
                textShadow: `0 0 12px ${accent}aa`,
                marginTop: 4,
              }}
            >
              {p.title}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="back"
            style={{
              background: 'transparent',
              border: `1px solid ${accent}aa`,
              color: accent,
              fontFamily: 'inherit',
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
              letterSpacing: '0.15em',
            }}
          >
            {backLabel}
          </button>
        </div>

        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.15em',
            color: '#9fb8c4',
            marginBottom: 14,
          }}
        >
          ROLE: <span style={{ color: '#fff' }}>{p.role}</span>
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.65,
            color: '#d6ecf2',
            whiteSpace: 'pre-wrap',
          }}
        >
          {p.description}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: `${accent}99`,
            textAlign: 'right',
          }}
        >
          [ ESC TO GO BACK ]
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
