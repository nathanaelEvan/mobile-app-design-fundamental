# Design decisions

Read by every run of mobile-app-design-fundamental. **final** = settled: do not ask about it again,
change only when the user explicitly asks. **draft** = default in use; may be asked once more.

| Decision | Value | Status |
|---|---|---|
| Type scale | Material 3 (Vuetify) | final |
| Font | Roboto | draft |
| Chrome style | Material | final |
| Screen safe area | 16px | final |
| Grid | 4px | final |
| Brand seed | #0d7065 | draft |
| Shape | rounded (8 / 12 / 16 / 28) | draft |
| Modes | light first; dark designed before launch | draft |
| Desktop frame device | 412×915 | final |
| Copy register | casual, "kamu" | draft |
| Stack | (e.g. Vue 3 + Vuetify 4, PWA) | final |

## Tokens

- File: `src/styles/tokens.css` (four tiers; components use semantic and component tokens only)
- Type role map: app bar title → title-large; screen title → headline-medium; row title →
  title-medium; body → body-large; secondary → body-medium; meta → body-small; buttons → label-large
- Changes to these lines are decisions: update the table above in the same change.

## Notes

(Anything the team decided that the table does not cover, with the date.)
