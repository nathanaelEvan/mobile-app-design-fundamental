# Device shell: phone frame on desktop, native on a phone

The kit is `<skill>/assets/shell/` (`device-shell.css`, `device-shell.js`, `demo.html`). It is plain
CSS and JS, works with any stack, and is meant to ship to production.

## What it does

| Where it opens | Mode | Result |
|---|---|---|
| Phone, tablet in hand (`pointer: coarse`), installed PWA, or window ≤ 480px | `native` | No frame. The app fills the screen (`100dvh`) and uses the device's safe areas |
| Desktop with a mouse | `frame` | A simple phone (bezel, status bar with clock/signal/wifi/battery, gesture handle) centred on a plain desk |
| `?frame=on` / `?frame=off` | forced | For screenshots and testing |

In frame mode:
- **Ratio is kept.** The whole phone is scaled by one factor,
  `min(1, available height ÷ phone height, available width ÷ phone width)`, so on a short laptop it
  gets smaller, never squashed or shortened. Never cap only one axis (`max-height: 100vh` on a
  fixed-width phone is the squashed-phone bug).
- **Mouse acts like a finger**, as in the browser's device emulation: a grey dot cursor (darker
  while pressed), drag to scroll any scroll container with a little momentum, a drag never fires a
  click, no text selection while dragging (fields stay selectable), wheel still scrolls.
- The status bar is drawn over the app; the app pads for it with `--app-inset-top`, exactly as it
  pads for a real status bar on a phone. Same for `--app-inset-bottom` and the gesture area.

## Wiring it

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#f6f7f7">
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

- Vite / Vue / Vuetify: put the kit in `public/device-shell/` and the markup in `index.html`;
  mount the app on `#app` as usual. With Vuetify, `v-app` fills `#app`; set Vuetify's layout to the
  app root, not the window (its `v-app` is `min-height: 100dvh` by default: override it to `100%`).
- Device size from `DESIGN.md` → `data-width` / `data-height` (Material default 412×915).
- Status bar tone for a dark screen: `DeviceShell.setStatusBar('light')`.

## Rules for app code (because the frame exists)

1. **No viewport units or width media queries inside the app.** In frame mode `100vh`, `vw`, `dvh`
   and `@media (max-width)` measure the desktop window, not the phone. Use `100%` of the app root,
   container units (`cqw`, `cqh`) and `@container app (...)`. Media queries stay fine for user
   settings and input (`prefers-color-scheme`, `prefers-reduced-motion`, `pointer`).
2. **Fixed and sticky UI is inside the app root.** The root is a size container, so
   `position: fixed` bars, sheets and toasts attach to the phone in both modes. Never portal them
   to `body` (Vuetify overlays: set `attach` to the app root or keep them inside `v-app`).
3. **Pad for the insets**: top bars add `--app-inset-top`, bottom bars add `--app-inset-bottom`.
4. **Gestures use Pointer Events** (not `touchstart`), so mouse in the frame and a finger on a
   phone go through the same code. An element that handles its own drag sets `touch-action: none`
   or `data-shell-nodrag`, and the shell leaves it alone.
5. **Coordinates in frame mode are scaled.** `getBoundingClientRect()` and pointer deltas are in
   screen pixels; divide by `DeviceShell.scale` for app pixels when it matters (drag thresholds,
   custom sliders).
6. **No hover styles** (phones have none); press is `:active`.

## Implementation notes for modern-web-guidance

The shell is the one place that reads the viewport, so it may use `dvh`. Everything inside it
follows modern-web-guidance (`form-factor-adaptation`, `responsive-design`, `size-aware-styling`):
container queries for layout, safe-area insets with `max()`, `container-type: size` only on a box
with a definite height (the app root is one).
