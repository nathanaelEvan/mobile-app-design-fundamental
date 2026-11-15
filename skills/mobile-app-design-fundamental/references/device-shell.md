# Device shell: phone frame on desktop, native on a phone

The kit is `<skill>/assets/shell/` (`device-shell.css`, `device-shell.js`, `demo.html`). It is plain
CSS and JS, works with any stack, and is meant to ship to production.

## What it does

| Where it opens | Mode | Result |
|---|---|---|
| Phone (`pointer: coarse` and `hover: none`), installed PWA, or a window 480px wide or less | `native` | No frame. The app fills the screen (`100dvh`) and uses the device's safe areas |
| Tablet (touch only, wider than 600px) | `native` | No frame. The app stays phone-sized: it is centred, at most `30rem` wide, on the desk colour |
| Desktop with a mouse, touchscreen laptops included | `frame` | A simple phone (bezel, status bar with clock/signal/wifi/battery, gesture handle) centred on a plain desk |
| `?frame=on` / `?frame=off` | forced | For screenshots and testing |

In frame mode:
- **Ratio is kept.** The whole phone is scaled by one factor,
  `min(1, available height ÷ phone height, available width ÷ phone width)`. On a short laptop it
  gets smaller, never squashed or shortened. Never cap only one axis: `max-height: 100vh` on a
  fixed-width phone is the squashed-phone bug.
- **Mouse acts like a finger**, as in the browser's device emulation:
  - a grey dot cursor, darker while pressed;
  - drag to scroll, locked to the axis you drag along, with a little momentum;
  - a drag never fires a click, and no text is selected while dragging (fields stay selectable);
  - the wheel still scrolls.
- The status bar is drawn over the app. The app pads for it with `--app-inset-top`, exactly as it
  pads for a real status bar on a phone. Same for `--app-inset-bottom` and the gesture area.

In both modes:
- **No scrollbars.** `device-shell.css` sets `scrollbar-width: none` on the app root and everything
  in it (a `::-webkit-scrollbar { display: none }` fallback where `scrollbar-width` is missing). A
  desktop scrollbar inside the phone is the giveaway that it is a web page. Scrolling still works
  by touch, wheel, keyboard and the frame's mouse-drag.
- **Chrome is not text.** Buttons, tabs, options, switches, choice labels and navigation get
  `user-select: none` and `-webkit-touch-callout: none`, so a long-press presses instead of
  selecting. Content text stays selectable.

## Wiring it

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
  <meta name="color-scheme" content="light dark">
  <meta name="text-scale" content="scale">
  <meta name="theme-color" content="#f6f7f7" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111313" media="(prefers-color-scheme: dark)">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/device-shell/device-shell.css">
  <script src="/device-shell/device-shell.js"></script> <!-- no defer: sets the mode before paint -->
</head>
<body>
  <div class="dsh" data-device-shell data-width="412" data-height="915">
    <div class="dsh-screen">
      <div id="app" data-app-root></div>   <!-- the framework mounts here -->
    </div>
  </div>
</body>
```

What the metas do:
- `interactive-widget=resizes-content`: Android Chrome shrinks the layout for the keyboard, so pinned
  actions stay above it. For iOS and the VirtualKeyboard API, see modern-web-guidance.
- `color-scheme` and `text-scale`: required by modern-web-guidance (`dark-mode`,
  `respect-os-text-scale`).

Other settings:
- The device size comes from `DESIGN.md` and goes in `data-width` / `data-height` (Material default
  412×915).
- For a dark screen under a light theme, set the status bar tone with
  `DeviceShell.setStatusBar('light')`. `'auto'` follows the colour scheme: the system, a
  `<meta name="color-scheme">` toggle (modern-web-guidance `dark-mode-toggle`) or `data-theme`
  on `<html>` (`color-tokens.md`).
- `window` receives `deviceshell:change` ({ mode, scale }) when the mode or the scale changes.

## Vuetify

- Put the kit in `public/device-shell/` and the markup in `index.html`, and mount the app on `#app`
  as usual.
- `v-app` fills the viewport by default: `.v-application__wrap` has `min-height: 100dvh`. Make it
  fill the app root instead: `.v-application__wrap { min-block-size: 100%; }`.
- Vuetify teleports overlays (dialogs, sheets, menus, snackbars, tooltips) to `body`, wherever they
  sit in the markup. Attach them to the app root globally:
  ```js
  createVuetify({ defaults: {
    VDialog: { attach: '#app' }, VBottomSheet: { attach: '#app' }, VMenu: { attach: '#app' },
    VSnackbar: { attach: '#app' }, VTooltip: { attach: '#app' },
    VBtn: { height: 40 },               // plus a 48px hit area (see below)
    VBottomNavigation: { height: 80 },  // Material 3 navigation bar
  } })
  ```
- Vuetify's defaults are under 48px: `v-btn` is 36 and `v-chip` is 32. Either set the heights in
  `defaults` or extend the hit area. Use `::before`, never `::after`: Vuetify 3 and 4 draw the
  button's focus ring with `.v-btn::after` (`pointer-events: none`, `height: 100%`), so a hit area
  there takes no taps and only shifts. Vuetify 4 also sets `overflow: hidden` on `.v-btn`, which
  clips any pseudo-element; its ripple and overlay clip themselves, so `visible` is safe. In a
  wrapper class (checked on Vuetify 3.13 and 4.3):
  ```css
  .app-btn.v-btn { overflow: visible; }
  .app-btn.v-btn::before { content: ""; position: absolute; inset: -4px 0; } /* 40 visible, 48 to touch */
  ```
  The checker measures the pseudo-element's real box (`components.md`, "Touch targets and hit
  areas").

## Other stacks

Any library that portals overlays to `body` puts them outside the phone. Point its container at the
app root; the checker reports anything that still escapes as "fixed to the window".
- **Radix / shadcn/ui:** pass the root to every `Portal`:
  `<DialogPrimitive.Portal container={document.getElementById('app')}>`. shadcn/ui renders the
  portal inside its own files (`components/ui/dialog.tsx`, `sheet`, `drawer`, `popover`,
  `dropdown-menu`, `select`, `tooltip`), so set it there once.
- **MUI:** `container` on `Dialog`, `Drawer`, `Popover`, `Menu`; or once in the theme's component
  `defaultProps`.
- **React portals of your own:** `createPortal(node, document.getElementById('app'))`.
- **Tailwind:** `sm:` / `md:` / `lg:` are width media queries, and `h-screen`, `min-h-screen`,
  `w-screen`, `h-dvh` are viewport units: none of them belongs in app code. Use `h-full` /
  `min-h-full`, and container variants against the root: `@container/app` on the root, `@sm/app:`
  on its children (built into v4; v3 needs `@tailwindcss/container-queries`). Press is `active:`,
  never `hover:`.

## Rules for app code (because the frame exists)

1. **No viewport units or width media queries inside the app.** In frame mode, `100vh`, `vw`, `dvh`
   and `@media (max-width)` measure the desktop window, not the phone. Use:
   - `100%` of the app root;
   - container units (`cqw`, `cqh`, `cqi`);
   - `@container app (...)`.

   Media queries stay fine for user settings and input (`prefers-color-scheme`,
   `prefers-reduced-motion`, `pointer`).
2. **Fixed and sticky UI stays inside the app root.** The root has layout containment, so
   `position: fixed` bars, sheets and toasts attach to the phone in both modes. Never portal them
   to `body` (Vuetify: see `attach` above).
3. **Top-layer UI** (a `<dialog>` opened with `showModal()`, `[popover]`) renders above everything
   and ignores containment. In frame mode the shell confines it and its `::backdrop` to the phone
   screen, using the screen rect it publishes (`--dsh-screen-left/top/width/height`). For that to
   work, app code follows two rules:
   - **Place dialogs with margin, never with `inset`.** `margin: auto` centres on the phone;
     `margin-block-end: 0` docks a bottom sheet.
   - **Size them with container units, never `%`.** Use `inline-size: 100cqi` and
     `max-block-size: 90cqb`. In the top layer, `%` resolves against the browser window.

   The same rules hold in native mode, so one stylesheet serves both; on a wide native viewport
   (tablet) the shell keeps modal dialogs and open popovers over the phone-width column. Popovers
   take the shell's insets at zero specificity, so an anchored menu keeps its own. Modal dialogs
   take them at a strong specificity on purpose, so a `.drawer { inset: 0 }` cannot escape the
   phone: place dialogs with margin. An exit
   animation (`transition-behavior: allow-discrete` on `display` and `overlay`) stays over the
   phone: the shell marks a closing dialog or popover `[data-dsh-closing]` until it has finished.
   The popover polyfill's `.\:popover-open` class is handled too. Implementation of dialogs and
   popovers: modern-web-guidance (`dialog`, `animate-to-from-top-layer`). `demo.html` has a working
   bottom sheet.
4. **Pad for the insets.** Top bars add `--app-inset-top`; bottom bars add `--app-inset-bottom`.
5. **Gestures use Pointer Events, not `touchstart`.** A mouse in the frame and a finger on a phone
   then go through the same code. An element that handles its own drag limits `touch-action` on
   its handle to the axis the page keeps (`pan-y` for a horizontal swipe, `none` when it owns
   both), or sets `data-shell-nodrag`; the shell's mouse-drag leaves that axis to it. Text stays
   selectable in the frame; selection is off only while a drag scrolls.
6. **Coordinates in frame mode are scaled.** `getBoundingClientRect()` and pointer deltas are in
   screen pixels. Divide by `DeviceShell.scale` for app pixels wherever it matters (drag
   thresholds, custom sliders).
7. **No hover styles.** Phones have none; press is `:active`. Anything clickable is a real
   `<button>` or `<a href>`, so it still gets keyboard focus and `:focus-visible`.
8. **No visible scrollbars.** Keep the shell's `scrollbar-width: none`; never set it back to
   `auto` / `thin`, and no `scrollbar-gutter: stable`. Without the kit, put the same rule on the app
   root and its descendants. With no bar, show that a region scrolls by letting content cut off at
   the edge (a chip half out of its row, a row under the bottom bar) or with a fade or shadow at
   the scrolling edge (modern-web-guidance `scrollability-affordance-hints`: the hint is then the
   only cue, so it needs 3:1 against what is next to it). A scroller with no focusable content gets
   `tabindex="0"` so the keyboard can scroll it.
9. **Hold and drag never select chrome.** The shell covers buttons, control roles, choice labels
   and navigation; a custom tappable row or card adds `user-select: none` itself. A drag region
   (sheet handle and header, swipe row, slider) sets `touch-action`, `-webkit-user-select: none`,
   `user-select: none` and `-webkit-touch-callout: none` on the region only (`motion.md`).

## Notes for modern-web-guidance

The shell is the one place that reads the viewport, so it may use `dvh`. Everything inside it
follows modern-web-guidance (`form-factor-adaptation`, `responsive-design`, `size-aware-styling`):
- container queries for layout;
- safe-area insets with `max()`;
- `container-type: size` only on a box with a definite height (the app root is one).
