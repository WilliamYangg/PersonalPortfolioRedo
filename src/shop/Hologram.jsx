import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// A floating holographic projection. A plane with a custom shader that does:
//   - chromatic aberration (R/G/B sampled at slightly offset uvs)
//   - moving scanlines
//   - random horizontal glitch bars (whole rows shift sideways briefly)
//   - cyan tint + edge fade so it reads as projected light
//   - subtle opacity pulse + rare full dropouts
// Additive-blended so it adds light to the wall behind it instead of being a
// solid sticker.

const vert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = `
  uniform sampler2D map;
  uniform float time;
  uniform vec3 holoColor;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // Subtle chromatic aberration.
    float aberr = 0.0025;
    float r = texture2D(map, uv + vec2(aberr, 0.0)).r;
    float g = texture2D(map, uv).g;
    float b = texture2D(map, uv - vec2(aberr, 0.0)).b;
    vec3 tex = vec3(r, g, b);

    // Mix cyan-tinted photo (keeps detail/warmth) with pure cyan glow.
    float lum = dot(tex, vec3(0.299, 0.587, 0.114));
    vec3 tinted = tex * holoColor * 2.0;
    vec3 cyanGlow = holoColor * (lum * 3.0 + 0.3);
    vec3 color = mix(tinted, cyanGlow, 0.10);

    // Soft scanlines.
    float scan = 0.5 + 0.5 * sin(uv.y * 220.0 - time * 3.0);
    color *= 0.9 + 0.1 * scan;

    // Gentle pulse.
    color *= 0.94 + 0.06 * sin(time * 1.5);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function Hologram({
  src = '/pictures/portrait.webp',
  position = [0, 1.4, 0],
  rotation = [0, 0, 0],
  width = 1.2,
  height = 1.6,
  color = '#5cf2ff',
}) {
  const tex = useTexture(src);
  const matRef = useRef();

  const uniforms = useMemo(
    () => ({
      map: { value: tex },
      time: { value: 0 },
      holoColor: { value: new THREE.Color(color) },
    }),
    [tex, color],
  );

  useFrame((state) => {
    if (matRef.current) matRef.current.uniforms.time.value = state.clock.elapsedTime;
  });

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
