// Second beat edit ("a short film about her"), styled after a reference edit:
// letterboxed square frame, half-panel white flashes, split screens, negative flashes.
// Media lives in public/edit/ (not uploaded to GitHub).
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
// only inside the longer shots, so the quick cuts stay clean
const TICKS = [9.06, 11.63, 13.05, 16.11, 17.07, 19.62, 20.11, 21.08];

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
  P('c3', 25.2, 0.38), P('c1', 19.5), P('c2', 4.5, 0.33), P('c4', 31.2, 0.38), P('c3', 4.8, 0.38), P('c2', 36.0),
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
  // Each 4 s phrase: a longer slow-mo shot, beat cuts, a quick double-cut on a syncopated hit, a longer shot to close.
  const PHRASE: { off: number; fx: Fx[]; rate?: number }[] = [
    { off: 0, fx: ['blurIn', 'slow'], rate: 0.7 },
    { off: 1.0, fx: ['punch'] },
    { off: 1.5, fx: ['driftL'] },
    { off: 2.0, fx: ['punch'] },
    { off: 2.5, fx: ['pull'] },
    { off: 2.75, fx: ['punch'] },
    { off: 3.0, fx: ['driftR', 'slow'], rate: 0.8 },
  ];
  BARS.forEach((bar, bi) => {
    PHRASE.forEach((p, pi) => {
      const raw = bar + p.off;
      const at = ACCENTS.find((a) => Math.abs(a - raw) < 0.06) ?? raw; // snap to the real accent
      if (at >= OUTRO - 0.01) return;
      const fx: Fx[] = bi === 0 && pi === 0 ? ['neg', ...p.fx] : p.fx;
      out.push({ ...next(), at, fx, rate: p.rate });
    });
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

const ShotView: React.FC<{ shot: Shot; dur: number; startFrame: number }> = ({ shot, dur, startFrame }) => {
  const f = useCurrentFrame();
  const h = boxHeight(startFrame + f);
  const fx = shot.fx;
  let scale = 1.08;
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
      <Layer s={shot} rate={shot.rate} h={h} scale={scale} filter={grade} />
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

export const Edit2: React.FC = () => {
  useSerif();
  const f = useCurrentFrame();
  const total = Math.round(E2_SECONDS * FPS);
  const h = boxHeight(f);
  const t = f / FPS;
  const lastTick = TICKS.filter((x) => x <= t).pop();
  const bump = lastTick === undefined ? 1 : interpolate(t - lastTick, [0, 0.13], [1.045, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      <div style={{ position: 'absolute', left: 0, top: (1920 - h) / 2, width: 1080, height: h, overflow: 'hidden' }}>
       <AbsoluteFill style={{ transform: `scale(${bump})` }}>
        {SHOTS.map((s, i) => {
          const from = Math.round(s.at * FPS);
          const to = i < SHOTS.length - 1 ? Math.round(SHOTS[i + 1].at * FPS) : total;
          return (
            <Sequence key={i} from={from} durationInFrames={to - from}>
              <ShotView shot={s} dur={to - from} startFrame={from} />
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
