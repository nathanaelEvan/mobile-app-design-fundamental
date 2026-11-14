# Payment (method, then waiting for payment)

**Job:** get the person to pay, with confidence, through a channel that finishes outside the app
(QRIS, virtual account, e-wallet, card 3-D Secure). Entering the order or address is `form.md`.

**Anatomy: choose a method**
1. Top app bar: back, "Pembayaran".
2. The total, the hero (display-small), with a "Lihat rincian" disclosure for line items and fees.
3. Methods grouped (QRIS · E-wallet · Virtual account · Kartu), each a 56px+ row with the issuer's
   logo, name and any fee. The last-used method is preselected; few groups, no dropdown.
4. Pinned bottom bar: "Bayar Rp 152.400". The amount sits on the button.

**Anatomy: card details** (when "Kartu" is picked; a form, so `form.md` holds too)
1. Card number, expiry, name on card, security code, in that order; expiry and code share a row.
2. Each field has its `autocomplete`: `cc-number`, `cc-exp`, `cc-name`, `cc-csc`, so the
   browser or the phone's wallet fills the card (modern-web-guidance `autofill-payment-form`).
3. The card number accepts spaces as typed and shows them in groups of 4; strip them before
   sending. The expiry hint ("BB/TT") sits above its field.
4. The security code is `type="text"` with `inputmode="numeric"`, never `type="password"`: people
   cannot check a masked code, and it is printed on the card they hold.

**Anatomy: waiting for payment**
1. Countdown to expiry, always visible ("Bayar dalam 23:59:12"), and the deadline as a time
   ("sebelum 14 Nov, 21:30").
2. The total again, with a copy button (transfers need the exact amount).
3. The instrument itself:
   - QRIS: the code as large as the screen allows, on a white quiet zone in light and dark themes
     alike, never cropped, plus "Simpan QR" (people pay from another phone or upload a screenshot).
   - Virtual account: the number in groups of 4 (`8808 1234 5678 9012`), the bank, and a "Salin"
     button that confirms with a snackbar ("Nomor VA disalin").
   - E-wallet: a button that opens the wallet app; the QR fallback underneath, for desktop.
4. How to pay, as collapsible steps per channel (m-banking, ATM, internet banking); open only the
   one for the chosen bank.
5. Pinned: "Cek status pembayaran" (primary), "Ganti metode" (text button).

**Rules:** the status updates by itself when the person comes back to the app (poll or push), and
the button is the manual fallback, not the only path. Leaving this screen never loses the payment:
it stays reachable from the order or a home banner until it is paid or expires. The amount, the
VA number and the countdown use tabular figures. Copy says what happens next, not just "Berhasil".

**Budget:** one instrument on screen; the instructions collapse; one primary action.

**Fails:** a QR that is shrunk to fit or inverted in dark mode; a VA number in one unbroken run
with no copy button; a countdown hidden in the instructions; "Cek status" as the only way to see
the payment went through; a back button that abandons a pending payment without a word.

**States:** method list loading; method unavailable (greyed, with the reason: "Sedang gangguan");
waiting (countdown); checking status (button shows progress); paid (confirm, show what was bought,
and move on); expired ("Waktu pembayaran habis", with "Buat pembayaran baru"); failed or declined
(say why when known, keep the order); offline (the instrument stays visible, since it was already
issued).
