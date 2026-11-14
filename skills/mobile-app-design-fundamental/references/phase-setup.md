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
| Shape | Rounded: 8 (chips), 12 (buttons, fields), 16 (cards, FAB), 28 (sheet top), full (avatars) |
| Light / dark | Both, following the system; dark designed, not inverted |
| Device for the desktop frame | 412×915 (Android, Material) |

A decision the user answers, or explicitly accepts as default, is **final**. One they skip is
**draft**: use the default, and you may ask about it once more later, never twice.

## 3. Write the files

From `<skill>/assets/templates/`, create in the project:
- `design/DESIGN.md`: fill the decisions table. Each row gets a value and a status; the template
  starts every row at `draft`, so promote the answered and accepted ones to `final`. Fill the token
  block too.
- `design/COMPONENTS.md`: empty inventory, or scanned (see `components.md`) if any UI exists.
- `design/REFERENCES.md`: empty log.

## 4. Install the kit

- Copy `<skill>/assets/tokens.css` into the project's styles and set the decided values (font,
  palette, radius). In a Vuetify project, delete its type class block (Vuetify already ships the
  same `text-*` classes), and fill Vuetify's theme from the semantic tier (`color-tokens.md`).
- The project's own palette replaces the primitives, never the semantic names. Pick each
  semantic token's shade by contrast, not by step number: a ramp's 500 is not this file's 500.
  Then run `node <skill>/scripts/check-tokens.mjs <tokens.css>` and fix every FAIL before any
  screen uses the tokens. Run it again whenever the palette changes.
- Copy `<skill>/assets/shell/` and wire it as `device-shell.md` describes. Wiring it includes the
  viewport, `color-scheme`, `text-scale` and `theme-color` metas, plus a web manifest with
  `"display": "standalone"`.
- Load the chosen font (Google Fonts or self-hosted, with `display=swap`). Vuetify does not ship
  font files.

## 5. Confirm in one line

"Setup done: Material 3 scale, <font>, 16px safe area, Material chrome, <device> frame. Saved in
design/DESIGN.md." Then continue with whatever the user asked, in the develop phase.
