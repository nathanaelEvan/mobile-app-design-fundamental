# Tokens: grid, type, safe area, shape, colour roles

Read in setup and audit only. In develop, the values live in `design/DESIGN.md`.
All sizes are written in rem (1rem = 16px at the default text size) so they follow the user's text
settings, as modern-web-guidance requires. The px in this file are the values at default size.

## 4px grid

Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96 → `--space-1` … (see `assets/tokens.css`).

- Every margin, padding, gap, offset, radius, icon size, control height and width is on the scale.
- Hairlines are 1px and are the only exception. A thicker border is 2px or 4px, and the element's
  outer size still lands on the grid.
- Optical nudges (an icon 1px lower) are not allowed; fix the line height or the icon's box instead.
- Text sits on the grid too: every Material 3 line height below is a multiple of 4.
- Controls: heights 32 (chip, dense), 40 (button), 48 (list row min, input, touch target), 56
  (one-line list row with avatar, text field filled), 64, 72 (two/three-line rows). Use
  `min-block-size`, never a fixed `height`, on anything with text (modern-web-guidance).

Common spacings:
| Use | px |
|---|---|
| Screen side margin (safe area) | 16 |
| Between unrelated sections | 32 |
| Between items inside a group | 8-12 |
| Section header to its content | 8 |
| Inside a card | 16 |
| Between two touch targets | 8 minimum |
| Icon to its label | 8 |

## Safe area

- Side margin `--safe-x: max(1rem, env(safe-area-inset-left/right))`.
- Top: the status bar height from the shell (`--app-inset-top`) — never put content under it.
- Bottom: the gesture area (`--app-inset-bottom`); pinned bars and the navigation bar add it as
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
| title-medium | 16 / 24 | 500 | 0.15px | List row and card titles |
| title-small | 14 / 20 | 500 | 0.1px | Section headers inside a screen |
| body-large | 16 / 24 | 400 | 0.5px | Paragraphs, primary row text: the minimum for reading text |
| body-medium | 14 / 20 | 400 | 0.25px | Secondary row lines, supporting text |
| body-small | 12 / 16 | 400 | 0.4px | Metadata, timestamps, helper text — never a paragraph |
| label-large | 14 / 20 | 500 | 0.1px | Buttons, tabs, text fields' labels |
| label-medium | 12 / 16 | 500 | 0.5px | Chips, navigation bar labels |
| label-small | 11 / 16 | 500 | 0.5px | Badges only |

Rules:
- Max 4 styles per screen plus one hero; max 2 weights (400 and 500 in this scale).
- Hierarchy from size and space first, colour second, boxes last.
- Changing numbers use `font-variant-numeric: tabular-nums`. A unit is smaller or lighter than its
  number (`7j 8m`, `Rp 12.400`).
- Sentence case everywhere. No all-caps for emphasis (modern-web-guidance agrees).
- If the user brings their own scale, it replaces this table in `DESIGN.md`; keep line heights on
  the 4px grid when you translate it.

Font: the user's decision. No preference → Roboto. One family is enough; a second display face only
if the user wants personality, and then only for display and headline styles. Set via
`--v-font-body` and `--v-font-heading` (Vuetify's own variables).

## Shape

Pick once, never mix: rounded (default: 8 small, 12 controls, 16 cards, 28 sheet top corners, full
for chips and FAB) or sharp (4 / 4 / 8 / 16). Nested radii are concentric: inner = outer − padding.

## Colour

Four tiers (primitive → brand → semantic → component) and the naming
`{property}-{role}-{rank|prominence}-{layer}-{state}`: read `color-tokens.md`.
Brand on at most 2 elements per screen. Text contrast 4.5:1, large text and icons 3:1.
Light mode separates with surface layers, not shadows. Shadows only on what floats (FAB, sheet,
menu), none in dark mode.
