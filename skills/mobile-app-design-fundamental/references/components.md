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
- Added: 2026-11-14, reason: no inventory entry, v-list-item needed the project's paddings
```

Keep entries short; the file is read often. Order: actions, inputs, containers, lists, navigation,
feedback, data display, custom.

## Baseline set a mobile app usually needs

Button (filled, tonal, text, icon), FAB, top app bar, navigation bar, tabs, list row, section
header, card (object), chip, text field, switch row, segmented button, bottom sheet, dialog,
snackbar, skeleton, empty state, progress (linear, circular), avatar, badge, hero metric, pinned
bottom action bar. Register them as they appear; do not build ones the app does not need.
