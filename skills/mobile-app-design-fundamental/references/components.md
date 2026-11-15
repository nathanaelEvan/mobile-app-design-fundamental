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

## Buttons: emphasis × tone

One Button component with two props: **emphasis** (Material 3) and **tone** (semantic). Never a
second button component for a colour, never a colour class on a button.

**One label style for every button** (Material label-large: 14px / 20px, the project's button
weight), whether it renders as `<button>` or as a link styled as a button. Element resets must not
fight the type classes: `button { font: inherit }` is unlayered and beats utility classes in cascade
layers (Vuetify 4), so a `<button class="text-label-large">` renders at the body size next to a
correct `<a>`. Reset only `font-family` and `color` on `button`, or only buttons without a type
class. The checker FAILs `buttonType` when buttons in one group render different label styles.

| Emphasis | Use for |
|---|---|
| filled | The one primary action of the screen or sheet |
| tonal | A secondary action that still matters, or the main action of a quiet screen |
| outlined | A secondary action of equal weight beside another (Batal next to Simpan) |
| text | Low emphasis: dialog actions, "Lihat semua", inline actions |
| elevated | Only on an image or busy background (Material); rare |

| Tone | Tokens | Use for |
|---|---|---|
| brand (default) | `--button-bg`, `--button-on`, `--button-bg-tonal`, `--button-on-tonal` | Everything not below |
| neutral | `--bg-neutral-subtle`, `--on-surface-default` | Utility actions that must not compete with the primary |
| danger | `--button-bg-danger` / `--button-on-danger` (filled), `--button-bg-danger-tonal` / `--button-on-danger-tonal`, `--button-on-danger-text` + `--button-outline-danger` (outlined, text) | Destructive actions |

Component tokens map to the semantic tier only (`--button-bg-danger: var(--bg-error-default)`,
`--button-on-danger: var(--on-error-default)`), per the four-tier rule; `assets/tokens.css` has the
block.

**Destructive actions** (delete, remove, reset, clear data, leave a group, sign out where it drops
local data) always take the **danger** tone, never brand:
- the entry point is **text or outlined** danger (a "Hapus akun" row or button), not filled;
- the final confirm (dialog or sheet) is **filled** danger, beside "Batal" as a **text** button
  (neutral or brand; never tonal or filled, which compete with the confirm);
- the confirm names what is destroyed and the button repeats verb + object: "Hapus 3 catatan?" /
  "Hapus catatan", never "Yakin?" / "OK" (`copy.md`);
- where it can be undone, act at once with an Undo snackbar instead of a confirm (removing a row or
  a step while editing: always this).

Register Button with its emphasis and tone variants in `COMPONENTS.md`.

## Navigation bar: where it shows

- Only on top-level destinations (home, lists, stats, profile...), 3-5 of them, one per tab.
- Hidden on everything pushed on top: detail screens, forms, payment / checkout, auth and
  onboarding, full-screen flows. Those get a top app bar with back (or close), and their pinned
  action bar takes the bottom.
- Switching tabs keeps each tab's place; back on a pushed screen returns to the tab it came from.

## Back and up: the top app bar's back button

- **Back is history back.** It returns to the screen the user came from, whatever that was: a
  chapter opened from a Home shortcut goes back to Home, not to the Books tab. A hard-coded parent
  route ("back = /books") is only the **fallback** when there is no previous screen in the app
  (opened from a link, a notification, or after a reload).
- **A fixed destination only when it is intentional**: closing a finished flow (scan → confirm →
  result, back goes Home, not into the confirm form again). Then it returns through history to
  where that screen already is (`history.go(-n)`) or replaces the current entry. Never a push.
- **Never two copies of a screen in a row.** A link or button to exactly the previous screen
  ("Retake photo" → scan, "Back to chapter") steps back instead of pushing. A pushed copy makes
  the parent's own back / close land on the child again: a loop the user cannot leave.
- Review: walk every flow forward, then press back / close until you reach a tab, and once from a
  deep link. Each press lands on the screen before; no screen comes back; the browser / system back
  agrees with the app's back.

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

An icon button made from a native `<button>` sets `padding: 0` and `flex-shrink: 0`. An icon-only
control's `aria-label` contains any text it shows ("Aa" → "Aa, ukuran teks"; WCAG 2.5.3).

A row of chips that scrolls sideways clips vertically too: give it 8px of block padding so the hit
area is not cut. It shows no scrollbar (the shell hides them): the last chip cut off at the edge,
or a fade, says it scrolls.

## Text selection

Off by default, fields and opt-in `data-selectable` content only: `device-shell.md`, rule 9. A
component never sets `user-select: text` itself.

## Illustration and mascot

- A mascot as an **avatar** (chat, a header) is its head or face, cropped to fill the circle; a
  full body shrunk into a ring does not read as an avatar. The full body is an illustration, for
  empty states, onboarding and reward moments.
- Literal colours are allowed only inside illustration asset files (SVG or image); everything
  around them uses tokens. In inline SVG use `currentColor` for parts that follow the theme.
- Illustrations and textures never sit under text; text stays on a solid surface (`anti-patterns.md`,
  "Tone").
- Register the mascot and each illustration set in `COMPONENTS.md`, with the moods it has.
