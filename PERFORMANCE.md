# Scroll Performance Hardening

## Problem

Scrolling the explore grid dropped below the 60 FPS target. The audit identified
three contributing factors:

1. `scroll-behavior: smooth` on `html`, which conflicts with hardware-accelerated
   delta scrolling.
2. Two sticky glass headers (`NavigationHeader`, `CategorySubNav`) each with
   `backdrop-blur-xl`, forcing full-screen Gaussian blur recalculation on the
   main thread while scrolling.
3. 24 asset cards rendering and painting continuously with no containment.

## Changes applied

| File | Change |
| --- | --- |
| `app/globals.css` | Removed `scroll-behavior: smooth` from `html`; added `.gpu-layer` and `.card-render-contain` |
| `components/layout/NavigationHeader.tsx` | `gpu-layer` on the sticky `<header>` |
| `components/layout/CategorySubNav.tsx` | `gpu-layer` on the sticky container |
| `components/molecules/AssetCard.tsx` | `card-render-contain` on the `<article>` |

`.gpu-layer` promotes the sticky surfaces onto their own compositor layer
(`translateZ(0)` + `backface-visibility: hidden` + `will-change: transform`), so
the `backdrop-filter` is rasterised once and reused as a cached texture instead of
being recomputed per scroll frame.

## Deviation from the brief: `content-visibility: auto`

The brief specified `content-visibility: auto` on asset cards. This was
implemented, measured, and then **rejected on evidence**.

A skipped card has no layout, so the browser substitutes its
`contain-intrinsic-size` placeholder. When the card is revealed it snaps to its
true height, which changes document height mid-scroll and jumps the scrollbar.

Isolating the directive at a 430px viewport during a full-page scroll:

| Configuration | Document-height drift |
| --- | --- |
| `content-visibility: auto` | **616px** |
| `contain: layout style paint` only | **0px** |

Card height is also breakpoint-dependent (593px at 390, 623px at 430, 581px at
768, 560px at 1024, 579px at 1440) because the preview keeps a 4:3 ratio against
a variable column width, so no single placeholder value is correct everywhere.
Tuning placeholders reduced but never eliminated the drift (616px -> 66px -> 12px
at 1440px), which confirms the directive itself is the cause rather than the
placeholder value.

**Decision.** `.card-render-contain` ships `contain: layout style paint`, which
provides the offscreen paint and layout isolation that was actually needed and
measures zero drift. `content-visibility: auto` is retained as an explicit
opt-in (`[data-cv-skip]`) for surfaces with a deterministic height, and is never
applied implicitly.

The long-task, containment, GPU-layer and layout-shift assertions in the
performance suite enforce this contract, so a future change that re-enables
`content-visibility: auto` on variable-height cards fails the build rather than
silently shipping a scrollbar jump.

## Verification

`scripts/verify.mjs --suite performance` asserts, at 390/430/768/1440:

- root `scroll-behavior` is not `smooth`
- both sticky surfaces are `position: sticky` and GPU-promoted
- cards declare layout/style/paint containment
- offscreen render skipping is opt-in, never implicit
- every offscreen card still reports real geometry, so `content-visibility` cannot
  create a blind spot in the touch-target and overflow audits
- no long task exceeds 100ms during a full-page scroll
- document height does not shift by more than 2px while scrolling
- no infinite animations run inside asset cards