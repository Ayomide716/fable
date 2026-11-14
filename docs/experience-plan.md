# Experience plan: "Liquid → Solid" (draft v1)

What a visitor sees, feels and does, second by second, and the rules that keep it one
cohesive piece. Builds on the brief and concept in [website-plan.md](website-plan.md) §7–8.

---

## 1. The one sentence
> You arrive at a drop of liquid glass. You scroll, and it **sets** into a crystal in front
> of you. At the end, it's solid enough to pick up, and it points you to the "start a project" form.

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
4. **One accent, one job.** Signal lime `#C6FF3D` only ever means "start a project". At the
   end the crystal focuses light into a lime point that lands on the Send button, so the
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
Total length ≈ 7 screen heights on desktop. Each beat lists what you see, what you can do,
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

### Beat 1: Hero, "You bring the idea. I *ship* the product."
- **See:** headline set huge, *behind* the droplet, so the letters bend through the glass.
  Sub-line: "Fullstack product engineer. Design, frontend and backend from one person,
  so you launch in weeks, not quarters." Name, "Available for new projects" status pill,
  lime **Start a project** CTA + "How I work".
- **Why this line:** it speaks to the visitor first ("you"), says the outcome in six
  words, and mirrors the concept (fluid idea in, solid product out). "Ship" is the
  italic serif word.
- **Do:** move the cursor; the droplet bulges away and ripples, the text behind it warps
  with it. On phones: tilt the device (with permission) or touch-drag.
- **Object:** liquid, wobbling slowly on its own (breathing, ~4 s loop). Wavy caustics on
  the floor.
- **Hand-off:** scroll cue "Scroll · watch it take shape". First scroll: the headline
  lifts away, the droplet thickens slightly (viscosity goes up).
- **Wow:** the headline refracting through real glass, reacting to your hand.
- **5-second test:** who, what, and the Start a project button must be readable before anyone
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
- **Do:** flip X-ray: the glass drains to a glowing wireframe, and labels pin to its parts
  naming the real tools behind them ("Next.js · routing", "Three.js · glass shader",
  "GSAP · scroll timeline", "Node + Postgres · contact form"). This replaces a separate
  Stack section: the tools are shown *working*, not listed. Flip back: it re-fills.
- **Object:** now solid. The cursor tilts it rather than deforming it.
- **Wow:** X-ray. It turns the effect into evidence.

### Beat 5: Contact, "Let's build something people *remember.*"
- **See:** headline, then a short form (three fields, one screen, no scrolling):
  1. **What are you building?** one or two lines (required)
  2. **Your email** (required)
  3. **When?** tap one chip: *ASAP* · *1–3 months* · *Just exploring* (optional)
  Lime **Send** button, the reply-time promise under it ("I reply within 1 working day"),
  and a quiet "or copy my email" link for people who prefer their own mail app. Footer.
- **Why a real form:** it sends straight from the page (a small server function on Vercel
  that emails you), so nobody is thrown out to a mail app, which is where most mailto
  clicks are lost. Few fields, typed answers kept if they leave and come back, clear
  errors next to the field, works without JavaScript as a fallback.
- **Object:** the crystal rounds into a polished glass sphere, the final solid form. Light
  passing through it focuses into a lime point that lands on the Send button.
- **Do:** grab and spin the sphere (hint: "Drag to spin"). It has real weight and
  friction. Press Send: the sphere gives one bright "clink" glint (and a tone if sound
  is on), and the form is replaced by "Got it. I'll reply within 1 working day."
- **Wow:** the object you watched form is now solid in your hand, and it points at the form.

### Global layer (always there)
- **Floating glass nav:** brand left, section links, sound toggle, lime "Start a project"
  pill right (jumps to the form). Hides on scroll down,
  returns on scroll up.
- **Cursor lens:** a small glass lens that magnifies slightly; grows over links, becomes a
  "drag" ring over the object. Hidden on touch devices.
- **Sound (off by default):** a small waveform icon in the nav turns it on; the choice is
  remembered. Low and quiet: a soft liquid hum at the top, a drip when you push the
  droplet, glass tones at each process stage, a clean "clink" on Send. Under 300 KB of
  audio, loaded only after it's switched on, muted whenever the tab is hidden.
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
| Faceted crystal | 3 (Launch)–4 | **Spline** → GLB | the "hero" final form; spend design time here |
| Glass sphere | 5 | code | simple primitive, physics-driven spin |
| Floor caustics | all | code (projected texture / shader) | the second visual layer; evolves with the story |
| Environment | all | HDRI + one key light | one lighting setup for the whole site |

**Morph approach (decided): dissolve inside a glint.** Each stage is its own mesh. At the
moment of change a bright glint sweeps across the object, and the next form fills in
behind it with a dissolve, then settles with a small spring. Why: it keeps 50+ fps on
mid-range phones (where most visitors are), works with the forms designed in Spline,
and the glint hides the swap so it reads as one object transforming. The smoother
shape-blending shader stays as a possible desktop upgrade later, only if the budget allows.

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
- Contact: form fields at full width, Send button in the thumb zone, the right keyboard
  for each field (email keyboard for email); sphere spin by swipe.
- Target ≥ 50 fps on a mid-range Android; if it drops, quality steps down automatically.

## 8. Accessibility and calm modes
- **Reduced motion:** the object shows each stage as a still with soft cross-fades; no
  wobble, no scroll-scrubbed morphs, no cursor physics.
- **No WebGL / weak device:** a designed static version with rendered stills of each stage
  (from the same scene), not a broken canvas.
- All text is real HTML, readable and selectable; the 3D is decorative (`aria-hidden`),
  and every interactive 3D moment has a normal button equivalent.
- Contrast checked on every text-over-glass spot.

## 9. Decisions
| Question | Decision |
|---|---|
| Sound | Optional, **off by default**, toggle in the nav |
| Hero line | "You bring the idea. I *ship* the product." |
| Stack section | **Cut.** Tools appear as X-ray labels in Proof: shorter page, more convincing |
| Contact | **Short form** (idea, email, timing chip) sent from the page, copy-email as backup |
| Morph | **Dissolve inside a glint** (phone-friendly); shape-blend shader only as a later desktop upgrade |

## 10. Next step
Once you approve this flow: build a **storyboard** (one key frame per beat, at desktop
and phone size) so you can see the look before we build. Then design the crystal, lattice
and panes in Spline and bring them into the hero prototype.
