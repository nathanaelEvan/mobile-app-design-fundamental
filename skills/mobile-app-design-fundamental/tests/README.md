# Checker regression suite

Tests for `scripts/check.mjs`. Node's built-in test runner, no installs. Needs Node 22+ and Chrome,
Edge or Chromium (the same discovery as the checker, `CHROME_PATH` included); without them every
test is skipped with the reason.

```sh
cd skills/mobile-app-design-fundamental && node --test
# or, from anywhere
node --test skills/mobile-app-design-fundamental/tests/check.test.mjs
# the token checker alone (no browser, under a second)
node --test skills/mobile-app-design-fundamental/tests/check-tokens.test.mjs
```

Four checker runs start in parallel (one headless Chrome each); the suite takes about 15–20 s.
Screenshots and `--report` files go to a temp folder that is removed afterwards. The checker is
spawned with the skill folder as its cwd, so it serves that folder and the fixtures reach
`../../assets/tokens.css` and `../../assets/shell/`.

The tests read the checker's printed output: one `PASS|WARN|FAIL|SKIP  <rule label>` line per rule,
then its detail lines. They match on the rule labels (the `RULES` table in `check.mjs`) and on the
class names in the fixtures. Renaming a label means updating `LABEL` in `check.test.mjs`.

## What runs

| Run | Expects |
|---|---|
| `assets/shell/demo.html` | exit 0, every rule PASS; the `--report` file equals the printed output |
| `demo.html --click "#open-filter"` | exit 0, every rule PASS, the click states ran (native and frame) |
| `fixtures/bad.html --click "#open-pop"` | exit 1, each violation below reported at its level |
| `fixtures/no-shell.html` | exit 1, the no-kit rules |

## `fixtures/bad.html`

A shelled page where every rule-breaking element has a `.bad-*` class (or `#bad-pop`) and every
near miss an `.ok-*` class.

| Rule | Violation |
|---|---|
| grid | `.bad-grid` padding 5px |
| targets | `.bad-small-a` / `-b` buttons 32×32 |
| targetsGap (WARN) | the same two, 4px apart |
| targetsOverlap (WARN) | `.bad-overlap-b` slides 16px under `.bad-overlap-a` |
| hover | `.bad-hover:hover` |
| viewport-units | `.bad-vh` 100vh, `.bad-vi` 50vi, `@media (600px < width)` |
| tiers | `.bad-primitive` uses `var(--p-neutral-500)`; `:root --bad-card-ink: var(--p-neutral-900)` |
| rawColour (WARN) | `.bad-raw` border-color `#ff00aa` |
| contrast | `.bad-contrast`: canvas-coloured text on the canvas (1:1), light and dark |
| input-zoom | `input.bad-input` at 14px |
| non-semantic-click (WARN) | `div.bad-click` with `cursor: pointer` |
| focus (WARN) | `.bad-focus:focus-visible { outline: none }`, the first control tabbed to |
| fixed (top layer) | `#bad-pop` popover with its own insets pinned to the window corner; opened by `--click "#open-pop"`, escapes the phone at 1366×768 |
| type | `.bad-type` at 15px |
| overflow | `.bad-clip` clips its text (in the fixed `.tray`) |
| safe-area | `.bad-edge` flush with the left edge (in the fixed `.tray`) |
| covered | `.bad-under` under the app bar (native) and the status bar (frame) |

Near misses that must stay quiet: `50cqi` / `100cqb`, an `@container` query, an `:active` rule, a
16px `textarea`, a checkbox, a `div` with `role="button" tabindex="0"`, an inline text link. The
shell, no-shell and text-scale rules must PASS.

`.bad-edge-scroller` and `.bad-clip-scroller` are the same violations inside the vertical
scroller (`main.screen`, `overflow-y: auto`). They guard a fixed bug: the browser computes
`overflow-x: auto` for any element whose `overflow-y` is not `visible`, so `inHScroller()` once
skipped everything inside a scrolling screen. It now counts only ancestors that really scroll
sideways.

## `fixtures/no-shell.html`

No device shell: a hand-made 412px phone with `max-block-size: 100vh` and text in px.

| Rule | Expected |
|---|---|
| noShell (WARN) | no `[data-device-shell]` |
| shell | the root changes ratio between 1440×900 and 1366×768 (squash) |
| viewport-units | `#app { max-block-size: 100vh }` |
| textScale (WARN) | the median text stays 16px at 200% text |
