// Frogi 16-second cut: starts on the action, full-screen clips, captions synced to the voiceover.
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
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const SHORT_FPS = 30;
export const SHORT_SECONDS = 16.3;
const FONT = 'ShortDisplay';
const GREEN = '#5EE07F';

type Clip = { file: string; at: number; until: number; from: number; rate?: number };
const CLIPS: Clip[] = [
  { file: 'the-catch.mp4', at: 0, until: 4.9, from: 0, rate: 0.82 },
  { file: 'locked.mp4', at: 4.9, until: 6.8, from: 0.3 },
  { file: 'pick-a-mission.mp4', at: 6.8, until: 9.1, from: 0.3 },
  { file: 'camera-counts.mp4', at: 9.1, until: 11.7, from: 0.3, rate: 1.2 },
  { file: 'unlocked.mp4', at: 11.7, until: 13.9, from: 0 },
  { file: 'link-in-bio.mp4', at: 13.9, until: SHORT_SECONDS, from: 0.5 },
];

type Cap = { text: string; at: number; y: number; hi?: string[]; size?: number };
const CAPS: Cap[] = [
  { text: 'I told myself: two minutes on TikTok…', at: 0.0, y: 29, hi: ['TikTok…'] },
  { text: 'Frogi had other plans. 🐸', at: 3.0, y: 29, hi: ['Frogi'] },
  { text: 'Go over your limit? LOCKED. 🔒', at: 5.1, y: 33, hi: ['LOCKED.'] },
  { text: 'To get it back…', at: 6.9, y: 74.5 },
  { text: 'pick a mission.', at: 8.0, y: 74.5, hi: ['mission.'] },
  { text: 'It counts every rep.', at: 9.25, y: 50, hi: ['every', 'rep.'] },
  { text: 'No cheating. 😤', at: 10.9, y: 50, hi: ['cheating.'] },
  { text: 'Unlocked. ✨', at: 11.85, y: 48, hi: ['Unlocked.'] },
  { text: 'Now, back to work.', at: 12.4, y: 48, hi: ['work.'] },
  { text: 'Try Frogi 👆', at: 14.6, y: 74, hi: ['Frogi'], size: 80 },
];

const useFont = () => {
  const [h] = useState(() => delayRender('short font'));
  useEffect(() => {
    new FontFace(FONT, `url(${staticFile('fonts/InterDisplay-Bold.otf')})`, { weight: '700' })
      .load()
      .then((f) => document.fonts.add(f))
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, [h]);
};

const ClipView: React.FC<{ clip: Clip; dur: number }> = ({ clip, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rate = clip.rate ?? 1;
  // Clips are a few seconds long: freeze on the last frame if the slot runs past the end.
  const maxFrames = Math.floor(((clipLen[clip.file] ?? 3) - clip.from) / rate * fps) - 1;
  const punch = interpolate(f, [0, 7], [1.1, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const push = interpolate(f, [0, dur], [1, 1.05]);
  const v = (
    <OffthreadVideo src={staticFile(`clips/${clip.file}`)} trimBefore={Math.round(clip.from * fps)} playbackRate={rate} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
  );
  return (
    <AbsoluteFill style={{ transform: `scale(${punch * push})`, background: 'black' }}>
      {f < maxFrames ? v : <Freeze frame={maxFrames}>{v}</Freeze>}
    </AbsoluteFill>
  );
};
const clipLen: Record<string, number> = {
  'the-catch.mp4': 4.0, 'locked.mp4': 3.0, 'pick-a-mission.mp4': 3.0, 'camera-counts.mp4': 5.88, 'unlocked.mp4': 3.0, 'link-in-bio.mp4': 3.6,
};

const Caption: React.FC<{ cap: Cap; dur: number }> = ({ cap, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = cap.text.split(' ');
  const out = interpolate(f, [dur - 3, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute', top: `${cap.y}%`, left: 60, right: 60, transform: 'translateY(-50%)',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', opacity: out,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: f - i * 2, fps, config: { damping: 13, stiffness: 230, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block', fontFamily: FONT, fontWeight: 700, fontSize: cap.size ?? 88, lineHeight: 1.1, letterSpacing: -1.5,
              color: cap.hi?.includes(w) ? GREEN : 'white', WebkitTextStroke: '12px rgba(0,0,0,0.9)', paintOrder: 'stroke fill',
              textShadow: '0 6px 24px rgba(0,0,0,0.5)', opacity: Math.min(1, p * 1.4),
              transform: `translateY(${(1 - p) * 26}px) scale(${0.7 + 0.3 * p})`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const FrogiShort: React.FC = () => {
  useFont();
  const { fps } = useVideoConfig();
  const total = Math.round(SHORT_SECONDS * fps);
  return (
    <AbsoluteFill style={{ background: 'black' }}>
      {CLIPS.map((c, i) => {
        const from = Math.round(c.at * fps);
        const to = Math.round(c.until * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ClipView clip={c} dur={to - from} />
          </Sequence>
        );
      })}
      {CAPS.map((c, i) => {
        const from = Math.round(c.at * fps);
        const nextAt = CAPS[i + 1]?.at ?? SHORT_SECONDS;
        // also end a caption at a clip change
        const clipEnd = CLIPS.find((cl) => c.at >= cl.at && c.at < cl.until)?.until ?? SHORT_SECONDS;
        const to = Math.round(Math.min(nextAt, clipEnd) * fps);
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Caption cap={c} dur={to - from} />
          </Sequence>
        );
      })}
      <Audio src={staticFile('audio/voiceover-short.mp3')} volume={(fr) => interpolate(fr, [total - 10, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};
