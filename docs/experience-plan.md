# Experience plan: "Liquid → Solid" (draft v1)

What a visitor sees, feels and does, second by second, and the rules that keep it one
cohesive piece. Builds on the brief and concept in [website-plan.md](website-plan.md) §7–8.

---

## 1. The one sentence
> You arrive at a drop of liquid glass. You scroll, and it **sets** into a crystal in front
> of you. At the end, it's solid enough to pick up, and it points you to the email.

Everything below serves that sentence. If a detail doesn't, it gets cut.

## 2. The emotional arc
The feeling is **calm confidence** throughout, but it has a shape: soft and curious at the top,
precise and assured at the bottom. The material and the feeling change together.

```
 assured  |                                          ●──────●  contact: "I trust this"
          |                              ●──────●╱  proof: "this is real"
 focused  |                  ●──────────╱  process: "I see how it works"
          |        ●───────╱  what I do: "oh, it's organising"
 curious  |  ●───╱  hero: "what is that? (touches it)"
          +-----------------------------------------------------------------
             liquid        settling        lattice       crystal      solid in hand
```

| | Top of page | Bottom of page |
|---|---|---|
| Material | liquid, wobbling, viscous | faceted, hard, polished |
| Light | soft, diffuse, warm-neutral, wavy caustics | crisp, cooler, sharp spectral lines |
| Motion | slow, elastic, lots of overshoot | short, exact, almost no overshoot |
| Sound (optional, off by default) | low liquid hum, drips | clean glass tones, a "clink" |
| Type rhythm | big, airy, one line at a time | tighter, denser, more information |

## 3. Cohesion rules (the "one of everything" system)
These are what make it feel like one designed object, not a stack of sections.

1. **One object.** The same glass form is on screen from the loader to the footer. It
   never leaves, it never duplicates into a second hero. Sections are layers of HTML
   *passing over* it; the object reacts to them.
2. **One light.** A single key light (plus an HDRI for reflections) defines the whole
   site. It sharpens and cools as the object solidifies. The caustic it throws on the
   "floor" is the second visual layer and evolves with it (wavy → geometric → spectrum).
3. **One gesture, different material.** The cursor (or finger) always *pushes* the object.
   The response tells you its state: jelly ripple at the top, stiff wobble mid-page,
   a crisp tilt and glint at the bottom. Visitors learn one interaction and feel the
   story through it.
4. **One accent, one job.** Signal lime `#C6FF3D` only ever means "email". At the end the
   crystal focuses light into a lime point that lands on the Copy-email button, so the
   3D literally points at the conversion.
5. **One timing system.** Object: spring physics, slow and weighty. UI: fast and crisp
   (150/250/400/600 ms, `cubic-bezier(0.16,1,0.3,1)`). Scroll drives the object;
   text reveals trigger once and never replay.
6. **One camera.** No cuts. The camera dollies and orbits gently; the object's screen
   position is set from the HTML layout (Lusion pattern), so type and 3D always line up.
7. **Glass only where it belongs:** the object, the floating nav, the cursor lens and the
   CTA pills. Content cards are **not** glass (fixes the current prototype, which uses
   glass on the "What I do" cards and proof stats). No glass on glass.

## 4. The flow, beat by beat
Total length ≈ 8 screen heights on desktop. Each beat lists what you see, what you can do,
what the object is doing, how it hands off to the next beat, and its one "wow".
Rule: **max one wow per section.**

### Beat 0: Loader (≤ 2 s)
- **See:** graphite screen, a small glass drop fills with liquid as assets load. Percentage
  in small mono type.
- **Object:** the loader drop *is* the hero object at small scale.
- **Hand-off:** at 100% the drop falls a few pixels, lands, and swells into the hero
  droplet as the camera pulls back. No fade to black, no cut.
- **Wow:** the loader becomes the site.
- **Fallback:** if loading takes > 4 s, show the hero text and let the 3D fade in later.

### Beat 1: Hero, "I turn ideas into products that *ship.*"
- **See:** headline set huge, *behind* the droplet, so the letters bend through the glass.
  Name, role, "Available for new projects" status pill, Email CTA + "How I work".
- **Do:** move the cursor; the droplet bulges away and ripples, the text behind it warps
  with it. On phones: tilt the device (with permission) or touch-drag.
- **Object:** liquid, wobbling slowly on its own (breathing, ~4 s loop). Wavy caustics on
  the floor.
- **Hand-off:** scroll cue "Scroll · watch it take shape". First scroll: the headline
  lifts away, the droplet thickens slightly (viscosity goes up).
- **Wow:** the headline refracting through real glass, reacting to your hand.
- **5-second test:** who, what, and the email button must be readable before anyone
  touches the object.

### Beat 2: What I do, "One engineer. The *whole* product."
- **See:** headline left, three capabilities (Product thinking, Interface engineering,
  Systems & backend) as quiet text blocks with fine hairline dividers. Not glass cards.
- **Object:** moves to the right third. As each capability scrolls in, the liquid
  **pulls into a layer**: three stacked bands form inside the drop, one per capability.
  Hovering a capability makes its band glow faintly.
- **Hand-off:** the three bands press together into a flatter, layered disc and the object
  moves back to centre.
- **Wow:** the object visibly organising itself as you read.

### Beat 3: Process (pinned, ~4 screens of scroll)
- **See:** the object centred, big. A step counter "01 / 04" and one short line per stage.
  A thin progress line shows where you are.
- **Object, four morphs:**
  1. **Idea:** still liquid, slow wobble.
  2. **Design:** splits into a few floating glass panes (like UI layers), aligned on a grid.
  3. **Build:** panes connect into a crystal lattice; edges light up as they join.
  4. **Launch:** lattice fills and polishes into the faceted crystal; one bright glint
     travels across it.
- **Do:** scroll controls the morph, scrubbable back and forth. Scroll speed adds a little
  inertia so it feels physical, never laggy.
- **Hand-off:** pin releases; the crystal settles with one small, firm bounce (the first
  time it moves like a solid).
- **Wow:** the morph itself. This is the centrepiece and gets most of the craft budget.

### Beat 4: Proof, "This site is the *case study.*"
- **See:** copy left, crystal right. An **X-ray** toggle and four live stats measured on
  the visitor's device: frame rate, load time, renderer, quality tier.
- **Do:** flip X-ray: the glass drains to a glowing wireframe with labels for the parts
  of the stack ("shader", "physics", "scroll timeline"). Flip back: it re-fills.
- **Object:** now solid. The cursor tilts it rather than deforming it.
- **Wow:** X-ray. It turns the effect into evidence.

### Beat 5: Stack
- **See:** a short line, "What I build with", and tool names.
- **Object:** small frosted (not clear) tiles with tool marks orbit the crystal in a slow
  ring, catching its light. Hover/tap a tile: it comes forward and shows one line of
  how you use it.
- **Note:** keep this short (one screen). It's a fit check, not a section to linger in.
- **Wow:** none needed; it's a breather before the ending. Restraint is the design.

### Beat 6: Contact, "Let's build something people *remember.*"
- **See:** headline, one line ("Tell me about the idea. I'll reply with how I'd build it."),
  the email address and a lime **Copy email** button. Reply-time promise. Footer.
- **Object:** the crystal rounds into a polished glass sphere, the final solid form. Light
  passing through it focuses into a lime point that lands on the Copy-email button.
- **Do:** grab and spin the sphere (hint: "Drag to spin"). It has real weight and
  friction. Click Copy: the button confirms "Copied", the sphere gives one bright
  "clink" glint (and a tone if sound is on).
- **Wow:** the object you watched form is now solid in your hand, and it points at the email.

### Global layer (always there)
- **Floating glass nav:** brand left, section links, Email pill right. Hides on scroll down,
  returns on scroll up.
- **Cursor lens:** a small glass lens that magnifies slightly; grows over links, becomes a
  "drag" ring over the object. Hidden on touch devices.
- **Section progress:** a hairline on the right edge that fills as you scroll, ticks at
  each beat.
- **Details others skip:** tab title changes when you leave ("Still here when you're
  back."), a custom 404 where the droplet has spilled, selection colour in lime-tinted grey,
  favicon is a tiny drop.

## 5. 3D element inventory
| Element | Appears in | Made where | Notes |
|---|---|---|---|
| Hero droplet (liquid) | 0–3 | code (vertex noise + transmission material) | needs to deform live, so not a static export |
| Layer bands | 2 | code (inner layers / shader) | subtle, inside the drop |
| Glass panes | 3 (Design) | **Spline** → GLB | design the pane set and its grid layout visually |
| Crystal lattice | 3 (Build), 4 X-ray | **Spline** → GLB | also gives the wireframe for X-ray |
| Faceted crystal | 3 (Launch)–5 | **Spline** → GLB | the "hero" final form; spend design time here |
| Glass sphere | 6 | code | simple primitive, physics-driven spin |
| Stack tiles | 5 | **Spline** → GLB (one tile, instanced) | frosted, not clear |
| Floor caustics | all | code (projected texture / shader) | the second visual layer; evolves with the story |
| Environment | all | HDRI + one key light | one lighting setup for the whole site |

**Morph approach (to decide in the hero prototype):** the forms have different shapes,
so a straight mesh blend won't work. Two options: (a) a dissolve/fill transition between
meshes, timed so the change happens inside a bright glint; (b) a signed-distance-field
shader that blends smoothly between shapes. Option (a) is cheaper on phones; (b) looks
more magical. We test both on a real phone before deciding.

## 6. Beauty rules
- **Composition:** one focal point per screen, in this order: object, headline, CTA.
  Generous empty space. Alternate object position (centre → right → centre → right →
  centre) so sections don't feel repeated.
- **Light does the decorating.** No gradients, blobs or patterns in the background. The
  only "decoration" is the light and caustics coming off the object.
- **Colour:** graphite `#0B0B0F` → warm off-white `#F2F0EB` with 4–5 greys between. Glass
  takes colour from what's behind it. Chromatic dispersion at edges is the only "rainbow",
  and it grows as the crystal forms.
- **Type:** Geist for everything, Instrument Serif italic for exactly one word per
  headline (*ship*, *whole*, *case study*, *remember*). Display 72–160 px fluid, tight
  tracking; small uppercase labels with wide tracking.
- **Texture:** a barely-there film grain over everything keeps it from looking like
  default 3D.
- **Restraint check per section:** if you remove the effect and the section still works,
  ask whether the effect earns its cost. If not, cut it.

## 7. Mobile (designed, not shrunk)
- Object sits in the top half; text below it. Same story, fewer particles and lower
  resolution, never a different idea.
- Interaction: touch-drag pushes the object; optional tilt in the hero.
- Process beat: pinned with snap points at each of the four stages, so a quick swipe
  lands on a clean frame.
- Contact: Copy email is a full-width thumb-zone button; sphere spin by swipe.
- Target ≥ 50 fps on a mid-range Android; if it drops, quality steps down automatically.

## 8. Accessibility and calm modes
- **Reduced motion:** the object shows each stage as a still with soft cross-fades; no
  wobble, no scroll-scrubbed morphs, no cursor physics.
- **No WebGL / weak device:** a designed static version with rendered stills of each stage
  (from the same scene), not a broken canvas.
- All text is real HTML, readable and selectable; the 3D is decorative (`aria-hidden`),
  and every interactive 3D moment has a normal button equivalent.
- Contrast checked on every text-over-glass spot.

## 9. Open questions for you
1. **Sound:** include an optional sound toggle (off by default), or no sound at all?
2. **Hero line:** keep "I turn ideas into products that *ship.*" or explore alternatives?
3. **Stack section:** keep it, or fold the tools into the Proof X-ray labels to shorten
   the page?
4. **Contact:** just email, or also a short "what are you building?" form that opens a
   pre-filled email?
5. **Morph style:** happy for me to prototype both morph approaches (§5) and show you
   them side by side on your phone?

## 10. Next step
Once you approve this flow: build a **storyboard** (one key frame per beat, at desktop
and phone size) so you can see the look before we build. Then design the crystal, lattice
and panes in Spline and bring them into the hero prototype.
