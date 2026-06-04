import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { flickerFactor } from './flicker.js';

// A pointLight whose intensity follows a cyberpunk flicker pattern. Same
// flicker function as the sign emissive, so spill light dips together with
// the sign when given a matching frequency/seed.
export default function FlickerPointLight({
  baseIntensity = 2,
  frequency = 3,
  amplitude = 0.6,
  seed = 0,
  ...rest
}) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const m = flickerFactor(state.clock.elapsedTime, frequency, amplitude, seed);
    ref.current.intensity = baseIntensity * m;
  });
  return <pointLight ref={ref} intensity={baseIntensity} {...rest} />;
}
