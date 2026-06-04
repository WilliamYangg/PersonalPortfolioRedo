import { useTexture, useVideoTexture } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

// A wall-mounted screen showing an image OR looping video.
// Pass exactly one of:
//   image="/textures/foo.png"
//   video="/videos/bar.mp4"
// fit="stretch" (default) maps the image to the plane (may distort).
// fit="cover" crops the image so it fills the plane while preserving aspect
// (e.g. portrait image on a landscape plane gets top + bottom cropped off).
export default function AdScreen({
  image,
  video,
  width = 1.6,
  height = 0.9,
  emissiveIntensity = 1.2,
  bezel = true,
  fit = 'stretch',
}) {
  return (
    <group>
      {bezel && (
        <mesh position={[0, 0, -0.005]}>
          <boxGeometry args={[width + 0.08, height + 0.08, 0.03]} />
          <meshStandardMaterial color="#04020a" roughness={0.6} metalness={0.4} />
        </mesh>
      )}
      <ScreenSurface
        image={image}
        video={video}
        width={width}
        height={height}
        emissiveIntensity={emissiveIntensity}
        fit={fit}
      />
    </group>
  );
}

function ScreenSurface({ image, video, width, height, emissiveIntensity, fit }) {
  if (video) return <VideoSurface src={video} width={width} height={height} />;
  if (image) return <ImageSurface src={image} width={width} height={height} emissiveIntensity={emissiveIntensity} fit={fit} />;
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color="#ff00ff" />
    </mesh>
  );
}

function ImageSurface({ src, width, height, emissiveIntensity, fit }) {
  const tex = useTexture(src);
  // Clone the texture so per-instance repeat/offset don't mutate the cached
  // shared texture (useTexture caches by URL — multiple AdScreens using the
  // same image with different fits would otherwise clobber each other).
  const cropped = useMemo(() => {
    const t = tex.clone();
    t.needsUpdate = true;
    if (fit === 'cover' && tex.image && tex.image.width && tex.image.height) {
      const imgAR = tex.image.width / tex.image.height;
      const planeAR = width / height;
      t.wrapS = THREE.ClampToEdgeWrapping;
      t.wrapT = THREE.ClampToEdgeWrapping;
      if (planeAR > imgAR) {
        t.repeat.set(1, imgAR / planeAR);
        t.offset.set(0, (1 - imgAR / planeAR) / 2);
      } else {
        t.repeat.set(planeAR / imgAR, 1);
        t.offset.set((1 - planeAR / imgAR) / 2, 0);
      }
    }
    return t;
  }, [tex, fit, width, height]);
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        map={cropped}
        emissive="#ffffff"
        emissiveMap={cropped}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false}
      />
    </mesh>
  );
}

function VideoSurface({ src, width, height }) {
  const tex = useVideoTexture(src, { muted: true, loop: true, start: true });
  return (
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}
