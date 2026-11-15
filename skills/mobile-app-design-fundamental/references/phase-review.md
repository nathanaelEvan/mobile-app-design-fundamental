# Phase: review

Run this before handing work over, or when asked to review or polish. Open `anti-patterns.md` too.

## 1. Run the checker

```sh
node <skill>/scripts/check.mjs http://localhost:5173 [--root sel] [--routes "/,/detail?demo,#/settings"] \
  [--out .mobile-design-check] [--report design/check.md] [--type-sizes …] [--ignore-css <regex>] \
  [--click "#open-filter;.menu-btn"] [--only native|frame] [--focus-tabs 16]
```

- `--routes` (or `--states`, the same list) audits more than the landing screen. An entry that
  starts with `/` is a route path from the origin (`/buku?demo`: history routing, Vue Router's
  `createWebHistory`); `?query` or `&query` is appended to the URL; `#/route` replaces its hash.
  Without it only the landing screen gets the DOM rules, so a project's `check:design` script lists
  **every** route, with the seed data that reaches its populated, empty and long states
  (`phase-setup.md`). A file target may carry a query (`index.html?screen=x`).
- `--root` defaults to `[data-app-root]` (the device shell), else `#app`.
- `--only native` or `--only frame` runs one mode's scenarios (faster while iterating; run both
  before handing over). `--focus-tabs` is how many controls the focus-ring rule tabs through per
  screen (default 16).
- `--ignore-css` skips third-party stylesheets for the CSS rules, matched against the sheet URL,
  Vite's `data-vite-dev-id` and the `<style>` element's id. The default skips `node_modules`,
  Vuetify (its runtime theme sheet `<style id="vuetify-theme-stylesheet">` included), `@mdi` and
  Google Fonts.
- `--click` audits UI that opens on a press: sheets, dialogs, menus. Selectors are separated by
  `;` (a selector may contain commas). For every state, each selector is pressed once on a fresh
  load (a tap on phones, a mouse click in frame mode, `element.click()` if it is covered), the UI
  settles (DOM quiet, animations finished) and the screen is audited again as an extra state named
  like `native-412+click(#open-filter)`, on the phones, in dark mode and on the short laptop. This
  is how the `fixed` top-layer check, targets and contrast see an open sheet. A selector that
  matches nothing on a route is skipped there (a note says so); one that matches on no route stops
  the run. While a modal is open (a modal `<dialog>`, an `aria-modal` sheet,
  Vuetify's `v-dialog` / `v-bottom-sheet`), the page behind it is skipped by the target, contrast
  and covered rules; `modalInert` checks that it really is inert. List every sheet trigger here.

Run it against the dev server (e.g. `vite dev`). There every stylesheet carries its source
(`data-vite-dev-id`), so `--ignore-css` can tell third-party CSS from app CSS. A production bundle
merges Vuetify or Tailwind into the app CSS, and the stylesheet rules (`viewport-units`, `hover`,
`tiers`, `rawColour`) then report vendor rules as well.

It needs Node 22+ and Chrome, Edge or Chromium (set `CHROME_PATH` if it is elsewhere). It installs
nothing and imports nothing outside `scripts/`: run it from wherever the skill is installed
(`node ~/.claude/skills/mobile-app-design-fundamental/scripts/check.mjs …`), or copy
`check.mjs` and `check-tokens.mjs` into the project's `scripts/`; no sibling checkout needed. On a
fresh Vite server the first load reloads once while dependencies are optimised; the checker
retries that run once. A page showing Vite's error overlay stops the run with its message: fix the
build first. It renders the URL (or an HTML file) as:
- **native** at 360×800, 412×915 and 430×932 with touch, at 200% text, in dark mode with reduced
  motion (every state); at 320×640 (first state only: WCAG 1.4.10 reflow, the smallest phone);
  and on a tablet (834×1194, first state only);
- **frame** on desktop at 1440×900 and 1366×768, the short laptop where squashed phones appear.

It prints PASS, WARN or FAIL per rule and saves screenshots to the out folder. FAIL rules:

| Rule | FAIL when |
|---|---|
| `shell` | Native mode shows a frame, frame mode is squashed (ratio off by more than 1%), or the frame is cut off. Without the kit: the app root changes ratio between 1440×900 and 1366×768, or is cut off |
| `overflow` | Horizontal scroll, or text clipped without an ellipsis, at any size including 200% text |
| `scrollbars` | A scroller in the app (root, screen, sheet, chip row, list) that really scrolls shows a scrollbar: its `scrollbar-width` is not `none`, or it lays out a gutter (frame runs) |
| `pinned` | A bar that should stay put (app bar, `nav`, `footer`, `[role=toolbar]`, a chat composer `form` with a `textarea`, `[data-pinned]`) is on screen at one end of the main scroller and gone at the other: it scrolls with the content. Card headers (inside `article`, `section`, `li`) and bars narrower than 90% of the app are content; `data-pinned="false"` opts one out |
| `select-gesture` | A drag region (`touch-action: none` or `data-shell-nodrag`) whose text can still be selected (no `user-select: none` on it or an ancestor) |
| `fixed` | A fixed bar, sheet or toast is attached to the window instead of the app root, or top-layer UI escapes the phone |
| `covered` | Text that no scroll position reveals: under the app bar, navigation bar or status bar |
| `safe-area` | Content starts closer than 16px to the side edge (navigation bar labels exempt) |
| `targets` | A control (`summary` included) is under 48×48, counting a pseudo-element hit area (inline text links exempt) |
| `contrast` | Text under 4.5:1, or under 3:1 for large text, in light and dark (dark runs for every state) |
| `input-zoom` | A text field (`input` other than checkbox, radio, range, colour, file, button types; `select`, `textarea`, `[contenteditable]`) is under 16px: iOS Safari zooms the page in on focus |
| `grid` | A margin, padding, gap, radius (all four corners), control height or line height is not a multiple of 4px |
| `buttonType` | Buttons or button-styled links in one group (same parent, e.g. a pinned bar) render different label sizes or weights. Usual cause: an unlayered element reset such as `button { font: inherit }` outranking type classes that live in cascade layers (Vuetify 4) |
| `type` | A font size outside the type scale (`--type-sizes` for a custom scale). A `clamp()` size with container units (fluid hero type) is exempt |
| `viewport-units` | App CSS uses viewport units (`vw`, `vh`, `vi`, `vb`, `vmin`, `vmax` and their `d`/`s`/`l` forms; container units such as `cqi` are fine) or width / height media queries, range syntax included (`600px < width`) |
| `hover` | App CSS has `:hover` rules, nested ones included |
| `tiers` | A primitive or brand token is used outside the semantic tier (`--bg-`, `--on-`, `--icon-`, `--outline-`, `--accent-`, `--shadow-`) |

Visually hidden elements (`.visually-hidden` and the same clip pattern) are skipped by
`overflow`, `safe-area`, `targets` and `contrast`.

WARN rules:
- `truncated`: single-line text cut with `text-overflow: ellipsis`. Fine only where the full text
  is reachable (a detail screen, an expand control, an accessible label); say where.
- `targetsOverlap` / `targetsGap`: hit areas overlap, or small targets sit less than 8px apart.
- `rawColour`: literal colours in app CSS.
- `non-semantic-click`: an element with `cursor: pointer` or an `onclick` that is not a link,
  button, form control, `label` or `summary`, has no `role` or `tabindex`, and is not inside one.
  Make it a `<button>` or `<a>`.
- `focus`: the checker presses Tab through the first `--focus-tabs` controls of the app (default
  16, one run per state).
  WARN when one shows no indicator: no outline, and nothing about it, its `::before` / `::after`
  or its children changes on focus (a box-shadow ring or a state layer counts).
- `noShell`: no device shell on the page.
- `modalInert`: an `aria-modal` sheet or a Vuetify dialog / bottom sheet is open (not in the top
  layer) and focusable elements behind it are not `inert` or `aria-hidden`: the keyboard and a
  screen reader still reach the page. Also a dialog role nested inside another one (a component
  that adds `role="dialog"` inside the library's dialog): one dialog role per sheet.
- `select-chrome`: a control with text (`button`, ARIA control roles, `summary`, navigation links,
  checkbox / radio labels) is text-selectable, so a long-press selects it instead of pressing.
- `select-text`: other text is selectable outside a field or `data-selectable` content. Text is
  unselectable by default; content is copyable only where `DESIGN.md`'s Text selection row says so.
- `textScale`: text does not grow at 200% (px font sizes).
- Text styles: more than 4 content styles plus a hero (bars excluded), or more than 2 weights.

Fix every FAIL. A WARN that stays needs a reason.

## 2. Taste gate (by looking at the screenshots)

- **Fit**: one job, one focal element, one filled primary button visible; states designed.
- **Remove**: could a card, divider, icon, subtitle or badge go, letting space do the work?
- **Hierarchy**: squint. Does one thing still lead? Is accent on at most 2 elements? Is content
  left-aligned? Centre only ceremonial moments: empty state, success, onboarding hero.
- **Native**:
  - Material bars, back behaviour and sheets.
  - The primary action is pinned above the gesture area and the keyboard where the archetype says
    so.
  - Nothing sits under the status bar.
- **Buttons**: one Button component; Material emphasis (one filled per screen); every destructive
  action in the danger tone (text / outlined to start, filled to confirm), its confirm naming what
  is destroyed.
- **Hold and drag**: long-press text, a button, a row and the sheet header; drag the sheet down by
  its header. Nothing selects (`device-shell.md`); the sheet follows and dismisses past the
  threshold (`motion.md`). No scrollbar anywhere, in the frame either.
- **Sheets open**: the page behind is inert (no tab stop, no screen-reader reading it), one dialog
  role, a close button besides the drag.
- **Accessibility**: one `h1`; an `aria-label` contains the visible text (WCAG 2.5.3); radio
  groups share a `name`; loading and new chat replies are announced (`screens/states.md`,
  `screens/chat.md`); state shown in words or icons, not colour alone.
- **Keyboard**: tab through the screen. Every control shows the focus ring and the order follows
  the layout.
- **Motion** (if any): durations from the tokens, interruptible, and the `motion.md` review list
  holds.
- **Content**: realistic data of uneven lengths, verbs on buttons, one number format.
- **Dark mode** (if decided): surfaces step lighter, no shadows, accent contrast rechecked. The
  checker's dark screenshot is in the out folder.
- **Forced colours**: emulate `forced-colors: active` (DevTools, Rendering). Selected tabs, chips
  and navigation items still show a border, outline or underline; cards keep their edge; spinners
  and progress still show (`color-tokens.md`, "Forced colours").

## 3. Report

Report as: archetype → top 3 problems → the fixes made → which routes and sheets the checker
covered (a claim of "no FAIL" names them). Update `design/COMPONENTS.md` and
`design/REFERENCES.md` if the work added to them. Work designed on a canvas: also the `canvas.md`
gate.
