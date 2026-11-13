# Phase: develop

`design/DESIGN.md` exists. Its final decisions are settled: read the values from it and do not ask
about them or explain them. Load only what each step names.

## The loop for a new screen or flow

1. **Classify.** Name the archetype and open only `screens/<archetype>.md`:
   home, list, detail, form, settings, onboarding, auth, search, sheet, profile, stats, chat.
   Every screen also needs `screens/states.md` unless it truly has no data.
2. **References.** Open `references-and-iteration.md` the first time in a session and follow it:
   Mobbin flows first, then screens; log what you used in `design/REFERENCES.md`.
3. **One-line brief**, before code: "Archetype. Job: … Focal: … Primary: … Cutting: …".
   Continue unless the user objects.
4. **Components.** Look up every part in `design/COMPONENTS.md`, then the UI library. New component
   only with a reason, added to the inventory in the same change (`components.md` has the format).
5. **Rough variants.** 2-3 quick variants that differ in structure (not colour), each a working
   screen at real content length. Show them (screenshots via the shell, or the canvas tool in use)
   and let the user pick. Skip only when the user already chose a direction or the change is small.
6. **Refine the pick.** Tokens from `DESIGN.md` only; 4px grid; states; real copy (`copy.md` when
   writing more than labels).
7. **Implement with modern-web-guidance.** Search it for each web feature you touch (sheets,
   dialogs, transitions, forms, scroll effects) and follow its guide. Motion, transitions and
   gestures: decide them with `motion.md` first (durations, easing, feel), then build them the way
   modern-web-guidance says.
8. **Quick check** before saying done: run `scripts/check.mjs` on the screen (see `phase-review.md`)
   and fix every `FAIL`.

## A change to an existing screen

Steps 3, 4, 6, 7, 8. Keep the screen's identity; do not redesign what was not asked.

## Rules of thumb while building

- Space groups things before boxes do. A card is for an object (a plan, a photo, a payment card).
- Pin the primary action above the gesture area on forms, detail, onboarding and checkout.
- Use the library's native-feeling parts (Vuetify `v-app-bar`, `v-bottom-navigation`,
  `v-bottom-sheet`, `v-list`) before hand-made ones.
- Fixed and sticky UI (bars, sheets, toasts) is positioned inside the app root, never against the
  window (`device-shell.md`).
- Gestures use Pointer Events, so the shell's mouse-as-finger works the same as a real finger.
