import { useGLTF } from '@react-three/drei';

// Generic GLB prop loader for Meshy exports.
// Drop your GLB into public/models/ then add:
//   <Prop src="/models/my_thing.glb" position={[1, 0, 2]} rotation={[0, Math.PI/2, 0]} scale={0.5} />
//
// `scale` accepts a single number or [x,y,z]. Meshy exports often need
// scaling down — start with scale={0.5} and tune from there.
//
// Hot tip: useGLTF caches by URL, so reusing the same src across multiple
// <Prop> instances does NOT redownload. We .clone() so each instance has its
// own transform without warping the cached source scene.
export default function Prop({ src, position, rotation, scale = 1, ...rest }) {
  const { scene } = useGLTF(src);
  return (
    <primitive
      object={scene.clone()}
      position={position}
      rotation={rotation}
      scale={scale}
      {...rest}
    />
  );
}

// Preload helper if you want to warm the cache:
//   import { preloadProp } from './shop/Prop.jsx';
//   preloadProp('/models/sign_projects.glb');
export const preloadProp = (src) => useGLTF.preload(src);
