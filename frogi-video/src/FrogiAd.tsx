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
import { Caption, FPS, INTRO_FRAMES, INTRO_LINES, SCENES, Scene, Variant, sceneFrames } from './scenes';

const YELLOW = '#FFE14D';
const FONT = 'FrogiCaption';
const FONT_CLEAN = 'FrogiClean';
const FONT_MONO = 'FrogiMono';

const hasFile = (path: string) => getStaticFiles().some((f) => f.name === path);

// Load the bundled caption font before the first frame renders.
const useFont = () => {
  const [handle] = useState(() => delayRender('caption font'));
  useEffect(() => {
    const faces = [
      new FontFace(FONT, `url(${staticFile('fonts/Inter-Black.otf')})`, { weight: '900' }),
      new FontFace(FONT_CLEAN, `url(${staticFile('fonts/Inter-Bold.otf')})`, { weight: '700' }),
      new FontFace(FONT_MONO, `url(${staticFile('fonts/DejaVuSansMono.ttf')})`),
    ];
    Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l))))
      .catch(() => undefined)
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

// Grown-up captions: one dark pill, clean type, a soft fade.
const CleanCaption: React.FC<{ caption: Caption; y: number; endFrame: number }> = ({ caption, y, endFrame }) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [endFrame - 5, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: `${y}%`,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        transform: `translateY(calc(-50% + ${interpolate(enter, [0, 1], [12, 0])}px))`,
        opacity: enter * exit,
      }}
    >
      <div
        style={{
          maxWidth: 880,
          padding: '20px 34px',
          borderRadius: 24,
          background: 'rgba(14,16,18,0.82)',
          color: 'white',
          fontFamily: FONT_CLEAN,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.2,
          letterSpacing: -0.5,
          textAlign: 'center',
        }}
      >
        {caption.text}
      </div>
    </div>
  );
};

const TerminalIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ background: '#0d1117', justifyContent: 'center', padding: '0 80px' }}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 54, lineHeight: 1.6, marginTop: -160 }}>
        {INTRO_LINES.map((l, i) => {
          const start = Math.round(l.at * fps);
          if (frame < start) return null;
          const typedChars = l.typed ? Math.floor((frame - start) / 1.3) : l.text.length;
          const shown = l.text.slice(0, typedChars);
          const isLast = i === INTRO_LINES.length - 1;
          return (
            <div key={i} style={{ color: l.color, whiteSpace: 'pre' }}>
              {shown.startsWith('$') ? (
                <>
                  <span style={{ color: '#3fb950' }}>$</span>
                  {shown.slice(1)}
                </>
              ) : (
                shown
              )}
              {isLast && cursorOn && <span style={{ background: '#e6edf3', color: '#0d1117' }}> </span>}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
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

const SceneView: React.FC<{ scene: Scene; variant: Variant }> = ({ scene, variant }) => {
  const clean = variant === 'clean';
  const captions = (clean && scene.cleanCaptions) || scene.captions;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const total = sceneFrames(scene);
  const playFrames = Math.round(scene.seconds * fps);

  // Quick punch-in on the cut, then a slow push for movement.
  const punch = spring({ frame, fps, config: { damping: 14, stiffness: 180 } });
  const scale = clean
    ? interpolate(frame, [0, total], [1, 1.03])
    : interpolate(punch, [0, 1], [1.08, 1]) * interpolate(frame, [0, total], [1, 1.05]);

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
      {captions.map((c, i) => {
        const start = Math.round(c.at * fps);
        const next = captions[i + 1];
        const end = next ? Math.round(next.at * fps) : total;
        return (
          <Sequence key={i} from={start} durationInFrames={end - start} layout="none">
            {clean ? (
              <CleanCaption caption={c} y={scene.captionY} endFrame={end - start} />
            ) : (
              <CaptionLine caption={c} y={scene.captionY} size={scene.size ?? 92} endFrame={end - start} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const FrogiAd: React.FC<{ variant: Variant }> = ({ variant }) => {
  useFont();
  // Each version has its own voiceover file, since the timing differs.
  const voPath = variant === 'clean' ? 'audio/voiceover-clean.mp3' : 'audio/voiceover.mp3';
  const hasVO = hasFile(voPath);
  const hasMusic = hasFile('audio/music.mp3');
  let cursor = variant === 'clean' ? INTRO_FRAMES : 0;

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {variant === 'clean' && (
        <Sequence durationInFrames={INTRO_FRAMES}>
          <TerminalIntro />
        </Sequence>
      )}
      {SCENES.map((s) => {
        const from = cursor;
        cursor += sceneFrames(s);
        return (
          <Sequence key={s.id} from={from} durationInFrames={sceneFrames(s)}>
            <SceneView scene={s} variant={variant} />
          </Sequence>
        );
      })}
      {hasVO && <Audio src={staticFile(voPath)} />}
      {hasMusic && <Audio src={staticFile('audio/music.mp3')} volume={hasVO ? 0.12 : 0.35} />}
    </AbsoluteFill>
  );
};

