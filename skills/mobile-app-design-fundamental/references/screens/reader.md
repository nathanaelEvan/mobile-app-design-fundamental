# Reader (long-form: a chapter, an article, a guide)

**Job:** read a long text comfortably, find a place in it, act on one part of it.

**Anatomy**
1. Top app bar: back, a short title (the chapter, not the whole book), contents, and at most one
   more action (text size or bookmark). The bar may hide on scroll down and return on scroll up.
2. Body: one column, body-large, line length set by the safe area, headings at one level below the
   screen title. Figures, formulas and tables scroll sideways inside their own box, never the page.
3. Contents: a bottom sheet listing the sections, the current one marked; a tap jumps there and
   closes the sheet.
4. Per-section action (ask about this part, highlight, practise): one quiet button at the end of
   the section or on a long-press menu that also exists as a button. Not on every paragraph.
5. Progress: a thin bar or "Bagian 3 dari 7"; reopening returns to the last position.

**Rules:** never collapse the body after a few lines (that is for short descriptions in
`detail.md`). Text follows the user's font size; a text-size control changes the app's scale, not
one paragraph. Copying text is off unless `DESIGN.md`'s Text selection row lists the reader
(`device-shell.md`).

**Budget:** one reading column, one bar, one per-section action style.

**Fails:** a wall with no headings; the whole book in one scroll with no contents; a floating
button over the text; formulas that overflow the screen; a 12px caption style for body text.

**States:** loading (heading + paragraph skeleton), offline (the cached chapter, with its age),
not downloaded yet, a very long section, a section with a wide table or formula, end of chapter
(what comes next).
