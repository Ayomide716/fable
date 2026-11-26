// Beat-synced TikTok edit. Media lives in public/edit/ (not uploaded to GitHub).
// c1–c4 are the original clips; c1hd–c4hd are upscaled + sharpened copies made with ffmpeg.
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
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export const EDIT_FPS = 30;
const SONG_START = 69.0; // seconds into the song: the hit before the build
const BEAT = 0.6058; // ~99 BPM
const DROP = 5.03; // first beat of the drop, relative to SONG_START
export const EDIT_SECONDS = 27.0; // ends right before the next quiet dip in the song

const SERIF = 'EditSerif';

type Clip = 'c1' | 'c2' | 'c3' | 'c4';
type Fx = 'punch' | 'shake' | 'flash' | 'blur' | 'slow' | 'rgb' | 'ramp' | 'bw' | 'freeze';
type Shot = { clip: Clip; src: number; at: number; fx?: Fx[]; rate?: number };

const b = (n: number) => DROP + n * BEAT;

// Clips c3/c4 have a white glow + music sticker at the bottom, so they get a deeper crop.
const CROP: Record<Clip, number> = { c1: 1.13, c2: 1.13, c3: 1.36, c4: 1.36 };

const SHOTS: Shot[] = [
  // Intro (black & white) while the text types out
  { clip: 'c3', src: 4.4, at: 0, fx: ['bw', 'slow'], rate: 0.7 },
  // DROP: colour bursts in
  { clip: 'c4', src: 9.6, at: b(0), fx: ['flash', 'rgb', 'shake', 'punch'] },
  { clip: 'c2', src: 3.0, at: b(1), fx: ['punch'] },
  { clip: 'c3', src: 21.4, at: b(2), fx: ['rgb', 'punch'] },
  { clip: 'c1', src: 6.0, at: b(3), fx: ['punch'] },
  { clip: 'c4', src: 12.0, at: b(4), fx: ['shake', 'punch'] },
  // Dip in the song: let one shot breathe
  { clip: 'c3', src: 14.2, at: b(5), fx: ['blur', 'slow'], rate: 0.75 },
  // Back in
  { clip: 'c4', src: 24.0, at: b(8), fx: ['flash', 'rgb', 'shake', 'ramp'] },
  { clip: 'c2', src: 9.0, at: b(9), fx: ['punch'] },
  { clip: 'c3', src: 2.4, at: b(10), fx: ['punch'] },
  { clip: 'c1', src: 15.0, at: b(11), fx: ['shake', 'punch'] },
  { clip: 'c4', src: 28.6, at: b(12), fx: ['flash', 'rgb', 'punch'] },
  { clip: 'c2', src: 24.0, at: b(13), fx: ['punch'] },
  { clip: 'c3', src: 17.8, at: b(14), fx: ['shake', 'punch'] },
  { clip: 'c1', src: 1.5, at: b(15), fx: ['punch'] },
  { clip: 'c4', src: 4.6, at: b(16), fx: ['flash', 'rgb', 'ramp'] },
  { clip: 'c2', src: 27.0, at: b(18), fx: ['punch'] },
  { clip: 'c3', src: 7.2, at: b(19), fx: ['shake', 'punch'] },
  { clip: 'c4', src: 10.6, at: b(20), fx: ['punch'] },
  { clip: 'c1', src: 10.5, at: b(21), fx: ['punch'] },
  { clip: 'c2', src: 30.0, at: b(22), fx: ['flash', 'rgb', 'ramp'] },
  { clip: 'c3', src: 29.8, at: b(24), fx: ['punch'] },
  { clip: 'c4', src: 20.4, at: b(25), fx: ['shake', 'punch'] },
  { clip: 'c1', src: 18.0, at: b(26), fx: ['punch'] },
  { clip: 'c2', src: 31.5, at: b(27), fx: ['punch'] },
  { clip: 'c3', src: 26.2, at: b(28), fx: ['flash', 'rgb', 'punch'] },
  { clip: 'c4', src: 14.4, at: b(29), fx: ['shake', 'punch'] },
  // Outro: slow-mo on her biggest smile, then freeze
  { clip: 'c4', src: 30.9, at: b(30), fx: ['flash', 'slow', 'freeze'], rate: 0.5 },
];

const useSerif = () => {
  const [h] = useState(() => delayRender('serif'));
  useEffect(() => {
    new FontFace(SERIF, `url(${staticFile('fonts/PlayfairDisplay-Italic.woff2')})`, { style: 'italic' })
      .load()
      .then((f) => document.fonts.add(f))
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, [h]);
};

// SVG filters for the colour-split glitch (one layer per channel).
const ChannelFilters: React.FC = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <filter id="ch-r">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" />
    </filter>
    <filter id="ch-g">
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" />
    </filter>
    <filter id="ch-b">
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" />
    </filter>
  </svg>
);

const Video: React.FC<{ clip: Clip; src: number; rate: number; style?: React.CSSProperties }> = ({ clip, src, rate, style }) => (
  <OffthreadVideo
    src={staticFile(`edit/${clip}hd.mp4`)}
    trimBefore={Math.round(src * EDIT_FPS)}
    playbackRate={rate}
    muted
    style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }}
  />
);

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const f = useCurrentFrame();
  const fx = shot.fx ?? [];
  const ease = Easing.out(Easing.cubic);

  let scale = CROP[shot.clip];
  if (fx.includes('punch')) scale *= interpolate(f, [0, 7], [1.22, 1], { extrapolateRight: 'clamp', easing: ease });
  if (fx.includes('slow')) scale *= interpolate(f, [0, dur], [1, 1.12]);
  if (fx.includes('ramp')) scale *= interpolate(f, [0, dur * 0.4, dur], [1.0, 1.16, 1.08], { easing: Easing.inOut(Easing.quad) });

  let dx = 0;
  let dy = 0;
  let rot = 0;
  if (fx.includes('shake') && f < 9) {
    const k = 1 - f / 9;
    dx = (random(`x${shot.at}${f}`) - 0.5) * 44 * k;
    dy = (random(`y${shot.at}${f}`) - 0.5) * 44 * k;
    rot = (random(`r${shot.at}${f}`) - 0.5) * 3 * k;
  }
  const blur = fx.includes('blur') ? interpolate(f, [0, 6], [18, 0], { extrapolateRight: 'clamp' }) : 0;
  const grade = fx.includes('bw')
    ? 'grayscale(1) contrast(1.25) brightness(1.02)'
    : 'contrast(1.08) saturate(1.18) brightness(1.04) sepia(0.06)';

  // Speed ramp: fast into the beat (2.2x), then slow-mo (0.55x).
  const rampSplit = Math.round(dur * 0.4);
  let video: React.ReactNode;
  if (fx.includes('ramp')) {
    const video2 = <Video clip={shot.clip} src={shot.src + (rampSplit * 2.2) / EDIT_FPS} rate={0.55} />;
    video = f < rampSplit ? <Video clip={shot.clip} src={shot.src} rate={2.2} /> : <Sequence from={rampSplit} layout="none">{video2}</Sequence>;
  } else if (fx.includes('freeze')) {
    const playFrames = Math.round(dur * 0.55);
    const v = <Video clip={shot.clip} src={shot.src} rate={shot.rate ?? 1} />;
    video = f < playFrames ? v : <Freeze frame={playFrames}>{v}</Freeze>;
  } else {
    video = <Video clip={shot.clip} src={shot.src} rate={shot.rate ?? 1} />;
  }

  // Colour split on the first frames of the shot.
  const split = fx.includes('rgb') ? interpolate(f, [0, 7], [26, 0], { extrapolateRight: 'clamp' }) : 0;

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <AbsoluteFill
        style={{
          transformOrigin: '50% 38%',
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
          filter: `blur(${blur}px) ${grade}`,
        }}
      >
        {split > 0.5 ? (
          <>
            <AbsoluteFill style={{ filter: 'url(#ch-r)', transform: `translateX(${split}px)`, mixBlendMode: 'screen' }}>{video}</AbsoluteFill>
            <AbsoluteFill style={{ filter: 'url(#ch-g)', mixBlendMode: 'screen' }}>{video}</AbsoluteFill>
            <AbsoluteFill style={{ filter: 'url(#ch-b)', transform: `translateX(${-split}px)`, mixBlendMode: 'screen' }}>{video}</AbsoluteFill>
          </>
        ) : (
          video
        )}
      </AbsoluteFill>
      {(shot.clip === 'c3' || shot.clip === 'c4') && (
        <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(12,4,24,0.92) 0%, rgba(12,4,24,0.55) 14%, transparent 30%)' }} />
      )}
      {fx.includes('flash') && (
        <AbsoluteFill style={{ background: 'white', opacity: interpolate(f, [0, 6], [0.9, 0], { extrapolateRight: 'clamp' }) }} />
      )}
    </AbsoluteFill>
  );
};

// ── Typing intro: "some people are pretty." → backspace → "art." ──
const TYPE_SCRIPT: { at: number; text: string }[] = (() => {
  const steps: { at: number; text: string }[] = [];
  const base = 'some people are ';
  const first = base + 'pretty.';
  let t = 0.35;
  for (let i = 1; i <= first.length; i++) steps.push({ at: (t += 0.07), text: first.slice(0, i) });
  t += 0.55; // let it sit
  for (let i = first.length - 1; i >= base.length; i--) steps.push({ at: (t += 0.05), text: first.slice(0, i) });
  t += 0.35;
  const last = base + 'art.';
  for (let i = base.length + 1; i <= last.length; i++) steps.push({ at: (t += 0.17), text: last.slice(0, i) });
  return steps;
})();

const Typing: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / EDIT_FPS;
  let text = '';
  for (const s of TYPE_SCRIPT) if (t >= s.at) text = s.text;
  const done = TYPE_SCRIPT[TYPE_SCRIPT.length - 1].at;
  const cursor = Math.floor(f / 9) % 2 === 0 || (t < done + 0.2 && t > 0.3);
  const base = 'some people are ';
  const tail = text.slice(base.length);
  const isArt = text.endsWith('art.') || (tail.length > 0 && 'art.'.startsWith(tail) && t > done - 1);
  const glow = interpolate(t, [done, done + 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        top: '64%',
        left: 60,
        right: 60,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: 96,
        lineHeight: 1.15,
        color: 'white',
        textShadow: '0 4px 30px rgba(0,0,0,0.65)',
      }}
    >
      {text.slice(0, Math.min(text.length, base.length))}
      {tail && (
        <span style={{ textShadow: isArt ? `0 0 ${30 * glow}px rgba(255,255,255,${0.8 * glow}), 0 4px 30px rgba(0,0,0,0.65)` : undefined }}>
          {tail}
        </span>
      )}
      <span style={{ opacity: cursor ? 1 : 0, fontStyle: 'normal', fontWeight: 300, marginLeft: 4 }}>|</span>
    </div>
  );
};

const Mine: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, 22], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <div
      style={{
        position: 'absolute',
        top: '70%',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: 'italic',
        fontSize: 120,
        color: 'white',
        opacity: t,
        letterSpacing: interpolate(t, [0, 1], [18, 2]),
        textShadow: '0 4px 40px rgba(0,0,0,0.6), 0 0 24px rgba(255,255,255,0.35)',
      }}
    >
      mine.
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="1080" height="1920" style={{ position: 'absolute', opacity: 0.09, mixBlendMode: 'overlay' }}>
      <filter id="g">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};

export const BeatEdit: React.FC = () => {
  useSerif();
  const f = useCurrentFrame();
  const total = Math.round(EDIT_SECONDS * EDIT_FPS);
  const fadeOut = interpolate(f, [total - 24, total], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dropFrame = Math.round(DROP * EDIT_FPS);
  const outroFrame = Math.round(SHOTS[SHOTS.length - 1].at * EDIT_FPS);

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <ChannelFilters />
      {SHOTS.map((s, i) => {
        const from = Math.round(s.at * EDIT_FPS);
        const to = i < SHOTS.length - 1 ? Math.round(SHOTS[i + 1].at * EDIT_FPS) : total;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView shot={s} dur={to - from} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: 'rgba(255,140,60,0.06)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <Grain />
      <Sequence durationInFrames={dropFrame}>
        <Typing />
      </Sequence>
      <Sequence from={outroFrame + 14}>
        <Mine />
      </Sequence>
      <AbsoluteFill style={{ background: 'black', opacity: fadeOut }} />
      <Audio
        src={staticFile('edit/song.mp3')}
        trimBefore={Math.round(SONG_START * EDIT_FPS)}
        volume={(fr) => interpolate(fr, [total - 30, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  );
};
