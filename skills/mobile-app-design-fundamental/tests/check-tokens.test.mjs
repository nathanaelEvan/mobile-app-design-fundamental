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
