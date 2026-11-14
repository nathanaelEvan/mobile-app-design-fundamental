# Phase: review

Run this before handing work over, or when asked to review or polish. Open `anti-patterns.md` too.

## 1. Run the checker

```sh
node <skill>/scripts/check.mjs http://localhost:5173 [--root "#app"] [--states "?screen=home,#/settings"] \
  [--out .mobile-design-check] [--report design/check.md] [--type-sizes …] [--ignore-css <regex>] \
  [--click "#open-filter;.menu-btn"] [--only native|frame] [--focus-tabs 16]
```

- `--states` audits more than the landing screen. Each entry is appended to the URL (a query or a
  `#/route`). List the screens you touched. A file target may carry a query
  (`index.html?screen=x`).
- `--only native` or `--only frame` runs one mode's scenarios (faster while iterating; run both
  before handing over). `--focus-tabs` is how many controls the focus-ring rule tabs through per
  screen (default 16).
- `--ignore-css` skips third-party stylesheets for the CSS rules. The default skips
  `node_modules`, Vuetify, `@mdi` and Google Fonts.
- `--click` audits UI that opens on a press: sheets, dialogs, menus. Selectors are separated by
  `;` (a selector may contain commas). For every state, each selector is pressed once on a fresh
  load (a tap on phones, a mouse click in frame mode, `element.click()` if it is covered), the UI
  settles (DOM quiet, animations finished) and the screen is audited again as an extra state named
  like `native-412+click(#open-filter)`, on the phones, in dark mode and on the short laptop. This
  is how the `fixed` top-layer check, targets and contrast see an open sheet. A selector that
  matches nothing stops the run. While a modal is open, the page behind it is inert and skipped by
  the target and contrast rules.

Run it against the dev server (e.g. `vite dev`). There every stylesheet carries its source
(`data-vite-dev-id`), so `--ignore-css` can tell third-party CSS from app CSS. A production bundle
merges Vuetify or Tailwind into the app CSS, and the stylesheet rules (`viewport-units`, `hover`,
`tiers`, `rawColour`) then report vendor rules as well.

It needs Node 22+ and Chrome, Edge or Chromium (set `CHROME_PATH` if it is elsewhere). It installs
nothing. It renders the URL (or an HTML file) as:
- **native** at 360×800, 412×915 and 430×932 with touch, at 200% text, in dark mode with reduced
  motion (every state), and on a tablet (834×1194, first state only);
- **frame** on desktop at 1440×900 and 1366×768, the short laptop where squashed phones appear.

It prints PASS, WARN or FAIL per rule and saves screenshots to the out folder. FAIL rules:

| Rule | FAIL when |
|---|---|
| `shell` | Native mode shows a frame, frame mode is squashed (ratio off by more than 1%), or the frame is cut off. Without the kit: the app root changes ratio between 1440×900 and 1366×768, or is cut off |
| `overflow` | Horizontal scroll, or clipped text, at any size including 200% text |
| `fixed` | A fixed bar, sheet or toast is attached to the window instead of the app root, or top-layer UI escapes the phone |
| `covered` | Text that no scroll position reveals: under the app bar, navigation bar or status bar |
| `safe-area` | Content starts closer than 16px to the side edge (navigation bar labels exempt) |
| `targets` | A control is under 48×48, counting a pseudo-element hit area (inline text links exempt) |
| `contrast` | Text under 4.5:1, or under 3:1 for large text, in light and dark (dark runs for every state) |
| `input-zoom` | A text field (`input` other than checkbox, radio, range, colour, file, button types; `select`, `textarea`, `[contenteditable]`) is under 16px: iOS Safari zooms the page in on focus |
| `grid` | A margin, padding, gap, radius, control height or line height is not a multiple of 4px |
| `type` | A font size outside the type scale (`--type-sizes` for a custom scale) |
| `viewport-units` | App CSS uses viewport units (`vw`, `vh`, `vi`, `vb`, `vmin`, `vmax` and their `d`/`s`/`l` forms; container units such as `cqi` are fine) or width / height media queries, range syntax included (`600px < width`) |
| `hover` | App CSS has `:hover` rules, nested ones included |
| `tiers` | A primitive or brand token is used outside the semantic tier (`--bg-`, `--on-`, `--icon-`, `--outline-`, `--accent-`, `--shadow-`) |

WARN rules:
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
- **Keyboard**: tab through the screen. Every control shows the focus ring and the order follows
  the layout.
- **Motion** (if any): durations from the tokens, interruptible, and the `motion.md` review list
  holds.
- **Content**: realistic data of uneven lengths, verbs on buttons, one number format.
- **Dark mode** (if decided): surfaces step lighter, no shadows, accent contrast rechecked. The
  checker's dark screenshot is in the out folder.

## 3. Report

Report as: archetype → top 3 problems → the fixes made. Update `design/COMPONENTS.md` and
`design/REFERENCES.md` if the work added to them.
