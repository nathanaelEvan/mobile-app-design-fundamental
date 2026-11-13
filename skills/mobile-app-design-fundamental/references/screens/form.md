# Form / checkout

**Job:** collect input (or payment) with the fewest decisions.

**Anatomy**
1. Top app bar: close or back, title of the task ("Tambah pengeluaran").
2. The most important field first and largest (an amount can be the hero, display-small).
3. Fields in one column, labels always visible (never placeholder-only), helper text under the
   field, errors under the field.
4. Choices with few options as chips or a segmented button, not a dropdown.
5. Pinned bottom bar with the submit action; it moves above the keyboard.

**Budget:** ≤6 fields per screen (split longer forms into steps with progress); one primary action.

**Rules:** correct input types and `autocomplete` (implementation: modern-web-guidance forms
guides); validate after interaction, not while typing the first character; keep what was typed on
error; the submit button is never disabled without saying why.

**Fails:** a wall of text fields with equal weight; a dropdown for 3 options; "Submit"; errors in a
toast at the top; the action hidden under the keyboard.

**States:** pristine, valid, field error, submitting (button shows progress), success (confirm and
move on), server error (inline, keep the input).
