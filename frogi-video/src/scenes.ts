// ─────────────────────────────────────────────────────────────
//  EDIT THIS FILE to change the video. Everything else just reads it.
// ─────────────────────────────────────────────────────────────
//
//  Clips go in  public/clips/   (any .mp4 / .mov from the media kit or your phone)
//  Audio goes in public/audio/  (voiceover.mp3 and/or music.mp3, both optional)
//
//  If a clip file is missing, the video shows a labelled placeholder,
//  so you can preview the edit before you have every clip.

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const CREATOR_CODE = 'YOUR CODE'; // ← your Frogi code from the dashboard
export const LINK_TEXT = 'Link in bio';

export type Clip = {
  file: string; // file name inside public/clips/
  label: string; // shown on the placeholder until the file exists
  fit?: 'phone' | 'fill'; // phone = keep whole screen recording visible; fill = crop to full screen
  startFrom?: number; // seconds to skip at the start of the clip
};

export type Scene = {
  id: string;
  seconds: number;
  caption: string; // on-screen words (also your voiceover line)
  emphasis?: string[]; // words to colour green
  clips: Clip[]; // played one after another, sharing the scene's time
};

export const SCENES: Scene[] = [
  {
    id: 'hook',
    seconds: 3,
    caption: 'I opened TikTok for a 2-minute break… 45 minutes ago.',
    emphasis: ['45', 'minutes'],
    clips: [{ file: 'me-scrolling.mp4', label: 'YOU at desk, scrolling phone', fit: 'fill' }],
  },
  {
    id: 'problem',
    seconds: 5,
    caption: 'One bug, one "quick break", and the whole coding session is gone.',
    emphasis: ['gone.'],
    clips: [
      { file: 'me-coding.mp4', label: 'YOUR editor / laptop', fit: 'fill' },
      { file: 'me-phone.mp4', label: 'YOU picking up phone again', fit: 'fill' },
    ],
  },
  {
    id: 'intro',
    seconds: 10,
    caption: 'So I started using Frogi. Pick the apps that eat your time, set a daily limit.',
    emphasis: ['Frogi.', 'daily', 'limit.'],
    clips: [
      { file: 'kit-onboarding.mp4', label: 'MEDIA KIT: onboarding', fit: 'phone' },
      { file: 'kit-set-limit.mp4', label: 'MEDIA KIT: setting a limit', fit: 'phone' },
    ],
  },
  {
    id: 'mission',
    seconds: 12,
    caption: 'Go over it and the app locks, until you finish a mission. Push-ups, squats, a walk.',
    emphasis: ['locks,', 'mission.'],
    clips: [
      { file: 'kit-locked.mp4', label: 'MEDIA KIT: app locked', fit: 'phone' },
      { file: 'kit-mission.mp4', label: 'MEDIA KIT: mission screen', fit: 'phone' },
      { file: 'me-pushups.mp4', label: 'YOU doing push-ups by desk', fit: 'fill' },
    ],
  },
  {
    id: 'pro',
    seconds: 7,
    caption: 'Free gives you one rule. Pro lets you limit every app.',
    emphasis: ['Pro', 'every'],
    clips: [{ file: 'kit-pro.mp4', label: 'MEDIA KIT: Pro / multiple apps', fit: 'phone' }],
  },
  {
    id: 'cta',
    seconds: 7,
    caption: 'If scrolling is killing your focus, try Frogi.',
    emphasis: ['Frogi.'],
    clips: [{ file: 'me-back-to-code.mp4', label: 'YOU back to coding', fit: 'fill' }],
  },
];

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + Math.round(s.seconds * FPS), 0);
