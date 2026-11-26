// Beat-synced TikTok edit. Media lives in public/edit/ (not uploaded to GitHub).
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from 'remotion';

export const EDIT_FPS = 30;
const SONG_START = 69.0; // seconds into the song: the hit before the build
const BEAT = 0.6058; // ~99 BPM
const DROP = 5.03; // first beat of the drop, relative to SONG_START
export const EDIT_SECONDS = 21.4;

type Fx = 'punch' | 'shake' | 'flash' | 'blur' | 'slow';
type Shot = { clip: 'c1' | 'c2'; src: number; at: number; fx?: Fx[]; rate?: number };

// Beat n after the drop (n can be fractional).
const b = (n: number) => DROP + n * BEAT;

const SHOTS: Shot[] = [
  // Intro: one dreamy slow-motion shot through the build
  { clip: 'c1', src: 9.2, at: 0, fx: ['flash', 'slow'], rate: 0.7 },
  // DROP: a cut on every beat
  { clip: 'c2', src: 3.0, at: b(0), fx: ['flash', 'shake', 'punch'] },
  { clip: 'c1', src: 1.5, at: b(1), fx: ['punch'] },
  { clip: 'c2', src: 9.0, at: b(2), fx: ['shake', 'punch'] },
  { clip: 'c1', src: 6.0, at: b(3), fx: ['punch'] },
  { clip: 'c2', src: 4.5, at: b(4), fx: ['shake', 'punch'] },
  // Little dip in the song: let one shot breathe
  { clip: 'c2', src: 10.3, at: b(5), fx: ['blur', 'slow'], rate: 0.75 },
  // Back in
  { clip: 'c1', src: 15.0, at: b(8), fx: ['flash', 'shake', 'punch'] },
  { clip: 'c2', src: 13.5, at: b(9), fx: ['punch'] },
  { clip: 'c1', src: 7.5, at: b(10), fx: ['shake', 'punch'] },
  { clip: 'c2', src: 24.0, at: b(11), fx: ['punch'] },
  { clip: 'c2', src: 27.0, at: b(12), fx: ['flash', 'shake', 'punch'] },
  { clip: 'c1', src: 13.5, at: b(13), fx: ['punch'] },
  { clip: 'c2', src: 15.0, at: b(14), fx: ['shake', 'punch'] },
  { clip: 'c1', src: 3.0, at: b(15), fx: ['punch'] },
  { clip: 'c2', src: 30.0, at: b(16), fx: ['flash', 'shake', 'punch'] },
  { clip: 'c2', src: 31.5, at: b(17), fx: ['punch'] },
  { clip: 'c1', src: 10.5, at: b(18), fx: ['blur'] },
  { clip: 'c2', src: 16.5, at: b(20), fx: ['shake', 'punch'] },
  // Outro: peace sign, slow push, fade out
  { clip: 'c1', src: 17.6, at: b(22), fx: ['flash', 'slow'], rate: 0.8 },
];

const ShotView: React.FC<{ shot: Shot; dur: number }> = ({ shot, dur }) => {
  const f = useCurrentFrame();
  const fx = shot.fx ?? [];
  const ease = Easing.out(Easing.cubic);

  // Base crop hides the WhatsApp music sticker at the bottom.
  let scale = 1.13;
  if (fx.includes('punch')) scale *= interpolate(f, [0, 7], [1.22, 1], { extrapolateRight: 'clamp', easing: ease });
  if (fx.includes('slow')) scale *= interpolate(f, [0, dur], [1, 1.12]);

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

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <AbsoluteFill
        style={{
          transformOrigin: '50% 40%',
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
          filter: `blur(${blur}px) contrast(1.08) saturate(1.18) brightness(1.04) sepia(0.08)`,
        }}
      >
        <OffthreadVideo
          src={staticFile(`edit/${shot.clip}.mp4`)}
          trimBefore={Math.round(shot.src * EDIT_FPS)}
          playbackRate={shot.rate ?? 1}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </AbsoluteFill>
      {fx.includes('flash') && (
        <AbsoluteFill
          style={{ background: 'white', opacity: interpolate(f, [0, 6], [0.85, 0], { extrapolateRight: 'clamp' }) }}
        />
      )}
    </AbsoluteFill>
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
  const f = useCurrentFrame();
  const total = Math.round(EDIT_SECONDS * EDIT_FPS);
  const fadeOut = interpolate(f, [total - 24, total], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {SHOTS.map((s, i) => {
        const from = Math.round(s.at * EDIT_FPS);
        const to = i < SHOTS.length - 1 ? Math.round(SHOTS[i + 1].at * EDIT_FPS) : total;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView shot={s} dur={to - from} />
          </Sequence>
        );
      })}
      {/* Warm tint + vignette */}
      <AbsoluteFill style={{ background: 'rgba(255,140,60,0.06)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <Grain />
      <AbsoluteFill style={{ background: 'black', opacity: fadeOut }} />
      <Audio
        src={staticFile('edit/song.mp3')}
        trimBefore={Math.round(SONG_START * EDIT_FPS)}
        volume={(fr) => interpolate(fr, [total - 30, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  );
};
