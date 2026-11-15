# Anti-patterns: what makes an app look generated

Each with its fix. The checker catches some; the rest you catch by looking.

1. **Card soup.** Every section in a white rounded card with a shadow; cards in cards. → Group with
   space and section headers. Cards only for objects.
2. **The 2×2 stat grid.** Four equal tiles, icon in a pastel circle + number + label. → One hero
   metric, then a quiet row of 2-3 secondary ones.
3. **Flat hierarchy.** Six sizes, everything bold, every number the same size. → 4 styles + hero,
   2 weights, one focal element.
4. **Default colour.** Material purple `#6750A4`, Tailwind indigo, iOS blue as the only brand colour,
   on every icon. → Ink and neutral surfaces, one considered accent on ≤2 elements.
5. **Gradient garnish.** Gradient buttons, headers, text. → Solid fills. A gradient only as an
   image-like backdrop on onboarding.
6. **Fake native chrome.** A hand-made header with a "<" text arrow, a bottom bar ignoring the
   gesture area, a hamburger as the main navigation. → Material top app bar and navigation bar.
7. **Icon confetti.** An icon or emoji on every row, label and button. → Icons only where they speed
   recognition; one icon family, monochrome.
8. **Centred everything.** → Left-align content; centre only empty states, success, onboarding hero.
9. **Placeholder content.** Lorem ipsum, "John Doe", `Rp 0`, identical rows. → Realistic, uneven,
   local data.
10. **Unpinned primary action.** The main button scrolls away or sits under the gesture area. →
    Pinned bar with the bottom inset.
11. **Off-grid nudges.** 13px, 15px, 18px paddings, 6px gaps. → The 4px scale.
12. **Desktop habits.** Hover effects, tooltips as the only label, tiny icon buttons, right-click
    menus. → Press feedback, visible labels, 48px targets, long-press or a menu button.
13. **Viewport sizing in the app.** `100vh` screens, `vw` fonts, width breakpoints. → App root
    container units; the shell owns the viewport.
14. **Squashed phone.** A desktop frame that shrinks only its height. → Uniform scale (the shell).
15. **Spinner screens.** A full-screen spinner for every load. → Skeletons in the layout's shape;
    keep cached content visible.
16. **Modal everything.** Dialogs for choices that fit a bottom sheet, sheets for full tasks that
    deserve a screen. → Sheet for a quick choice on top of context, screen for a task.
17. **Generic copy.** "Submit", "OK", "Oops! Something went wrong". → Verbs that say what happens,
    errors that say what to do (`copy.md`).
18. **Navigation bar everywhere.** Tabs under a detail, form, checkout or sign-in screen. → Bar on
    top-level destinations only; pushed screens get a top app bar with back.
19. **Clickable divs.** A `div` or `span` with a click handler. → A real `<button>` or `<a href>`.
20. **Desktop scrollbars.** A grey bar down the screen, a sheet or a chip row. → None, anywhere
    (`device-shell.md`).
21. **Selectable text.** A long-press selects a button's or a title's text; a drag highlights the
    page. → Unselectable by default, opt-in content only (`device-shell.md`).
22. **Brand-coloured destruction.** "Hapus" or "Reset" as a filled brand button that looks like the
    happy path. → Danger tone: text or outlined to start, filled danger to confirm, naming what is
    destroyed (`components.md`).
23. **Off-pattern buttons.** One-off button colours and shapes per screen. → One Button: Material
    emphasis (filled, tonal, outlined, text) × tone (brand, neutral, danger).
24. **Back by route.** Back hard-coded to a parent ("/books") sends a user who came from Home to
    Books, and a pushed "back" puts a second copy in history, so close loops. → History back; the
    route only as the no-history fallback; never push to go back (`components.md`, "Back and up").
25. **Static selection.** A segmented button, tab or chip that cuts from one option to the next.
    → The indicator slides to the new option, or the selected state fades in (`motion.md`).

## Tone

`DESIGN.md`'s Brand tone row decides how strict 4, 5 and 7 are. **Calm** and **premium** keep them
as written. **Playful** (children, students, games, rewards) relaxes them, within limits:
- **Accent** (4): up to 3 accent hues across the app, each with one job (brand, reward, a
  subject's colour). Still at most 2 accented elements per screen region, and still tokens.
- **Gradients and textures** (5): allowed on hero cards, illustrations and reward moments. Never
  under text: text sits on a solid surface or a scrim that keeps 4.5:1.
- **Icons** (7): full-colour icons are fine if they are **one family** (one style, one stroke, one
  palette), drawn from tokens or as illustration assets. Still only where they speed recognition.
- A mascot is fine (`components.md`, "Illustration and mascot"); one per screen at most.
Nothing else relaxes: grid, type scale, targets, contrast and one primary action stay.
