# Copy

Words are layout: real copy reveals real layout problems.

The language, locale and register come from `DESIGN.md`. The examples below are Indonesian (the
default locale, `id-ID`); for another locale, apply the same rules in its language and formats.

- Write in the app's language. Most languages run longer than English (Indonesian ~20-30%,
  German ~30%): test every label at its real length; never design around an English placeholder.
- Pick one register and keep it, never both in one app: in Indonesian casual (`kamu`) or formal
  (`Anda`); elsewhere the language's own pair (`du` / `Sie`, `tu` / `vous`).
- Buttons say what happens: "Simpan alamat", "Mulai uji coba 7 hari", not "Submit", "OK", "Lanjut"
  (unless it is truly a step in a sequence).
- Titles say where you are, in 1-3 words. No repeated title (app bar and a header saying the same).
- Empty states say what will be here and how to get it: "Tempat favoritmu muncul di sini. Ketuk ♡
  di tempat mana pun untuk menyimpannya."
- Errors say what happened and what to do, near the field: "Nomor HP kurang 2 digit". No "Oops!",
  no blame, no codes without a next step.
- Sentence case. Exclamation marks only for real celebrations.
- Numbers: one format per app, the locale's (`Rp 12.400`, `1,5 km`, dates as "Hari ini",
  "Kemarin", "12 Nov").
- Sample data: real-looking names of mixed lengths ("Sekar Ayu Pramesti", "Budi"), real prices
  (`Rp 23.500`, not `Rp 10.000`), dates relative to today, one row that is much longer than the rest.
