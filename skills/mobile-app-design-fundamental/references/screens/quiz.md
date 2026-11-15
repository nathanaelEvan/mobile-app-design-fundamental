# Quiz / practice

**Job:** answer one question at a time, learn from each answer, see the result.

**Anatomy**
1. Top app bar: close (with "Keluar dari kuis?" if progress would be lost), and progress
   ("Soal 3 dari 10" plus a linear bar).
2. The question: title-large or headline-small; a figure or formula under it if needed.
3. Choices as full-width cards, a radio group: real `<input type="radio">` sharing one `name`
   inside a `fieldset` with the question as `legend`, each card its `<label>` (48px+). Arrow keys
   move between choices.
4. Pinned bottom bar: "Periksa jawaban" (disabled until a choice is made, with the reason shown),
   then "Soal berikutnya".
5. Feedback after checking: the chosen card marked correct or wrong by icon **and** words (never
   colour alone), the right answer shown, one line on why. Announced in a polite live region.
6. Completion: the score as the hero, what to review, and the next action (retry the wrong ones,
   back to the chapter). A reward moment may use `--ease-spring-bouncy` once.

**Printable summary** (when the app offers one): a `@media print` stylesheet that drops the bars,
navigation and buttons, prints the content in black on white at body size, and keeps each question
with its answer (`break-inside: avoid`). Offer it as "Simpan ringkasan (PDF)" through the browser's
print dialog.

**Budget:** one question per screen, one primary action, ≤5 choices.

**Fails:** choices as `div`s with click handlers; correct/wrong shown only in green/red; a timer
nobody asked for; confetti on every answer; the score hidden behind another tap.

**States:** loading, first question, answered correct, answered wrong, last question, completed,
offline (questions cached, results saved on reconnect), a very long question or choice.
