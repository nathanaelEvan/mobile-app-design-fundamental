// Regression suite for assets/shell/device-shell.css (and the scheme half of tokens.css), in headless
// Chrome over CDP. node --test <skill>/tests/shell.test.mjs. Needs Node 22+ and Chrome / Edge / Chromium.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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
const SKIP = !CHROME ? 'Chrome / Edge / Chromium not found (set CHROME_PATH)'
  : typeof WebSocket === 'undefined' ? `needs Node 22+ (this is ${process.versions.node})` : false;

// ---------------------------------------------------------------- server + browser

let server, origin, proc, profile, ws, session;
const pending = new Map();
let seq = 0;
const send = (method, params = {}, sessionId = session) => new Promise((res, rej) => {
  const id = ++seq;
  pending.set(id, { res, rej, method });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const events = new Set();
const once = (method) => new Promise((res, rej) => {
  const t = setTimeout(() => { events.delete(l); rej(new Error(`timeout waiting for ${method}`)); }, 20000);
  const l = (d) => { if (d.method === method && d.sessionId === session) { clearTimeout(t); events.delete(l); res(d.params); } };
  events.add(l);
});
async function evaluate(expression) {
  const { result, exceptionDetails } = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
  return result.value;
}
// a fresh document at this viewport and system scheme
async function open(file, { w, h, mobile = false, dark = false, query = '' }) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 });
  await scheme(dark, mobile);
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: `${origin}/tests/fixtures/${file}${query}` });
  await loaded;
  await evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))');
}
const scheme = (dark, mobile = false) => send('Emulation.setEmulatedMedia', { features: [
  { name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' },
  { name: 'pointer', value: mobile ? 'coarse' : 'fine' }, { name: 'hover', value: mobile ? 'none' : 'hover' },
] });

before(async () => {
  if (SKIP) return;
  server = http.createServer((req, res) => {
    const p = path.join(SKILL, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(SKILL) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' }[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  origin = `http://127.0.0.1:${server.address().port}`;
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'madf-shell-'));
  proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--no-default-browser-check', '--hide-scrollbars', ...(process.platform === 'linux' ? ['--disable-dev-shm-usage'] : []),
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chrome did not start')), 20000);
    proc.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    proc.on('exit', () => rej(new Error('Chrome exited early')));
  });
  ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const p = pending.get(d.id); pending.delete(d.id);
      d.error ? p.rej(new Error(`${p.method}: ${d.error.message}`)) : p.res(d.result);
    } else for (const l of events) l(d);
  };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, undefined);
  ({ sessionId: session } = await send('Target.attachToTarget', { targetId, flatten: true }, undefined));
  await send('Page.enable');
});

after(async () => {
  try { ws?.close(); } catch {}
  if (proc && proc.exitCode === null) {
    const gone = new Promise((r) => proc.once('exit', r));
    proc.kill();
    await Promise.race([gone, new Promise((r) => setTimeout(r, 5000))]);
  }
  server?.close();
  if (profile) try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
});

// ---------------------------------------------------------------- top layer: popover vs dialog

// in the page: open the menu and the drawer, and measure them against the phone screen
function measure() {
  const menu = document.getElementById('menu'), drawer = document.getElementById('drawer');
  const screen = document.querySelector('.dsh-screen').getBoundingClientRect();
  menu.showPopover();
  const cs = getComputedStyle(menu);
  const out = { mode: document.documentElement.dataset.shell, menu: { top: cs.top, left: cs.left } };
  menu.hidePopover();
  drawer.showModal();
  const r = drawer.getBoundingClientRect();
  out.screen = { left: screen.left, top: screen.top, right: screen.right, bottom: screen.bottom };
  out.drawer = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  return out;
}
const inside = (r, s, tol = 1.5) => r.left >= s.left - tol && r.top >= s.top - tol && r.right <= s.right + tol && r.bottom <= s.bottom + tol;

test('frame: a one-class .menu popover keeps its own insets; a modal .drawer { inset: 0 } stays on the phone', { skip: SKIP }, async () => {
  await open('popover-anchor.html', { w: 1366, h: 768, query: '?frame=on' });
  const m = await evaluate(`(${measure})()`);
  assert.equal(m.mode, 'frame');
  // the shell's inset is the screen rect / scale (hundreds of px); the menu asked for 8px 12px
  assert.deepEqual(m.menu, { top: '8px', left: '12px' }, JSON.stringify(m));
  assert.ok(inside(m.drawer, m.screen), `drawer escapes the phone: ${JSON.stringify(m)}`);
  // confined, not merely small: it starts at the screen's corner and spans its height
  assert.ok(Math.abs(m.drawer.left - m.screen.left) < 1.5 && Math.abs(m.drawer.top - m.screen.top) < 1.5, JSON.stringify(m));
  assert.ok(Math.abs(m.drawer.bottom - m.screen.bottom) < 1.5, JSON.stringify(m));
});

test('frame: a closing drawer ([data-dsh-closing]) stays on the phone while its exit runs', { skip: SKIP }, async () => {
  await open('popover-anchor.html', { w: 1366, h: 768, query: '?frame=on' });
  const m = await evaluate(`(async () => {
    const d = document.getElementById('drawer');
    d.showModal();
    await new Promise((r) => setTimeout(r, 400));
    d.close();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    // computed values, not the box: Chrome does not lay out a dialog again during its overlay exit,
    // so getBoundingClientRect() keeps the open position whatever the cascade now says
    const root = getComputedStyle(document.documentElement), cs = getComputedStyle(d);
    const scale = parseFloat(root.getPropertyValue('--dsh-scale'));
    return { closing: d.hasAttribute('data-dsh-closing'), modal: d.matches(':modal'), display: cs.display, scale,
      top: parseFloat(cs.top), left: parseFloat(cs.left), zoom: parseFloat(cs.zoom),
      want: { top: parseFloat(root.getPropertyValue('--dsh-screen-top')) / scale, left: parseFloat(root.getPropertyValue('--dsh-screen-left')) / scale } };
  })()`);
  if (!m.closing) return; // a browser without transition-property: overlay leaves the top layer at once
  assert.equal(m.modal, false);
  assert.equal(m.display, 'block', 'the exit is still drawing the drawer');
  // the shell's insets and zoom, not the app's inset: 0 (which would put it on the window corner)
  assert.ok(m.scale < 1 && Math.abs(m.zoom - m.scale) < 1e-3, `closing drawer lost the zoom: ${JSON.stringify(m)}`);
  assert.ok(Math.abs(m.top - m.want.top) < 0.5 && Math.abs(m.left - m.want.left) < 0.5, `closing drawer jumps off the phone: ${JSON.stringify(m)}`);
});

test('native on a wide viewport: the .menu keeps its insets; the drawer stays over the phone column', { skip: SKIP }, async () => {
  await open('popover-anchor.html', { w: 1024, h: 1366, mobile: true, query: '?frame=off' });
  const m = await evaluate(`(${measure})()`);
  assert.equal(m.mode, 'native');
  assert.deepEqual(m.menu, { top: '8px', left: '12px' }, JSON.stringify(m));
  assert.ok(m.drawer.left >= m.screen.left - 1.5 && m.drawer.right <= m.screen.right + 1.5, `drawer outside the column: ${JSON.stringify(m)}`);
});

// ---------------------------------------------------------------- scheme: data-theme and the MWG meta

const LIGHT_INK = '#1b1b1f', DARK_INK = '#f4f4f6';
const state = () => evaluate(`(() => {
  const root = document.documentElement;
  return { scheme: getComputedStyle(root).colorScheme, ink: getComputedStyle(root).getPropertyValue('--dsh-ink').trim(),
    canvas: getComputedStyle(document.getElementById('app')).backgroundColor };
})()`);
const set = (meta, theme, statusbar) => evaluate(`(() => {
  const root = document.documentElement;
  document.querySelector('meta[name="color-scheme"]').content = ${JSON.stringify(meta)};
  ${theme ? `root.dataset.theme = ${JSON.stringify(theme)};` : 'delete root.dataset.theme;'}
  ${statusbar ? `root.dataset.statusbar = ${JSON.stringify(statusbar)};` : 'delete root.dataset.statusbar;'}
})()`);

test('the color-scheme meta pins the scheme and the status bar; data-theme wins over it; the system is the default', { skip: SKIP }, async () => {
  await open('meta-scheme.html', { w: 1366, h: 768, query: '?frame=on' });
  const cases = [
    // system dark, meta, data-theme, data-statusbar -> color-scheme, ink
    [false, 'light dark', null, null, 'light dark', LIGHT_INK],
    [true, 'light dark', null, null, 'light dark', DARK_INK],
    [false, 'dark', null, null, 'dark', DARK_INK],
    [true, 'light', null, null, 'light', LIGHT_INK],
    [true, 'dark', 'light', null, 'light', LIGHT_INK],
    [false, 'light', 'dark', null, 'dark', DARK_INK],
    [true, 'light', 'dark', null, 'dark', DARK_INK],
    [false, 'dark', null, 'dark', 'dark', LIGHT_INK],   // the app's tone wins (DeviceShell.setStatusBar)
  ];
  const canvas = {};
  for (const [dark, meta, theme, statusbar, want, ink] of cases) {
    await scheme(dark);
    await set(meta, theme, statusbar);
    const s = await state();
    const label = JSON.stringify({ dark, meta, theme, statusbar });
    assert.equal(s.scheme, want, label);
    assert.equal(s.ink, ink, label);
    // light-dark() tokens follow the used scheme
    const used = want === 'light dark' ? (dark ? 'dark' : 'light') : want;
    (canvas[used] ??= new Set()).add(s.canvas);
  }
  assert.equal(canvas.light.size, 1);
  assert.equal(canvas.dark.size, 1);
  assert.notDeepEqual([...canvas.light], [...canvas.dark]);
});
