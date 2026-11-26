import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Freeze,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  getStaticFiles,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { FULL_BLEED_SECONDS, HOOK_TEXT, PRO_SCENES, ProScene, XFADE, proSceneFrames } from './proScenes';

const GREEN = '#5EE07F';
const DISPLAY = 'ProDisplay';
const TEXT = 'ProText';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Phone geometry (1080×1920 canvas).
const SCREEN_W = 640;
const SCREEN_H = Math.round((SCREEN_W * 16) / 9);
const SCREEN_TOP = 600;
const BEZEL = 16;
const SCREEN_CENTER_Y = SCREEN_TOP + SCREEN_H / 2;
const FULL_SCALE = 1080 / SCREEN_W;

const hasFile = (p: string) => getStaticFiles().some((f) => f.name === p);

const useFonts = () => {
  const [handle] = useState(() => delayRender('pro fonts'));
  useEffect(() => {
    const faces = [
      new FontFace(DISPLAY, `url(${staticFile('fonts/InterDisplay-Bold.otf')})`, { weight: '700' }),
      new FontFace(TEXT, `url(${staticFile('fonts/Inter-SemiBold.otf')})`, { weight: '600' }),
    ];
    Promise.all(faces.map((f) => f.load().then((l) => document.fonts.add(l))))
      .catch(() => undefined)
      .finally(() => continueRender(handle));
  }, [handle]);
};

const starts = (() => {
  let c = 0;
  return PRO_SCENES.map((s) => {
    const at = c;
    c += proSceneFrames(s);
    return at;
  });
})();

// ── Background: deep charcoal, soft green glow, fine grain, vignette ──
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 70) * 30;
  return (
    <AbsoluteFill style={{ background: '#060807' }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% ${64 + drift / 40}%, rgba(70,200,105,0.30), rgba(70,200,105,0.06) 55%, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 60% 30% at 50% 18%, rgba(255,255,255,0.05), transparent 70%)',
        }}
      />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      <svg width="1080" height="1920" style={{ position: 'absolute', opacity: 0.07, mixBlendMode: 'overlay' }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(frame / 2)} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// ── One screen recording, cross-dissolving in over the previous one ──
const Screen: React.FC<{ scene: ProScene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const play = Math.round(scene.seconds * fps);
  const path = `clips/${scene.clip}`;
  const opacity = index === 0 ? 1 : interpolate(frame, [0, XFADE], [0, 1], { extrapolateRight: 'clamp' });
  const video = <OffthreadVideo src={staticFile(path)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
  if (!hasFile(path)) return <AbsoluteFill style={{ background: '#222' }} />;
  return <AbsoluteFill style={{ opacity }}>{frame < play ? video : <Freeze frame={play - 1}>{video}</Freeze>}</AbsoluteFill>;
};

// ── Phone: starts full-screen, pulls back, then floats gently ──
const Phone: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pullStart = Math.round(FULL_BLEED_SECONDS * fps);
  const p = interpolate(frame, [pullStart, pullStart + 26], [0, 1], { easing: EASE, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const scale = 1 + (1 - p) * (FULL_SCALE - 1);
  const shiftY = (1 - p) * (960 - SCREEN_CENTER_Y);
  const floatY = Math.sin(frame / 45) * 8 * p;
  const tiltY = Math.sin(frame / 60) * 4 * p;
  const tiltX = (3 + Math.cos(frame / 75) * 1.5) * p;
  const radius = 72 * p;

  return (
    <AbsoluteFill style={{ perspective: 2400 }}>
      {/* Soft shadow under the phone */}
      <div
        style={{
          position: 'absolute',
          left: 540 - 300,
          top: SCREEN_TOP + SCREEN_H - 20 + floatY,
          width: 600,
          height: 90,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)',
          filter: 'blur(40px)',
          opacity: p,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 540 - SCREEN_W / 2 - BEZEL,
          top: SCREEN_TOP - BEZEL,
          width: SCREEN_W + BEZEL * 2,
          height: SCREEN_H + BEZEL * 2,
          padding: BEZEL * p,
          boxSizing: 'border-box',
          borderRadius: radius + BEZEL,
          background: 'linear-gradient(145deg, #2a2d2b, #0b0c0c 40%, #1b1d1c)',
          boxShadow: p > 0 ? `0 0 0 2px rgba(255,255,255,${0.07 * p}), 0 60px 120px rgba(0,0,0,${0.55 * p})` : 'none',
          transformOrigin: `50% 50%`,
          transform: `translateY(${shiftY + floatY}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${scale})`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: radius,
            overflow: 'hidden',
            background: 'black',
            // keep the screen exactly full-canvas before the pull-back
            margin: 0,
          }}
        >
          {PRO_SCENES.map((s, i) => (
            <Sequence
              key={s.id}
              from={starts[i]}
              durationInFrames={proSceneFrames(s) + (i < PRO_SCENES.length - 1 ? XFADE : 0)}
            >
              <Screen scene={s} index={i} />
            </Sequence>
          ))}
          {/* Glass sheen */}
          <AbsoluteFill
            style={{
              background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 28%)',
              opacity: p,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ── Headline: eyebrow + two lines that rise out of a mask ──
const renderLine = (line: string) =>
  line.split(/(\[[^\]]+\])/).map((part, i) =>
    part.startsWith('[') ? (
      <span key={i} style={{ color: GREEN }}>
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

const Headline: React.FC<{ scene: ProScene; duration: number; keepEyebrowIn: boolean; keepEyebrowOut: boolean }> = ({
  scene,
  duration,
  keepEyebrowIn,
  keepEyebrowOut,
}) => {
  const frame = useCurrentFrame();
  const lines = scene.headline.split('\n');
  const out = interpolate(frame, [duration - 9, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const eyebrowIn = keepEyebrowIn ? 1 : interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const eyebrowOut = keepEyebrowOut ? 0 : out;

  return (
    <div style={{ position: 'absolute', top: 205, left: 70, right: 70, textAlign: 'center' }}>
      <div
        style={{
          fontFamily: TEXT,
          fontWeight: 600,
          fontSize: 34,
          letterSpacing: 6,
          textTransform: 'uppercase',
          color: GREEN,
          opacity: eyebrowIn * (1 - eyebrowOut),
          transform: `translateY(${(1 - eyebrowIn) * 14}px)`,
          marginBottom: 22,
        }}
      >
        {scene.eyebrow}
      </div>
      {lines.map((line, i) => {
        const t = interpolate(frame, [3 + i * 4, 21 + i * 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
        return (
          <div key={i} style={{ overflow: 'hidden', paddingBottom: 8 }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 1.02,
                letterSpacing: -3,
                color: 'white',
                transform: `translateY(${(1 - t) * 105 - out * 40}%)`,
                opacity: 1 - out,
              }}
            >
              {renderLine(line)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Hook text over the full-screen opening ──
const HookText: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp', easing: EASE });
  const out = interpolate(frame, [duration - 8, duration], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div style={{ position: 'absolute', top: 560, left: 60, right: 60, textAlign: 'center', overflow: 'hidden' }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: 92,
          lineHeight: 1.04,
          letterSpacing: -3,
          color: 'white',
          textShadow: '0 6px 40px rgba(0,0,0,0.6)',
          transform: `translateY(${(1 - t) * 100}%)`,
          opacity: out,
        }}
      >
        {HOOK_TEXT}
      </div>
    </div>
  );
};

export const FrogiAdPro: React.FC = () => {
  useFonts();
  const { fps } = useVideoConfig();
  const vo = 'audio/voiceover-pro.mp3';
  const hookEnd = Math.round(FULL_BLEED_SECONDS * fps);

  return (
    <AbsoluteFill>
      <Backdrop />
      <Phone />
      <Sequence from={4} durationInFrames={hookEnd - 4}>
        <HookText duration={hookEnd - 4} />
      </Sequence>
      {PRO_SCENES.map((s, i) => {
        const delay = Math.round((s.headlineAt ?? 0) * fps);
        const dur = proSceneFrames(s) - delay;
        const prev = PRO_SCENES[i - 1];
        const next = PRO_SCENES[i + 1];
        return (
          <Sequence key={s.id} from={starts[i] + delay} durationInFrames={dur}>
            <Headline
              scene={s}
              duration={i === PRO_SCENES.length - 1 ? dur + 100 : dur}
              keepEyebrowIn={!!prev && prev.eyebrow === s.eyebrow}
              keepEyebrowOut={!!next && next.eyebrow === s.eyebrow}
            />
          </Sequence>
        );
      })}
      {hasFile(vo) && <Audio src={staticFile(vo)} />}
      {hasFile('audio/music.mp3') && <Audio src={staticFile('audio/music.mp3')} volume={hasFile(vo) ? 0.12 : 0.35} />}
    </AbsoluteFill>
  );
};
