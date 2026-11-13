# Phase: audit (first run in a project that already has UI)

Goal: record what the project already decided, find where it breaks the fundamentals, and leave a
`design/` folder so later runs go straight to develop. **Do not restyle anything in this phase.**

## 1. Extract the decisions the code already made

Read `tokens.md` and `color-tokens.md`, then scan the styles and theme:
- Font families, the font sizes and line heights in use (count them), weights in use.
- Spacing values in use; how many are off the 4px grid.
- Side margin of screens; radius values.
- Colour: raw hex and palette classes in components (count and where), which tier each colour
  would belong to, near-duplicate greys. Propose the four-tier mapping; do not mass-migrate. New
  colour goes into the new tiers, old call sites move one component at a time.
- Chrome style (Material, iOS, custom), navigation pattern, the device the layout assumes.

Fill `design/DESIGN.md` from the template with what you found. Mark each value **draft** and show
the user the table: "This is what the app decides today. Which of these are final?" What they
confirm becomes final; what they want changed goes through the setup step for that decision.

## 2. Build the component inventory

Follow `components.md` to scan components into `design/COMPONENTS.md`, noting duplicates (two
button styles, three card variants) as findings.

## 3. Check it

Run `node <skill>/scripts/check.mjs <url-or-file> --report design/audit.md` (see `phase-review.md`
for flags). If the app has no device shell yet, say so and list it as a finding.

Also look, by reading code, for:
- `vw`, `vh`, `dvh`, `svh` or width media queries inside app code (they read the desktop window
  inside the frame).
- `:hover` styles in app UI.
- Screens without loading, empty or error states.
- A frame that only shrinks one axis (`max-height: 100vh` on a fixed-width phone) — the squashed
  phone bug.

## 4. Report

Write `design/audit.md`: the decisions table, then findings ranked by impact (broken on a real
phone > accessibility > grid and scale drift > polish), each with file:line and the fix. Tell the
user the top five in chat and ask whether to fix them now. Later runs read `DESIGN.md`, not this
report.
