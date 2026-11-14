# Phase: develop

`design/DESIGN.md` exists. Its final decisions are settled: read the values from it and do not ask
about them or explain them. Load only what each step names.

## The loop for a new screen or flow

1. **Classify.** Name the archetype and open only `screens/<archetype>.md`:
   home, list, detail, form, payment, settings, onboarding, auth, search, sheet, profile, stats,
   chat, scanner.
   Every screen also needs `screens/states.md` unless it truly has no data.
2. **References.** Open `references-and-iteration.md` the first time in a session and follow it:
   Mobbin flows first, then screens; log what you used in `design/REFERENCES.md`.
3. **One-line brief**, before code: "Archetype. Job: … Focal: … Primary: … Cutting: …".
   Continue unless the user objects.
4. **Components.** Look up every part in `design/COMPONENTS.md`, then in the UI library.
   - Make a new component only with a reason, and add it to the inventory in the same change.
     `components.md` has the format.
   - A new component's colours: follow "A new component" in `color-tokens.md`.
5. **Rough variants.** Follow "Quick iteration" in `references-and-iteration.md`: 2-3 structural
   variants, then the user picks. Skip this only when the direction is already chosen or the change
   is small. With no one to ask (a subagent, CI, a "just build it" request), pick the variant that
   best fits the archetype's job and budget, say why in one line, and keep the others' screenshots
   so the user can switch later.
6. **Refine the pick.** Tokens from `DESIGN.md` only; 4px grid; states; real copy (`copy.md` when
   writing more than labels).
7. **Implement with modern-web-guidance.** Search it for each web feature you touch (sheets,
   dialogs, transitions, forms, scroll effects) and follow its guide, converted as in "Adapting
   modern-web-guidance snippets" below. Motion, transitions and
   gestures: decide them with `motion.md` first (durations, easing, feel), then build them the way
   modern-web-guidance says.
8. **Quick check** before saying done. Run
   `node <skill>/scripts/check.mjs <dev-server-url> --root "#app" --states "<the screens you touched>"`
   and fix every `FAIL`.

## A change to an existing screen

Steps 3, 4, 6, 7, 8. Keep the screen's identity; do not redesign what was not asked.

## Rules of thumb while building

- Space groups things before boxes do. A card is for an object (a plan, a photo, a payment card).
- Pin the primary action above the gesture area on forms, detail, onboarding and checkout.
- The navigation bar shows on top-level destinations only; pushed screens, forms, checkout, auth
  and onboarding use a top app bar with back instead (`components.md`, "Navigation bar").
- Tappable things are real `<button>` / `<a href>` with a 48px hit area (`components.md`).
- Use the library's native-feeling parts (Vuetify `v-app-bar`, `v-bottom-navigation`,
  `v-bottom-sheet`, `v-list`) before hand-made ones.
- Fixed and sticky UI (bars, sheets, toasts) is positioned inside the app root, never against the
  window (`device-shell.md`).
- Drawers, swipe actions and carousels use native scroll (`scroll-snap` plus an
  `IntersectionObserver` for state), as modern-web-guidance's `navigation-drawer`,
  `swipe-to-reveal` and `swipe-to-remove` build them; they forbid `pointermove` JS for these.
  Pointer Events only for a custom drag scroll-snap cannot express (a sheet's drag handle, a
  slider), so the shell's mouse-as-finger works the same as a real finger (`motion.md`).

## Adapting modern-web-guidance snippets

**Browser policy.** `DESIGN.md`'s Browser target row is the project's custom browser-support
policy. modern-web-guidance assumes Baseline *widely available* with every fallback unless a
policy exists; with this one, skip fallbacks for Baseline features inside the target. Features it
marks *Limited availability* still need their fallback or a graceful degradation, for example:
- `transition-behavior: allow-discrete` on `display`: Firefox parses it but does not transition,
  so the exit is instant (`animate-element-entry-exit`). Fine if the end state is right.
- `focusgroup`: load the polyfill only when native support is missing (`tabs`).
- `hidden="until-found"`, `interpolate-size`: enhancements; without them a panel is just hidden,
  a size change is instant (`tabs`).
- `scroll-initial-target`: set the start scroll position from script (`navigation-drawer`).
- Anchor positioning: `@supports (anchor-name: --x)` with an absolute-position fallback
  (`css-layout`).
- `text-wrap: pretty`: plain wrapping is the fallback (`improve-text-layout-and-legibility`).
- `navigator.install()`: no browser ships it yet; hide the install button unless it or
  `beforeinstallprompt` exists (`install-web-app`).

**Convert its snippets to this skill's rules** before pasting:

| modern-web-guidance writes | Write instead |
|---|---|
| `100dvh`, `100svh`, `100vh`, `100dvw`, `100vw`, `100dvb` | `100%` of the app root, or `100cqi` / `100cqb` |
| `:is(:hover, :focus-visible)` | `:focus-visible`, plus `:active` for press |
| An off-scale size (`font-size: 0.85rem`) | The nearest type token (`body-small` / `body-medium`) |
| A custom checkbox of `1.2rem` | `1.25rem` (20px), inside a 48px `<label>` |
| Icon tokens `--icon-*`, `--icon-style-*` (`icons.md` mask/url tokens) | `--mask-icon-*`, `--mask-icon-style-*`: `--icon-*` is reserved for colour |
| Single-line `text-overflow: ellipsis` | Only where the full text is reachable (detail screen, expand, label); the checker WARNs `truncated` |
