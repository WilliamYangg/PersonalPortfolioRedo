import { Grid } from '@react-three/drei';

// Wet cyberpunk street: dark reflective plane + animated neon grid lines.
// The Grid component from drei renders a shader-based infinite grid that
// fades into the fog.
export default function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          color="#02010a"
          roughness={0.25}
          metalness={0.8}
        />
      </mesh>
      <Grid
        args={[80, 80]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#ff2d75"
        sectionSize={4}
        sectionThickness={1.2}
        sectionColor="#00ffff"
        fadeDistance={28}
        fadeStrength={1.2}
        followCamera={false}
        infiniteGrid
        position={[0, 0.005, 0]}
      />
    </>
  );
}
