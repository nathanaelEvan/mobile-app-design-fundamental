// Regression suite for scripts/check.mjs. Run from anywhere: node --test <skill>/tests/check.test.mjs
// Each checker run spawns its own headless Chrome; the runs start together and the tests await them.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER = path.join(SKILL, 'scripts', 'check.mjs');
const RUN_TIMEOUT = 240_000;
const TEST_TIMEOUT = RUN_TIMEOUT + 30_000;

// Same discovery as check.mjs findChrome()
function findChrome() {
  if (process.env.CHROME_PATH) return fs.existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : null;
  const c = {
    win32: [
      `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
      `${process.env['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ],
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium', '/usr/bin/microsoft-edge'],
  }[process.platform] || [];
  return c.find((p) => p && fs.existsSync(p)) || null;
}
const CHROME = findChrome();
const NODE_OK = typeof WebSocket !== 'undefined';
const SKIP = !CHROME ? 'Chrome / Edge / Chromium not found (set CHROME_PATH)'
  : !NODE_OK ? `check.mjs needs Node 22+ (this is ${process.versions.node})` : false;

// Rule labels exactly as check.mjs prints them (its RULES table); keyed by the ids phase-review.md uses
const LABEL = {
  noShell: 'device shell installed',
  shell: 'device shell',
  overflow: 'overflow / clipping',
  truncated: 'truncated text (ellipsis)',
  fixed: 'fixed UI inside the phone',
  covered: 'no text under bars or the status bar',
  safe: 'safe area 16px',
  targets: 'touch targets ≥ 48',
  targetsOverlap: 'touch targets apart',
  targetsGap: 'small touch targets 8px apart',
  inputZoom: 'form fields ≥ 16px (no iOS zoom on focus)',
  nonSemanticClick: 'clickable elements are buttons or links',
  focus: 'keyboard focus is visible',
  contrast: 'text contrast (WCAG AA)',
  grid: '4px grid',
  type: 'type scale',
  vunits: 'no viewport units / width media queries in app CSS',
  hover: 'no :hover in app CSS',
  tiers: 'colour tiers (no primitives in components)',
  rawColour: 'raw colour literals in app CSS',
  textScale: 'text follows the user font size',
};

// "STATUS  label (n)" then indented detail lines -> { rule: { status, details[] } }
function parse(stdout) {
  const rules = {};
  let cur = null;
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^(PASS|WARN|FAIL|SKIP)\s+(.*)$/);
    if (m) {
      const rest = m[2];
      const id = Object.keys(LABEL).find((k) => rest === LABEL[k] || rest.startsWith(`${LABEL[k]} (`));
      cur = id ? (rules[id] = { status: m[1], details: [] }) : null;
      if (!id && rest.startsWith('content text styles')) rules.textStyles = { status: m[1], details: [rest] };
    } else if (cur && /^\s{8}\S/.test(line)) cur.details.push(line.trim());
    else cur = null;
  }
  return rules;
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'madf-test-'));
after(() => fs.rmSync(tmpRoot, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }));

const runs = new Map();
// Memoised: every run starts on first use, and all are started up front (below) so they overlap
function check(name, target, ...args) {
  if (runs.has(name)) return runs.get(name);
  const out = path.join(tmpRoot, name);
  const report = path.join(tmpRoot, `${name}.md`);
  const p = new Promise((resolve) => {
    // cwd = the skill folder: the checker then serves from there, so fixtures reach ../../assets
    const child = spawn(process.execPath, [CHECKER, target, '--out', out, '--report', report, ...args], { cwd: SKILL });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const t = setTimeout(() => child.kill(), RUN_TIMEOUT);
    child.on('close', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal, stdout, stderr, report, rules: parse(stdout) });
    });
  });
  runs.set(name, p);
  return p;
}
const RUNS = {
  demo: () => check('demo', 'assets/shell/demo.html'),
  demoClick: () => check('demo-click', 'assets/shell/demo.html', '--click', '#open-filter'),
  bad: () => check('bad', 'tests/fixtures/bad.html', '--click', '#open-pop'),
  noShell: () => check('no-shell', 'tests/fixtures/no-shell.html'),
};
if (!SKIP) Object.values(RUNS).forEach((r) => r());

const opts = { skip: SKIP, timeout: TEST_TIMEOUT };
const ran = (r) => assert.ok(r.code === 0 || r.code === 1, `checker crashed (exit ${r.code}${r.signal ? `, ${r.signal}` : ''}):\n${r.stderr}\n${r.stdout}`);
const quiet = (r) => {
  ran(r);
  const noisy = r.stdout.split(/\r?\n/).filter((l) => /^(FAIL|WARN|SKIP)\b/.test(l));
  assert.deepEqual(noisy, [], `expected every rule to PASS:\n${r.stdout}`);
  assert.equal(r.code, 0, r.stdout);
  for (const id of Object.keys(LABEL)) assert.equal(r.rules[id]?.status, 'PASS', `${id} missing or not PASS`);
};
// the rule is reported at `status` with a detail line containing every needle
const reports = (r, id, status, ...needles) => {
  const rule = r.rules[id];
  assert.ok(rule, `rule "${LABEL[id]}" not in the output:\n${r.stdout}`);
  assert.equal(rule.status, status, `${id}: ${rule.status}, expected ${status}\n${rule.details.join('\n')}`);
  assert.ok(rule.details.some((d) => needles.every((n) => d.includes(n))),
    `${id}: no detail line with ${JSON.stringify(needles)}:\n${rule.details.join('\n')}`);
};

// ---------------------------------------------------------------- known-good page

test('demo.html passes every rule', opts, async () => quiet(await RUNS.demo()));

test('demo.html passes with the filter sheet open (--click "#open-filter")', opts, async () => {
  const r = await RUNS.demoClick();
  quiet(r);
  assert.match(r.stdout, /native-412\+click\(#open-filter\)=native/);
  assert.match(r.stdout, /frame-1366x768\+click\(#open-filter\)=frame/);
});

test('--report writes the printed output as markdown', opts, async () => {
  const r = await RUNS.demo();
  const md = fs.readFileSync(r.report, 'utf8');
  assert.equal(md, `\`\`\`\n${r.stdout.replace(/\r\n/g, '\n').trimEnd()}\n\`\`\`\n`);
});

// ---------------------------------------------------------------- bad.html: one violation per rule

const BAD = [
  // [rule, status, ...substrings of one detail line]
  ['grid', 'FAIL', 'paddingTop 5px', 'div.bad-grid'],
  ['grid', 'FAIL', 'borderBottomRightRadius 5px', 'div.bad-radius'], // every corner, not only the top-left
  ['targets', 'FAIL', 'button.bad-small-a', '32×32'],
  ['targets', 'FAIL', 'summary.bad-summary', '"More"'],
  ['targets', 'FAIL', 'button.hit.bad-hit-dead', '×40'], // pointer-events: none on the pseudo-element
  ['targets', 'FAIL', 'button.hit.bad-hit-shifted', '×44'], // inset with height: 100% moves the box 4px up, does not grow it
  ['targets', 'FAIL', 'button.hit.bad-hit-clipped', '×40'], // overflow: hidden clips it (Vuetify 4 .v-btn)
  ['targetsGap', 'WARN', 'button.bad-small-a', 'button.bad-small-b', 'only 4px apart'],
  ['targetsOverlap', 'WARN', 'button.btn.bad-overlap-a', 'button.btn.bad-overlap-b', 'hit areas overlap'],
  ['hover', 'FAIL', '.bad-hover:hover'],
  ['vunits', 'FAIL', '.bad-vh', '100vh'],
  ['vunits', 'FAIL', '.bad-vi', '50vi'],
  ['vunits', 'FAIL', '@media (600px < width)'],
  ['tiers', 'FAIL', '.bad-primitive uses a primitive/brand token'],
  ['tiers', 'FAIL', '--bad-card-ink skips the semantic tier', '--p-neutral-900'],
  ['rawColour', 'WARN', '.bad-raw {', 'border-'],
  ['contrast', 'FAIL', 'p.bad-contrast', '1.00:1'],
  ['contrast', 'FAIL', 'p.bad-faded'],
  ['inputZoom', 'FAIL', 'input.bad-input', 'is 14px'],
  ['nonSemanticClick', 'WARN', 'div.bad-click', 'cursor: pointer'],
  ['focus', 'WARN', 'button.btn.bad-focus', 'no focus indicator'],
  ['focus', 'WARN', 'button.btn.bad-focus-late', 'no focus indicator'],
  ['fixed', 'FAIL', 'div#bad-pop', '(top layer) escapes the phone', 'frame-1366x768+click(#open-pop)'],
  ['type', 'FAIL', '15px is not in the type scale', 'p.bad-type'],
  ['overflow', 'FAIL', 'p.bad-clip', 'clips its text'],
  ['truncated', 'WARN', 'p.bad-ellipsis', 'truncated with ellipsis'],
  ['safe', 'FAIL', 'p.bad-edge', '"Edge text" 0px /'],
  ['covered', 'FAIL', 'p.bad-under', 'is hidden under header.app-bar'],
  ['covered', 'FAIL', 'p.bad-under', 'sits under the status bar'],
];

test('bad.html fails (exit 1)', opts, async () => {
  const r = await RUNS.bad();
  ran(r);
  assert.equal(r.code, 1, r.stdout);
});

for (const [id, status, ...needles] of BAD) {
  test(`bad.html: ${id} reports ${needles[0]}`, opts, async () => reports(await RUNS.bad(), id, status, ...needles));
}

test('bad.html: near misses stay quiet', opts, async () => {
  const r = await RUNS.bad();
  ran(r);
  const details = Object.values(r.rules).flatMap((x) => x.details);
  for (const needle of [
    'ok-', // .ok-cqi, .ok-container, .ok-active, .ok-rest, .ok-textarea, .ok-checkbox, .ok-check-label, .ok-role, .ok-hairline
    'cqi', 'cqb', // container units are not viewport units
    '@container', // container queries are not width media queries
    ':active',
    'textarea', // a 16px textarea does not zoom
    'checkbox', // a checkbox is not a text field
    'Div with a role', // role="button" + tabindex is a control
    'terms of use', // an inline text link is exempt from the target size
    'visually-hidden', 'Saved:', 'Skip back', // a .visually-hidden live region and skip link (overflow, safe, targets, contrast)
    'Fluid hero', // clamp() + cqi type is exempt from the type scale
    ':has(', // :root:has(meta[name=color-scheme]) is a root: its tokens are not app rules (tiers, rawColour)
    'dvh', // a token-shaped inline <style> is a token sheet: no viewport-unit rule
  ]) assert.ok(!details.some((d) => d.includes(needle)), `"${needle}" should not be reported:\n${details.filter((d) => d.includes(needle)).join('\n')}`);
  // rawColour prints 3 locations only: the count proves .bad-raw's 4 border longhands are all it found
  // (not the :root:has() tokens, nor .ok-nested-var's literal inside a nested var() fallback)
  assert.match(r.stdout, /raw colour literals in app CSS \(4 declarations, 1 distinct values\)/);
  // the bad page is otherwise sound: the shell is in place and in the right mode everywhere
  assert.equal(r.rules.shell.status, 'PASS', r.rules.shell.details.join('\n'));
  assert.equal(r.rules.noShell.status, 'PASS');
  assert.equal(r.rules.textScale.status, 'PASS');
});

// Regression: an absolute ::before hit area inside an overflow: hidden button raised scrollHeight,
// and overflow read the button as clipped text.
test('bad.html: a pseudo hit area clipped by its button is not clipped text', opts, async () => {
  const r = await RUNS.bad();
  ran(r);
  assert.ok(!r.rules.overflow.details.some((d) => d.includes('bad-hit-clipped')), r.rules.overflow.details.join('\n'));
});

// Regressions: inHScroller() once treated overflow-y:auto scrollers as horizontal and skipped these.
test('bad.html: text flush with the edge inside a vertical scroller fails the safe area', opts, async () => {
  reports(await RUNS.bad(), 'safe', 'FAIL', 'p.bad-edge-scroller');
});
test('bad.html: clipped text inside a vertical scroller fails overflow', opts, async () => {
  reports(await RUNS.bad(), 'overflow', 'FAIL', 'p.bad-clip-scroller', 'clips its text');
});
// an ellipsis turns the clipping FAIL into the truncated WARN; clipping without one stays FAIL
test('bad.html: ellipsis truncation is not an overflow FAIL', opts, async () => {
  const r = await RUNS.bad();
  assert.ok(!r.rules.overflow.details.some((d) => d.includes('bad-ellipsis')), r.rules.overflow.details.join('\n'));
});
// WCAG 1.4.10 Reflow: a native 320×640 run on the first state only (not repeated for --click states)
test('bad.html: the 320px reflow run is native, first state only', opts, async () => {
  const r = await RUNS.bad();
  assert.match(r.stdout, /native-320=native/);
  assert.doesNotMatch(r.stdout, /native-320\+click/);
});

// ---------------------------------------------------------------- no-shell.html: hand-made frame

test('no-shell.html: no kit, squashed phone, 100vh and px text', opts, async () => {
  const r = await RUNS.noShell();
  ran(r);
  assert.equal(r.code, 1, r.stdout);
  reports(r, 'noShell', 'WARN', 'no [data-device-shell]');
  reports(r, 'shell', 'FAIL', 'the phone is squashed', '[frame-1366x768]');
  reports(r, 'vunits', 'FAIL', '#app', 'max-block-size: 100vh');
  reports(r, 'textScale', 'WARN', 'sizes are not in rem/em');
});
