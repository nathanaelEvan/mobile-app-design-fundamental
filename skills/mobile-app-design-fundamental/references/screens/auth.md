# Auth (sign in, sign up, verify)

**Job:** get in with the least typing.

**Anatomy**
1. App mark and one line of what you get (not a marketing page).
2. The fastest method first: passkey or Google / phone number with OTP; email + password after.
3. One field per step for phone/OTP flows; OTP field with one-time-code autofill, resend with a
   countdown.
4. Primary action pinned above the keyboard; terms as a body-small line, not a checkbox wall.

**Rules:** implementation of passkeys, OTP autofill, sign-in forms: follow modern-web-guidance
(`passkey-*`, `sms-otp-form`, `autofill-sign-in-form`).

**Fails:** sign-up and sign-in as two look-alike screens with a toggle; password rules shown only
after failure; "Invalid credentials" with no next step.

**States:** wrong code (say how many tries left), expired code, no network, account exists
(offer to sign in), locked (say when it unlocks).
