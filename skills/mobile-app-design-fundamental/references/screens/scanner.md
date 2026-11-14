# Scanner (QR, barcode, document)

**Job:** point the camera at one thing and act on it, in seconds. Paying the scanned QR is
`payment.md`; this file ends when the code is read.

**Anatomy**
1. Full-bleed camera preview (the one place content touches the edge), under a top app bar that
   floats over it: close, the task ("Scan QRIS"), the torch toggle.
2. A viewfinder frame in the centre with the scrim around it at 32% of the overlay colour; one line
   of instruction under it ("Arahkan kamera ke kode QR").
3. Bottom: "Pilih dari galeri" (people scan a screenshot) and, where it applies, a manual entry
   fallback ("Masukkan kode"), both 48px+ buttons above the gesture inset.
4. On a read: a short confirmation (haptic plus the frame snapping to the code), then straight on
   to the result or a sheet with what was read. No extra "Scan" button press.

**Rules:** ask for the camera when the person opens the scanner, with a one-line reason before the
system prompt, never on launch. Text over the preview sits on a scrim or a surface, so it keeps
4.5:1 on any camera image. Implementation of the camera, `BarcodeDetector` and its fallback:
modern-web-guidance.

**Budget:** one instruction line, one frame, at most two buttons; nothing else over the preview.

**Fails:** a tiny viewfinder; a "Scan" button the person has to press; instructions in white on
the raw camera image; no gallery option; the permission asked before the person knows why.

**States:** permission not asked yet (explain, then ask); permission denied (explain, link to
system settings, offer gallery and manual entry); no camera (desktop frame: gallery and manual
entry only); low light (suggest the torch); unreadable or wrong kind of code (say what was found
and what is expected, keep scanning); success.
