'use client';

import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import Lenis from 'lenis';
import { GlassObject } from './scene/GlassObject';
import { Headline3D } from './scene/Headline3D';
import { clamp01, state } from '../lib/state';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** One persistent canvas behind the HTML (the Lusion pattern from the plan). */
export default function Experience() {
  const [ok, setOk] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    if (!hasWebGL()) return; // the HTML headline stays visible: a designed fallback, not a broken canvas
    setOk(true);

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyReduced = () => (state.reducedMotion = reduced.matches);
    applyReduced();
    reduced.addEventListener('change', applyReduced);

    const section = () => document.getElementById('solidify');
    const measure = () => {
      state.viewportH = window.innerHeight;
      const isMobile = window.innerWidth < 760 || window.innerWidth / window.innerHeight < 0.8;
      setMobile(isMobile);
      setDpr(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    };
    const onScroll = (y: number) => {
      state.scrollY = y;
      const el = section();
      if (el) {
        const travel = el.offsetHeight - window.innerHeight;
        state.morph = clamp01((y - el.offsetTop + window.innerHeight * 0.35) / (travel + window.innerHeight * 0.35));
      }
    };
    const onPointer = (e: PointerEvent) => {
      state.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      state.pointer.active = true;
      state.pointer.lastMove = performance.now();
    };
    const onLeave = () => (state.pointer.active = false);

    measure();
    onScroll(window.scrollY);
    window.addEventListener('resize', measure);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduced.matches) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', (l: Lenis) => onScroll(l.scroll));
      const loop = (t: number) => {
        lenis!.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    } else {
      window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    }

    return () => {
      reduced.removeEventListener('change', applyReduced);
      window.removeEventListener('resize', measure);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);

  if (!ok) return null;

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        flat
        dpr={dpr}
        camera={{ position: [0, 0, 10], fov: 35, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0B0B0F');
          document.documentElement.classList.add('gl-ready');
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(1, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(mobile ? 1.5 : 2, d + 0.25))}
        />
        <color attach="background" args={['#0B0B0F']} />
        {/* One studio light for the whole site: a warm key strip, a cool rim, a soft top. */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} color="#fff6e6" position={[-4, 3, 3]} scale={[6, 0.6, 1]} rotation={[0, Math.PI / 4, -0.3]} />
          {/* side strips behind the object: they draw the rim that separates glass from the dark page */}
          <Lightformer form="rect" intensity={2.4} color="#cfe0ff" position={[6, 0, -3]} scale={[0.8, 10, 1]} rotation={[0, -Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={1.6} color="#fff6e6" position={[-6, 0, -3]} scale={[0.8, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
          <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, 7, 0]} scale={[8, 2, 1]} rotation={[Math.PI / 2, 0, 0]} />
          <Lightformer form="rect" intensity={0.5} color="#F2F0EB" position={[0, -5, 3]} scale={[10, 1, 1]} rotation={[-Math.PI / 3, 0, 0]} />
        </Environment>
        <Headline3D mobile={mobile} />
        <GlassObject key={mobile ? 'm' : 'd'} mobile={mobile} />
      </Canvas>
    </div>
  );
}
