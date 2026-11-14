import * as THREE from 'three';

/**
 * The crystal from the Spline file (docs/experience-plan.md §11), in the same
 * units Spline uses: a hexagonal crystal whose lower ring is turned 30°, which
 * gives a 24-facet antiprism. Kept in code so the site can render it before
 * the GLB export lands; swap for the GLB when it does.
 */
export const CRYSTAL = { R: 110, yTop: 240, yU: 95, yL: -85, yBot: -200, lowerRing: 0.94 };

export function crystalPoints(): THREE.Vector3[] {
  const { R, yTop, yU, yL, yBot, lowerRing } = CRYSTAL;
  const p: THREE.Vector3[] = [new THREE.Vector3(0, yTop, 0)];
  for (let i = 0; i < 6; i++) {
    const a = (i * 60 * Math.PI) / 180;
    p.push(new THREE.Vector3(Math.cos(a) * R, yU, Math.sin(a) * R));
  }
  for (let i = 0; i < 6; i++) {
    const a = ((i * 60 + 30) * Math.PI) / 180;
    p.push(new THREE.Vector3(Math.cos(a) * R * lowerRing, yL, Math.sin(a) * R * lowerRing));
  }
  p.push(new THREE.Vector3(0, yBot, 0));
  return p;
}

export function crystalTriangles(): number[] {
  const idx: number[] = [];
  for (let i = 0; i < 6; i++) {
    const u0 = 1 + i, u1 = 1 + ((i + 1) % 6), l0 = 7 + i, l1 = 7 + ((i + 1) % 6);
    idx.push(u1, u0, 0, u0, u1, l0, l1, l0, u1, l0, l1, 13);
  }
  return idx;
}

/** Flat-shaded crystal, centred on the origin and scaled to `height` world units. */
export function crystalGeometry(height: number): THREE.BufferGeometry {
  const pts = crystalPoints();
  const s = height / (CRYSTAL.yTop - CRYSTAL.yBot);
  const cy = (CRYSTAL.yTop + CRYSTAL.yBot) / 2;
  const pos: number[] = [];
  for (const i of crystalTriangles()) {
    const v = pts[i];
    pos.push(v.x * s, (v.y - cy) * s, v.z * s);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** The lattice edges (also the X-ray wireframe later). */
export function crystalEdges(height: number): THREE.BufferGeometry {
  const pts = crystalPoints();
  const s = height / (CRYSTAL.yTop - CRYSTAL.yBot);
  const cy = (CRYSTAL.yTop + CRYSTAL.yBot) / 2;
  const pairs: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const u0 = 1 + i, u1 = 1 + ((i + 1) % 6), l0 = 7 + i, l1 = 7 + ((i + 1) % 6);
    pairs.push([0, u0], [u0, u1], [u0, l0], [l0, u1], [l0, l1], [l0, 13]);
  }
  const pos: number[] = [];
  for (const [a, b] of pairs) {
    for (const v of [pts[a], pts[b]]) pos.push(v.x * s, (v.y - cy) * s, v.z * s);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}
