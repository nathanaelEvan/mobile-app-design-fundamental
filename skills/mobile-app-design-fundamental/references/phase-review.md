# Phase: review

Run before handing work over, or when asked to review or polish. Open `anti-patterns.md` too.

## 1. Run the checker

```sh
node <skill>/scripts/check.mjs http://localhost:5173 [--out .mobile-design-check] [--root "#app"]
```

It needs Node 22+ and Chrome, Edge or Chromium (`CHROME_PATH` if it is elsewhere). It installs
nothing. It renders the URL (or an HTML file) as:
- **native** at 360×800, 412×915 and 430×932 with touch, and again at 200% text size;
- **frame** on desktop at 1440×900 and 1366×768 (the short laptop where squashed phones appear).

It prints PASS / WARN / FAIL per rule and saves screenshots to the out folder:

| Rule | Fails when |
|---|---|
| `grid` | a margin, padding, gap, radius, width/height of a control, or line height is not a multiple of 4px |
| `safe-area` | content starts closer than 16px to the side edge |
| `targets` | a control is under 48×48 (inline text links exempt) or two sit closer than 8px |
| `type` | a font size outside the type scale (`--type-sizes` for a custom scale); WARN above 4 content styles + hero (bar labels excluded) or 2 weights |
| `covered` | text that no scroll position reveals: under the app bar, navigation bar or status bar |
| `fixed` | a fixed bar, sheet or toast attached to the window instead of the app root |
| `tiers` / `rawColour` | a primitive or brand token, or a literal colour, used outside the token file's `:root` blocks |
| `overflow` | horizontal scroll, or text clipped, at any size or at 200% text |
| `viewport-units` | app CSS uses `vw`/`vh`/`dvh`/`svh`/`lvh` or width media queries |
| `hover` | app CSS has `:hover` rules |
| `shell` | native mode shows a frame, frame mode is squashed (ratio off by more than 1%), or the frame is cut off |

Fix every FAIL. A WARN needs a reason if it stays.

## 2. Taste gate (by looking at the screenshots)

**Fit**: one job, one focal element, one filled primary button visible; states designed.
**Remove**: can a card, divider, icon, subtitle or badge go and let space do the work?
**Hierarchy**: squint — does one thing still lead? Accent on at most 2 elements? Left-aligned
content (centre only ceremonial moments: empty state, success, onboarding hero)?
**Native**: Material bars, back behaviour, sheets; the primary action pinned above the gesture
area where the archetype says so; nothing under the status bar.
**Content**: realistic data of uneven lengths, verbs on buttons, one number format.
**Dark mode** (if decided): surfaces step lighter, no shadows, accent contrast rechecked.

## 3. Report

As: archetype → top 3 problems → the fixes made. Update `design/COMPONENTS.md` and
`design/REFERENCES.md` if the work added to them.
