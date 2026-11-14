'use client';

import { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { state } from '../../lib/state';

const SANS = '/fonts/Geist-500.woff';
const SERIF = '/fonts/InstrumentSerif-Italic.woff';
const INK = '#F2F0EB';
/** The headline lives in the 3D scene, behind the glass, so the glass can bend it. */
const DEPTH = -2.2;

type Seg = { t: string; serif?: boolean };

function RichLine({ segs, size, x, y, align }: { segs: Seg[]; size: number; x: number; y: number; align: 'center' | 'left' }) {
  const [widths, setWidths] = useState<number[]>(() => segs.map(() => 0));
  const gap = size * 0.24;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (segs.length - 1);
  let cursor = align === 'center' ? x - total / 2 : x;
  const ready = widths.every((w) => w > 0);
  return (
    <group visible={ready}>
      {segs.map((s, i) => {
        const left = cursor;
        cursor += widths[i] + gap;
        return (
          <Text
            key={i}
            font={s.serif ? SERIF : SANS}
            fontSize={s.serif ? size * 1.04 : size}
            letterSpacing={s.serif ? -0.01 : -0.045}
            anchorX="left"
            anchorY="middle"
            position={[left, y, 0]}
            color={INK}
            onSync={(m: any) => {
              const b = m.textRenderInfo?.blockBounds;
              if (!b) return;
              const w = b[2] - b[0];
              setWidths((prev) => (Math.abs(prev[i] - w) < 1e-4 ? prev : prev.map((p, j) => (j === i ? w : p))));
            }}
          >
            {s.t}
          </Text>
        );
      })}
    </group>
  );
}

export function Headline3D({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const { camera, viewport } = useThree();
  const vp = viewport.getCurrentViewport(camera, [0, 0, DEPTH]);
  const W = vp.width, H = vp.height;

  useFrame(() => {
    // scroll with the page, like normal HTML text would
    group.current.position.y = (state.scrollY / state.viewportH) * H;
  });

  if (mobile) {
    const size = Math.min((58 / 844) * H, W * 0.149);
    const x = -W / 2 + (20 / 390) * W;
    const ys = [205, 267, 329, 391].map((c) => ((422 - c) / 844) * H);
    return (
      <group ref={group} position={[0, 0, DEPTH]}>
        <RichLine segs={[{ t: 'You bring' }]} size={size} x={x} y={ys[0]} align="left" />
        <RichLine segs={[{ t: 'the idea.' }]} size={size} x={x} y={ys[1]} align="left" />
        <RichLine segs={[{ t: 'I' }, { t: 'ship', serif: true }, { t: 'the' }]} size={size} x={x} y={ys[2]} align="left" />
        <RichLine segs={[{ t: 'product.' }]} size={size} x={x} y={ys[3]} align="left" />
      </group>
    );
  }

  const size = Math.min((120 / 900) * H, W * 0.083);
  return (
    <group ref={group} position={[0, 0, DEPTH]}>
      <RichLine segs={[{ t: 'You bring the idea.' }]} size={size} x={0} y={H * 0.075} align="center" />
      <RichLine segs={[{ t: 'I' }, { t: 'ship', serif: true }, { t: 'the product.' }]} size={size} x={0} y={-H * 0.08} align="center" />
    </group>
  );
}
