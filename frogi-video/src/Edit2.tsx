// Second beat edit ("a short film about her"), styled after a reference edit:
// letterboxed square frame, half-panel white flashes, split screens, negative flashes.
// Media lives in public/edit/ (not uploaded to GitHub).
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
  staticFile,
  useCurrentFrame,
} from 'remotion';

export const E2_FPS = 30;
export const E2_SECONDS = 24.3;
const FPS = E2_FPS;
const SERIF = 'E2Serif';

const BEAT = 0.5; // ~117.5 BPM
const DROP = 8.36;
const BARS = [8.36, 12.38, 16.37, 20.36];
const OUTRO = 22.31;
// Every accent in the fast section (cuts) and the small hi-hat ticks between them (zoom bumps).
const ACCENTS = [8.36, 8.61, 8.87, 9.36, 9.87, 10.1, 10.36, 10.61, 10.87, 11.12, 11.35, 11.87, 12.12, 12.38, 12.61, 12.86, 13.35, 13.86, 14.12, 14.37, 14.61, 14.86, 15.12, 15.37, 15.86, 16.37, 16.6, 16.86, 17.37, 17.86, 18.11, 18.37, 18.62, 18.88, 19.11, 19.37, 19.88, 20.36, 20.62, 20.87, 21.36, 21.87];
const TICKS = [9.06, 9.61, 11.63, 13.05, 13.61, 16.11, 17.07, 17.62, 19.62, 20.11, 21.08, 21.62];

const INTRO_H = 820; // cinematic letterbox height during the intro
const BOX_H = 1080; // square frame after the drop

type Clip = 'c1' | 'c2' | 'c3' | 'c4';
type Src = { clip: Clip; src: number; focus: number };
type Fx = 'neg' | 'blurIn' | 'punch' | 'splitH' | 'splitV' | 'slow' | 'fadeIn' | 'driftL' | 'driftR' | 'pull';
type Shot = Src & { at: number; fx: Fx[]; rate?: number; partner?: Src };

const P = (clip: Clip, src: number, focus = 0.36): Src => ({ clip, src, focus });

// Moments from her clips, in the order they'll be used.
const POOL: Src[] = [
  P('c4', 9.6, 0.36), P('c2', 3.0, 0.33), P('c3', 21.4, 0.38), P('c1', 6.0), P('c4', 24.0, 0.4), P('c2', 9.0, 0.33),
  P('c3', 2.4, 0.38), P('c1', 15.0), P('c4', 28.6, 0.4), P('c2', 24.0, 0.38), P('c3', 17.8, 0.38), P('c1', 1.5),
  P('c4', 12.0, 0.38), P('c2', 27.0, 0.35), P('c3', 7.2, 0.38), P('c1', 10.5, 0.33), P('c4', 4.6), P('c2', 30.0, 0.4),
  P('c3', 29.8, 0.4), P('c1', 18.0), P('c4', 20.4, 0.38), P('c2', 31.5, 0.38), P('c3', 14.2, 0.38), P('c1', 13.5),
  P('c4', 14.4, 0.38), P('c2', 13.5), P('c3', 26.2, 0.38), P('c1', 3.0), P('c4', 10.8, 0.38), P('c2', 16.5),
  P('c3', 25.2, 0.38), P('c1', 19.5), P('c2', 4.5, 0.33), P('c4', 26.4, 0.38), P('c3', 4.8, 0.38), P('c2', 36.0),
  P('c1', 7.5), P('c4', 24.6, 0.4), P('c2', 21.0), P('c3', 18.4, 0.38),
];


const SHOTS: Shot[] = (() => {
  let k = 0;
  const next = () => POOL[k++ % POOL.length];
  const out: Shot[] = [
    // Intro: slow, cinematic
    { ...P('c3', 4.4, 0.36), at: 0, fx: ['slow', 'fadeIn'], rate: 0.6 },
    { ...P('c2', 15.0, 0.34), at: 4.37, fx: ['slow', 'fadeIn'], rate: 0.6 },
    // Build-up stutter into the drop
    { ...P('c4', 10.6, 0.38), at: 7.36, fx: ['blurIn'] },
    { ...P('c1', 6.6), at: 7.85, fx: ['blurIn'] },
  ];
  // Cuts: every main beat, plus the two strongest syncopated hits in each 4 s phrase.
  const beats: number[] = [];
  for (let t = DROP; t < OUTRO - 0.01; t += BEAT) beats.push(t);
  const extras = BARS.flatMap((b) => [b + 0.25, b + 2.75]);
  const raw = [...beats, ...extras].filter((t) => t < OUTRO - 0.01).sort((x, y) => x - y);
  const cuts = raw.map((t) => ACCENTS.find((a) => Math.abs(a - t) < 0.07) ?? t);
  cuts.forEach((at, i) => {
    const phraseStart = BARS.some((b) => Math.abs(b - at) < 0.05);
    const fx: Fx[] = i === 0 ? ['neg', 'blurIn', 'punch'] : phraseStart ? ['blurIn', 'punch'] : i % 4 === 3 ? ['blurIn'] : ['punch'];
    out.push({ ...next(), at, fx });
  });
  out.push({ ...P('c4', 30.9, 0.36), at: OUTRO, fx: ['slow', 'blurIn'], rate: 0.5 });
  return out;
})();

// Half-panel white flashes: left, right, top, bottom on the last half-beat of each phrase.
const PANELS: { at: number; side: 'L' | 'R' | 'T' | 'B' }[] = [];
for (const s of [] as number[]) { // panel flashes switched off
  (['L', 'R', 'T', 'B'] as const).forEach((side, i) => PANELS.push({ at: s + i * 0.125, side }));
}

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

const boxHeight = (f: number) => {
  const total = Math.round(E2_SECONDS * FPS);
  const open = interpolate(f, [DROP * FPS - 4, DROP * FPS + 6], [INTRO_H, BOX_H], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const close = interpolate(f, [total - 26, total - 2], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  return open * close;
};

// A clip filling the box, with her face (focus) kept near the centre.
const Layer: React.FC<{ s: Src; rate?: number; h: number; scale: number; filter?: string }> = ({ s, rate = 1, h, scale, filter }) => {
  const vh = 1920 * scale;
  const top = Math.min(0, Math.max(h - vh, h / 2 - s.focus * vh));
  return (
    <div style={{ position: 'absolute', left: (1080 - 1080 * scale) / 2, top, width: 1080 * scale, height: vh, filter }}>
      <OffthreadVideo
        src={staticFile(`edit/${s.clip}hd.mp4`)}
        trimBefore={Math.round(s.src * FPS)}
        playbackRate={rate}
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  );
};

// ── Velocity mode ──
// cXv.mp4 are 90 fps copies with generated in-between frames, so slow motion stays smooth.
const V_FPS = 90;
const VA = 0.7; // speed at the cut and at the end of a shot (a light hang on the beat)
const VB = 1.9; // extra speed in the middle (the rush)
const velSpeed = (u: number) => VA + VB * Math.sin(Math.PI * u) ** 2;
const velOffset = (u: number, D: number) => D * (VA * u + VB * (u / 2 - Math.sin(2 * Math.PI * u) / (4 * Math.PI)));

const VLayer: React.FC<{ s: Src; t: number; h: number; scale: number; filter?: string; style?: React.CSSProperties }> = ({ s, t, h, scale, filter, style }) => {
  const vh = 1920 * scale;
  const top = Math.min(0, Math.max(h - vh, h / 2 - s.focus * vh));
  return (
    <div style={{ position: 'absolute', left: (1080 - 1080 * scale) / 2, top, width: 1080 * scale, height: vh, filter, ...style }}>
      <Freeze frame={Math.max(0, Math.round(t * V_FPS))}>
        <OffthreadVideo src={staticFile(`edit/${s.clip}v.mp4`)} playbackRate={1 / 3} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Freeze>
    </div>
  );
};

const VelocityShot: React.FC<{ shot: Shot; dur: number; startFrame: number; scale: number; grade: string }> = ({ shot, dur, startFrame, scale, grade }) => {
  const f = useCurrentFrame();
  const h = boxHeight(startFrame + f);
  const D = dur / FPS;
  const u = Math.min(1, f / dur);
  const constant = shot.fx.includes('slow');
  const t = constant ? shot.src + (f / FPS) * (shot.rate ?? 1) : shot.src + velOffset(u, D);
  const speed = constant ? shot.rate ?? 1 : velSpeed(u);
  // Motion blur during the rush: blend in the previous frames.
  const ghosts = speed > 1.4 ? [1, 2] : [];
  return (
    <>
      <VLayer s={shot} t={t} h={h} scale={scale * (1 + 0.05 * u)} filter={grade} />
      {ghosts.map((k) => (
        <VLayer key={k} s={shot} t={t - (k * speed) / V_FPS} h={h} scale={scale * (1 + 0.05 * u)} filter={grade} style={{ opacity: k === 1 ? 0.35 : 0.2 }} />
      ))}
      {/* soft glow */}
      <VLayer s={shot} t={t} h={h} scale={scale * (1 + 0.05 * u)} filter="blur(22px) brightness(1.2) saturate(1.2)" style={{ mixBlendMode: 'screen', opacity: 0.22 }} />
    </>
  );
};

const ShotView: React.FC<{ shot: Shot; dur: number; startFrame: number; velocity?: boolean }> = ({ shot, dur, startFrame, velocity }) => {
  const f = useCurrentFrame();
  const h = boxHeight(startFrame + f);
  const fx = shot.fx;
  let scale = 1.04;
  if (fx.includes('punch')) scale *= interpolate(f, [0, 7], [1.1, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  if (fx.includes('slow')) scale *= interpolate(f, [0, dur], [1, 1.1]);
  if (fx.includes('blurIn')) scale *= interpolate(f, [0, 4], [1.06, 1], { extrapolateRight: 'clamp' });
  if (fx.includes('pull')) scale *= interpolate(f, [0, dur], [1.12, 1.02]);
  const driftX = fx.includes('driftL') ? interpolate(f, [0, dur], [30, -30]) : fx.includes('driftR') ? interpolate(f, [0, dur], [-30, 30]) : 0;
  const blur = fx.includes('blurIn') ? interpolate(f, [0, 3], [14, 0], { extrapolateRight: 'clamp' }) : 0;
  const neg = fx.includes('neg') && f < 2;
  const opacity = fx.includes('fadeIn') ? interpolate(f, [0, 12], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  const grade = `contrast(1.12) saturate(1.08) brightness(1.03)${neg ? ' invert(1)' : ''}${blur ? ` blur(${blur}px)` : ''}`;
  const splitShow = f >= 1; // split appears a frame after the cut, like the reference

  return (
    <AbsoluteFill style={{ opacity, transform: `translateX(${driftX}px)` }}>
      {velocity ? (
        <VelocityShot shot={shot} dur={dur} startFrame={startFrame} scale={scale} grade={grade} />
      ) : (
        <Layer s={shot} rate={shot.rate} h={h} scale={scale} filter={grade} />
      )}
      {shot.partner && fx.includes('splitH') && splitShow && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: h / 2, height: h / 2, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: -h / 2, height: h }}>
            <Layer s={shot.partner} h={h} scale={1.04} filter="contrast(1.15) saturate(0.7) hue-rotate(70deg) brightness(0.85)" />
          </div>
        </div>
      )}
      {shot.partner && fx.includes('splitV') && splitShow && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080 * 0.42, height: h, overflow: 'hidden', borderRight: '3px solid rgba(255,255,255,0.85)' }}>
          <Layer s={shot.partner} h={h} scale={1.04} filter="invert(1) contrast(1.2) grayscale(0.3)" />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Panels: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const p = PANELS.find((x) => t >= x.at && t < x.at + 2 / FPS);
  if (!p) return null;
  const h = boxHeight(f);
  const st: React.CSSProperties = { position: 'absolute', background: 'white' };
  if (p.side === 'L') Object.assign(st, { left: 0, top: 0, width: 540, height: h });
  if (p.side === 'R') Object.assign(st, { left: 540, top: 0, width: 540, height: h });
  if (p.side === 'T') Object.assign(st, { left: 0, top: 0, width: 1080, height: h / 2 });
  if (p.side === 'B') Object.assign(st, { left: 0, top: h / 2, width: 1080, height: h / 2 });
  return <div style={st} />;
};

const IntroText: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const line = (text: string, a: number, b: number, size: number) => {
    const o = interpolate(t, [a, a + 0.6, b - 0.4, b], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const y = interpolate(t, [a, a + 0.8], [16, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
    return (
      <div style={{ opacity: o, transform: `translateY(${y}px)`, fontSize: size, letterSpacing: 1 }}>{text}</div>
    );
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: 1920 - (1920 - INTRO_H) / 4 - 70,
        left: 0,
        right: 0,
        textAlign: 'center',
        fontFamily: SERIF,
        fontStyle: 'italic',
        color: 'white',
        lineHeight: 1.25,
      }}
    >
      {line('a short film', 0.8, 7.2, 74)}
      {line('about her.', 3.0, 7.2, 74)}
    </div>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width="1080" height="1920" style={{ position: 'absolute', opacity: 0.08, mixBlendMode: 'overlay' }}>
      <filter id="g2">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={f % 12} />
      </filter>
      <rect width="100%" height="100%" filter="url(#g2)" />
    </svg>
  );
};

export const Edit2: React.FC<{ velocity?: boolean }> = ({ velocity = false }) => {
  useSerif();
  const f = useCurrentFrame();
  const total = Math.round(E2_SECONDS * FPS);
  const h = boxHeight(f);
  const t = f / FPS;
  const lastTick = TICKS.filter((x) => x <= t).pop();
  const bump = lastTick === undefined ? 1 : interpolate(t - lastTick, [0, 0.13], [1.045, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const lastBar = BARS.filter((b) => b <= t).pop();
  const sk = velocity && lastBar !== undefined ? Math.max(0, 1 - (t - lastBar) / 0.3) : 0;
  const shakeX = sk * 16 * Math.sin(f * 2.7);
  const shakeY = sk * 12 * Math.cos(f * 3.3);
  const shakeR = sk * 1.4 * Math.sin(f * 1.9);
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <div style={{ position: 'absolute', left: 0, top: (1920 - h) / 2, width: 1080, height: h, overflow: 'hidden' }}>
       <AbsoluteFill style={{ transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeR}deg) scale(${bump * (sk > 0 ? 1.03 : 1)})` }}>
        {SHOTS.map((s, i) => {
          const from = Math.round(s.at * FPS);
          const to = i < SHOTS.length - 1 ? Math.round(SHOTS[i + 1].at * FPS) : total;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from}>
              <ShotView shot={s} dur={to - from} startFrame={from} velocity={velocity} />
            </Sequence>
          );
        })}
        {/* cool cinematic tint + vignette */}
        <AbsoluteFill style={{ background: 'rgba(40,90,140,0.08)', mixBlendMode: 'soft-light' }} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)' }} />
        <Panels />
       </AbsoluteFill>
      </div>
      <Grain />
      <Sequence durationInFrames={Math.round(DROP * FPS)}>
        <IntroText />
      </Sequence>
      <Audio
        src={staticFile('edit/song2.mp3')}
        volume={(fr) => interpolate(fr, [total - 40, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      />
    </AbsoluteFill>
  );
};
