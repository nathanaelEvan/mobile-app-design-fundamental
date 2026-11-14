# Design decisions

Every run of mobile-app-design-fundamental reads this file.
- **final**: settled. Do not ask about it again; change it only when the user explicitly asks.
- **draft**: the default is in use. It may be asked about once more.

Setup and audit promote a row to final when the user answers or accepts it. Values below are the
skill's defaults; replace them with the project's own.

| Decision | Value | Status |
|---|---|---|
| Type scale | Material 3 (Vuetify) | draft |
| Font | Roboto | draft |
| Chrome style | Material | draft |
| Screen safe area | 16px | draft |
| Grid | 4px | draft |
| Brand seed | (hex) | draft |
| Shape | rounded: 8 / 12 / 16 / 28 / full | draft |
| Modes | light and dark (system), designed both | draft |
| Desktop frame device | 412×915 | draft |
| Copy register | casual, "kamu" | draft |
| Stack | (e.g. Vue 3 + Vuetify 4, PWA) | draft |

## Tokens

- File: the project's tokens file (e.g. `src/styles/tokens.css`; the path depends on the stack). It has four tiers; components use semantic and component tokens
  only.
- Type role map:

  | Element | Style |
  |---|---|
  | App bar title | title-large |
  | Screen title | headline-medium |
  | Card title | title-medium |
  | Row title, body | body-large |
  | Secondary text | body-medium |
  | Meta | body-small |
  | Buttons, chips | label-large |
  | Navigation labels | label-medium |
- A change to these lines is a decision: update the table above in the same change.

## Notes

(Anything the team decided that the table does not cover, with the date.)
