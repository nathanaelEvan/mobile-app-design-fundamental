# Design canvas (Wonder, Figma, Paper, Pencil…)

Open when variants or hi-fi screens are drawn on a design canvas instead of in code. The canvas is
where the design is drawn; the repo is the source of truth. Its own tool's skill decides how to
draw. This file decides what an artboard must respect so design → code needs no rework.

## Artboards follow the app's rules

- **Size**: the `DESIGN.md` device (412×915 by default), with the 4px grid, 16px safe area and type
  scale applied as in code.
- **No phone status bar in the artboard.** The shell draws it in frame mode and the real phone has
  its own. When the top must show the space, leave a 40px empty band (on the grid; a tool's own
  54px preset is off-grid) and do not put content in it.
- **Hit areas**: a visual under 48px (a 40px chip, a 24px icon) gets a 48px annotation (a dashed
  outline or a note on the layer), so the code gets the hit area (`components.md`).
- **Tokens**: canvas tokens use the repo's semantic and component names (`bg-surface-01`,
  `--button-bg`), with values copied from `tokens.css`. Never a parallel `v2-*` scheme that has to
  be remapped later.
- **One mode on canvas.** A canvas token holds one value, so artboards are light. Dark is designed
  and checked in code (`color-tokens.md`), not inverted on the canvas.
- **Inline SVG**: `var()` in an SVG `fill` / `stroke` attribute often does not resolve on canvas
  or in exported code. Use `currentColor` and set the colour on the element. Literal colours only
  inside illustration assets (`components.md`, "Illustration and mascot").

## Gate before design → code

Run on the artboards, before any code is written, with the review taste gate (`phase-review.md`
§2) plus:
- Every gesture drawn (drag to reorder, swipe to delete, drag a sheet) has a visible button
  alternative on the same artboard (`motion.md`).
- No fake features: every control maps to something the app does or will do in this change (no
  login, account switch, download or settings that do not exist).
- Counts match content: "Langkah 1 dari 2" only when there are two steps; badges and progress
  match the sample data.
- Quick replies and suggested actions never hand over the answer or skip the task the screen is
  for (`screens/chat.md`).
- Every state the archetype names has an artboard or a note (`screens/states.md`).

A FAIL here is fixed on the canvas, then built.

## Variants

Rough variants may live on the canvas (`references-and-iteration.md`). Before deleting the ones not
picked, export a screenshot of each to `design/variants/` and link it from `REFERENCES.md`, so the
user can still switch later. The canvas inventory (pages, artboard ids, positions) stays on the
canvas; `REFERENCES.md` gets the 3-5 line summary only.
