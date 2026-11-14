# Components: the inventory rule

`design/COMPONENTS.md` is the list every agent checks before it uses or makes a component.
One button style, one card style, one list row: a second version of something that exists is a bug.

## Check order (every time)

1. **The project inventory** (`design/COMPONENTS.md`). Use the entry. Need a variation? Add a prop
   or variant to that component and update its entry; do not fork it.
2. **The UI library in use** (Vuetify: `v-btn`, `v-list-item`, `v-card`, `v-text-field`,
   `v-bottom-sheet`, `v-navigation-drawer`, `v-app-bar`, `v-bottom-navigation`, `v-chip`,
   `v-snackbar`, `v-skeleton-loader`...). Wrap it once with the project's tokens, register the
   wrapper in the inventory, use the wrapper from then on.
3. **New component**, only when 1 and 2 cannot express it (a hero metric, a plan card). Build it
   from tokens, write one line on why, and register it **in the same change**.

## Creating the inventory (setup and audit)

Scan the component folders (`src/components`, `components`, `ui`, `lib`), the library imports, and
repeated markup in screens (three screens with the same hand-written row = an unregistered
component). For each, write an entry. Note duplicates as findings, not fixes.

## Entry format

```md
### ListRow
- File: src/components/ListRow.vue (wraps v-list-item)
- Use for: one item in a list or settings group; 1-3 lines
- Not for: actions that need a button → use Button/Tonal
- Variants: leading (icon | avatar | none), trailing (chevron | switch | value), lines (1 | 2 | 3)
- Sizes: min height 56 (1 line) / 72 (2 lines) / 88 (3 lines); side padding 16
- States: default, pressed, disabled, selected
- Colour tokens: --bg-surface-01, --on-surface-default / -muted, --bg-surface-01-pressed, --bg-selected
- Added: 2026-11-14, reason: no inventory entry, v-list-item needed the project's paddings
```

Keep entries short; the file is read often. Order: actions, inputs, containers, lists, navigation,
feedback, data display, custom.

## Baseline set a mobile app usually needs

Button (filled, tonal, text, icon), FAB, top app bar, navigation bar, tabs, list row, section
header, card (object), chip, text field, switch row, segmented button, bottom sheet, dialog,
snackbar, skeleton, empty state, progress (linear, circular), avatar, badge, hero metric, pinned
bottom action bar. Register them as they appear; do not build ones the app does not need.

## Navigation bar: where it shows

- Only on top-level destinations (home, lists, stats, profile...), 3-5 of them, one per tab.
- Hidden on everything pushed on top: detail screens, forms, payment / checkout, auth and
  onboarding, full-screen flows. Those get a top app bar with back (or close), and their pinned
  action bar takes the bottom.
- Switching tabs keeps each tab's place; back on a pushed screen returns to the tab it came from.

## Touch targets and hit areas

Every tappable thing is 48×48 to touch (`--target`) and is a real `<button>` or `<a href>`, not a
`div` with a click handler: that is what gives it keyboard focus, `:focus-visible` and a role.
A control drawn smaller (a 40px button, a 32px chip) extends its hit area with an absolutely
positioned pseudo-element with **negative insets**. The checker measures that box as the browser
lays it out (not a centred box made with `top: 50%` + `translate`), and it does not count when:
- it has `pointer-events: none` (taps pass through it);
- a `width` / `height` of 100% fights the insets: the box moves instead of growing;
- the control, or an ancestor it sits in, has `overflow` other than `visible` and cuts it off;
- the insets start inside the control's border: a 1px border needs 1px more.

```css
.chip { position: relative; border: 1px solid var(--chip-outline); }
.chip::after { content: ""; position: absolute; inset: calc(-0.5rem - 1px) 0; } /* 32 drawn, 48 to touch */
```

A row of chips that scrolls sideways clips vertically too: give it 8px of block padding so the hit
area is not cut.
