import React from 'react';
import { Composition } from 'remotion';
import { FrogiAd } from './FrogiAd';
import { FrogiAdPro } from './Pro';
import { BeatEdit, EDIT_FPS, EDIT_SECONDS } from './BeatEdit';
import { Edit2, E2_FPS, E2_SECONDS } from './Edit2';
import { BannerTutorial, TUT_FPS, TUT_TOTAL } from './Tutorial';
import { BuildIt, BUILD_FPS, BUILD_SECONDS } from './BuildIt';
import { FrogiShort, SHORT_FPS, SHORT_SECONDS } from './Short';
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
    <Composition id="Edit2" component={Edit2} durationInFrames={Math.round(E2_SECONDS * E2_FPS)} fps={E2_FPS} width={WIDTH} height={HEIGHT} />
    {/* Same edit with CapCut-style velocity (speed ramps + smooth slow-mo + motion blur + glow) */}
    <Composition id="Edit2Velocity" component={Edit2} durationInFrames={Math.round(E2_SECONDS * E2_FPS)} fps={E2_FPS} width={WIDTH} height={HEIGHT} defaultProps={{ velocity: true }} />
    <Composition id="BannerTutorial" component={BannerTutorial} durationInFrames={TUT_TOTAL} fps={TUT_FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="BuildIt" component={BuildIt} durationInFrames={Math.round(BUILD_SECONDS * BUILD_FPS)} fps={BUILD_FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="FrogiShort" component={FrogiShort} durationInFrames={Math.round(SHORT_SECONDS * SHORT_FPS)} fps={SHORT_FPS} width={WIDTH} height={HEIGHT} />
  </>
);
