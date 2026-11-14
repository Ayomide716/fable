/**
 * Shared, mutable frame state. Written by DOM listeners, read inside useFrame,
 * so scrolling and pointer moves never trigger React re-renders.
 */
export const state = {
  scrollY: 0,
  viewportH: 1,
  /** 0 → 1 across the "solidify" section; the swap from liquid to crystal happens at 0.5. */
  morph: 0,
  pointer: { x: 0, y: 0, active: false, lastMove: 0 },
  reducedMotion: false,
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Under-damped spring, integrated per frame. */
export class Spring {
  value: number;
  velocity = 0;
  constructor(v = 0, public stiffness = 120, public damping = 14) {
    this.value = v;
  }
  step(target: number, dt: number) {
    const h = Math.min(dt, 1 / 30);
    const a = this.stiffness * (target - this.value) - this.damping * this.velocity;
    this.velocity += a * h;
    this.value += this.velocity * h;
    return this.value;
  }
}
