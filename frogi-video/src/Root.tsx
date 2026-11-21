import React from 'react';
import { Composition } from 'remotion';
import { FrogiAd } from './FrogiAd';
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from './scenes';

export const Root: React.FC = () => (
  <Composition
    id="FrogiAd"
    component={FrogiAd}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
