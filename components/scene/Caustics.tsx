'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type CausticsHandle = { set: (radius: number, solid: number, time: number, objY: number) => void };

/**
 * The light the object throws on the "floor": soft and wavy while it's liquid,
 * tighter with sharp spectral lines once it's crystal. Cheap fake, no extra pass.
 */
export const Caustics = forwardRef<CausticsHandle>(function Caustics(_, ref) {
  const mesh = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({ uSolid: { value: 0 }, uTime: { value: 0 } }), []);

  useImperativeHandle(ref, () => ({
    set(radius, solid, time) {
      mesh.current.position.set(0, -radius * 1.22, 0);
      mesh.current.scale.set(radius * 3.4, radius * 3.4, 1);
      const u = (mesh.current.material as THREE.ShaderMaterial).uniforms;
      u.uSolid.value = solid;
      u.uTime.value = time;
    },
  }));

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          uniform float uSolid; uniform float uTime; varying vec2 vUv;
          void main() {
            vec2 p = vUv * 2.0 - 1.0;
            float r = length(p);
            float pool = exp(-r * r * mix(6.0, 10.0, uSolid));
            // liquid: two soft rings that breathe and drift
            float w = r + 0.035 * sin(atan(p.y, p.x) * 2.0 + uTime * 0.7);
            float ring = exp(-pow((w - 0.38 - 0.02 * sin(uTime)) / 0.05, 2.0)) * 0.6
                       + exp(-pow((w - 0.62) / 0.07, 2.0)) * 0.3;
            // crystal: six fine spokes with a slight split of colour
            float ang = atan(p.y, p.x);
            float fall = exp(-r * r * 7.0) * smoothstep(0.05, 0.25, r);
            vec3 spectral = vec3(
              pow(abs(cos(ang * 3.0 + 0.04)), 90.0),
              pow(abs(cos(ang * 3.0)), 90.0),
              pow(abs(cos(ang * 3.0 - 0.04)), 90.0)) * fall;
            vec3 warm = vec3(1.0, 0.96, 0.9);
            vec3 col = warm * pool * 0.16 + warm * ring * 0.12 * (1.0 - uSolid) + spectral * 0.35 * uSolid;
            float edge = smoothstep(1.0, 0.75, r);
            gl_FragColor = vec4(col * edge, 1.0);
          }
        `}
      />
    </mesh>
  );
});
