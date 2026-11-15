# mobile-app-design-fundamental

An agent skill (Claude Code, Codex and any agent that reads `SKILL.md`) that gives coding agents the
fundamentals of **mobile app design on the web**: PWAs, Vue/Vuetify, React, Svelte or plain HTML.

It decides **what the app looks like and how it behaves**. It is built to run alongside
**[modern-web-guidance](https://www.npmjs.com/package/modern-web-guidance)**, which decides **how it
is implemented**. When the two disagree on implementation, modern-web-guidance wins, so they never
fight.

## What it enforces

- **A 4px grid** for every spacing, size, radius and line height, a **16px screen safe area**, and
  **touch targets of 48px or more**.
- **The Material 3 type scale as Vuetify ships it**, used unless the project decides otherwise. The
  per-screen budget is 4 content styles plus a hero, and 2 weights.
- **Four-tier colour tokens**: primitive → brand → semantic → component. Names follow
  `{property}-{role}-{rank|prominence}-{layer}-{state}`, and components never use a hex value.
- **A component inventory** (`design/COMPONENTS.md`), checked before any component is used or made.
- **References first, quick iteration.** Start with Mobbin flows, then build 2-3 rough variants,
  then refine the one picked.
- **Screen archetypes** (home, list, detail, form, payment, settings, onboarding, auth, search,
  sheet, profile, stats, chat, scanner, reader, quiz), each with its states (loading, empty, error, offline,
  long content).
- **Motion and gesture decisions** with Material duration and easing tokens. There are two CSS
  `linear()` springs, release projection and interruptibility, and every gesture has a button
  alternative.
- **A device shell.** On desktop the app sits in a simple phone frame with a status bar.
  - The frame scales uniformly, so it is never squashed.
  - The mouse acts like a finger: axis-locked drag to scroll with momentum.
  - Modal dialogs and popovers stay inside the phone.
  - On a phone, or as an installed PWA, it runs native with no frame. On a tablet it stays
    phone-width.
- **A checker** (`scripts/check.mjs`, Node 22+ and Chrome, no installs).
  - It renders the app natively at 360, 412 and 430, at 200% text, in dark mode with reduced motion,
    at 320 for reflow, and on a tablet. It also renders it framed at 1440×900 and 1366×768.
  - It covers several screens with `--states`.
  - It reports grid, safe area, touch targets and their spacing, WCAG contrast, type, overflow,
    truncated text, covered text, viewport units, hover, colour tiers, top-layer escapes and the
    shell. Without the shell, it still catches a squashed phone.
  - `--click` opens sheets, dialogs and menus before auditing, and `--report` writes the result to
    a file.
- **A token checker** (`scripts/check-tokens.mjs`, Node 18+, no browser). It checks every colour
  token pair from the naming grammar, in light and dark (4.5:1 for text, 3:1 for icons and control
  outlines), before any screen uses them. Run it at setup and whenever the palette changes.

## Light on tokens

`SKILL.md` is a short router. The agent reads only the file for its phase:

| Phase | When | Reads |
|---|---|---|
| Setup | New project, no `design/DESIGN.md` | `phase-setup.md`, `tokens.md`, `color-tokens.md` |
| Audit | Existing UI, no `design/DESIGN.md` | `phase-audit.md` + tokens files; writes `design/audit.md` |
| Develop | `design/DESIGN.md` exists | `phase-develop.md` + one screen archetype, and `motion.md` if needed |
| Review | Before handing over | `phase-review.md`, `anti-patterns.md`, runs the checker |

Decisions the user marks **final** in `design/DESIGN.md` (font, scale, safe area, chrome, colour and
so on) are never asked about again.

## What's in the repo

```
skills/mobile-app-design-fundamental/
  SKILL.md              the router: phases, rules, which file to read
  references/           phase guides, tokens, colour, motion, copy, anti-patterns, device shell
    screens/            one file per screen archetype, plus states.md
  assets/
    tokens.css          starter tokens (4px grid, M3 type scale, four-tier colour, light and dark)
    shell/              device-shell.css / .js and a demo page
    templates/          DESIGN.md, COMPONENTS.md, REFERENCES.md, copied into the project's design/
  scripts/              check.mjs (rendered audit), check-tokens.mjs (token contrast)
  tests/                regression suite for both checkers and the shell
  evals/                skill evals: 6 should-fire and 4 should-not-fire cases
```

## Install

```bash
npx skills add https://github.com/nathanaelEvan/mobile-app-design-fundamental --skill mobile-app-design-fundamental
```

Alternatively, clone the repo and link the skill folder into `~/.claude/skills/` (on Windows, use a
directory junction), so a `git pull` updates it.

Also install the companion skill:

```
/plugin install modern-web-guidance@claude-plugins-official
```

For the reference workflow, connect the **Mobbin MCP**. An Awwwards MCP is optional and used for
mood only.

## Try the shell and the checker

```bash
cd skills/mobile-app-design-fundamental
node scripts/check.mjs assets/shell/demo.html
```

Open `assets/shell/demo.html` through any static server. On desktop you get the frame (add
`?frame=off` to see native mode); on a phone it is the app.

Check the starter tokens (or your own palette):

```bash
node scripts/check-tokens.mjs assets/tokens.css
```

## Tests and evals

The checker regression suite uses Node's built-in test runner (Node 22+ and Chrome, Edge or
Chromium; without them the tests skip):

```bash
cd skills/mobile-app-design-fundamental
node --test tests/check-tokens.test.mjs tests/check.test.mjs tests/shell.test.mjs
```

The skill evals check that the skill fires on mobile web UI work (and stays quiet on a backend
route, a Python script, a desktop admin table or a git question), and that its answers carry the
rules. They run full Claude sessions, so they cost money:

```bash
claude plugin eval . --case "no-*" --runs 1
```

See [`tests/README.md`](skills/mobile-app-design-fundamental/tests/README.md) for what each test
and eval covers.

## Credits

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Motion principles are adapted from
fluid-interactions (MIT). Inspiration came from taste-skill, impeccable, ui-ux-pro-max,
mobile-ui-skill-pack, Material Design 3 and Vuetify.

## License

MIT
