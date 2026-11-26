import React from 'react';
import { Composition } from 'remotion';
import { FrogiAd } from './FrogiAd';
import { FrogiAdPro } from './Pro';
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
  </>
);
