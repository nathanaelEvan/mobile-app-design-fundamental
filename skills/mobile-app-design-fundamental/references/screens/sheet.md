# Bottom sheet and dialog

**Job:** a quick choice or task on top of the current context.

**Choose**
- Bottom sheet: pick from options, a short form (≤3 fields), more actions for an item, a filter.
- Dialog: a decision that blocks (confirm delete, unsaved changes). Two actions, verbs.
- Full screen: anything longer, anything with its own navigation.

**Anatomy (sheet)**: drag handle, title (headline-small) or none for an action list, content,
optional pinned action. Top corners radius 28, scrim behind, the bottom inset inside the sheet.
Partial height by default; expands to full when content needs it.

**Rules:** dismiss by drag down, scrim tap and back; never two sheets stacked. Scrim tap:
`closedby="any"` is right for a sheet `<dialog>` that does not cover the whole screen, since a tap
outside lands on its `::backdrop`. A `<dialog>` that fills the screen (the navigation drawer
pattern: a full-size scroller holding the panel) must not use it: taps outside the panel land on
the dialog itself. Close it from a click outside the panel instead (modern-web-guidance
`navigation-drawer`). Implementation of
dialogs, popovers, top-layer animation and scroll locking: modern-web-guidance (`dialog`,
`animate-to-from-top-layer`, `prevent-page-scroll-under-modal-dialog`).

**Fails:** a dialog for a list of options; a sheet with a full form and tabs; "Are you sure?" with
"OK / Cancel".
