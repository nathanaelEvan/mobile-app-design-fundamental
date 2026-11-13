# References first, quick iteration

New screens and flows start from how good apps solved the same job, not from a blank page.

## Sources, in order

1. **Mobbin MCP (primary).** Tools `mcp__mobbin__*`.
   - Start with `search_flows` for the job ("add expense", "onboarding health app", "checkout"),
     then `search_screens` for the specific screen, `search_sections` for one part (a stats header,
     a plan picker).
   - Filter to Android when the chrome is Material; iOS screens are still useful for layout ideas.
   - Pick 3-5 that solve the same job well. Save them with `save_content` into a collection named
     after the project (`create_collection` once).
2. **Awwwards MCP (secondary), when installed.** Mostly websites: use it for visual mood,
   typography and motion ideas, not for app structure.
3. Neither available: say so in one line and work from the archetype file.

## What to take from a reference

Structure (what is on the screen, in what order), hierarchy (what leads), and interaction (how the
job is done). **Never** copy a brand's look, illustrations, copy or icons.

## Log it

Add to `design/REFERENCES.md`:
```md
## Add expense (form) — 2026-11-14
- Mobbin: <link> — amount as the hero field, category as chips under it
- Mobbin: <link> — pinned save bar above the keyboard
- Taken: hero amount, chips. Left: their 3-step wizard (our form is one screen)
```

## Quick iteration

- **2-3 rough variants** that differ in structure: e.g. list vs grouped cards vs hero-metric-first.
  Same tokens, real content, working at the device size. No polish yet.
- Show them side by side (screenshots from the shell at `?frame=on`, or artboards if a canvas tool
  is in use) with one line each on the trade-off. The user picks or mixes.
- Then refine **one**. Iterate in small loops: change → screenshot → look → change.
- Timebox: a variant should take minutes, not an hour. If a variant needs a new component, sketch
  it with existing ones first.
