// Beat-synced TikTok edit. Media lives in public/edit/ (not uploaded to GitHub).
// c1–c4 are the original clips; c1hd–c4hd are upscaled + sharpened copies made with ffmpeg.
import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
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
type Fx = 'punch' | 'shake' | 'flash' | 'blur' | 'slow' | 'rgb' | 'ramp' | 'bw';
// How the shot ENTERS. It starts a few frames before its beat so it lands exactly on the beat.
type Tr = 'cut' | 'slideR' | 'slideL' | 'slideUp' | 'zoom' | 'spin' | 'fade';
type Shot = { clip: Clip; src: number; at: number; fx?: Fx[]; rate?: number; tr?: Tr };

const TR_LEN: Record<Tr, number> = { cut: 0, slideR: 6, slideL: 6, slideUp: 6, zoom: 6, spin: 7, fade: 10 };

const b = (n: number) => DROP + n * BEAT;

// Clips c3/c4 have a white glow + music sticker at the bottom, so they get a deeper crop.
const CROP: Record<Clip, number> = { c1: 1.13, c2: 1.13, c3: 1.36, c4: 1.36 };

const SHOTS: Shot[] = [
  // Intro (black & white) while the text types out
  { clip: 'c3', src: 4.4, at: 0, fx: ['bw', 'slow'], rate: 0.7 },
  // DROP: colour bursts in (hard cuts on the big hits, transitions in between)
  { clip: 'c4', src: 9.6, at: b(0), fx: ['flash', 'rgb', 'shake', 'punch'] },
  { clip: 'c2', src: 3.0, at: b(1), fx: ['punch'] },
  { clip: 'c3', src: 21.4, at: b(2), fx: ['rgb'], tr: 'zoom' },
  { clip: 'c1', src: 6.0, at: b(3), fx: ['punch'] },
  { clip: 'c4', src: 12.0, at: b(4), fx: ['punch', 'shake'] },
  // Dip in the song: let one shot breathe
  { clip: 'c3', src: 14.2, at: b(5), fx: ['slow'], rate: 0.75, tr: 'fade' },
  // Back in
  { clip: 'c4', src: 24.0, at: b(8), fx: ['flash', 'rgb', 'shake', 'ramp'] },
  { clip: 'c2', src: 9.0, at: b(9), fx: ['punch'] },
  { clip: 'c3', src: 2.4, at: b(10), fx: ['punch'] },
  { clip: 'c1', src: 15.0, at: b(11), fx: ['punch', 'shake'] },
  { clip: 'c4', src: 28.6, at: b(12), fx: ['flash', 'rgb', 'punch'] },
  { clip: 'c2', src: 24.0, at: b(13), fx: ['punch'] },
  { clip: 'c3', src: 17.8, at: b(14), fx: ['punch', 'shake'] },
  { clip: 'c1', src: 1.5, at: b(15), fx: ['punch'] },
  { clip: 'c4', src: 4.6, at: b(16), fx: ['flash', 'rgb', 'ramp'] },
  { clip: 'c2', src: 27.0, at: b(18), fx: ['punch'] },
  { clip: 'c3', src: 7.2, at: b(19), fx: ['punch', 'shake'] },
  { clip: 'c4', src: 10.6, at: b(20), fx: ['punch'] },
  { clip: 'c1', src: 10.5, at: b(21), fx: ['punch'] },
  { clip: 'c2', src: 30.0, at: b(22), fx: ['flash', 'rgb', 'ramp'] },
  { clip: 'c3', src: 29.8, at: b(24), fx: ['punch'] },
  { clip: 'c4', src: 20.4, at: b(25), fx: ['punch', 'shake'] },
  { clip: 'c1', src: 18.0, at: b(26), fx: ['punch'] },
  { clip: 'c2', src: 31.5, at: b(27), tr: 'spin' },
  { clip: 'c3', src: 26.2, at: b(28), fx: ['flash', 'rgb', 'punch'] },
  { clip: 'c4', src: 14.4, at: b(29), fx: ['shake'], tr: 'zoom' },
  // Outro: smooth slow-mo on her biggest smile all the way to the end
  { clip: 'c4', src: 30.6, at: b(30), fx: ['slow'], rate: 0.5, tr: 'fade' },
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
    <filter id="mb-x"><feGaussianBlur stdDeviation="38 0" /></filter>
    <filter id="mb-y"><feGaussianBlur stdDeviation="0 38" /></filter>
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

const ShotView: React.FC<{ shot: Shot; dur: number; lead: number; exitTr: Tr; exitLen: number }> = ({
  shot,
  dur,
  lead,
  exitTr,
  exitLen,
}) => {
  const f = useCurrentFrame();
  const fb = f - lead; // frames since this shot's beat
  const fx = shot.fx ?? [];
  const ease = Easing.out(Easing.cubic);

  let scale = CROP[shot.clip];
  if (fx.includes('punch')) scale *= interpolate(fb, [0, 7], [fx.includes('flash') ? 1.22 : 1.1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
  if (fx.includes('slow')) scale *= interpolate(f, [0, dur], [1, 1.12]);
  if (fx.includes('ramp')) scale *= interpolate(f, [0, dur * 0.4, dur], [1.0, 1.16, 1.08], { easing: Easing.inOut(Easing.quad) });

  let dx = 0;
  let dy = 0;
  let rot = 0;
  if (fx.includes('shake') && fb >= 0 && fb < 9) {
    const k = 1 - fb / 9;
    dx = (random(`x${shot.at}${fb}`) - 0.5) * 44 * k;
    dy = (random(`y${shot.at}${fb}`) - 0.5) * 44 * k;
    rot = (random(`r${shot.at}${fb}`) - 0.5) * 3 * k;
  }
  const grade = fx.includes('bw')
    ? 'grayscale(1) contrast(1.25) brightness(1.02)'
    : 'contrast(1.08) saturate(1.18) brightness(1.04) sepia(0.06)';

  // Speed ramp: fast into the beat (2.2x), then slow-mo (0.55x).
  const rampSplit = Math.round(dur * 0.4);
  let video: React.ReactNode;
  if (fx.includes('ramp')) {
    const video2 = <Video clip={shot.clip} src={shot.src + (rampSplit * 2.2) / EDIT_FPS} rate={0.55} />;
    video = f < rampSplit ? <Video clip={shot.clip} src={shot.src} rate={2.2} /> : <Sequence from={rampSplit} layout="none">{video2}</Sequence>;
  } else {
    video = <Video clip={shot.clip} src={shot.src} rate={shot.rate ?? 1} />;
  }

  const split = fx.includes('rgb') ? interpolate(fb, [0, 7], [26, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;

  // ── Transition in (lands on the beat) and out (pushed by the next shot) ──
  const tr = shot.tr ?? 'cut';
  const e = lead > 0 ? interpolate(f, [0, lead], [0, 1], { extrapolateRight: 'clamp', easing: ease }) : 1;
  const q = exitLen > 0 ? interpolate(f, [dur - exitLen, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease }) : 0;
  let tx = 0;
  let ty = 0;
  let ts = 1;
  let tr8 = 0;
  let op = 1;
  let mblur = '';
  let soft = 0;
  if (e < 1) {
    if (tr === 'slideR') tx = (1 - e) * 1080;
    if (tr === 'slideL') tx = -(1 - e) * 1080;
    if (tr === 'slideUp') ty = (1 - e) * 1920;
    if (tr === 'zoom') { ts = 1 + (1 - e) * 0.8; op = e; soft = (1 - e) * 14; }
    if (tr === 'spin') { ts = 1 + (1 - e) * 0.5; tr8 = (1 - e) * -22; op = Math.min(1, e * 1.6); soft = (1 - e) * 10; }
    if (tr === 'fade') op = e;
    if (tr.startsWith('slide') && e < 0.9) mblur = tr === 'slideUp' ? 'url(#mb-y)' : 'url(#mb-x)';
  }
  if (q > 0) {
    if (exitTr === 'slideR') tx = -q * 1080;
    if (exitTr === 'slideL') tx = q * 1080;
    if (exitTr === 'slideUp') ty = -q * 1920;
    if (exitTr === 'zoom') { ts = 1 + q * 0.35; soft = q * 8; }
    if (exitTr === 'spin') { ts = 1 + q * 0.3; tr8 = q * 18; soft = q * 6; }
    if (exitTr.startsWith('slide') && q > 0.1 && q < 1) mblur = exitTr === 'slideUp' ? 'url(#mb-y)' : 'url(#mb-x)';
  }

  return (
    <AbsoluteFill
      style={{
        background: 'black',
        opacity: op,
        transform: `translate(${tx}px, ${ty}px) rotate(${tr8}deg) scale(${ts})`,
        filter: `${mblur} blur(${soft}px)`.trim(),
      }}
    >
      <AbsoluteFill
        style={{
          transformOrigin: '50% 38%',
          transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
          filter: grade,
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
        <AbsoluteFill style={{ background: 'white', opacity: interpolate(fb, [0, 6], [0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />
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
        transform: `translateY(${(1 - t) * 90}px)`,
        letterSpacing: 2,
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
        const lead = TR_LEN[s.tr ?? 'cut'];
        const next = SHOTS[i + 1];
        const from = Math.round(s.at * EDIT_FPS) - lead;
        const to = next ? Math.round(next.at * EDIT_FPS) : total;
        const exitTr = next?.tr ?? 'cut';
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView shot={s} dur={to - from} lead={lead} exitTr={exitTr} exitLen={next ? TR_LEN[exitTr] : 0} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{ background: 'rgba(255,140,60,0.06)', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.45) 100%)' }} />
      <Grain />
      <Sequence durationInFrames={dropFrame}>
        <Typing />
      </Sequence>
      <Sequence from={outroFrame + 18}>
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
