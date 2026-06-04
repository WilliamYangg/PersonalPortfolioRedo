import { useEffect, useState } from 'react';
import { PROJECTS, EXPERIENCE, SIDE_PROJECTS, FUN_FACTS } from './projectData.js';

const TABS = [
  { key: 'experience', label: 'EXPERIENCE' },
  { key: 'projects',   label: 'PROJECTS' },
  { key: 'fun',        label: 'FUN FACTS' },
];

const ACCENT = '#5cf2ff';

// Tabbed overview surface — opens when the William Yang sign is clicked.
// Tabs: Experience / Projects / Fun Facts. Clicking an experience or project
// item bubbles a slug up to Shop.jsx which then opens ProjectModal for that
// slug.
export default function OverviewModal({ open, onClose, onSelectProject }) {
  const [tab, setTab] = useState('experience');

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset to first tab whenever modal reopens.
  useEffect(() => {
    if (open) setTab('experience');
  }, [open]);

  if (!open) return null;

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
          width: 'min(620px, 94vw)',
          minHeight: 380,
          padding: '28px 32px 32px',
          background: 'linear-gradient(180deg, rgba(10,4,24,0.95) 0%, rgba(4,2,12,0.95) 100%)',
          border: `1px solid ${ACCENT}`,
          color: '#e9faff',
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          boxShadow: `0 0 60px ${ACCENT}55, inset 0 0 30px ${ACCENT}22`,
          clipPath:
            'polygon(0 12px, 12px 0, calc(100% - 24px) 0, 100% 24px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 24px 100%, 0 calc(100% - 24px))',
        }}
      >
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

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: `1px solid ${ACCENT}55`,
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.25em', color: ACCENT, opacity: 0.8 }}>
              // PROFILE
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: ACCENT,
                textShadow: `0 0 12px ${ACCENT}aa`,
                marginTop: 4,
              }}
            >
              WILLIAM YANG
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              background: 'transparent',
              border: `1px solid ${ACCENT}aa`,
              color: ACCENT,
              fontFamily: 'inherit',
              fontSize: 12,
              padding: '4px 10px',
              cursor: 'pointer',
              letterSpacing: '0.15em',
            }}
          >
            [ X ]
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  background: active ? `${ACCENT}22` : 'transparent',
                  border: `1px solid ${active ? ACCENT : `${ACCENT}33`}`,
                  borderBottom: active ? `2px solid ${ACCENT}` : `1px solid ${ACCENT}33`,
                  color: active ? ACCENT : '#9fb8c4',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  letterSpacing: '0.2em',
                  padding: '10px 0',
                  cursor: 'pointer',
                  textShadow: active ? `0 0 10px ${ACCENT}aa` : 'none',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ position: 'relative', minHeight: 180 }}>
          {tab === 'experience' && (
            <ProjectList slugs={EXPERIENCE} onSelect={onSelectProject} />
          )}
          {tab === 'projects' && (
            <ProjectList slugs={SIDE_PROJECTS} onSelect={onSelectProject} />
          )}
          {tab === 'fun' && <FunFacts />}
        </div>

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: `${ACCENT}99`,
            textAlign: 'right',
          }}
        >
          [ ESC TO CLOSE ]
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

function ProjectList({ slugs, onSelect }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {slugs.map((slug) => {
        const p = PROJECTS[slug];
        if (!p) return null;
        return (
          <button
            key={slug}
            onClick={() => onSelect(slug)}
            style={{
              textAlign: 'left',
              background: 'transparent',
              border: `1px solid ${p.accent}55`,
              borderLeft: `3px solid ${p.accent}`,
              padding: '12px 14px',
              color: '#e9faff',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = `${p.accent}11`;
              e.currentTarget.style.borderColor = p.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = `${p.accent}55`;
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: p.accent,
                textShadow: `0 0 8px ${p.accent}77`,
              }}
            >
              {p.title}
            </div>
            <div style={{ fontSize: 11, color: '#9fb8c4', marginTop: 3, letterSpacing: '0.08em' }}>
              {p.role}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function FunFacts() {
  return (
    <ul style={{ margin: 0, paddingLeft: 18, color: '#d6ecf2', fontSize: 14, lineHeight: 1.7 }}>
      {FUN_FACTS.map((f, i) => (
        <li key={i} style={{ marginBottom: 6 }}>
          <span style={{ color: ACCENT, marginRight: 8 }}>▸</span>
          {f}
        </li>
      ))}
    </ul>
  );
}
