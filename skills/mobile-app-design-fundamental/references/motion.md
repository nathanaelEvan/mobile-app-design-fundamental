# Motion and gestures: decisions

Open when a screen adds motion, a transition or a gesture. This file decides **when, what, how
long and what it feels like**. **How** it is built comes from modern-web-guidance: search it for
the pattern (`motion`, `physics-based-easing`, `animate-element-entry-exit`,
`animate-to-from-top-layer`, `same-document-transitions`, `stack-drill-down`, `swipe-to-reveal`,
`swipe-to-remove`, `pull-to-reveal`, `drag`, `scroll-entry-exit-effects`) and follow its guide.

Spring and gesture principles adapted from fluid-interactions (MIT, Seun Oyediran), corrected for
modern-web-guidance and Material: see the repo's `THIRD_PARTY_NOTICES.md`.

## 1. Motion has a job

Motion shows where something came from or went, confirms a press, or follows the finger.
Anything else is cut: no decorative loops, no entrance animation on every screen load, no parallax
for its own sake. One focal motion per transition.

## 2. Tokens (in `tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--dur-instant` | 50ms | Colour or state flip |
| `--dur-short` | 100ms | Press in |
| `--dur-short-2` | 150ms | Press out, icon swap, fade of a state layer |
| `--dur-short-3` | 200ms | The reduced-motion fade |
| `--dur-medium` | 250ms | Chips, switches, small menus, snackbar |
| `--dur-medium-2` | 300ms | Sheet and dialog enter, FAB |
| `--dur-long` | 400ms | Full-screen push and pop, shared element |
| `--dur-long-2` | 500ms | Large morph (the maximum) |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Most state changes on screen |
| `--ease-enter` | `cubic-bezier(0.05, 0.7, 0.1, 1)` | Things arriving (Material emphasized decelerate) |
| `--ease-exit` | `cubic-bezier(0.3, 0, 0.8, 0.15)` | Things leaving (emphasized accelerate) |
| `--ease-spring` + `--dur-spring` | `linear()` spring, damping 0.9, 350ms | Sheets, cards, toggles: a settle with no visible bounce |
| `--ease-spring-bouncy` + `--dur-spring-bouncy` | `linear()` spring, damping 0.75, 500ms | Rare playful moments (a reward, a like) |

- Exits are about two thirds of the enter duration and use `--ease-exit`.
- Further travel takes longer: a chip 250ms, a sheet 300ms, a full screen 400ms.
- Never put bounce on opacity or colour; only on position and scale.
- No bounce on navigation, paging, full-screen views or text: use `--ease-enter` / `--ease-exit`
  (or a critically damped spring for a gesture release).

## 3. Choreography

- **Enter decelerates, exit accelerates.** Open from the trigger (a sheet rises from the bottom
  edge, a menu grows from its button, a detail screen from its row).
- **Material transition patterns**: container transform (a card or row becomes its detail screen),
  shared axis (steps of a flow, tabs: slide 30px + fade on the axis of travel), fade through
  (unrelated top-level destinations: fade out in `--dur-short`, fade in in `--dur-short-3` with a
  0.92 → 1 scale), fade (dialogs, menus).
- **Stagger** lists by 20-30ms, at most the first 5 items, the whole stagger within one
  `--dur-medium`. Never stagger content the user is waiting to read.
- **Shared element** only for the one thing the user is tracking (the photo, the amount).
- **Text appears only once legible**: during a morph, body text fades in after ~60% progress and
  leaves before ~40%; keep one element constant so the eye has an anchor.

## 4. Press feedback

Every tappable thing answers within one frame: `:active` with a state layer (the content colour
at 10% on surfaces, 12% on fills: the `-pressed` tokens) or `scale: 0.97` in `--dur-short`,
released in `--dur-short-2`. No hover states. Disabled things do
not react.

## 5. Gestures

Prefer the platform's own mechanics before custom ones (modern-web-guidance has the patterns):
native scroll with `scroll-snap` for carousels, paging and swipe actions; `<dialog>` or the UI
library's sheet (Vuetify `v-bottom-sheet`) for sheets; View Transitions for container transforms.
A custom pointer-driven drag only when none of these can express it.

Decisions for every gesture:
- **Every gesture has a visible alternative**: a button for swipe-to-delete, a refresh action for
  pull-to-refresh, a close button on a sheet, a back button for swipe back. Gestures are shortcuts.
- **The finger leads.** While dragging, the thing moves 1:1 with the finger; never animate toward
  the finger.
- **Release keeps momentum.** Where the thing lands is decided by its projected position (position
  + velocity × deceleration), not by where the finger let go: a short fast flick dismisses, a slow
  long drag that comes back does not. Dismiss when projected past 25-50% of the travel.
- **Interruptible.** A moving thing can be grabbed again; taps work while things settle. State
  follows the target of the animation, not its end event.
- **Edges resist.** Past the end, content stretches (Material stretch overscroll) instead of
  stopping dead or flying free; directions that do nothing resist.
- **Direction lock** after ~10 app-px with a 2:1 ratio; the other axis goes back to native scroll.
- **Thresholds are in app pixels.** In the desktop frame, pointer deltas are in screen pixels:
  divide by `DeviceShell.scale` (`device-shell.md`). Size detents from the app root, never the
  window. A custom-drag surface sets `data-shell-nodrag` and `touch-action: none` on the handle only.
- **Material back**: system back and the back button pop the screen (predictive back where the
  browser supports it); no iOS left-edge swipe that fights the Android back gesture.
- **Sheets**: drag handle 32×4 with a 48px hit area, scrim 32% of the overlay colour, detents at
  real content heights, a fast flick down closes from any detent.
- **Long press** (500ms) only for secondary actions that also live in a menu.
- **Haptics** (`navigator.vibrate(10)`, Android only): on a commit (a destructive swipe passing its
  threshold, a snap to a detent). Never on scroll, never the only feedback.

## 6. Reduced motion

- What the finger drives does not change: dragging still follows the finger.
- Springs lose their bounce; large automatic moves (screen push, container transform) become a
  `--dur-short-3` fade in place; parallax, decorative scale and stagger are dropped. State changes (colour,
  opacity) stay.
- Auto-playing motion longer than 5 seconds has a visible pause control (WCAG 2.2.2), whatever the
  motion setting. Nothing flashes more than three times a second.
- The end state is always reached: nothing stays hidden because an animation did not run.

## 7. Review

- Does each motion have a job (where from, where to, confirm, follow)?
- Durations and easings from the tokens; nothing over 500ms; exits faster than enters?
- Grab it mid-animation: does it respond? Tap during a settle: does the tap land?
- Flick fast and short, drag slow and long: does each land where the hand meant?
- Every gesture has a button; reduced motion on: still usable, end states reached?
- In the desktop frame at a small scale, do thresholds still feel the same?
