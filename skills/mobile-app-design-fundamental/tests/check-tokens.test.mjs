// Regression suite for scripts/check-tokens.mjs. No browser: node --test <skill>/tests/check-tokens.test.mjs
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(SKILL, 'scripts', 'check-tokens.mjs');
const TOKENS = fs.readFileSync(path.join(SKILL, 'assets', 'tokens.css'), 'utf8');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'check-tokens-'));
after(() => fs.rmSync(TMP, { recursive: true, force: true }));

const run = (css) => {
  const f = path.join(TMP, `t${Math.random().toString(36).slice(2)}.css`);
  fs.writeFileSync(f, css);
  const r = spawnSync(process.execPath, [SCRIPT, f], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
};
const swap = (from, to) => { assert.ok(TOKENS.includes(from), `tokens.css no longer has ${from}`); return TOKENS.replace(from, to); };

test('the starter tokens.css passes in light and dark', () => {
  const { code, out } = run(TOKENS);
  assert.equal(code, 0, out);
  assert.match(out, /0 fail, 0 skipped/);
});

test('the old subtle text value fails with its real ratios', () => {
  const { code, out } = run(swap('--p-neutral-550: #636b6b', '--p-neutral-550: #737b7b'));
  assert.equal(code, 1);
  assert.match(out, /FAIL {2}light {2}--on-surface-subtle on --bg-canvas: 4\.04/);
  assert.match(out, /FAIL {2}light {2}--on-surface-subtle on --bg-surface-02: 3\.72/);
});

test('an oklch palette is read, and a weak control stroke fails at 3:1', () => {
  const { code, out } = run(swap('--outline-control: light-dark(var(--p-neutral-500), var(--p-neutral-500))', '--outline-control: light-dark(oklch(0.85 0.01 200), var(--p-neutral-500))'));
  assert.equal(code, 1);
  assert.match(out, /FAIL {2}light {2}--outline-control on --bg-surface-01: 1\.\d\d \(needs 3\)/);
  assert.doesNotMatch(out, /SKIP/);
});

test('a color-mix fill in dark mode is resolved (error subtle)', () => {
  const { code, out } = run(swap('--on-error-subtle-default: light-dark(var(--p-red-700), var(--p-red-300))', '--on-error-subtle-default: light-dark(var(--p-red-700), var(--p-red-600))'));
  assert.equal(code, 1);
  assert.match(out, /FAIL\s+dark\s+--on-error-subtle-default on --bg-error-subtle/);
});

test('component pairs follow the grammar (--chip-on-selected on --chip-bg-selected)', () => {
  const { code, out } = run(swap('--chip-on-selected: var(--on-brand-subtle-default)', '--chip-on-selected: var(--on-disabled)'));
  assert.equal(code, 1);
  assert.match(out, /--chip-on-selected on --chip-bg-selected/);
});

test('an unreadable value is a SKIP, not a crash', () => {
  const { out } = run(swap('--p-neutral-550: #636b6b', '--p-neutral-550: color(display-p3 0.4 0.4 0.4)'));
  assert.match(out, /SKIP .*--on-surface-subtle .*cannot read/);
});

// ---------------------------------------------------------------- parser: modes, nesting, grammar

test('a nested @media dark fallback inside :root overrides the dark mode only', () => {
  const css = `:root { --bg-canvas: #ffffff; --on-surface-default: #1a1a1a;
    @media (prefers-color-scheme: dark) { --bg-canvas: #111111; --on-surface-default: #2a2a2a; } }`;
  const { code, out } = run(css);
  assert.equal(code, 1, out);
  assert.match(out, /1 pairs/);
  assert.match(out, /FAIL\s+dark\s+--on-surface-default on --bg-canvas/);
  assert.doesNotMatch(out, /FAIL\s+light/);
});

test('[data-theme="dark"] on the root is the dark mode; a later declaration wins', () => {
  const css = `:root { --bg-canvas: #ffffff; --on-surface-default: #eeeeee; }
    :root { --on-surface-default: #1a1a1a; }
    :root[data-theme="dark"] { --bg-canvas: #111111; --on-surface-default: #f0f0f0; }`;
  const { code, out } = run(css);
  assert.equal(code, 0, out);
  assert.match(out, /2 pass, 0 fail/);
});

test('hyphenated component names pair up (--nav-bar-on on --nav-bar-bg)', () => {
  const { code, out } = run(':root { --nav-bar-bg: #ffffff; --nav-bar-on: #eeeeee; }');
  assert.equal(code, 1, out);
  assert.match(out, /--nav-bar-on on --nav-bar-bg/);
});

test('color-mix() reads a percentage before the colour', () => {
  const { code, out } = run(':root { --bg-canvas: #ffffff; --on-surface-default: color-mix(in srgb, 80% #000000, #ffffff); }');
  assert.equal(code, 0, out);
  assert.doesNotMatch(out, /SKIP/);
});

test('color-mix(in oklch) keeps the chroma between opposite hues (polar, not oklab)', () => {
  // in oklab the two cancel to a grey; in oklch the mix keeps C 0.15 on the hue between them
  // a light fill under white text, so the pair fails and prints the fill's hex
  const { out } = run(':root { --bg-canvas: #ffffff; --bg-brand-default: color-mix(in oklch, oklch(0.8 0.15 10), oklch(0.8 0.15 180)); --on-brand-default: #ffffff; }');
  const fill = out.match(/#ffffff on (#[0-9a-f]{6})/)?.[1];
  assert.ok(fill, out);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(fill.slice(i, i + 2), 16));
  assert.ok(Math.max(r, g, b) - Math.min(r, g, b) > 40, `${fill} is a grey: the hues were mixed in oklab`);
});

test('the modern-web-guidance meta toggle (:root:has(meta[name=color-scheme][content=dark])) is the dark mode', () => {
  const css = `:root { --bg-canvas: #ffffff; --on-surface-default: #1a1a1a; }
    :root:has(> head > meta[name="color-scheme"][content="dark"]) { --bg-canvas: #111111; }`;
  const { code, out } = run(css);
  assert.equal(code, 1, out);
  assert.match(out, /FAIL\s+dark\s+--on-surface-default on --bg-canvas/);
  assert.doesNotMatch(out, /FAIL\s+light/);
});

test('the meta toggle nested (:root { &:has(…[content="light"]) }) and :where(:root) are read', () => {
  const css = `:where(:root) { --bg-canvas: #111111; --on-surface-default: #f0f0f0;
      &:has(> head > meta[name="color-scheme"][content="light"]) { --bg-canvas: #ffffff; } }
    :where(:root)[data-theme="dark"] { --on-surface-default: #222222; }`;
  const { code, out } = run(css);
  assert.equal(code, 1, out);
  assert.match(out, /FAIL\s+light\s+--on-surface-default on --bg-canvas: 1\.\d\d/);
  assert.match(out, /FAIL\s+dark\s+--on-surface-default on --bg-canvas/);
});

test('any other :root:has() is a state, not a mode, and is not read', () => {
  const { code, out } = run(`:root { --bg-canvas: #ffffff; --on-surface-default: #1a1a1a; }
    :root:has(dialog[open]) { --on-surface-default: #ffffff; }`);
  assert.equal(code, 0, out);
});

test('image --icon-* tokens (url() masks, modern-web-guidance icons) make no pair and no SKIP', () => {
  const { code, out } = run(swap(':root {\n  --bg-canvas:', `:root {
  --icon-trash: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E");
  --icon-action-share: url("/icons/share.svg");
  --icon-surface-menu: var(--icon-trash);
  --icon-on-error: linear-gradient(red, blue);
  --icon-style-size: 1em;
  --bg-canvas:`));
  assert.equal(code, 0, out);
  assert.match(out, /0 fail, 0 skipped/);
  assert.doesNotMatch(out, /--icon-(action-share|surface-menu|on-error|trash)/);
});

test('a colour token that points at an undefined var() is still reported as SKIP', () => {
  const { out } = run(':root { --bg-canvas: #ffffff; --icon-surface-default: var(--nope); }');
  assert.match(out, /SKIP .*--icon-surface-default .*--nope is not defined/);
});

// ---------------------------------------------------------------- --json: drift against tokens.json

const runJson = (json) => {
  const css = path.join(TMP, `d${Math.random().toString(36).slice(2)}.css`);
  const js = path.join(TMP, `d${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(css, TOKENS);
  fs.writeFileSync(js, typeof json === 'string' ? json : JSON.stringify(json));
  const r = spawnSync(process.execPath, [SCRIPT, css, '--json', js], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
};
const theme = (bg, fg) => ({ map: { background: 'bg-canvas', 'on-surface': 'on-surface-default' },
  light: { background: bg, 'on-surface': fg }, dark: { background: bg, 'on-surface': fg } });

test('--json: a hex that no longer matches its token is a drift; the right ones pass', () => {
  const wrong = runJson(theme('#123456', '#123456'));
  assert.equal(wrong.code, 1, wrong.out);
  assert.match(wrong.out, /DRIFT {2}light {2}background: tokens\.json #123456 but --bg-canvas is #[0-9a-f]{6}/);
  // take the resolved values from the report and feed them back: no drift
  const want = (mode, key) => wrong.out.match(new RegExp(`DRIFT  ${mode}\\s+${key}: tokens\\.json #123456 but --[\\w-]+ is (#[0-9a-f]{6})`))[1];
  const ok = runJson({ map: theme().map,
    light: { background: want('light', 'background'), 'on-surface': want('light', 'on-surface') },
    dark: { background: want('dark', 'background'), 'on-surface': want('dark', 'on-surface') } });
  assert.equal(ok.code, 0, ok.out);
  assert.match(ok.out, /tokens\.json: 4 values compared — 0 drift/);
});

test('--json: a missing map entry, an undeclared token and a comment are reported', () => {
  const r = runJson({ map: { background: 'bg-nope', extra: 'bg-canvas' }, light: { background: '#ffffff', stray: '#000000' }, dark: {} });
  assert.equal(r.code, 1);
  assert.match(r.out, /background: --bg-nope is not declared in the CSS/);
  assert.match(r.out, /stray: not in "map"/);
  assert.match(r.out, /dark +extra: in "map" but has no dark value/);
  const c = runJson('{\n  // a note\n  "map": {}\n}');
  assert.equal(c.code, 1);
  assert.match(c.out, /is not valid JSON.*"\$comment" key/);
});
