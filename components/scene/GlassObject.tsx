'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createNoise3D } from 'simplex-noise';
import { crystalEdges, crystalGeometry } from '../../lib/crystal';
import { Spring, lerp, smoothstep, state } from '../../lib/state';
import { Glint, type GlintHandle } from './Glint';
import { Caustics, type CausticsHandle } from './Caustics';

const noise = createNoise3D(() => 0.42);
const DEG = Math.PI / 180;

/**
 * The one object. A single mesh and a single transmission material, so the
 * glass costs one extra render pass whether it is liquid or crystal. At the
 * swap the geometry changes underneath a bright glint (the decided
 * "dissolve inside a glint" morph) and the crystal settles with a spring.
 */
export function GlassObject({ mobile }: { mobile: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const mesh = useRef<THREE.Mesh>(null!);
  const edges = useRef<THREE.LineSegments>(null!);
  const mat = useRef<any>(null!);
  const glint = useRef<GlintHandle>(null!);
  const caustics = useRef<CausticsHandle>(null!);
  const { camera, viewport } = useThree();

  const drop = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, mobile ? 18 : 28);
    g.deleteAttribute('normal');
    g.deleteAttribute('uv');
    const m = mergeVertices(g);
    m.computeVertexNormals();
    const base = Float32Array.from(m.attributes.position.array as Float32Array);
    return { geo: m, base };
  }, [mobile]);

  const crystal = useMemo(() => crystalGeometry(2.25), []);
  const edgeGeo = useMemo(() => crystalEdges(2.25), []);

  const sim = useRef({
    t: 0,
    solid: false,
    swapAt: -10,
    fill: new Spring(1, 140, 9),
    push: new Spring(0, 70, 7),
    pushDir: new THREE.Vector3(1, 0, 0),
    tiltX: new Spring(0, 40, 9),
    tiltY: new Spring(0, 40, 9),
    spin: 0,
    posX: new Spring(0, 30, 10),
    posY: new Spring(0, 30, 10),
  });

  const tmp = useMemo(
    () => ({ v: new THREE.Vector3(), p: new THREE.Vector3(), c: new THREE.Vector3(), inv: new THREE.Matrix4() }),
    [],
  );

  useFrame((_, dtRaw) => {
    const s = sim.current;
    const dt = Math.min(dtRaw, 1 / 20);
    const reduced = state.reducedMotion;
    s.t += reduced ? 0 : dt;
    const m = state.morph;

    // ---- where the object sits (follows the layout, never leaves the screen)
    const vp = viewport.getCurrentViewport(camera, [0, 0, 0]);
    const radius = mobile ? vp.width * 0.27 : Math.min(vp.height * 0.25, vp.width * 0.17);
    const heroX = mobile ? vp.width * 0.1 : 0;
    const heroY = mobile ? vp.height * 0.13 : -vp.height * 0.02;
    const pinnedY = mobile ? vp.height * 0.16 : 0;
    const inSolidify = smoothstep(0.0, 0.12, m);
    group.current.position.set(
      s.posX.step(lerp(heroX, 0, inSolidify), dt),
      s.posY.step(lerp(heroY, pinnedY, inSolidify), dt),
      0,
    );

    // ---- the swap, with a little hysteresis so scrubbing at 0.5 doesn't flicker
    const wantSolid = s.solid ? m > 0.46 : m > 0.54;
    if (wantSolid !== s.solid) {
      s.solid = wantSolid;
      s.swapAt = s.t;
      mesh.current.geometry = wantSolid ? crystal : drop.geo;
      s.fill.value = wantSolid ? 0.78 : 0.9;
      s.fill.velocity = 0;
      if (reduced) s.fill.value = 1;
    }
    const fill = reduced ? 1 : s.fill.step(1, dt);

    // ---- pointer: push the liquid, tilt the solid
    const pt = state.pointer;
    tmp.p.set(pt.x, pt.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const dist = -camera.position.z / tmp.p.z;
    tmp.p.multiplyScalar(dist).add(camera.position); // pointer on the z=0 plane
    tmp.c.copy(group.current.position);
    const toPointer = tmp.v.copy(tmp.p).sub(tmp.c);
    const near = pt.active && !reduced ? 1 - smoothstep(radius * 0.9, radius * 2.0, toPointer.length()) : 0;

    if (!s.solid) {
      // viscosity rises as you scroll towards the swap
      const settle = smoothstep(0, 0.5, m);
      const amp = reduced ? 0.02 : lerp(0.075, 0.03, settle);
      const speed = lerp(0.55, 0.22, settle);
      const freq = lerp(1.25, 0.9, settle);

      if (near > 0) {
        mesh.current.updateMatrixWorld();
        tmp.inv.copy(mesh.current.matrixWorld).invert();
        const local = tmp.v.copy(tmp.p).applyMatrix4(tmp.inv);
        local.z = Math.max(local.z, 0.6); // the pointer comes from the viewer's side
        s.pushDir.lerp(local.normalize(), 0.25).normalize();
      }
      const push = s.push.step(near * lerp(0.42, 0.18, settle), dt);

      const pos = drop.geo.attributes.position.array as Float32Array;
      const base = drop.base;
      const pd = s.pushDir;
      const tt = s.t * speed;
      for (let i = 0; i < pos.length; i += 3) {
        const nx = base[i], ny = base[i + 1], nz = base[i + 2];
        let d =
          noise(nx * freq + tt, ny * freq - tt * 0.6, nz * freq) * amp +
          noise(nx * 2.6 - tt * 0.8, ny * 2.6, nz * 2.6 + tt) * amp * 0.35;
        const k = nx * pd.x + ny * pd.y + nz * pd.z;
        if (k > 0) d -= push * k * k * k;
        else d += push * 0.3 * k * k;
        // a drop is a little heavier at the bottom
        const sag = 1 + Math.max(0, -ny) * 0.06 - Math.max(0, ny) * 0.02;
        pos[i] = nx * (1 + d);
        pos[i + 1] = ny * (1 + d) * sag;
        pos[i + 2] = nz * (1 + d);
      }
      drop.geo.attributes.position.needsUpdate = true;
      drop.geo.computeVertexNormals();
      mesh.current.scale.setScalar(radius * fill);
      mesh.current.rotation.set(0, s.t * 0.12, 0);
    } else {
      // solid: it tilts toward the pointer instead of deforming
      const tx = near > 0 ? -toPointer.y / radius : 0;
      const ty = near > 0 ? toPointer.x / radius : 0;
      s.spin += reduced ? 0 : dt * 0.18;
      // same resting tilt as the Spline file (12° / -8°), plus pointer tilt
      mesh.current.rotation.set(
        s.tiltX.step(tx * 0.35, dt),
        12 * DEG + s.spin + s.tiltY.step(ty * 0.5, dt),
        -8 * DEG,
      );
      mesh.current.scale.setScalar((radius / 1.1) * fill);
    }

    // ---- material: dispersion grows as the object solidifies
    const solidity = s.solid ? 1 : smoothstep(0.1, 0.5, m) * 0.35;
    const mt = mat.current;
    if (mt) {
      mt.ior = lerp(1.22, 1.55, solidity);
      mt.chromaticAberration = lerp(0.03, 0.14, solidity);
      mt.distortion = lerp(0.06, 0.0, solidity);
      mt.thickness = lerp(radius * 0.32, radius * 0.45, solidity);
      mt.anisotropicBlur = lerp(0.04, 0.02, solidity);
      mt.time = s.t;
    }

    if (edges.current) {
      edges.current.visible = s.solid;
      (edges.current.material as THREE.LineBasicMaterial).opacity = 0.4 * smoothstep(0.1, 0.6, s.t - s.swapAt);
    }

    // ---- glint: a scrubbed pre-glow towards the swap, then a sweep right after it
    const since = s.t - s.swapAt;
    const sweep = reduced ? 0 : 1 - smoothstep(0, 0.7, since);
    const preGlow = reduced ? 0 : Math.exp(-Math.pow((m - 0.5) / 0.06, 2));
    glint.current?.set(radius, smoothstep(0, 0.7, since) * 2.4 - 1.2, Math.max(sweep, preGlow * 0.7));

    caustics.current?.set(radius, s.solid ? 1 : solidity, s.t, group.current.position.y);
    if (process.env.NODE_ENV !== 'production' || (globalThis as any).__fableDebug) {
      (globalThis as any).__fableSim = { m, solid: s.solid, fill, since: s.t - s.swapAt, scale: mesh.current.scale.x, pos: group.current.position.toArray(), visible: mesh.current.visible };
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={drop.geo}>
        <MeshTransmissionMaterial
          ref={mat}
          samples={mobile ? 4 : 8}
          resolution={mobile ? 384 : 768}
          transmission={1}
          roughness={0.03}
          thickness={1}
          ior={1.2}
          chromaticAberration={0.03}
          anisotropicBlur={0.1}
          distortion={0.06}
          distortionScale={0.35}
          temporalDistortion={0}
          clearcoat={1}
          clearcoatRoughness={0.05}
          color="#ffffff"
          attenuationColor="#e9eef7"
          attenuationDistance={3}
          background={new THREE.Color('#0B0B0F')}
          envMapIntensity={1.6}
          specularIntensity={1}
        />
        <lineSegments ref={edges} geometry={edgeGeo} scale={1} visible={false}>
          <lineBasicMaterial color="#F2F0EB" transparent opacity={0} depthWrite={false} />
        </lineSegments>
      </mesh>
      <Glint ref={glint} />
      <Caustics ref={caustics} />
    </group>
  );
}
