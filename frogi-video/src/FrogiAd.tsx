import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Freeze,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  getStaticFiles,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { Caption, FPS, SCENES, Scene, sceneFrames } from './scenes';

const YELLOW = '#FFE14D';
const FONT = 'FrogiCaption';

const hasFile = (path: string) => getStaticFiles().some((f) => f.name === path);

// Load the bundled caption font before the first frame renders.
const useFont = () => {
  const [handle] = useState(() => delayRender('caption font'));
  useEffect(() => {
    const face = new FontFace(FONT, `url(${staticFile('fonts/Inter-Black.otf')})`, { weight: '900' });
    face
      .load()
      .then((f) => document.fonts.add(f))
      .finally(() => continueRender(handle));
  }, [handle]);
};

const CaptionLine: React.FC<{ caption: Caption; y: number; size: number; endFrame: number }> = ({ caption, y, size, endFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = caption.text.split(' ');
  const exit = interpolate(frame, [endFrame - 4, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}%`,
        left: 70,
        right: 70,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0 22px',
        opacity: exit,
      }}
    >
      {words.map((w, i) => {
        const pop = spring({ frame: frame - i * 3, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
        const hot = caption.highlight?.includes(w);
        return (
          <span
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: size,
              lineHeight: 1.12,
              letterSpacing: -1,
              color: hot ? YELLOW : 'white',
              WebkitTextStroke: '14px black',
              paintOrder: 'stroke fill',
              textShadow: '0 8px 24px rgba(0,0,0,0.45)',
              transform: `scale(${interpolate(pop, [0, 1], [0.6, 1])}) translateY(${interpolate(pop, [0, 1], [30, 0])}px)`,
              opacity: Math.min(1, pop * 1.5),
              display: 'inline-block',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const Placeholder: React.FC<{ name: string }> = ({ name }) => (
  <AbsoluteFill style={{ background: '#1f3a2a', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ color: 'white', fontFamily: FONT, fontSize: 60, textAlign: 'center', padding: 80 }}>
      Missing clip:
      <br />
      {name}
    </div>
  </AbsoluteFill>
);

const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = sceneFrames(scene);
  const playFrames = Math.round(scene.seconds * fps);

  // Quick punch-in on the cut, then a slow push for movement.
  const punch = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const scale = interpolate(punch, [0, 1], [1.08, 1]) * interpolate(frame, [0, total], [1, 1.05]);

  const path = `clips/${scene.clip}`;
  const video = (
    <OffthreadVideo
      src={staticFile(path)}
      trimBefore={Math.round((scene.from ?? 0) * fps)}
      muted
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        {!hasFile(path) ? (
          <Placeholder name={scene.clip} />
        ) : frame < playFrames ? (
          video
        ) : (
          <Freeze frame={playFrames - 1}>{video}</Freeze>
        )}
      </AbsoluteFill>
      {scene.captions.map((c, i) => {
        const start = Math.round(c.at * fps);
        const next = scene.captions[i + 1];
        const end = next ? Math.round(next.at * fps) : total;
        return (
          <Sequence key={i} from={start} durationInFrames={end - start} layout="none">
            <CaptionLine caption={c} y={scene.captionY} size={scene.size ?? 92} endFrame={end - start} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const FrogiAd: React.FC = () => {
  useFont();
  const hasVO = hasFile('audio/voiceover.mp3');
  const hasMusic = hasFile('audio/music.mp3');
  let cursor = 0;

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {SCENES.map((s) => {
        const from = cursor;
        cursor += sceneFrames(s);
        return (
          <Sequence key={s.id} from={from} durationInFrames={sceneFrames(s)}>
            <SceneView scene={s} />
          </Sequence>
        );
      })}
      {hasVO && <Audio src={staticFile('audio/voiceover.mp3')} />}
      {hasMusic && <Audio src={staticFile('audio/music.mp3')} volume={hasVO ? 0.12 : 0.35} />}
    </AbsoluteFill>
  );
};

export { FPS };
