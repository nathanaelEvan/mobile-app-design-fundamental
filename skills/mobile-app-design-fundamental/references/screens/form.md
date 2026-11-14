# Form / checkout

**Job:** collect input (or payment) with the fewest decisions.

**Anatomy**
1. Top app bar: close or back, title of the task ("Tambah pengeluaran").
2. The most important field first and largest (an amount can be the hero, display-small).
3. Fields in one column, labels always visible (never placeholder-only). A format hint
   ("DD/MM/YYYY", "MM/YY", "16 digit") sits **above** the input, under the label, so the keyboard
   and the autofill popover never cover it; link it with `aria-describedby`. Errors sit inline
   under the field.
4. Choices with few options as chips or a segmented button, not a dropdown.
5. Pinned bottom bar with the submit action; it moves above the keyboard.

**Budget:** ≤6 fields per screen (split longer forms into steps with progress); one primary action.

**Rules:** correct input types and `autocomplete` (implementation: modern-web-guidance forms
guides; a card form follows `autofill-payment-form`, see `payment.md`); keep what was typed on
error; the submit button is never disabled without saying why. Inputs, `select` and `textarea`
use `font-size` ≥ 16px (iOS Safari zooms the page into a smaller field; checker `input-zoom`).
Control borders use `--outline-control` (≥3:1), not the decorative `--outline-neutral`.

**Errors:** shown after interaction (`:user-invalid`), not while typing the first character;
inline under the field, starting with an error icon with a text alternative (never colour alone),
saying how to fix it. One polite live region for the page announces them; after a failed submit,
focus moves to the first invalid field (modern-web-guidance `validate-input-after-interaction`).

**Keyboard:** each field opens the keyboard it needs. `inputmode="numeric"` for OTP, PIN and amounts in a
currency written without decimals (Rupiah, yen); `decimal` for units and currencies that have
them, `type="tel"` for phone numbers, `type="email"` for email. `enterkeyhint` names what Enter
does: `next` between fields, `done` or `send` on the last, `search` in a search field. Format an
amount while it is typed, in the locale from `DESIGN.md` (`Rp 12.400`), but store it as a plain number.

**Fails:** a wall of text fields with equal weight; a dropdown for 3 options; "Submit"; errors in a
toast at the top; a format hint under the field, where the keyboard covers it; the action hidden
under the keyboard.

**States:** pristine, valid, field error, submitting (button shows progress), success (confirm and
move on), server error (inline, keep the input).
