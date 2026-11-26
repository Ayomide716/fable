// ─────────────────────────────────────────────────────────────
//  PRO VERSION: edit headlines and timing here.
// ─────────────────────────────────────────────────────────────
//  Headline lines are separated by \n. Wrap words in [brackets] to colour them green.

import { CREATOR_CODE, FPS } from './scenes';

export type ProScene = {
  id: string;
  clip: string;
  seconds: number;
  hold?: number; // freeze last frame for extra seconds
  eyebrow: string; // small label above the headline
  headline: string;
  headlineAt?: number; // seconds into the scene before the headline appears
};

// The video opens full-screen on the first clip, then pulls back into the phone.
export const FULL_BLEED_SECONDS = 2.2;
export const HOOK_TEXT = 'Two minutes on TikTok.';

export const PRO_SCENES: ProScene[] = [
  { id: 'hook', clip: 'the-catch.mp4', seconds: 4, eyebrow: 'Frogi', headline: 'Had other\n[plans.]', headlineAt: 2.3 },
  { id: 'meet', clip: 'meet-frogi.mp4', seconds: 3, eyebrow: 'Meet Frogi', headline: 'Earn your\nscreen time [back.]' },
  { id: 'limit', clip: 'set-a-limit.mp4', seconds: 3, eyebrow: '01 · Set limits', headline: 'Choose a\n[daily limit.]' },
  { id: 'rules', clip: 'pond-rules.mp4', seconds: 3.5, eyebrow: '01 · Set limits', headline: 'For every app that\npulls you [away.]' },
  { id: 'locked', clip: 'locked.mp4', seconds: 3, eyebrow: '02 · Get caught', headline: 'Go over it,\nand it [locks.]' },
  { id: 'mission', clip: 'pick-a-mission.mp4', seconds: 3, eyebrow: '03 · Earn it back', headline: 'Pick a\n[mission.]' },
  { id: 'counts', clip: 'camera-counts.mp4', seconds: 4.8, eyebrow: '03 · Earn it back', headline: 'It counts\nevery [rep.]' },
  { id: 'unlocked', clip: 'unlocked.mp4', seconds: 3, eyebrow: 'Unlocked', headline: 'Now, back\nto [work.]' },
  {
    id: 'cta',
    clip: 'link-in-bio.mp4',
    seconds: 3.6,
    hold: 1.6,
    eyebrow: 'Link in bio',
    headline: `Use code\n[${CREATOR_CODE.replace(/ /g, ' ')}]`,
  },
];

export const XFADE = 8; // frames of cross-dissolve between screens
export const proSceneFrames = (s: ProScene) => Math.round((s.seconds + (s.hold ?? 0)) * FPS);
export const PRO_TOTAL_FRAMES = PRO_SCENES.reduce((n, s) => n + proSceneFrames(s), 0);
