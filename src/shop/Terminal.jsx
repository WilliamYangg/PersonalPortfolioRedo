import { useEffect, useState } from 'react';
import { PROJECTS, EXPERIENCE, SIDE_PROJECTS, FUN_FACTS, CONTACT } from './projectData.js';
import { playHoverTerminal, playClickTerminal } from './audio.js';

// Unified cyberpunk "terminal" — single shell that handles both the William
// Yang tabbed overview AND per-project detail views. Switching between them
// keeps the shell mounted, so the border/header/scanlines persist and only
// the inner content swaps — feels like one terminal navigating between
// screens, not modals stacking.
//
// Props:
//   open          — controls visibility
//   initialSlug   — if provided, opens straight to that project's detail.
//                   Otherwise opens to the tabs view.
//   onClose       — close handler.
//
// Hover styling uses CSS :hover (not JS event handlers) for instant response.

const TABS = [
  { key: 'experience', label: 'EXPERIENCE' },
  { key: 'projects',   label: 'PROJECTS' },
  { key: 'contact',    label: 'CONTACT' },
  { key: 'fun',        label: 'FUN FACTS' },
];

const SHELL_ACCENT = '#5cf2ff';

export default function Terminal({ open, initialSlug = null, onClose }) {
  // view = 'tabs' | { slug }
  const [view, setView] = useState(initialSlug ? { slug: initialSlug } : 'tabs');
  const [tab, setTab] = useState('experience');

  // Sync view with props *during* render (not in an effect) so opening the
  // terminal straight to a project doesn't flash the tabs view for one frame
  // before the effect catches up. React discards the in-progress render and
  // re-runs with the updated state, so the very first paint is correct.
  const [openPrev, setOpenPrev] = useState(open);
  if (open !== openPrev) {
    setOpenPrev(open);
    if (open) {
      setView(initialSlug ? { slug: initialSlug } : 'tabs');
      setTab('experience');
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      // From any project detail (regardless of how we entered), Escape goes
      // back to the overview tabs first. Only from tabs does it close.
      if (typeof view === 'object') {
        setView('tabs');
      } else {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, view, onClose]);

  if (!open) return null;

  const isProject = typeof view === 'object';
  const project = isProject ? PROJECTS[view.slug] : null;
  // Shell accent stays cyan in tabs view, switches to project accent in detail.
  const accent = isProject ? (project?.accent || SHELL_ACCENT) : SHELL_ACCENT;
  // From a project detail view, BACK always returns to the overview tabs,
  // even if the user entered straight into a project from the scene. Only
  // the tabs view closes the terminal outright.
  const canGoBack = isProject;
  const backLabel = canGoBack ? '< BACK' : '< CLOSE';

  const handleBack = () => {
    if (canGoBack) setView('tabs');
    else onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        // Fully transparent — a tinted overlay forces the compositor to blend
        // a full-screen translucent layer over the canvas every frame, which
        // costs real money when the canvas is animating at 60fps. The modal
        // box itself is opaque so it provides its own visual separation.
        background: 'transparent',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="term-shell"
        style={{
          position: 'relative',
          width: 'min(620px, 94vw)',
          maxHeight: '84vh',
          overflowY: 'auto',
          padding: '28px 32px 32px',
          // Solid background (no gradient) so hover repaints don't blend
          // through a gradient layer.
          background: '#06031a',
          border: `1px solid ${accent}`,
          color: '#e9faff',
          fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
          // Notched / cut-corner cyberpunk silhouette. The 1px border above
          // gets clipped by this, so the shape itself has to read as the
          // border — the accent-tinted box-shadow inset reinforces it.
          clipPath:
            'polygon(0 14px, 14px 0, calc(100% - 28px) 0, 100% 28px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 28px 100%, 0 calc(100% - 28px))',
          boxShadow: `inset 0 0 0 1px ${accent}, 0 0 40px ${accent}33`,
          // Isolate paint so hover repaints in the shell never escape this
          // box. (Skipped translateZ — GPU promotion can blur text.)
          contain: 'layout paint',
        }}
      >

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            borderBottom: `1px solid ${accent}55`,
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.25em', color: accent, opacity: 0.8 }}>
              {isProject ? '// PROJECT_FILE' : '// PROFILE'}
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
              {isProject ? project?.title : 'WILLIAM YANG'}
            </div>
          </div>
          <button
            onClick={() => { playClickTerminal(); handleBack(); }}
            onMouseEnter={playHoverTerminal}
            aria-label="back"
            className="term-btn"
            style={{
              background: 'transparent',
              border: `1px solid ${accent}aa`,
              color: accent,
              fontFamily: 'inherit',
              fontSize: 12,
              padding: '4px 12px',
              cursor: 'pointer',
              letterSpacing: '0.15em',
              '--accent': accent,
              '--accent-soft': `${accent}22`,
              '--accent-glow': `${accent}66`,
            }}
          >
            {backLabel}
          </button>
        </div>

        {/* Body */}
        {isProject ? (
          <ProjectDetail project={project} />
        ) : (
          <TabsView
            tab={tab}
            setTab={setTab}
            onSelectProject={(slug) => setView({ slug })}
          />
        )}

        <div
          style={{
            marginTop: 22,
            fontSize: 10,
            letterSpacing: '0.3em',
            color: `${accent}99`,
            textAlign: 'right',
          }}
        >
          [ ESC TO {canGoBack ? 'GO BACK' : 'CLOSE'} ]
        </div>
      </div>

      <style>{`
        .term-shell {
          scrollbar-width: thin;
          scrollbar-color: ${SHELL_ACCENT}88 transparent;
        }
        .term-shell::-webkit-scrollbar {
          width: 8px;
        }
        .term-shell::-webkit-scrollbar-track {
          background: transparent;
        }
        .term-shell::-webkit-scrollbar-thumb {
          background: ${SHELL_ACCENT}55;
          border-radius: 4px;
        }
        .term-shell::-webkit-scrollbar-thumb:hover {
          background: ${SHELL_ACCENT}aa;
        }
        .term-btn {
          transition: background 120ms ease-out, box-shadow 120ms ease-out;
        }
        .term-btn:hover {
          background: var(--accent-soft) !important;
          box-shadow: 0 0 12px var(--accent-glow);
        }
        .term-row {
          display: block;
          text-align: left;
          width: 100%;
          background: transparent;
          padding: 12px 14px;
          color: #e9faff;
          font-family: inherit;
          cursor: pointer;
          border: 1px solid var(--row-accent-55);
          border-left: 3px solid var(--row-accent);
          contain: paint;
        }
        .term-row:hover {
          background: var(--row-accent-11);
          border-color: var(--row-accent);
        }
        .term-tab {
          flex: 1;
          background: transparent;
          color: #9fb8c4;
          font-family: inherit;
          font-size: 11px;
          letter-spacing: 0.2em;
          padding: 10px 0;
          cursor: pointer;
          border: 1px solid ${SHELL_ACCENT}33;
          border-bottom: 1px solid ${SHELL_ACCENT}33;
        }
        .term-tab.active {
          background: ${SHELL_ACCENT}22;
          color: ${SHELL_ACCENT};
          border-color: ${SHELL_ACCENT};
          border-bottom: 2px solid ${SHELL_ACCENT};
          text-shadow: 0 0 10px ${SHELL_ACCENT}aa;
        }
        .term-tab:hover:not(.active) {
          background: ${SHELL_ACCENT}11;
          color: ${SHELL_ACCENT};
        }
      `}</style>
    </div>
  );
}

function TabsView({ tab, setTab, onSelectProject }) {
  return (
    <>
      <div style={{ display: 'flex', gap: 0, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { playClickTerminal(); setTab(t.key); }}
            onMouseEnter={playHoverTerminal}
            className={`term-tab ${tab === t.key ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'experience' && (
        <ProjectList slugs={EXPERIENCE} onSelect={onSelectProject} />
      )}
      {tab === 'projects' && (
        <ProjectList slugs={SIDE_PROJECTS} onSelect={onSelectProject} />
      )}
      {tab === 'contact' && <Contact />}
      {tab === 'fun' && <FunFacts />}
    </>
  );
}

function Contact() {
  return (
    <div style={{ color: '#d6ecf2', fontSize: 14, lineHeight: 1.7 }}>
      <ContactRow label="EMAIL" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
      <ContactRow label="PHONE" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\s+/g, '')}`} />
    </div>
  );
}

function ContactRow({ label, value, href }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 14,
        padding: '10px 0',
        borderBottom: `1px solid ${SHELL_ACCENT}22`,
      }}
    >
      <span
        style={{
          fontSize: 11,
          letterSpacing: '0.25em',
          color: SHELL_ACCENT,
          minWidth: 64,
        }}
      >
        {label}
      </span>
      <a
        href={href}
        style={{
          color: '#fff',
          textDecoration: 'none',
          borderBottom: `1px dashed ${SHELL_ACCENT}77`,
          paddingBottom: 1,
        }}
      >
        {value}
      </a>
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
            onClick={() => { playClickTerminal(); onSelect(slug); }}
            onMouseEnter={playHoverTerminal}
            className="term-row"
            style={{
              '--row-accent': p.accent,
              '--row-accent-55': `${p.accent}55`,
              '--row-accent-11': `${p.accent}11`,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: p.accent,
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
          <span style={{ color: SHELL_ACCENT, marginRight: 8 }}>▸</span>
          {f}
        </li>
      ))}
    </ul>
  );
}

function ProjectDetail({ project }) {
  if (!project) return null;
  const accent = project.accent || SHELL_ACCENT;
  const hasImages = project.images && project.images.length > 0;
  const imagesBelow = project.imagesBelow;
  return (
    <>
      <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#9fb8c4', marginBottom: 14 }}>
        ROLE: <span style={{ color: '#fff' }}>{project.role}</span>
      </div>
      {hasImages && !imagesBelow && (
        <Carousel images={project.images} accent={accent} />
      )}
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.65,
          color: '#d6ecf2',
          whiteSpace: 'pre-wrap',
          marginBottom: project.bullets?.length ? 12 : 0,
        }}
      >
        {project.description}
      </div>
      {project.bullets && project.bullets.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {project.bullets.map((b, i) => (
            <li
              key={i}
              style={{
                position: 'relative',
                paddingLeft: 18,
                marginBottom: 8,
                fontSize: 13.5,
                lineHeight: 1.55,
                color: '#d6ecf2',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  color: accent,
                  fontWeight: 700,
                }}
              >
                ▸
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
      {project.links && project.links.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {project.links.map((l, i) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 13,
                letterSpacing: '0.08em',
                color: accent,
                textDecoration: 'none',
                borderBottom: `1px dashed ${accent}77`,
                alignSelf: 'flex-start',
                paddingBottom: 2,
              }}
            >
              ▸ {l.label} ↗
            </a>
          ))}
        </div>
      )}
      {hasImages && imagesBelow && (
        <div style={{ marginTop: 16 }}>
          <Carousel images={project.images} accent={accent} />
        </div>
      )}
    </>
  );
}

function Carousel({ images, accent }) {
  const [idx, setIdx] = useState(0);
  const total = images.length;
  const go = (delta) => setIdx((i) => (i + delta + total) % total);
  const arrowBtn = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    background: 'rgba(6,3,26,0.7)',
    border: `1px solid ${accent}aa`,
    color: accent,
    fontFamily: 'inherit',
    fontSize: 16,
    lineHeight: '24px',
    padding: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <div
      style={{
        position: 'relative',
        marginBottom: 14,
        border: `1px solid ${accent}55`,
        background: '#040214',
      }}
    >
      <img
        src={images[idx]}
        alt=""
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
        }}
      />
      {total > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="previous" style={{ ...arrowBtn, left: 8 }}>‹</button>
          <button onClick={() => go(+1)} aria-label="next" style={{ ...arrowBtn, right: 8 }}>›</button>
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: 0,
              right: 0,
              display: 'flex',
              gap: 6,
              justifyContent: 'center',
            }}
          >
            {images.map((_, i) => (
              <span
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i === idx ? accent : `${accent}55`,
                  cursor: 'pointer',
                  boxShadow: i === idx ? `0 0 6px ${accent}aa` : 'none',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
