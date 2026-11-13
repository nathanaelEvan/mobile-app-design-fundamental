# Phase: setup

Goal: one short conversation that settles the design decisions, written into `design/DESIGN.md`,
so no later run asks again. Read `tokens.md` and `color-tokens.md` now (setup and audit are the only
phases that need them).

## 1. Look before asking

Check what the project already decides, and do not ask about it:
- Stack: `package.json` (vue, vuetify, react, svelte, astro), a Vuetify `createVuetify({ theme })`,
  Tailwind config, existing CSS custom properties.
- Fonts already loaded (`<link>` to Google Fonts, `@font-face`, `--v-font-body`).
- A brand colour in a theme, a logo, a manifest `theme_color`.

## 2. Ask once, only what is still open

Ask in a single message (use the host's question tool when it has one). Offer the default first.
Skip any question the project or the user already answered.

| Decision | Default when the user has no preference |
|---|---|
| Type scale | Material 3 as Vuetify ships it (`tokens.md`) |
| Font | The user's choice. No preference: Roboto (Vuetify's default) |
| Chrome style | Material |
| Screen safe area (side margin) | 16px |
| Brand / accent colour | Ask; if none, ink-on-neutral with one accent picked from references |
| Shape | Rounded: radius 12 (controls), 16 (cards), 28 (sheet top) |
| Light / dark | Light first, dark designed (not inverted) before launch |
| Device for the desktop frame | 412×915 (Android, Material) |

A decision the user answers, or explicitly accepts as default, is **final**. One they skip is
**draft**: use the default, and you may ask about it once more later, never twice.

## 3. Write the files

From `<skill>/assets/templates/`, create in the project:
- `design/DESIGN.md`: fill the decisions table (value + `final`/`draft`) and the token block.
- `design/COMPONENTS.md`: empty inventory, or scanned (see `components.md`) if any UI exists.
- `design/REFERENCES.md`: empty log.

## 4. Install the kit

- Copy `<skill>/assets/tokens.css` into the project's styles and set the decided values (font,
  colours, radius). In a Vuetify project, map the same values into `createVuetify({ theme })` and
  keep `tokens.css` for the grid, safe area and roles Vuetify does not cover; its type classes share
  Vuetify's names, so they do not clash.
- Copy `<skill>/assets/shell/` and wire it as `device-shell.md` describes.
- Add `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
  `theme-color`, and a web manifest with `"display": "standalone"`.

## 5. Confirm in one line

"Setup done: Material 3 scale, <font>, 16px safe area, Material chrome, <device> frame. Saved in
design/DESIGN.md." Then continue with whatever the user asked, in the develop phase.
