# Fable glass design guide

Research notes for building Fable's glass lock screen, clock and home screen on Android.
Based on Apple's public Human Interface Guidelines (Materials, updated Sept 2025),
reporting on the iOS 26 lock-screen clock, and open-source glass implementations.

> Fable uses its own name for this style. We do not copy Apple's name ("Liquid Glass"),
> SF fonts, SF Symbols, icons or wallpapers. The Play Store rejects apps that do.

## 1. How the iOS 26 lock-screen clock works
- **Glass vs Solid**: the clock can be frosted glass (lit like real glass) or a solid colour.
- **Adaptive time / stretch**: the clock can be stretched taller to fill empty space in the
  wallpaper; only the first (default) font supports stretching.
- **Wallpaper shows through** the numerals: colours blend through them with a soft glow.
- **Depth**: the subject of a photo can overlap the clock.
- **Opacity slider** (added in iOS 26.1/26.2): users set the glass from clear to more frosted
  because legibility depends on the wallpaper.
- Best results come from photos with a clear subject and calm areas for the clock.

**Fable takeaways**: offer Glass/Solid, a tall "stretch" height control, an opacity
(clear ↔ frosted) slider, depth (subject over clock) for photo wallpapers, and pick the
clock's label colour from the wallpaper's brightness.

## 2. Material rules (from Apple's HIG, Materials)
- Glass is for the **floating control layer** (dock, search pill, sheets, buttons,
  notifications), not for content. Do not put glass on every card or list row.
- **Use it sparingly.** Limit glass to the most important elements on each screen.
- **Never stack glass on glass.**
- Two variants:
  - **Regular**: blurs and adjusts brightness of what's behind. Use for anything with text.
  - **Clear**: very see-through. Only over rich photos/wallpapers.
- With clear glass over a **bright** background, add a **dark dimming layer at 35% opacity**.
  Over dark backgrounds, no dimming is needed.
- Glass has **no colour of its own**. It picks up the colour behind it. Text and symbols on
  glass are **monochrome**: dark over light backgrounds, light over dark.
- Use colour only for status or the one primary action. Tint the button background, not the
  icon. At most one or two prominent buttons per screen.
- Thicker (more opaque) glass gives better text contrast; thinner keeps more context.
- **Accessibility**: Reduce Transparency → opaque fallback; Increase Contrast → stronger
  fills and borders; Reduce Motion → no morphing or refraction animation.
- Touch targets: 44×44 dp default, never below 28×28.

## 3. Starting values (approximations used by cross-platform implementers)
| | Regular | Clear |
|---|---|---|
| Backdrop blur | 20–40 px | 8–16 px |
| Fill opacity (white) | 60–80% | 20–40% |
| Saturation boost | 1.2–1.5× | 1.2–1.5× |
| Border | 1 px translucent white | 1 px translucent white |
| Dimming behind (bright bg) | — | 35% black |

Highlights that sell the effect: a bright 1 px inner top edge (specular rim), a softer
bottom inner edge, a soft drop shadow, and slight edge refraction (the background bends
near the edges).

## 4. Building it on Android
| Piece | Android approach | Min Android |
|---|---|---|
| Blur behind a view | `RenderEffect.createBlurEffect` | 12 (API 31) |
| Refraction, specular rim, chromatic edge | AGSL `RuntimeShader` | 13 (API 33) |
| Fallback | translucent fill + border, no blur | 8 (API 26) |
| Glass clock on lock + home screen | **Live wallpaper** (`WallpaperService`) drawing the wallpaper and the clock digits with OpenGL ES shaders (blur + refraction inside the digit shapes) | 8 (API 26) |
| Glass UI in the app/launcher | Jetpack Compose + a glass library (below) | 12–13 |

Because the live wallpaper draws both the background and the clock itself, it can do true
glass digits on every supported phone, not just Android 13+.

## 5. Open-source references
- **Kyant0/AndroidLiquidGlass** ("Backdrop"): Compose Multiplatform glass library with example
  buttons, toggles, sliders and bottom tabs. Apache-2.0. Strongest Android option.
- **FletchMcKee/liquid**: Compose runtime-shader glass, lens and chromatic dispersion.
- **chrisbanes/haze**: Compose blur library with a liquid-glass effect.
- **ybouane/liquidglass**, **naughtyduk/liquidGL**, **iyinchao/liquid-glass-studio**: WebGL
  shader implementations (crop → blur → refraction shader with Fresnel + specular). Useful to
  port the shader math to GLSL/AGSL.
- **Design skills**: `dickwu/apple-design-skill` (HIG pages + curated liquid-glass guide),
  `alirezarezvani/claude-skills` (apple-hig-expert), `rshankras/claude-code-apple-skills`.

## Sources
- Apple HIG, Materials: https://developer.apple.com/design/human-interface-guidelines/materials
- Apple, Adopting Liquid Glass: https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass
- MacRumors, iOS 26 Lock Screen guide: https://www.macrumors.com/guide/ios-26-lock-screen/
- Engadget, stretching the iOS 26 clock: https://www.engadget.com/mobile/smartphones/how-to-stretch-the-clock-on-your-lock-screen-in-ios-26-130032926.html
- 9to5Mac, iOS 26.2 glass slider: https://9to5mac.com/2025/11/04/ios-26-2-adds-liquid-glass-slider-to-customize-your-lock-screen/
- Kyant0/AndroidLiquidGlass: https://github.com/Kyant0/AndroidLiquidGlass
- dickwu/apple-design-skill: https://github.com/dickwu/apple-design-skill
