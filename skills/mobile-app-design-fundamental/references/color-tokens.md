# Colour tokens: primitive → brand → semantic → component

Read at setup, at audit, and when a new component needs its colours decided. In develop, use the
names already in `design/DESIGN.md` and `tokens.css`; do not reopen this file to colour a screen.

**Never a hex, `rgb()`, `hsl()`, `oklch()` or a palette class (`bg-blue-500`) in a component.**

## The four tiers

| Tier | Holds | A component may use it? |
|---|---|---|
| Primitive | Every literal colour: neutral ramp, hue ramps (`--p-blue-500`) | **No** |
| Brand | The brand seed and its generated tonal ramp (`--brand-50 … --brand-950`) | **No** |
| Semantic | Every real decision, per mode (light and dark) | Yes |
| Component | `--chip-bg`, `--nav-bar-indicator`… mapped from semantic | Yes, prefer these |

Direction is one way: Component → Semantic → Brand → Primitive. Never skip a tier. In plain CSS
the primitives are still reachable, so the checker enforces it: `var(--p-*)` or `var(--brand-*)`
in an app rule, or in any token that is not a semantic one (`--bg-*`, `--on-*`, `--icon-*`,
`--outline-*`), is a FAIL. `--shadow-*` is built from semantic tokens, so it never names a
primitive either.

## Reading a semantic name

`{property}-{role}-{rank|prominence}-{layer}-{state}`

| Prefix | Paints |
|---|---|
| `bg-` | a fill |
| `on-` | text on that fill |
| `icon-` | an icon on that fill |
| `outline-` | a stroke |

Closed word lists. Roles never share a word with ranks or prominences, which is what stops
`on-primary-primary` collisions:

- **Role**: `surface` `neutral` `action` `brand` `error` `warning` `success` `info`
- **Rank** (text, icons): `default` `muted` `subtle`, always suffixed, always all three
- **Prominence** (fills): `subtle` `default` `bold`

Rank and prominence share `default` and `subtle`, so the position decides the meaning:
- `on-surface-<rank>`: text on surfaces (`on-surface-muted`).
- `on-<role>-<prominence>`: text on that role's fill. `on-brand-default` is text on the default
  brand fill.
- `on-<role>-<prominence>-<rank>`: a rank on that fill. `on-brand-subtle-default` is default text
  on the subtle brand fill.
- **Reserved single words** that sit outside the grammar: `bg-canvas`, `bg-selected`,
  `bg-disabled`, `bg-overlay`, `on-disabled`, `outline-focus`.
- **Icons on a fill** use `icon-on-<role>`. Icons that act use `icon-action-on-surface`.
- **Layer**: `01` `02` `03`, hard cap at three
- **State**: `pressed` `selected` `focus` `disabled` (mobile has no `hover`)
- **Categorical accent** (optional): `accent-<hue>` for values that are only *different*, never
  better or worse (two categories, a tag colour). Chips, pills, tints only; never a button. A real
  meaning (error, success) always takes its role, not an accent.

Rules that are easy to get wrong:
- **`primary` is never a role.** The brand colour is `brand`. (Material and Vuetify call it
  `primary`; map it, see below.)
- **A layer number appears only when the value is computed from the layer**:
  `bg-surface-01-pressed` has one, `on-surface-default` does not (same on every layer).
- **Numbers mean position, not lightness.** `surface-01` is one level in, in both modes.
- **`on-surface-error` ≠ `on-error-default`**: red text on a card vs white text on a red fill.
- **Only interactive things get states.** A static card has no `-pressed`.

## Minimum semantic set for a mobile app

```
bg-canvas  bg-surface-01  bg-surface-02  bg-surface-03  bg-surface-01-pressed
bg-brand-subtle  bg-brand-default  bg-brand-bold  bg-brand-default-pressed
bg-neutral-subtle  bg-neutral-default  bg-selected  bg-disabled  bg-overlay
bg-error-subtle  bg-error-default  bg-warning-subtle  bg-warning-default
bg-success-subtle  bg-success-default  bg-info-subtle  bg-info-default
on-surface-default  on-surface-muted  on-surface-subtle  on-surface-error
on-brand-default  on-brand-subtle-default  on-error-default  on-warning-default
on-success-default  on-info-default  on-error-subtle-default  on-warning-subtle-default
on-success-subtle-default  on-info-subtle-default  on-disabled
icon-surface-default  icon-surface-muted  icon-action-on-surface  icon-on-brand
outline-surface-01  outline-neutral  outline-control  outline-focus  outline-error
```

`shadow-float` (composed from `shadow-float-color`) sits beside the set: the one elevation, for
what floats (FAB, sheet, menu). Its colour is transparent in dark mode, so it is safe to leave on.

**Two strokes, two jobs.**
- `outline-control` is the boundary of something you operate: text field, checkbox, radio, switch
  track, outlined button, filter chip. It is the only thing that shows where the control is, so it
  holds 3:1 against canvas, surface-01 and surface-02 in both modes (WCAG 1.4.11).
- `outline-neutral` is decorative: dividers, card edges, the sheet handle. Nothing is lost if it
  is missed, so it stays quiet (below 3:1 by design). Never put it on a control.
- `outline-surface-01` is the hairline between rows on surface-01.

**Text ranks and layers.** `on-surface-subtle` clears 4.5:1 on canvas, surface-01 and surface-02.
On surface-03 use `on-surface-muted`. `on-disabled` is below 4.5:1 on purpose (WCAG exempts
disabled controls); never use it for text that is merely secondary.

Each semantic token is `light-dark(<light>, <dark>)` in one block. `color-scheme` on `:root` picks
the value: it follows the system, and `data-theme="light|dark"` on `<html>` forces a mode. This is
modern-web-guidance's dark-mode pattern, with the raw values kept in the primitive tier.

Add a token only for a real decision the set does not cover. Give it both modes at once and check
its contrast pair: text 4.5:1, large text and icons 3:1.

## A new component: colours first

1. Can existing semantic tokens cover it? Then use them; not every component needs its own.
2. Otherwise write its contract in the component block of `tokens.css` (and its entry in
   `design/COMPONENTS.md`), mapping each part to a semantic token only:
   ```css
   --chip-bg: var(--bg-neutral-subtle);
   --chip-on: var(--on-surface-default);
   --chip-outline: var(--outline-control);
   --chip-bg-pressed: var(--bg-neutral-subtle-pressed);
   --chip-bg-selected: var(--bg-brand-subtle);
   --chip-on-selected: var(--on-brand-subtle-default);
   ```
3. Build the component against `--chip-*` only. Check both modes.

Two components mapping to the same semantic tokens next to each other is a sign they are one
component: merge them in the inventory.

## Vuetify projects

Vuetify parses theme colours in JavaScript, so they must be literal hex values; `var(--…)` does
not work there.

1. Keep the resolved values in one source per mode, for example `design/tokens.json` with
   `{ light: {…}, dark: {…} }` holding semantic name → hex.
2. Generate both `tokens.css` and the Vuetify theme from that source.
3. Fill the theme like this:

```js
createVuetify({ theme: { defaultTheme: 'system', themes: {
  light: { dark: false, colors: {
    background: '<bg-canvas>', surface: '<bg-surface-01>', 'surface-variant': '<bg-surface-02>',
    'on-background': '<on-surface-default>', 'on-surface': '<on-surface-default>',
    'on-surface-variant': '<on-surface-muted>',
    primary: '<bg-brand-default>', 'on-primary': '<on-brand-default>',
    secondary: '<bg-neutral-default>', error: '<bg-error-default>', 'on-error': '<on-error-default>',
    success: '<bg-success-default>', warning: '<bg-warning-default>', info: '<bg-info-default>' } },
  dark: { dark: true, colors: { /* the same keys from the dark values */ } } } } })
```

Project components use the semantic and component names, never `rgb(var(--v-theme-primary))`.
Vuetify's own components follow its theme.

## Picking the palette

The user's decision. With none: one brand seed (from references or the logo) → a tonal ramp →
neutrals tinted a few degrees toward the brand hue. Ink-on-neutral first; brand on at most two
elements per screen. Avoid the generated-app defaults (Material purple `#6750A4`, Tailwind indigo,
a purple-to-blue gradient).

The palette in `assets/tokens.css` is a starter that passes. A palette the user brings replaces
the primitives; then re-pick the shade behind each semantic token and run
`scripts/check-tokens.mjs`, which checks every text, icon and control-stroke pair in light and
dark (see `phase-setup.md`).
