import { useState } from 'react';
import { Text } from '@react-three/drei';

// A wall-mounted neon sign: dark backplate with a glowing neon-colored
// border strip and emissive text. Place inside <Mount face="..." u=... v=...>.
// Size is local to the mount frame: width × height in meters.
export default function Sign({
  text,
  width = 1.2,
  height = 0.4,
  color = '#ff2d75',
  fontSize = 0.18,
  onClick,
}) {
  const [hover, setHover] = useState(false);
  const intensity = hover ? 2.4 : 1.4;
  const hasHandler = typeof onClick === 'function';

  return (
    <group
      onClick={hasHandler ? onClick : undefined}
      onPointerOver={() => {
        setHover(true);
        if (hasHandler) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Backplate */}
      <mesh>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#0a0420" roughness={0.7} />
      </mesh>
      {/* Neon border — four thin emissive strips around the backplate */}
      {[
        [width, 0.025, 0,  height / 2 - 0.012],   // top
        [width, 0.025, 0, -height / 2 + 0.012],   // bottom
        [0.025, height, -width / 2 + 0.012, 0],   // left
        [0.025, height,  width / 2 - 0.012, 0],   // right
      ].map(([w, h, x, y], i) => (
        <mesh key={i} position={[x, y, 0.025]}>
          <boxGeometry args={[w, h, 0.02]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={intensity}
            toneMapped={false}
          />
        </mesh>
      ))}
      <Text
        position={[0, 0, 0.045]}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.004}
        outlineColor={color}
      >
        {text}
      </Text>
    </group>
  );
}
