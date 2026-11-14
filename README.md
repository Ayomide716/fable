# Studio site

Award-level 3D portfolio site. Plan: [docs/website-plan.md](docs/website-plan.md), experience flow:
[docs/experience-plan.md](docs/experience-plan.md).

## Hero prototype

Next.js + React Three Fiber. One fixed canvas behind the HTML: the headline is drawn in 3D behind a
liquid-glass drop so it bends through the glass; scrolling through the "solidify" section turns the
drop into the crystal from the Spline file, inside a glint.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

- `components/scene/GlassObject.tsx`: the drop → crystal object (one mesh, one transmission material)
- `components/scene/Headline3D.tsx`: the headline behind the glass
- `lib/crystal.ts`: the crystal geometry, same vertices as the Spline file
- `prototype/liquid-to-solid.html`: the earlier single-file prototype, kept for reference
