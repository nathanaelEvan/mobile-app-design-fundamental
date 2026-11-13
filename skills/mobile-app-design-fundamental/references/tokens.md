# Tokens: grid, type, safe area, shape, focus

Read in setup and audit only. In develop, the values live in `design/DESIGN.md` and `tokens.css`.
Sizes that hold or follow text are in rem (1rem = 16px at the default text size) so they grow with
the user's text settings, as modern-web-guidance requires. Sizes tied to the finger or the screen
edge (touch targets, the side safe area, icons) are px, so they do not double at 200% text. The px
in this file are the values at the default size.

## 4px grid

Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96 → `--space-1` … `--space-24`.

- Every margin, padding, gap, offset, radius, icon size and control size is on the scale.
- Hairlines are 1px and are the only exception. A thicker border is 2px or 4px, and the element's
  outer size still lands on the grid.
- No optical nudges (an icon 1px lower): fix the line height or the icon's box instead.
- Text sits on the grid too: every Material 3 line height below is a multiple of 4.
- Minimum sizes (always `min-block-size`, never a fixed `height`, on anything with text):

| Thing | Min height | Token |
|---|---|---|
| Touch target (any tappable) | 48 | `--target` |
| Button | 40 visible, 48 touch (extend the hit area) | `--control-min` |
| Chip | 32 visible, 48 touch | — |
| Text field | 56 | `--field-min` |
| List row: one line / two lines / three lines | 56 / 72 / 88 | `--row-1-min` … `--row-3-min` |
| Navigation bar | 80 + bottom inset | — |
| Top app bar | 64 + top inset | — |

Common spacings:
| Use | px |
|---|---|
| Screen side margin (safe area) | 16 |
| Between unrelated sections | 32 |
| Between items inside a group | 8-12 |
| Section header to its content | 8 |
| Inside a card | 16 |
| Between two small touch targets | 8 minimum |
| Icon to its label | 8 |

## Safe area

- Side margin `--safe-left` / `--safe-right`: 16px, or the device inset when larger.
- Top: the status bar (`--app-inset-top`, set by the shell). Never put content under it.
- Bottom: the gesture area (`--app-inset-bottom`). Pinned bars and the navigation bar add it as
  padding. The shell sets both insets in frame and native mode (`device-shell.md`).

## Type scale: Material 3, as Vuetify ships it

Default when the user has no preference. Class names match Vuetify's (`text-<style>`), so a Vuetify
project and a plain project read the same.

| Style | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|
| display-large | 57 / 64 | 400 | -0.25px | Onboarding hero word, a celebration number |
| display-medium | 45 / 52 | 400 | 0 | Rare: a hero number on a stats screen |
| display-small | 36 / 44 | 400 | 0 | The hero metric of a home or stats screen |
| headline-large | 32 / 40 | 400 | 0 | Onboarding and empty-state headline |
| headline-medium | 28 / 36 | 400 | 0 | Large screen title (top of a top-level screen) |
| headline-small | 24 / 32 | 400 | 0 | Sheet and dialog titles, section-defining titles |
| title-large | 22 / 28 | 400 | 0 | Top app bar title |
| title-medium | 16 / 24 | 500 | 0.15px | Card titles |
| title-small | 14 / 20 | 500 | 0.1px | Section headers inside a screen |
| body-large | 16 / 24 | 400 | 0.5px | List row titles, paragraphs: the minimum for reading text |
| body-medium | 14 / 20 | 400 | 0.25px | Row supporting lines, supporting text |
| body-small | 12 / 16 | 400 | 0.4px | Metadata, timestamps, helper text; never a paragraph |
| label-large | 14 / 20 | 500 | 0.1px | Buttons, tabs, chips, trailing values |
| label-medium | 12 / 16 | 500 | 0.5px | Navigation bar labels |
| label-small | 11 / 16 | 500 | 0.5px | Badges only |

Rules:
- Max 4 content styles per screen plus one hero, max 2 weights (400 and 500 in this scale). App bar
  and navigation bar labels are not counted.
- Hierarchy comes from size and space first, colour second, boxes last.
- Changing numbers use `font-variant-numeric: tabular-nums`. A unit is smaller or lighter than its
  number (`7j 8m`, `Rp 12.400`).
- Sentence case everywhere. No all-caps for emphasis (modern-web-guidance agrees).
- Fluid type is rarely needed in a phone-sized app. If it is, use container units inside
  `clamp()` with rem bounds (`clamp(2.25rem, 1.5rem + 4cqi, 3.5rem)`), never `vw`.
- If the user brings their own scale, it replaces this table in `DESIGN.md`. Keep its line heights
  on the 4px grid, and pass its sizes to the checker with `--type-sizes`.

Font: the user's decision. No preference → Roboto (load it; Vuetify does not ship the font file).
One family is enough. Add a second display face only if the user wants personality, and then only
for display and headline styles. Set it via `--v-font-body` and `--v-font-heading` (Vuetify's own
variables).

## Shape

Pick once, never mix. One line, used everywhere:
- **rounded** (default): small 8 (chips, small controls), medium 12 (buttons, fields, menus),
  large 16 (cards, FAB), extra-large 28 (sheet and dialog top corners), full (avatars; buttons only
  if the project picks pill buttons).
- **sharp**: small 4, medium 4, large 8, extra-large 16, full (avatars).

Nested radii are concentric: inner = outer − padding.

## Focus

Every focusable control shows a ring on keyboard focus: 2px `--outline-focus`, 2px offset, at least
3:1 against what is behind it. `tokens.css` sets it on `:focus-visible`. Never remove it (no
`outline: none` without a visible replacement).

## Colour

Four tiers (primitive → brand → semantic → component) and the naming
`{property}-{role}-{rank|prominence}-{layer}-{state}`: read `color-tokens.md`.
- Brand on at most 2 elements per screen.
- Text contrast 4.5:1; large text and icons 3:1.
- Light mode separates with surface layers, not shadows.
- Shadows only on what floats (FAB, sheet, menu), and none in dark mode.
