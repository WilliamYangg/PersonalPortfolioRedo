import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Terminal from './Terminal.jsx';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import ShopMesh from './ShopMesh.jsx';
import Ground from './Ground.jsx';
import Billboard from './Billboard.jsx';
import SignMesh from './SignMesh.jsx';
import FlickerPointLight from './FlickerPointLight.jsx';
import Prop from './Prop.jsx';
import Rain from './Rain.jsx';
import LoadingScreen from './LoadingScreen.jsx';
import CameraIntro from './CameraIntro.jsx';
import { ensureBgMusic, toggleMusicMute, toggleSfxMute } from './audio.js';
// import Mount from './Mount.jsx';
// import Sign from './Sign.jsx';
// import AdScreen from './AdScreen.jsx';
// import Prop from './Prop.jsx';

// === EDIT THIS FILE TO PLACE CONTENT ON THE SHOP ===========================
//
// The shop itself is a Meshy GLB loaded by <ShopMesh />.
// If it faces the wrong way after import, pass rotationY={Math.PI} (or
// Math.PI/2, -Math.PI/2) until the front is towards the camera.
//
// Once we know what the actual mesh looks like, we'll re-add wall-mounted
// signs/screens by reading the geometry and positioning manually in world
// coords (the previous UV-coord Mount system assumed an axis-aligned box —
// the real GLB has its own shape).
//
// ===========================================================================

export default function Shop() {
  // Terminal can open in two modes: a specific project (initialSlug set) or
  // the William Yang tabbed overview (initialSlug = null). Closing always
  // resets both.
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [initialSlug, setInitialSlug] = useState(null);

  // On Mac/Windows, clicking back into the browser from another app fires a
  // click event on whatever's under the cursor — which can land on a
  // billboard and open a project unintentionally. We track the last time the
  // window regained focus and swallow any project-open call that arrives
  // within ~300ms of it.
  const lastFocusAt = useRef(0);
  useEffect(() => {
    const onFocus = () => { lastFocusAt.current = performance.now(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        lastFocusAt.current = performance.now();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const isFocusEcho = () => performance.now() - lastFocusAt.current < 300;

  // Loading screen sits on top of the Canvas until assets finish loading and
  // the user clicks LET'S GO. Audio (which needs a user gesture anyway) only
  // starts once they've entered.
  const [entered, setEntered] = useState(false);
  // Zoom-in intro fires on entry; OrbitControls stay disabled until it ends.
  const [introPlaying, setIntroPlaying] = useState(false);
  const handleEnter = () => {
    setEntered(true);
    setIntroPlaying(true);
    ensureBgMusic();
  };

  // Separate mute toggles for music (rain) and SFX (hover/click).
  const [musicMuted, setMusicMuted] = useState(false);
  const [sfxMuted, setSfxMuted] = useState(false);
  const handleMusicToggle = () => setMusicMuted(toggleMusicMute());
  const handleSfxToggle = () => setSfxMuted(toggleSfxMute());

  const openProject = (slug) => {
    if (isFocusEcho()) return;
    setInitialSlug(slug);
    setTerminalOpen(true);
  };
  const openOverview = () => {
    if (isFocusEcho()) return;
    setInitialSlug(null);
    setTerminalOpen(true);
  };
  const closeTerminal = () => setTerminalOpen(false);
  return (
    <>
    <Canvas
      shadows
      camera={{ position: [2.6, 0.5, 4.8], fov: 45 }}
      style={{ position: 'fixed', inset: 0, background: '#04020c' }}
      dpr={1}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <fog attach="fog" args={['#000000', 5, 14]} />
      <color attach="background" args={['#000000']} />

      <ambientLight intensity={0.95} color="#5544aa" />
      <directionalLight
        position={[4, 8, 4]}
        intensity={1.5}
        color="#cfd6ff"
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      {/* Hero spotlight from above-front: the "stage light" on the building.
          castShadow removed — directional light already supplies shadows;
          a second shadow caster doubles per-frame shadow-map render cost. */}
      <spotLight
        position={[0, 6, 5]}
        intensity={35}
        angle={0.55}
        penumbra={0.6}
        distance={14}
        color="#ffffff"
        target-position={[0, 1.2, 0]}
      />
      {/* Front key lights — the pink/cyan that defines the cyberpunk facade.
          Keeping these; they carry most of the look. The orange top fill and
          three of the four back-wall spills were cut: every point light is a
          per-fragment cost across the whole screen, and the back-wall ones
          are barely visible from the default camera angle. */}
      <pointLight position={[-2.0, 1.4, 2.2]} intensity={14} color="#ff2d75" distance={5} decay={2} />
      <pointLight position={[ 2.0, 1.4, 2.2]} intensity={14} color="#00ffff" distance={5} decay={2} />

      {/* One left-wall spill kept so the left face still reads against fog. */}
      <pointLight position={[-2.6, 1.4,  0.0]} intensity={10} color="#39ff8e" distance={5} decay={2} />

      {/* Back-wall spill so the AceVerse/Minecraft/Airtable billboards read
          when the camera orbits around. */}
      <pointLight position={[0.0, 1.4, -2.6]} intensity={9} color="#8a5cff" distance={5} decay={2} />

      {/* The Meshy shop. If it faces wrong direction, set rotationY. */}
      <ShopMesh src="/models/shop.glb" targetHeight={3.0} rotationY={0} />

      {/* Cyberpunk rain — streaks of cyan-white falling around the scene. */}
      <Rain count={600} area={10} height={8} speed={14} />

      {/* Wall-mounted billboard on the FRONT facade, above the awning,
          facing the camera. Tweak position/targetWidth/screen as needed. */}
      {/* Dappa logo sign on the RIGHT wall — emissive cranked + a spill
          pointLight 0.4m in front to make the wall glow around it. */}
      <SignMesh
        src="/models/dappalogo.glb"
        position={[1.1, 0.92, 0.4]}
        rotation={[0, Math.PI / 2, 0]}
        targetWidth={0.9}
        emissiveIntensity={8}
        hoverScale={1.05}
        // flicker={{ frequency: 1.6, amplitude: 0.55, seed: 0 }}
        onClick={() => openProject('dappa')}
      />
      <pointLight position={[1.55, 0.92, 0.4]} intensity={1} color="#FF68CE" distance={2.0} decay={2} />

      {/* Kollmann logo — sits just below the dappa sign on the RIGHT wall */}
      <SignMesh
        src="/models/kollmannlogo.glb"
        position={[1.1, 0.45, 0.4]}
        rotation={[0, Math.PI / 2, 0]}
        targetWidth={0.9}
        emissiveIntensity={8}
        hoverScale={1.05}
        // flicker={{ frequency: 1.0, amplitude: 0.65, seed: 11.3 }}
        onClick={() => openProject('kollmann')}
      />
      <pointLight position={[1.55, 0.6, 0.4]} intensity={2} color="#8A00C4" distance={2.0} decay={2} />

      {/* Illuminated Diamond CBA billboard on the RIGHT wall, bottom-right
          corner (same wall as dappa, lower + further forward toward the
          front-right corner of the building). */}
      <SignMesh
        src="/models/cbabillboard.glb"
        position={[1.1, 0.55, -0.68]}
        rotation={[0, Math.PI / 2, 0]}
        targetWidth={0.5}
        emissiveIntensity={6}
        hoverScale={1.05}
        onClick={() => openProject('cba')}
      />
      <pointLight position={[1.55, 0.4, -0.55]} intensity={0.5} color="#ffe28a" distance={10} decay={2} />

      {/* Obsidian screen lying flat on the ROOF — rotated -π/2 X so the
          screen face (originally +Z) points up. Plays the league clip. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.48, 2.18, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        targetWidth={0.756}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        screen={{
          video: '/videos/leagueclip.mp4',
          width: 0.58,
          height: 0.41,
          offset: [0, -0.015, -0.02],
        }}
      />

      {/* Obsidian screen on the FRONT facade — covers left + middle windows.
          Holds a portrait photo composited into the screen recess.
          Vertex analysis: bezel front at model Z=0.142, screen surface at
          Z=0.113, screen extent ±0.87 X × ±0.52 Y (1.67:1 aspect). */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[-0.25, 1.5, 0.97]}
        rotation={[0, 0, 0]}
        targetWidth={1.05}
        meshEmissiveIntensity={1.0}
        hoverScale={1.03}
        onClick={openOverview}
        screen={{
          image: '/pictures/portrait.jpg',
          width: 0.78,
          height: 0.58,
          offset: [0, 0, 0.07],
          emissiveIntensity: 1.2,
        }}
      />

      {/* GitHub + LinkedIn — small square obsidian frames stacked vertically
          on the FRONT facade, to the RIGHT of the portrait. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.67, 1.67, 1]}
        rotation={[0, 0, 0]}
        targetWidth={0.32}
        targetHeight={0.32}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => window.open('https://github.com/WilliamYangg', '_blank', 'noopener,noreferrer')}
        screen={{
          image: '/pictures/githublogo.png',
          width: 0.28,
          height: 0.28,
          offset: [0, 0, -0.03],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.67, 1.35, 1]}
        rotation={[0, 0, 0]}
        targetWidth={0.32}
        targetHeight={0.32}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => window.open('https://www.linkedin.com/in/william-yang-a28092250/', '_blank', 'noopener,noreferrer')}
        screen={{
          image: '/pictures/linkedlnlogo.jpeg',
          width: 0.28,
          height: 0.28,
          offset: [0, 0, -0.03],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* Lyra banner — wide skinny obsidian screen on the RIGHT wall, above
          dappa/kollmann. 4:1 aspect to match the banner image. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[1.08, 1.46, 0]}
        rotation={[0, Math.PI / 2, 0]}
        targetWidth={1.8}
        targetHeight={0.49}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('lyra')}
        screen={{
          image: '/pictures/lyrabanner.jpeg',
          width: 1.692,
          height: 0.42,
          offset: [0, 0, 0.07],
          emissiveIntensity: 1.2,
        }}
      />

      {/* Optiver — LEFT wall, bottom-left, covering the window there.
          Portrait source cropped to landscape via fit:"cover" (top/bottom
          of the photo are hidden). Skinny obsidian screen like lyra. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[-0.97, 0.55, -0.39]}
        rotation={[0, -Math.PI / 2, 0]}
        targetWidth={0.82}
        targetHeight={0.62}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('optiver')}
        screen={{
          image: '/pictures/optiverpic.jpg',
          width: 0.72,
          height: 0.53,
          offset: [0, 0, -0.01],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* AceVerse logo — skinny obsidian banner on the BACK wall. Faces -Z
          so it's only visible when you orbit around the building. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.08, 1.5, -1.08]}
        rotation={[0, Math.PI, 0]}
        targetWidth={0.55}
        targetHeight={0.55}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('aceverse')}
        screen={{
          image: '/pictures/AceVerse%20Logo%20copy.png',
          width: 0.48,
          height: 0.48,
          offset: [0, 0, -0.02],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* Minecraft logo — back wall, same square frame, sits to the LEFT of
          the AceVerse banner (left from viewer's POV when behind the building,
          which is +X in world coords). */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.73, 1.5, -1.08]}
        rotation={[0, Math.PI, 0]}
        targetWidth={0.55}
        targetHeight={0.55}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('minecrafthack')}
        screen={{
          image: '/pictures/minecraftlogo.png',
          width: 0.48,
          height: 0.48,
          offset: [0, 0, -0.02],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* Unreal Engine logo — back wall, RIGHT of AceVerse (-X from viewer's POV). */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[-0.57, 1.5, -1.08]}
        rotation={[0, Math.PI, 0]}
        targetWidth={0.55}
        targetHeight={0.55}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('unrealengine5')}
        screen={{
          image: '/pictures/unrealengine.png',
          width: 0.48,
          height: 0.48,
          offset: [0, 0, -0.02],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* Airtable logo — back wall, same square frame, sits BELOW AceVerse. */}
      <Billboard
        src="/models/obsidianscreen.glb"
        position={[0.08, 0.6, -1.08]}
        rotation={[0, Math.PI, 0]}
        targetWidth={0.55}
        targetHeight={0.55}
        depthScale={0.3}
        meshEmissiveIntensity={1.0}
        hoverScale={1.05}
        onClick={() => openProject('airtableclone')}
        screen={{
          image: '/pictures/airtablelogo.png',
          width: 0.48,
          height: 0.48,
          offset: [0, 0, -0.02],
          emissiveIntensity: 1.2,
          fit: 'cover',
        }}
      />

      {/* Tree in a pot — Meshy prop sitting on the roof. Tune scale/position
          after seeing it render; Meshy exports often need scaling down. */}
      <Prop
        src="/models/Meshy_AI_tree_in_a_pot_0602020944_texture.glb"
        position={[-0.5, 2.32, 0]}
        scale={0.35}
      />
      {/* Second tree on the roof — back-right corner to balance the first. */}
      <Prop
        src="/models/Meshy_AI_tree_in_a_pot_0602023358_texture.glb"
        position={[0.7, 2.32, -0.7]}
        rotation={[0, Math.PI, 0]}
        scale={0.35}
      />
      {/* Rusty vintage chair on the roof — tune scale/position after seeing
          it render; Meshy exports vary. */}
      <Prop
        src="/models/Meshy_AI_Rusty_vintage_metal_f_0602024832_texture.glb"
        position={[-0.4, 2.15, -0.5]}
        scale={0.18}
      />
      {/* Open cardboard box on the roof. */}
      <Prop
        src="/models/Meshy_AI_Open_Cardboard_Box_0602031433_texture.glb"
        position={[0.2, 2.15, -0.4]}
        scale={0.18}
      />
      {/* Brown cardboard box on the roof. */}
      <Prop
        src="/models/Meshy_AI_Brown_Cardboard_Box_0602070105_texture.glb"
        position={[-0.5, 2.15, 0.5]}
        scale={0.18}
      />

      {/* William Yang neon sign — FRONT facade, bottom-right, covering the
          existing window. Default mesh faces +Z so no rotation needed. */}
      <SignMesh
        src="/models/williamyang.glb"
        position={[0.37, 0.51, 0.95]}
        rotation={[0, 0, 0]}
        targetWidth={0.95}
        emissiveIntensity={8}
        hoverScale={1.05}
        onClick={openOverview}
      />

      {/* === Wall content (will re-add after we see the real mesh) ===
      <Mount face="front" u={0.5} v={0.94}>
        <Sign text="VINCENT YANG" color="#00ffff" width={2.6} height={0.32} fontSize={0.16} />
      </Mount>
      <Mount face="front" u={0.18} v={0.45}>
        <AdScreen width={1.4} height={0.9} />
      </Mount>
      */}

      <CameraIntro
        active={introPlaying}
        rest={[2.6, 0.5, 4.8]}
        onComplete={() => setIntroPlaying(false)}
      />

      <OrbitControls
        enabled={!introPlaying}
        target={[0, 1.0, 0]}
        enablePan={false}
        enableZoom={true}
        enableDamping={true}
        dampingFactor={0.2}
        minDistance={3.5}
        maxDistance={7.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={false}
      />

      {/* Postprocessing disabled — bloom was causing whole-screen blackout
          flickers. Need to investigate root cause (possibly @react-three/
          postprocessing version incompatibility, or render-target sizing
          with our DPR settings) before re-enabling.
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.45} luminanceThreshold={0.7} luminanceSmoothing={0.35} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.7} />
      </EffectComposer>
      */}
    </Canvas>
    <Terminal
      open={terminalOpen}
      initialSlug={initialSlug}
      onClose={closeTerminal}
    />
    {!entered && <LoadingScreen onEnter={handleEnter} />}
    {entered && (
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1100,
          display: 'flex',
          gap: 8,
        }}
      >
        <MuteButton onClick={handleMusicToggle} muted={musicMuted} label="MUSIC" />
        <MuteButton onClick={handleSfxToggle} muted={sfxMuted} label="SFX" />
      </div>
    )}
    </>
  );
}

function MuteButton({ onClick, muted, label }) {
  return (
    <button
      onClick={onClick}
      aria-label={`${muted ? 'unmute' : 'mute'} ${label.toLowerCase()}`}
      style={{
        background: 'rgba(6,3,26,0.7)',
        border: '1px solid #5cf2ffaa',
        color: muted ? '#9fb8c4' : '#5cf2ff',
        fontFamily: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
        fontSize: 11,
        letterSpacing: '0.2em',
        padding: '8px 12px',
        cursor: 'pointer',
        opacity: muted ? 0.6 : 1,
      }}
    >
      {label} {muted ? 'OFF' : 'ON'}
    </button>
  );
}
