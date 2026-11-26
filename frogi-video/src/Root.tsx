import React from 'react';
import { Composition } from 'remotion';
import { FrogiAd } from './FrogiAd';
import { FrogiAdPro } from './Pro';
import { BeatEdit, EDIT_FPS, EDIT_SECONDS } from './BeatEdit';
import { PRO_TOTAL_FRAMES } from './proScenes';
import { FPS, HEIGHT, WIDTH, totalFrames } from './scenes';

export const Root: React.FC = () => (
  <>
    {/* Bold, bouncy captions */}
    <Composition
      id="FrogiAd"
      component={FrogiAd}
      durationInFrames={totalFrames('playful')}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ variant: 'playful' as const }}
    />
    {/* Grown-up: terminal intro, clean captions, calmer motion */}
    <Composition
      id="FrogiAdClean"
      component={FrogiAd}
      durationInFrames={totalFrames('clean')}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{ variant: 'clean' as const }}
    />
    {/* Pro: phone on a premium backdrop, editorial headlines */}
    <Composition id="FrogiAdPro" component={FrogiAdPro} durationInFrames={PRO_TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    {/* Beat-synced personal edit (media in public/edit/, not committed) */}
    <Composition id="BeatEdit" component={BeatEdit} durationInFrames={Math.round(EDIT_SECONDS * EDIT_FPS)} fps={EDIT_FPS} width={WIDTH} height={HEIGHT} />
  </>
);
