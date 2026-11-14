'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type GlintHandle = { set: (radius: number, sweep: number, alpha: number) => void };

/** A bright diagonal band that sweeps across the object; the swap hides inside it. */
export const Glint = forwardRef<GlintHandle>(function Glint(_, ref) {
  const mesh = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({ uSweep: { value: -1.2 }, uAlpha: { value: 0 } }), []);

  useImperativeHandle(ref, () => ({
    set(radius, sweep, alpha) {
      mesh.current.scale.setScalar(radius * 2.8);
      mesh.current.position.set(0, 0, radius * 1.25);
      const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
      u.uSweep.value = sweep;
      u.uAlpha.value = alpha;
      mesh.current.visible = alpha > 0.002;
    },
  }));

  return (
    <mesh ref={mesh} renderOrder={10} visible={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float uSweep; uniform float uAlpha; varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float mask = smoothstep(0.75, 0.2, length(p));
            float band = (p.x + p.y) * 0.7071 - uSweep;
            float core = exp(-band * band * 60.0);
            float halo = exp(-band * band * 6.0) * 0.25;
            float a = (core + halo) * mask * uAlpha;
            gl_FragColor = vec4(vec3(1.0, 0.985, 0.95) * a, a);
          }
        `}
      />
    </mesh>
  );
});
