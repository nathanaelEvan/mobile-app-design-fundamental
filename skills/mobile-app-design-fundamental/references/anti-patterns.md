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
