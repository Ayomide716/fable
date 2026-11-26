// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to change the video. Everything else reads it.
// ─────────────────────────────────────────────────────────────
//
//  Clips live in public/clips/ (the Frogi media kit, renamed without the
//  "frogi-animated-" prefix). Optional audio: public/audio/voiceover.mp3
//  and public/audio/music.mp3 — the video picks them up automatically.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const CREATOR_CODE = 'YOUR CODE'; // ← your Frogi code from the dashboard

export type Caption = {
  text: string;
  at: number; // seconds from the start of the scene
  highlight?: string[]; // words shown in yellow
};

export type Scene = {
  id: string;
  clip: string; // file in public/clips/
  from?: number; // seconds to skip at the start of the clip
  seconds: number; // how long the clip plays
  hold?: number; // extra seconds frozen on the last frame
  captionY: number; // caption position, % from top (kept clear of the app's own text)
  size?: number; // caption font size (default 92)
  captions: Caption[];
  cleanCaptions?: Caption[]; // replaces `captions` in the grown-up (clean) version
};

export const SCENES: Scene[] = [
  {
    id: 'hook',
    clip: 'the-catch.mp4',
    seconds: 4,
    captionY: 29,
    captions: [
      { text: 'POV: you open TikTok mid-debug…', at: 0, highlight: ['TikTok'] },
      { text: '…and a frog eats it.', at: 1.9, highlight: ['frog'] },
    ],
    cleanCaptions: [{ text: 'Frogi had other plans.', at: 1.2 }],
  },
  {
    id: 'meet',
    clip: 'meet-frogi.mp4',
    seconds: 3,
    captionY: 82,
    captions: [{ text: 'Meet Frogi.', at: 0.2, highlight: ['Frogi.'] }],
  },
  {
    id: 'limit',
    clip: 'set-a-limit.mp4',
    seconds: 3,
    captionY: 62,
    captions: [{ text: 'Set a daily limit', at: 0.1, highlight: ['daily', 'limit'] }],
  },
  {
    id: 'rules',
    clip: 'pond-rules.mp4',
    seconds: 3.5,
    captionY: 56,
    captions: [{ text: 'for every app that eats your time.', at: 0, highlight: ['every', 'app'] }],
  },
  {
    id: 'locked',
    clip: 'locked.mp4',
    seconds: 3,
    captionY: 33,
    captions: [{ text: 'Go over it? Locked.', at: 0.2, highlight: ['Locked.'] }],
  },
  {
    id: 'mission',
    clip: 'pick-a-mission.mp4',
    seconds: 3,
    captionY: 74.5,
    captions: [
      { text: 'Want it back?', at: 0.1 },
      { text: 'Pick a mission.', at: 1.3, highlight: ['mission.'] },
    ],
  },
  {
    id: 'counts',
    clip: 'camera-counts.mp4',
    seconds: 4.8,
    captionY: 50,
    captions: [
      { text: 'Push-ups, squats, a walk…', at: 0, highlight: ['Push-ups,', 'squats,'] },
      { text: 'and it actually counts your reps.', at: 2.2, highlight: ['counts'] },
    ],
  },
  {
    id: 'unlocked',
    clip: 'unlocked.mp4',
    seconds: 3,
    captionY: 48,
    captions: [{ text: 'Now back to the bug.', at: 0.6, highlight: ['bug.'] }],
  },
  {
    id: 'cta',
    clip: 'link-in-bio.mp4',
    seconds: 3.6,
    hold: 1.4,
    captionY: 74.5,
    size: 76,
    captions: [{ text: `Code: ${CREATOR_CODE}`, at: 1.2, highlight: CREATOR_CODE.split(' ') }],
  },
];

// Grown-up version only: a short terminal intro before the first clip.
export const INTRO_SECONDS = 3;
export const INTRO_LINES = [
  { text: '$ npm test', at: 0, color: '#e6edf3' },
  { text: '  3 tests failing', at: 0.5, color: '#ff7b72' },
  { text: '$ open tiktok --for "2 min"', at: 1.0, color: '#e6edf3', typed: true },
];

export type Variant = 'playful' | 'clean';

export const sceneFrames = (s: Scene) => Math.round((s.seconds + (s.hold ?? 0)) * FPS);
export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + sceneFrames(s), 0);
export const INTRO_FRAMES = Math.round(INTRO_SECONDS * FPS);
export const totalFrames = (v: Variant) => TOTAL_FRAMES + (v === 'clean' ? INTRO_FRAMES : 0);
