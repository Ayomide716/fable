// "How to add a banner to your TikTok profile" — sped-up tutorial from two screen recordings.
// Recordings live in public/tut/ (not uploaded to GitHub).
import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const TUT_FPS = 30;
const DISPLAY = 'TutDisplay';
const TEXT = 'TutText';
const CYAN = '#3EC8FF';

// Screen recording frame on the canvas
const REC_H = 1340;
const REC_W = Math.round((REC_H * 1088) / 2352);
const REC_TOP = 300;
const REC_LEFT = Math.round((1080 - REC_W) / 2);

type Tap = { x: number; y: number; at: number }; // position as fraction of the screen, time in output seconds from segment start
type Seg = {
  src: 'rec1' | 'rec2';
  from: number; // seconds in the recording
  to: number;
  speed: number;
  step?: string; // e.g. "1"
  title: string;
  tap?: Tap;
  keep?: boolean; // continue the previous caption without re-animating it
};

const SEGS: Seg[] = [
  { src: 'rec2', from: 26.0, to: 27.5, speed: 1, title: 'Get this banner on your TikTok 👇' },
  { src: 'rec1', from: 2.6, to: 3.8, speed: 1, step: '1', title: 'Tap the top of your profile', tap: { x: 0.5, y: 0.07, at: 0.75 } },
  { src: 'rec1', from: 3.8, to: 5.0, speed: 1, step: '2', title: 'Tap “Upload photo”', tap: { x: 0.5, y: 0.818, at: 0.85 } },
  { src: 'rec1', from: 5.4, to: 8.0, speed: 1.6, step: '3', title: 'Choose your banner image', tap: { x: 0.38, y: 0.14, at: 0.6 } },
  { src: 'rec1', from: 8.0, to: 9.4, speed: 1.2, step: '4', title: 'Tap Select, then Next', tap: { x: 0.1, y: 0.975, at: 0.35 } },
  { src: 'rec1', from: 9.4, to: 11.8, speed: 1.5, step: '5', title: 'Adjust it and tap Save', tap: { x: 0.73, y: 0.914, at: 1.35 } },
  { src: 'rec1', from: 11.8, to: 16.0, speed: 4, step: '6', title: 'Wait for it to upload ⏳' },
  { src: 'rec2', from: 25.0, to: 28.6, speed: 1, title: 'Done! Your banner is live ✨' },
  { src: 'rec2', from: 30.0, to: 30.8, speed: 1, title: 'Tap it to view or change it', tap: { x: 0.5, y: 0.05, at: 0.35 } },
  { src: 'rec2', from: 32.2, to: 33.4, speed: 1, title: 'Tap it to view or change it', keep: true },
  { src: 'rec2', from: 33.5, to: 36.5, speed: 1, title: 'Follow for more tips 🧙‍♂️' },
];

const segFrames = (s: Seg) => Math.round(((s.to - s.from) / s.speed) * TUT_FPS);
export const TUT_TOTAL = SEGS.reduce((n, s) => n + segFrames(s), 0);

const useFonts = () => {
  const [h] = useState(() => delayRender('tut fonts'));
  useEffect(() => {
    Promise.all(
      [
        new FontFace(DISPLAY, `url(${staticFile('fonts/InterDisplay-Bold.otf')})`, { weight: '700' }),
        new FontFace(TEXT, `url(${staticFile('fonts/Inter-SemiBold.otf')})`, { weight: '600' }),
      ].map((f) => f.load().then((l) => document.fonts.add(l))),
    )
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, [h]);
};

const TapMarker: React.FC<{ tap: Tap }> = ({ tap }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t0 = Math.round(tap.at * fps);
  const k = f - t0;
  if (k < -6 || k > 18) return null;
  const pre = interpolate(k, [-6, 0], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = interpolate(k, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const x = REC_LEFT + tap.x * REC_W;
  const y = REC_TOP + tap.y * REC_H;
  return (
    <>
      <div
        style={{
          position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34,
          background: 'rgba(255,255,255,0.55)', border: '4px solid white', boxShadow: `0 0 24px ${CYAN}`,
          opacity: k < 0 ? pre : 1 - ring, transform: `scale(${k < 0 ? 0.6 + 0.4 * pre : 1 - 0.2 * ring})`,
        }}
      />
      {k >= 0 && (
        <div
          style={{
            position: 'absolute', left: x - 34, top: y - 34, width: 68, height: 68, borderRadius: 34,
            border: `5px solid ${CYAN}`, opacity: 1 - ring, transform: `scale(${1 + ring * 1.6})`,
          }}
        />
      )}
    </>
  );
};

const Caption: React.FC<{ seg: Seg; dur: number; holdEnd?: boolean }> = ({ seg, dur, holdEnd }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = seg.keep ? 1 : spring({ frame: f, fps, config: { damping: 16, stiffness: 200 } });
  const out = holdEnd ? 0 : interpolate(f, [dur - 4, dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute', top: 150, left: 50, right: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22,
        opacity: pop * (1 - out), transform: `translateY(${(1 - pop) * 24}px)`,
      }}
    >
      {seg.step && (
        <div
          style={{
            flex: '0 0 auto', width: 84, height: 84, borderRadius: 42, background: CYAN, color: '#04121c',
            fontFamily: DISPLAY, fontWeight: 700, fontSize: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 30px rgba(62,200,255,0.5)`,
          }}
        >
          {seg.step}
        </div>
      )}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, lineHeight: 1.08, color: 'white', letterSpacing: -1.5, textAlign: seg.step ? 'left' : 'center' }}>
        {seg.title}
      </div>
    </div>
  );
};

const Progress: React.FC<{ index: number }> = ({ index }) => {
  const stepIdx = SEGS.slice(0, index + 1).filter((s) => s.step).length;
  const total = SEGS.filter((s) => s.step).length;
  if (!SEGS[index].step) return null;
  return (
    <div style={{ position: 'absolute', top: REC_TOP + REC_H + 34, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 12 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i < stepIdx ? 46 : 22, height: 10, borderRadius: 5, background: i < stepIdx ? CYAN : 'rgba(255,255,255,0.25)' }} />
      ))}
    </div>
  );
};

const SegView: React.FC<{ seg: Seg; dur: number; index: number }> = ({ seg, dur, index }) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 4], [0.4, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: REC_LEFT, top: REC_TOP, width: REC_W, height: REC_H, borderRadius: 44, overflow: 'hidden',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.10), 0 40px 100px rgba(0,0,0,0.6)', opacity: fade,
        }}
      >
        <OffthreadVideo
          src={staticFile(`tut/${seg.src}.mp4`)}
          trimBefore={Math.round(seg.from * TUT_FPS)}
          playbackRate={seg.speed}
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      {seg.speed > 1.3 && (
        <div style={{ position: 'absolute', top: REC_TOP + 24, right: REC_LEFT + 24, padding: '6px 16px', borderRadius: 14, background: 'rgba(0,0,0,0.65)', color: 'white', fontFamily: TEXT, fontSize: 30 }}>
          {seg.speed}×
        </div>
      )}
      {seg.tap && <TapMarker tap={seg.tap} />}
      <Caption seg={seg} dur={dur} holdEnd={!!SEGS[index + 1]?.keep} />
      <Progress index={index} />
    </AbsoluteFill>
  );
};

export const BannerTutorial: React.FC = () => {
  useFonts();
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 55%, #0d2a44 0%, #070b12 70%)' }}>
      {SEGS.map((s, i) => {
        const from = cursor;
        const dur = segFrames(s);
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <SegView seg={s} dur={dur} index={i} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
