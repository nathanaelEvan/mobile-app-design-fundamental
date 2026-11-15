# Phase: setup

Goal: one short conversation that settles the design decisions, written into `design/DESIGN.md`,
so no later run asks again. Read `tokens.md` and `color-tokens.md` now (setup and audit are the only
phases that need them).

## 1. Look before asking

Check what the project already decides, and do not ask about it (and write it into `DESIGN.md`):
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
| Brand tone | Ask, with the audience: calm (default), playful or premium. Playful relaxes a few anti-patterns, within limits (`anti-patterns.md`, "Tone") |
| Shape | Rounded: 8 (chips), 12 (buttons, fields), 16 (cards, FAB), 28 (sheet top), full (avatars) |
| Light / dark | Both, following the system; dark designed, not inverted |
| Device for the desktop frame | 412×915 (Android, Material) |
| Language and locale | `<html lang>` or the i18n config when set; else the language the user writes in (Indonesian → `id-ID`, `Rp 12.400`, `1,5 km`; English → `en`); else Indonesian, `id-ID` |
| Copy register | Casual, in that language (Indonesian: "kamu"; English: plain "you") (`copy.md`) |
| Browser target | Evergreen, Baseline newly available included (`SKILL.md`) |
| Text selection | Off everywhere, fields only (`SKILL.md` rule 16). Content is copyable only when the user asks: list it and mark it `data-selectable` |

With no one to ask (a subagent, CI), take what the project shows plus the defaults, write every
row as **draft**, and continue.

A decision the user answers, or explicitly accepts as default, is **final**. One they skip is
**draft**: use the default, and you may ask about it once more later, never twice. One the user
says is not decided yet (the app idea, the name, the brand) is **OPEN**: no default, ask before
building on it.

## 3. Write the files

From `<skill>/assets/templates/`, create in the project:
- `design/DESIGN.md`: fill the decisions table. Each row gets a value and a status; the template
  starts every row at `draft`, so promote the answered and accepted ones to `final`. Fill the token
  block too.
- `design/COMPONENTS.md`: empty inventory, or scanned (see `components.md`) if any UI exists.
- `design/REFERENCES.md`: empty log.

## 4. Install the kit

- Copy `<skill>/assets/tokens.css` into the project's styles and set the decided values (font,
  palette, radius). In a Vuetify project, check which type classes it ships: Vuetify 4 has the
  Material 3 names (`text-body-large`…), so delete the file's type class block; Vuetify 3 has
  Material 2 names (`text-h1`…`text-caption`), so keep the block. Either way, fill Vuetify's theme
  from the semantic tier (`color-tokens.md`).
- The project's own palette replaces the primitives, never the semantic names. Pick each
  semantic token's shade by contrast, not by step number: a ramp's 500 is not this file's 500.
  Then run `node <skill>/scripts/check-tokens.mjs <tokens.css>` and fix every FAIL before any
  screen uses the tokens. Run it again whenever the palette changes. When a JSON copy of the theme
  exists (`design/tokens.json`), add `--json design/tokens.json` so the two cannot drift.
- Copy `<skill>/assets/shell/` and wire it as `device-shell.md` describes. Wiring it includes the
  viewport, `color-scheme`, `text-scale` and `theme-color` metas.
- **Installable (PWA)**: start from `<skill>/assets/pwa/manifest.webmanifest`. It needs PNG icons
  at 192 and 512 plus a 512 maskable one (the mark inside the central 80%), not only an SVG;
  `theme_color` and `background_color` copy the resolved light `bg-canvas` value (a manifest
  cannot read CSS variables; note it in `DESIGN.md` so a palette change updates it).
- **Checker scripts**: add `check:design` (quick: every route at 360, seconds; run it on every
  build, or `npm run check:design -- --filter <route>` for the screens a change touched) and
  `check:design:full` (the same plus `--full`: every viewport; before a release or hand-over) to
  `package.json`, so a review covers the whole app, not the landing screen:
  - `--routes` (alias of `--states`) lists every screen. An entry starting with `/` is a route path
    from the origin (`--routes "/,/buku?demo,/profil?demo"`), so history routing is covered; `?x`
    and `#x` entries are appended to the URL as before.
  - `--click` lists every sheet and dialog trigger (`".toc-btn;.sources-btn"`), so open sheets get
    audited too.
  - **Seed data**: a `?demo` query (or `#demo`) that fills the app with realistic sample data, plus
    `?demo=empty` and `?demo=long` for the empty and long-content states, so the checker reaches
    every state without a backend. Each render starts with empty storage, so every route carries
    its own seed. Keep it out of production paths.
- Load the chosen font (Google Fonts or self-hosted, with `display=swap`). Vuetify does not ship
  font files.

## 5. Confirm in one line

"Setup done: Material 3 scale, <font>, 16px safe area, Material chrome, <device> frame. Saved in
design/DESIGN.md." Then continue with whatever the user asked, in the develop phase.
