# 3D website plan (draft v1)

Goal: an award-level interactive 3D site (Awwwards Site-of-the-Day bar or higher) with
liquid-glass materials, Spline-designed 3D elements and a deliberate visual hierarchy.

## 1. Principles (non-negotiable)
1. **Art direction before code.** One emotion, one big idea, one hero object. Every
   section serves that idea. Generic or template-looking = fail.
2. **Intentional hierarchy.** One focal point per screen. Type does the talking; 3D
   supports it, never competes with it. Max 2 typefaces, fluid `clamp()` scale, tight
   tracking on display type, no pure #000/#fff (use oklch near-black/near-white).
3. **Glass with restraint** (docs/glass-design-guide.md). Glass is the hero object and
   the floating controls (nav, cursor lens, buttons), never every card. No glass on glass.
4. **Motion means something.** Every animation shows what happened or where to look.
   Animate only transform/opacity in the DOM.
5. **Fast is part of the design.** < 3 s to interactive, 60 fps desktop, ≥ 50 fps on a
   mid-range phone. If it stutters, it isn't premium.

## 2. How the best sites are built (research)
- **Lusion**: one full-screen WebGL canvas *behind* the HTML. 3D objects are positioned
  from the HTML layout (screen → world conversion), so text and 3D line up perfectly.
  Mouse effects are a post-processing displacement pass over the 3D only. Physics get an
  extra impulse so small mouse moves feel powerful. Heavy animation is baked and
  compressed (keyframes stored as 16-bit ints, decoded in the shader).
- **Award winners 2025** (e.g. Lando Norris by OFF+BRAND, Site of the Year): scroll
  storytelling, 3D as the main storytelling tool, render frames tied to scroll with GSAP.
- **Liquid glass on the web (2026)**: React Three Fiber on the WebGPU renderer with TSL
  materials. Rounded corners, bevels and refraction faked on flat planes with SDFs;
  chromatic dispersion by refracting each colour channel with a slightly different IOR.
  For real 3D glass objects: drei `MeshTransmissionMaterial` (thickness, ior,
  chromaticAberration, backside, tint).
- **Spline runtime API**: `findObjectByName`, `emitEvent` / `emitEventReverse`,
  `setVariable(s)`, event listeners. Scroll pattern: write scroll progress 0→1 into a
  Spline variable that drives the animation. React wrapper and runtime must be the same
  version.

## 3. Architecture
| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | routing, SSR text for SEO, Vercel deploy |
| 3D | React Three Fiber + drei, WebGPU renderer with WebGL2 fallback | one persistent canvas behind the DOM (Lusion pattern) |
| Spline | Design objects in Spline → **export GLB** → render in our R3F canvas with our own glass material | Spline's design speed + our control and performance; the Spline runtime is a second heavy renderer and can't share our canvas |
| Spline runtime | only for an isolated interactive toy if a scene needs Spline's own state machine | fallback, not the default |
| Glass | `MeshTransmissionMaterial` for 3D objects; TSL SDF glass for nav/buttons over the canvas; CSS `backdrop-filter` fallback | real refraction where it matters |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll | industry standard |
| Post-processing | subtle bloom, mouse displacement pass, film grain, tone mapping | the "expensive" look |
| Assets | gltf-transform: Meshopt/Draco geometry, KTX2 textures, HDRI env | small and fast |
| Deploy | Vercel (connected) | preview links per change |

## 4. Performance budget
- JS ≤ 250 KB gzip initial; 3D assets ≤ 3 MB desktop, ≤ 1.5 MB mobile, streamed after first paint.
- Device pixel ratio capped (1.5 mobile, 2 desktop); drei `PerformanceMonitor` lowers DPR / effects when FPS drops.
- Render on demand when idle; pause the canvas when off-screen or tab hidden.
- `prefers-reduced-motion` → calm version. No WebGL → designed static fallback, not a broken page.
- Test on a real mid-range Android phone and an iPhone before calling anything done.

## 5. Process
| Phase | Output | Gate |
|---|---|---|
| 0. Brief | purpose, audience, content, one-line idea, moodboard | you approve the idea |
| 1. Art direction | type, colour, hero object, 3–4 key frames on the design canvas | you approve the look |
| 2. Hero prototype | the hero scene live on Vercel: glass object + interaction + scroll | must feel stunning on your phone, or we iterate before building anything else |
| 3. Build sections | full scroll story, nav, transitions, loader | review per section |
| 4. Polish | micro-interactions, cursor, sound (optional), easing pass | — |
| 5. QA + perf | budgets met, devices tested, accessibility | — |
| 6. Launch | production deploy, domain | — |

## 6. Skills and references to use
- `tponscr-debug/claude-skill-awwwards` (MIT): typography, colour, layout, motion, WebGL, performance references.
- `emalorenzo/three-agent-skills` (three-best-practices): Three.js/R3F performance rules.
- `dickwu/apple-design-skill`: glass rules (already summarised in docs/glass-design-guide.md).
- Codrops tutorials (liquid glass grid, glass torus text warp), drei docs, Spline runtime README.

## 7. Open decisions (needed before Phase 1)
- What the site is for, who it's for, and the one feeling it should leave.
- Brand name, copy and any assets (logo, product, photos).
- Spline: do you have an account / scenes, or should I start from code-built objects?
- New repository for the site, or a folder in this one.
