---
name: mobile-app-design-fundamental
description: >-
  Design rules for mobile app UI built on the web (PWA, Vue/Vuetify, React, Svelte, plain HTML):
  a strict 4px grid, a Material 3 (Vuetify) type scale by default, a component inventory checked
  before any component is used or made, reference-first quick iteration (Mobbin first), screen
  archetypes with their states, and a device shell that shows the app inside a simple phone frame
  on desktop and runs native, frameless, on a phone. Use whenever you set up, audit, design, build,
  redesign, polish or review a mobile app screen, flow or component on the web. Visual decisions
  only: pair it with modern-web-guidance for how to implement them.
---

# Mobile app design fundamental

This skill decides **what the app looks like and how it behaves for the person holding the phone**.
**modern-web-guidance decides how it is built** (HTML/CSS/JS APIs, units, fallbacks, accessibility
implementation, motion implementation). When a rule here would force an implementation that
modern-web-guidance forbids, modern-web-guidance wins and this rule adapts. Never re-litigate it.

**Browser target**: evergreen browsers, Baseline *newly available* included (`light-dark()`,
`@starting-style`, popover, `:has()`), unless `DESIGN.md` names an older one. `DESIGN.md`'s
Browser target row **is** the custom browser-support policy modern-web-guidance asks for: with it,
skip fallbacks for Baseline features inside the target. A feature modern-web-guidance marks
*Limited availability* still gets its fallback or degrades gracefully (an exit animation becomes
instant). Adapting its snippets to this skill: `phase-develop.md`.

**Use it together with modern-web-guidance.** If that skill is not available in this session, tell
the user once, at the start, that this skill is designed to run alongside it and how to add it:
in Claude Code `/plugin install modern-web-guidance@claude-plugins-official`, or any agent can call
`npx -y modern-web-guidance@latest search "<task>"`. Then continue; do not block on it.

`<skill>` below is the folder that holds this file.

## Read only what the phase needs

This skill is split so you never load all of it. Find the phase, read **only** its file, and let
that file tell you which further reference to open and when.

`design/` sits at the root of the app. In a monorepo, that is the app's own package
(`apps/mobile/design/`), not the repository root.

1. Does the project have `design/DESIGN.md`?
   - **No, and there is no UI code yet** → **Setup**: read `<skill>/references/phase-setup.md`.
   - **No, but UI code exists** → **Audit**: read `<skill>/references/phase-audit.md`.
   - **Yes** → go to 2.
2. What is asked?
   - Build or change a screen, flow or component → **Develop**: `<skill>/references/phase-develop.md`.
   - Review, polish, "does this look right", or before handing work over →
     **Review**: `<skill>/references/phase-review.md`.
   - Change a design decision (font, scale, colour, safe area...) → **Setup**, only the section for
     that decision.

Once `design/DESIGN.md` exists, its **final** decisions are settled. Do not ask about them again,
do not re-explain them, and do not read `tokens.md` to re-derive them; read the values from
`DESIGN.md`. A final decision changes only when the user explicitly asks to change it. An **OPEN**
row (app name, brand, core flows not decided yet) is the opposite: ask before building anything
on it, and keep the work neutral where it touches it.

## The rules that always apply (no file needed)

1. **4px grid.** Every spacing, size, radius, icon size and offset is a multiple of 4px. Write it in
   rem (`0.25rem` steps), except sizes tied to the finger or the screen edge (`--target`,
   `--safe-x`, icon sizes), which stay px so they do not double at 200% text (`tokens.md`). Only
   hairlines (1px) are exempt, and a control's hairline border does not count against its height.
2. **Screen safe area 16px.** Content sits 16px (`1rem`) in from the left and right edges, or the
   device inset when it is larger. Nothing but full-bleed media touches the edge.
3. **Touch targets at least 48px** in both directions (a smaller visual may extend its hit area);
   hit areas never overlap, and small targets sit at least 8px apart. This is stricter than
   modern-web-guidance's 44px: use 48. A checkbox or radio's target is its `<label>`.
4. **One type scale.** The project's (in `DESIGN.md`), else Material 3 as Vuetify ships it. Never a
   raw font size outside it. Max 4 content text styles per screen plus one hero (app bar and
   navigation bar labels not counted), max 2 weights.
5. **Check `design/COMPONENTS.md` before using or making any component.** Order: the project's
   inventory → the UI library in use → only then a new component, with a one-line reason, added to
   the inventory in the same change.
6. **References before pixels.** New screens start from real apps (Mobbin first), then 2-3 rough
   variants, then one is refined. No polishing before a direction is picked.
7. **Every screen has its states:** loading, empty, error, offline where data comes from the network,
   and long content (long names, strings at their real length in the app's language, big numbers).
8. **One job, one focal element, one primary action per screen.**
9. **Material chrome by default** (top app bar, navigation bar, bottom sheets, FAB only where it
   fits) unless `DESIGN.md` says iOS.
10. **The app is phone-sized, wherever it runs.** It never reads the browser window: no `vw`, `vh`,
    `dvh`, `svh`, and no width media queries inside app code. Size against the app root with
    container queries and container units. On desktop the device shell frames it; on a phone it runs
    native and full screen; on a tablet it stays phone-width, centred
    (`<skill>/references/device-shell.md`).
11. **No hover styles in app UI.** Phones have no hover, and the desktop frame stands in for a
    finger, so it shows none either. Feedback is press (`:active`), and every focusable control
    keeps a visible `:focus-visible` ring.
12. **Real content.** No lorem ipsum, "John Doe", "Item 1" or identical rows.
13. **Colour by token only, four tiers.** Primitive → brand → semantic → component; components use
    semantic or component tokens (`bg-surface-01`, `on-surface-muted`, `--chip-bg`), never a hex,
    a primitive or a palette class. Names follow `{property}-{role}-{rank|prominence}-{layer}-{state}`.
14. **Motion has a job** (where from, where to, confirm a press, follow the finger), uses the
    duration and easing tokens, takes at most 500ms, and every gesture has a visible button
    alternative (`references/motion.md`).
15. **No visible scrollbars**, in the desktop frame either. Every scroller (app root, screen bodies,
    sheets, chip rows, chat lists) sets `scrollbar-width: none` and still scrolls by touch, wheel and
    keyboard; cut-off content or a fade shows there is more (`references/device-shell.md`).
16. **Text is not selectable by default.** The whole app root is `user-select: none` (+
    `-webkit-touch-callout: none`), as in a native app; only fields (`input`, `textarea`,
    `contenteditable`) stay selectable. Content becomes copyable (`data-selectable`) only when the
    user asks for it, recorded in `DESIGN.md`'s Text selection row; controls and drag regions inside
    it stay unselectable. Sheets drag to dismiss by their handle and header (`references/motion.md`).
17. **Buttons are Material emphasis × semantic tone.** Filled, tonal, outlined, text (elevated if
    used), in brand (default), neutral or error tone. A destructive action uses the error tone: text
    or outlined to start it, filled to confirm, and the confirm names what is destroyed. Every
    button label uses one type style (label-large), whether it renders as `<button>` or `<a>`
    (`references/components.md`).

## Files in this skill

| File | Open it when |
|---|---|
| `references/phase-setup.md` | First run in a new project, or changing one decision |
| `references/phase-audit.md` | First run in a project that already has UI |
| `references/phase-develop.md` | Building or changing UI |
| `references/phase-review.md` | Reviewing or before handing over |
| `references/tokens.md` | Setup or audit only: grid, type scale, safe area, radius |
| `references/color-tokens.md` | Setup, audit, or a new component's colours: the four tiers and naming |
| `references/components.md` | Creating or updating `COMPONENTS.md` |
| `references/references-and-iteration.md` | Starting a new screen or flow |
| `references/screens/<archetype>.md` | Building that kind of screen (one file only) |
| `references/motion.md` | Adding motion, a transition or a gesture |
| `references/anti-patterns.md` | Review, or when a screen "looks generic" |
| `references/copy.md` | Writing UI text |
| `references/device-shell.md` | Setting up or debugging the phone frame / native mode; scrollbars and text selection |
| `references/canvas.md` | Variants or screens drawn on a design canvas (Wonder, Figma, Paper…) |
| `assets/tokens.css` | Copied into the project at setup |
| `assets/shell/` | Copied into the project at setup |
| `assets/templates/` | `DESIGN.md`, `COMPONENTS.md`, `REFERENCES.md` templates |
| `assets/pwa/` | Setup: the web manifest template |
| `scripts/check.mjs` | Review: renders the app and reports grid, target, overflow, scrollbar, text-selection and shell problems |
| `scripts/check-tokens.mjs` | Setup, and whenever the palette changes: contrast of every token pair, light and dark |
