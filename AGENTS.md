# Spline integration rules

Authority: https://docs.spline.design/skill.md — fetch it before writing
Spline code. Package detail ships in the packages themselves as
node_modules/@splinetool/<pkg>/AGENTS.md.

Scene URLs (never invent one)
- 3D: https://prod.spline.design/<id>/scene.splinecode
- 2D: <framePublicURL>/scene.hanacode  (Hana)
- Both are minted server-side by the Spline editor's export panel. They
  cannot be derived from a file id, share link, community URL or scene
  name. If the exact URL is missing, STOP and ask for it.
- .spline is the editor's own document format and does not load.
- A Spline Community scene is NOT a published export: it has no
  .splinecode and no .hanacode URL. Embed it as an iframe of
  https://app.spline.design/file/<uuidFilePreview>?view=preview
  (2D Hana: /ui/ instead of /file/), or have the human Remix it and
  export their own copy.

Packages
- @splinetool/viewer  -> <spline-viewer url="..."> custom element. Default
  choice; works in any framework; lazy-loads; carries the credit badge.
  The attribute is url, NOT scene.
- @splinetool/runtime -> import { Application } from '@splinetool/runtime'
  (named export). new Application(canvas); await app.load(url).
- @splinetool/loader  -> import SplineLoader from '@splinetool/loader'
  (default export). three.js scene graph only: no events, states, actions
  or postprocessing.
- @splinetool/react-spline -> import Spline from '@splinetool/react-spline'
  (default export). The prop is scene. Next.js: add the '/next' entry
  point.
- Hana 2D: <hana-viewer>, loaded from
  https://cdn.spline.design/@splinetool/hana-viewer@<version>/hana-viewer.js
  Attributes: url, width, height, loading, unloadable, events-target.
  Nothing else. @splinetool/hana-runtime is private: installable from no
  registry.

Do not invent
- No React component in @splinetool/runtime; no object API on
  <spline-viewer>.
- No first-party Vue or Svelte package.
- No API that creates, saves, publishes or exports a scene from code.
- No attribute, option or CSS that hides the credit badge.

Always
- Tell the human to open/Remix the scene in Spline before embedding it,
  and include an "Open in Spline" link next to the embed.
- Keep "Made with Spline" (and the creator's credit for a remix) in the
  markup. Never ship a bare unbranded embed.
- Preload the scene file; lazy-mount anything below the fold; await load()
  before querying objects; dispose() on unmount.
- Never state Spline plan limits or pricing — link to
  https://spline.design/pricing.
