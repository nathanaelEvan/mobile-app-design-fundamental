#!/usr/bin/env node
/*
  check.mjs — mobile-app-design-fundamental
  Renders a mobile web app in headless Chrome as a phone (native) and on desktop (frame), and
  reports the fundamentals: 4px grid, safe area, touch targets, type scale, overflow, viewport
  units, hover, colour tiers and the device shell. Node 22+, Chrome / Edge / Chromium. No installs.

  node check.mjs <url | html file[?query]> [--out dir] [--root selector] [--report file.md]
                 [--states "?screen=home,?screen=detail"] [--type-sizes 57,45,36,32,28,24,22,16,14,12,11]
                 [--only native|frame]

  --states audits several screens of one app: each entry is appended to the URL (query or #hash).
  Without it only the landing screen is audited by the DOM rules (stylesheet rules cover all CSS).
*/
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------------------------------------------------------------- args

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : def; };
const target = argv.find((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
if (!target) {
  console.log('usage: node check.mjs <url | html file[?query]> [--out dir] [--root selector] [--report file.md] [--states list] [--type-sizes list] [--only native|frame]');
  process.exit(2);
}
const [, TARGET_PATH, TARGET_QUERY] = target.match(/^([^?#]*)(.*)$/);
const STATES = (opt('states', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const withState = (url, state) => {
  if (!state) return url;
  if (state.startsWith('#')) return url.replace(/#.*$/, '') + state;
  const q = state.replace(/^\?/, '');
  const [base, hash = ''] = url.split('#');
  return `${base}${base.includes('?') ? '&' : '?'}${q}${hash ? `#${hash}` : ''}`;
};
const OUT = path.resolve(opt('out', '.mobile-design-check'));
const ROOT_SEL = opt('root', '[data-app-root]');
const REPORT = opt('report', null);
const ONLY = opt('only', null);
const TYPE_SIZES = (opt('type-sizes', '57,45,36,32,28,24,22,16,14,12,11')).split(',').map(Number);

const SCENARIOS = [
  { id: 'native-412', w: 412, h: 915, mobile: true, expect: 'native', full: true },
  { id: 'native-360', w: 360, h: 800, mobile: true, expect: 'native' },
  { id: 'native-430', w: 430, h: 932, mobile: true, expect: 'native' },
  { id: 'native-412-text200', w: 412, h: 915, mobile: true, expect: 'native', fontPx: 32 },
  { id: 'frame-1440x900', w: 1440, h: 900, mobile: false, expect: 'frame' },
  { id: 'frame-1366x768', w: 1366, h: 768, mobile: false, expect: 'frame' },
].filter((s) => !ONLY || s.expect === ONLY);

// ---------------------------------------------------------------- serve a file target

async function resolveTarget() {
  if (/^https?:\/\//.test(target)) return { url: target };
  const file = path.resolve(TARGET_PATH);
  if (!fs.existsSync(file)) throw new Error(`not found: ${TARGET_PATH}`);
  // serve over HTTP so stylesheets are readable (file:// sheets are cross-origin to the page)
  const base = file.startsWith(process.cwd()) ? process.cwd() : path.dirname(file);
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
    '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
  const server = http.createServer((req, res) => {
    const p = path.join(base, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!p.startsWith(base) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const rel = path.relative(base, file).split(path.sep).map(encodeURIComponent).join('/');
  return { url: `http://127.0.0.1:${server.address().port}/${rel}${TARGET_QUERY}`, server };
}

// ---------------------------------------------------------------- chrome + CDP

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
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
    linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge'],
  }[process.platform] || [];
  const hit = c.find((p) => p && fs.existsSync(p));
  if (!hit) throw new Error('Chrome, Edge or Chromium not found; set CHROME_PATH');
  return hit;
}

async function launch() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'madf-'));
  const proc = spawn(findChrome(), ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chrome did not start')), 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(t); res(m[1]); }
    });
    proc.on('exit', () => rej(new Error('Chrome exited early')));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) {
      const p = pending.get(d.id); pending.delete(d.id);
      d.error ? p.rej(new Error(`${p.method}: ${d.error.message}`)) : p.res(d.result);
    } else for (const l of listeners) l(d);
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const n = ++id; pending.set(n, { res, rej, method });
    ws.send(JSON.stringify({ id: n, method, params, sessionId }));
  });
  const waitFor = (method, sessionId, ms = 30000) => new Promise((res, rej) => {
    const t = setTimeout(() => { listeners.delete(l); rej(new Error(`timeout waiting for ${method}`)); }, ms);
    const l = (d) => { if (d.method === method && d.sessionId === sessionId) { clearTimeout(t); listeners.delete(l); res(d.params); } };
    listeners.add(l);
  });
  const close = () => { try { ws.close(); } catch {} proc.kill(); setTimeout(() => fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 }), 500); };
  return { send, waitFor, close };
}

// ---------------------------------------------------------------- in-page audit

function audit({ rootSel, typeSizes, full }) {
  const R = { grid: [], safe: [], targets: [], targetsOverlap: [], type: [], typeCount: null, overflow: [], vunits: [], hover: [],
    tiers: [], rawColour: [], shell: [], fixed: [], covered: [], noShell: [], info: {} };
  const root = document.querySelector(rootSel);
  if (!root) return { fatal: `no element matches ${rootSel}` };
  const html = document.documentElement;
  const scale = window.DeviceShell?.scale ?? 1;
  const fontScale = parseFloat(getComputedStyle(html).fontSize) / 16;
  const rr = root.getBoundingClientRect();
  R.info = { shell: html.dataset.shell || '(none)', scale: +scale.toFixed(3), fontScale, root: [Math.round(rr.width), Math.round(rr.height)] };

  const name = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) s += `#${e.id}`;
    const c = [...e.classList].slice(0, 2).join('.');
    if (c) s += `.${c}`;
    return s;
  };
  const visible = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden' && e.getClientRects().length > 0; };
  const els = [...root.querySelectorAll('*')].filter(visible);
  const inHScroller = (e) => { for (let n = e.parentElement; n && n !== root; n = n.parentElement) { const o = getComputedStyle(n).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; };
  const ownText = (e) => [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
  const scrollers = [root, ...els].filter((e) => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 1);
  const scrollerOf = (e) => scrollers.filter((s) => s.contains(e) && s !== e).pop();
  const clippedByAncestor = (e) => { for (let n = e.parentElement; n && n !== root; n = n.parentElement) if (/(hidden|clip)/.test(getComputedStyle(n).overflowX)) return true; return false; };

  // median text size, to tell whether text follows the user's font size (compared across runs)
  const textSizes = els.filter((e) => ownText(e).length).map((e) => parseFloat(getComputedStyle(e).fontSize)).sort((a, b) => a - b);
  R.info.medianFont = textSizes.length ? textSizes[Math.floor(textSizes.length / 2)] : 0;

  // ---- grid (default text size only)
  if (full) {
    const props = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'rowGap', 'columnGap', 'borderTopLeftRadius', 'lineHeight'];
    const bad = new Map();
    const off = (n) => Number.isFinite(n) && Math.abs(n) > 1.05 && Math.abs(n / 4 - Math.round(n / 4)) > 0.02;
    for (const e of els) {
      const cs = getComputedStyle(e);
      if (e instanceof SVGElement) continue; // icon and illustration internals are drawn, not laid out
      for (const p of props) {
        const v = cs[p];
        if (!v || v === 'normal' || v.endsWith('%')) continue;
        if (p === 'lineHeight' && !ownText(e).length) continue;
        const n = parseFloat(v);
        if (p === 'borderTopLeftRadius') { const b = e.getBoundingClientRect(); if (n >= Math.min(b.width, b.height) / scale / 2 - 0.5 || n >= 999) continue; }
        if ((p === 'rowGap' || p === 'columnGap') && !/(flex|grid)/.test(cs.display)) continue;
        if (off(n)) { const k = `${p} ${+n.toFixed(2)}px`; if (!bad.has(k)) bad.set(k, []); bad.get(k).push(name(e)); }
      }
      if (e.matches('button, input, select, textarea, [role="button"]')) {
        const h = e.getBoundingClientRect().height / scale;
        // controls only (≤ 64px); card-sized tappables take their content's height
        if (h <= 64 && off(h)) { const k = `control height ${+h.toFixed(2)}px`; if (!bad.has(k)) bad.set(k, []); bad.get(k).push(name(e)); }
      }
    }
    for (const [k, list] of bad) R.grid.push(`${k} — ${[...new Set(list)].slice(0, 3).join(', ')}${list.length > 3 ? ` (+${list.length - 3})` : ''}`);
  }

  // ---- safe area (text closer than 16px to the side edges)
  const edge = 16 * scale - 0.5;
  for (const e of els) {
    const t = ownText(e);
    if (!t.length || inHScroller(e) || e.closest('.dsh-statusbar')) continue;
    const range = document.createRange();
    range.selectNodeContents(e);
    const b = range.getBoundingClientRect();
    if (!b.width) continue;
    if (b.left - rr.left < edge || rr.right - b.right < edge) {
      R.safe.push(`${name(e)} "${e.textContent.trim().slice(0, 32)}" ${Math.round((b.left - rr.left) / scale)}px / ${Math.round((rr.right - b.right) / scale)}px from the edges`);
    }
  }

  // ---- touch targets
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="tab"], [role="link"], [role="checkbox"], [role="switch"], [role="menuitem"], [tabindex]:not([tabindex="-1"])';
  const targets = [];
  for (const e of root.querySelectorAll(sel)) {
    if (!visible(e) || e.disabled) continue;
    if (e.tagName === 'A' && e.parentElement && e.parentElement.textContent.trim().length > e.textContent.trim().length + 2 && getComputedStyle(e).display === 'inline') continue;
    const b = e.getBoundingClientRect();
    let x0 = b.left, x1 = b.right, y0 = b.top, y1 = b.bottom;
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(e, pseudo);
      if (ps.content === 'none' || ps.position !== 'absolute') continue;
      const v = (p) => { const n = parseFloat(ps[p]); return Number.isFinite(n) ? n * scale : 0; };
      x0 = Math.min(x0, b.left + Math.min(0, v('left'))); x1 = Math.max(x1, b.right - Math.min(0, v('right')));
      y0 = Math.min(y0, b.top + Math.min(0, v('top'))); y1 = Math.max(y1, b.bottom - Math.min(0, v('bottom')));
    }
    const w = (x1 - x0) / scale, h = (y1 - y0) / scale;
    targets.push({ e, x0, x1, y0, y1 });
    if (Math.min(w, h) < 47.5) R.targets.push(`${name(e)} "${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24)}" ${Math.round(w)}×${Math.round(h)}`);
  }
  const overlaps = new Set();
  for (let i = 0; i < targets.length; i++) for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i], b = targets[j];
    if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    if (scrollerOf(a.e) !== scrollerOf(b.e)) continue; // one scrolls under the other (a bar): scrolling separates them
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    if (ox > 1 && oy > 1) overlaps.add(`${name(a.e)} ↔ ${name(b.e)} hit areas overlap`);
  }
  R.targetsOverlap.push(...overlaps);

  // ---- type (default text size only)
  if (full) {
    const styles = new Set(), weights = new Set(), sizes = new Map();
    for (const e of els) {
      if (!ownText(e).length || e.closest('.dsh-statusbar')) continue;
      const cs = getComputedStyle(e);
      const fs = +(parseFloat(cs.fontSize) / fontScale).toFixed(2);
      weights.add(cs.fontWeight);
      // the budget counts content styles: app bar and navigation bar labels are chrome
      if (!e.closest('header, nav, [role="banner"], [role="navigation"], [role="tablist"]')) styles.add(`${fs}/${cs.fontWeight}`);
      if (!typeSizes.some((s) => Math.abs(s - fs) < 0.1)) { if (!sizes.has(fs)) sizes.set(fs, []); sizes.get(fs).push(name(e)); }
    }
    for (const [fs, list] of sizes) R.type.push(`${fs}px is not in the type scale — ${[...new Set(list)].slice(0, 3).join(', ')}`);
    R.typeCount = { styles: [...styles], weights: [...weights] };
  }

  // ---- overflow and clipping
  const se = document.scrollingElement;
  if (se.scrollWidth > se.clientWidth + 1) R.overflow.push(`page scrolls sideways (${se.scrollWidth} > ${se.clientWidth})`);
  for (const e of els) {
    if (inHScroller(e) || (e instanceof SVGElement && e.tagName.toLowerCase() !== 'svg') || clippedByAncestor(e)) continue;
    const b = e.getBoundingClientRect();
    if (getComputedStyle(e).position !== 'fixed' && (b.right > rr.right + 1 || b.left < rr.left - 1) && b.width < rr.width * 3) {
      R.overflow.push(`${name(e)} sticks out of the app (${Math.round((b.left - rr.left) / scale)}…${Math.round((b.right - rr.left) / scale)})`);
    }
    if (ownText(e).length) {
      const cs = getComputedStyle(e);
      if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) {
        R.overflow.push(`${name(e)} clips its text`);
      }
    }
  }

  // ---- text that can never be seen: under a bar or the status bar at the scroll position where it
  //      should be reachable (checked at the top and at the bottom of every vertical scroller)
  const insetTop = parseFloat(getComputedStyle(root).getPropertyValue('--app-inset-top')) || 0;
  const coveredSeen = new Set();
  const OVERLAY = /fixed|sticky|absolute/;
  const checkCovered = () => {
    for (const e of els) {
      if (!ownText(e).length || e.closest('.dsh-statusbar')) continue;
      const range = document.createRange();
      range.selectNodeContents(e);
      const b = range.getBoundingClientRect();
      if (!b.width || b.bottom < rr.top || b.top > rr.bottom || b.left > rr.right || b.right < rr.left) continue;
      const fixedSelf = /fixed|sticky/.test(getComputedStyle(e).position) || e.closest('header, nav');
      const sc = scrollerOf(e);
      const canUp = sc && sc.scrollTop > 1;
      const canDown = sc && sc.scrollTop + sc.clientHeight < sc.scrollHeight - 1;
      const label = `${name(e)} "${e.textContent.trim().slice(0, 28)}"`;
      if (insetTop && !fixedSelf && b.top < rr.top + insetTop * scale - 0.5 && !canUp) {
        coveredSeen.add(`${label} sits under the status bar`); continue;
      }
      const x = Math.min(Math.max(b.left + b.width / 2, rr.left + 1), rr.right - 1);
      const y = Math.min(Math.max(b.top + Math.min(b.height / 2, 8 * scale), rr.top + 1), rr.bottom - 1);
      const hit = document.elementFromPoint(x, y);
      if (!hit || hit === e || e.contains(hit) || hit.contains(e)) continue;
      let cover = hit;
      while (cover.parentElement && cover.parentElement !== root && !OVERLAY.test(getComputedStyle(cover).position)) cover = cover.parentElement;
      // a cover is an overlay that stays put while the text's scroller moves (a bar, a tab bar)
      if (!OVERLAY.test(getComputedStyle(cover).position) || cover.contains(e) || (sc && sc.contains(cover))) continue;
      const cb = cover.getBoundingClientRect();
      // a bar anchored to the bottom edge hides what scrolling down reveals, and the reverse at the top
      const coverIsBelow = Math.abs(cb.bottom - rr.bottom) < Math.abs(cb.top - rr.top);
      if ((coverIsBelow && canDown) || (!coverIsBelow && canUp)) continue; // scroll reveals it
      coveredSeen.add(`${label} is hidden under ${name(cover)}`);
    }
  };
  const saved = scrollers.map((s) => s.scrollTop);
  scrollers.forEach((s) => { s.scrollTop = 0; });
  checkCovered();
  scrollers.forEach((s) => { s.scrollTop = s.scrollHeight; });
  checkCovered();
  scrollers.forEach((s, i) => { s.scrollTop = saved[i]; });
  R.covered.push(...coveredSeen);

  // ---- fixed UI must stay inside the phone
  for (const e of els) {
    if (getComputedStyle(e).position !== 'fixed') continue;
    const b = e.getBoundingClientRect();
    if (b.left < rr.left - 1 || b.right > rr.right + 1 || b.top < rr.top - 1 || b.bottom > rr.bottom + 1) R.fixed.push(`${name(e)} is fixed to the window, not the app root`);
  }

  // ---- stylesheets: viewport units, width media queries, hover, colour tiers (once)
  if (full) {
    const VU = /(?:\d|\))\s*(dvh|svh|lvh|vh|dvw|svw|lvw|vw|vmin|vmax)\b/;
    const HEX = /#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/i;
    const isRootSel = (s) => /^(:root|html)(\[[^\]]*\]|:not\([^)]*\))*$/.test(s.trim());
    const walk = (rules, src) => {
      for (const r of rules) {
        if (r.cssRules && r.conditionText !== undefined && r.constructor.name === 'CSSMediaRule') {
          if (/(min-|max-)?(width|height)\s*[:<>=]/.test(r.conditionText) || /\b(min|max)-(width|height)\b/.test(r.conditionText)) R.vunits.push(`@media ${r.conditionText} in ${src}`);
          walk(r.cssRules, src); continue;
        }
        if (r.cssRules && !r.style) { walk(r.cssRules, src); continue; }
        if (!r.style || !r.selectorText) continue;
        const text = r.style.cssText;
        if (VU.test(text)) R.vunits.push(`${r.selectorText} { ${text.match(new RegExp(`[\\w-]+:[^;]*${VU.source}[^;]*`))?.[0] || 'viewport unit'} } in ${src}`);
        if (/:hover\b/.test(r.selectorText)) R.hover.push(`${r.selectorText} in ${src}`);
        const rootRule = r.selectorText.split(',').every(isRootSel);
        if (!rootRule && /var\(--(p|brand)-/.test(text)) R.tiers.push(`${r.selectorText} uses a primitive/brand token in ${src}`);
        if (!rootRule) for (let i = 0; i < r.style.length; i++) {
          const p = r.style[i];
          if (!/(color|background|border|outline|fill|stroke|shadow)/.test(p)) continue;
          const v = r.style.getPropertyValue(p);
          if (HEX.test(v.replace(/var\([^)]*\)/g, '')) && !/^(transparent|currentcolor|inherit)$/i.test(v.trim())) R.rawColour.push({ at: `${r.selectorText} { ${p} } in ${src}`, value: v.trim() });
        }
      }
    };
    for (const sh of document.styleSheets) {
      const src = sh.href ? sh.href.split('/').pop() : '<style>';
      if (sh.href && /device-shell/.test(sh.href)) continue;
      if (sh.href && /tokens\.css/.test(sh.href)) {
        // the token file itself may hold literals, but only in :root blocks
        try { for (const r of sh.cssRules) if (r.selectorText && !r.selectorText.split(',').every(isRootSel) && /var\(--(p|brand)-/.test(r.style.cssText)) R.tiers.push(`${r.selectorText} in tokens.css`); } catch {}
        continue;
      }
      let rules;
      try { rules = sh.cssRules; } catch { continue; } // cross-origin (fonts)
      walk(rules, src);
    }
    for (const e of [root, ...els]) {
      const st = e.getAttribute('style');
      if (st && VU.test(st)) R.vunits.push(`${name(e)} style="${st.slice(0, 40)}"`);
    }
  }

  // ---- shell
  const shellEl = document.querySelector('[data-device-shell]');
  R.info.hasShell = !!shellEl;
  if (!shellEl) {
    // no kit: still catch the classic frame bugs on desktop sizes
    R.noShell.push('no [data-device-shell]: install assets/shell (device-shell.md) for frame and native modes');
    if (innerWidth > 480 && (rr.top < -0.5 || rr.bottom > innerHeight + 0.5 || rr.left < -0.5 || rr.right > innerWidth + 0.5)) {
      R.shell.push(`app root ${Math.round(rr.width)}×${Math.round(rr.height)} is cut off by the ${innerWidth}×${innerHeight} window`);
    }
  }
  if (shellEl && html.dataset.shell === 'frame') {
    const d = shellEl.getBoundingClientRect();
    const W = +shellEl.dataset.width || 412, H = +shellEl.dataset.height || 915;
    const ratio = rr.width / rr.height, want = W / H;
    if (Math.abs(ratio / want - 1) > 0.01) R.shell.push(`screen ratio ${ratio.toFixed(3)} ≠ ${want.toFixed(3)}: the phone is squashed`);
    if (d.top < -0.5 || d.left < -0.5 || d.bottom > innerHeight + 0.5 || d.right > innerWidth + 0.5) R.shell.push('the phone is cut off by the window');
    const sb = shellEl.querySelector('.dsh-statusbar');
    if (!sb || !sb.getClientRects().length) R.shell.push('no status bar in frame mode');
  }
  if (shellEl && html.dataset.shell === 'native') {
    if (Math.abs(rr.width - innerWidth) > 1 || Math.abs(rr.height - innerHeight) > 1) R.shell.push(`native app root is ${Math.round(rr.width)}×${Math.round(rr.height)}, the screen is ${innerWidth}×${innerHeight}`);
    const sb = shellEl.querySelector('.dsh-statusbar');
    if (sb && sb.getClientRects().length) R.shell.push('the fake status bar shows on a real phone');
  }
  return R;
}

// ---------------------------------------------------------------- run

const RULES = [
  ['noShell', 'WARN', 'device shell installed'],
  ['shell', 'FAIL', 'device shell'],
  ['overflow', 'FAIL', 'overflow / clipping'],
  ['fixed', 'FAIL', 'fixed UI inside the phone'],
  ['covered', 'FAIL', 'no text under bars or the status bar'],
  ['safe', 'FAIL', 'safe area 16px'],
  ['targets', 'FAIL', 'touch targets ≥ 48'],
  ['targetsOverlap', 'WARN', 'touch targets apart'],
  ['grid', 'FAIL', '4px grid'],
  ['type', 'FAIL', 'type scale'],
  ['vunits', 'FAIL', 'no viewport units / width media queries in app CSS'],
  ['hover', 'FAIL', 'no :hover in app CSS'],
  ['tiers', 'FAIL', 'colour tiers (no primitives in components)'],
  ['rawColour', 'WARN', 'raw colour literals in app CSS'],
  ['textScale', 'WARN', 'text follows the user font size'],
];

const main = async () => {
  const { url, server } = await resolveTarget();
  fs.mkdirSync(OUT, { recursive: true });
  const b = await launch();
  const results = [];
  try {
    const { targetId } = await b.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId: s } = await b.send('Target.attachToTarget', { targetId, flatten: true });
    await b.send('Page.enable', {}, s);
    await b.send('Runtime.enable', {}, s);
    const runs = (STATES.length ? STATES : ['']).flatMap((state, si) => SCENARIOS
      .filter((sc) => si === 0 || sc.expect === 'native' || sc.id === 'frame-1366x768') // later states: phones + the short laptop
      .map((sc) => ({ ...sc, id: state ? `${sc.id}${state.replace(/[^\w=-]+/g, '_')}` : sc.id, base: sc.id, state })));
    for (const sc of runs) {
      const pageUrl = withState(url, sc.state);
      await b.send('Emulation.setDeviceMetricsOverride', { width: sc.w, height: sc.h, deviceScaleFactor: sc.mobile ? 2 : 1, mobile: sc.mobile }, s);
      await b.send('Emulation.setTouchEmulationEnabled', { enabled: sc.mobile, maxTouchPoints: sc.mobile ? 5 : 1 }, s);
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: sc.mobile ? 'coarse' : 'fine' }, { name: 'hover', value: sc.mobile ? 'none' : 'hover' }] }, s).catch(() => {});
      await b.send('Page.setFontSizes', { fontSizes: { standard: sc.fontPx || 16, fixed: sc.fontPx ? Math.round(sc.fontPx * 13 / 16) : 13 } }, s).catch(() => {});
      const loaded = b.waitFor('Page.loadEventFired', s);
      await b.send('Page.navigate', { url: pageUrl }, s);
      await loaded;
      await b.send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))', awaitPromise: true }, s);
      const { result, exceptionDetails } = await b.send('Runtime.evaluate', {
        expression: `(${audit.toString()})(${JSON.stringify({ rootSel: ROOT_SEL, typeSizes: TYPE_SIZES, full: !!sc.full })})`,
        returnByValue: true, awaitPromise: true,
      }, s);
      if (exceptionDetails) throw new Error(`audit failed: ${exceptionDetails.exception?.description || exceptionDetails.text}`);
      const shot = await b.send('Page.captureScreenshot', { format: 'png' }, s);
      fs.writeFileSync(path.join(OUT, `${sc.id}.png`), Buffer.from(shot.data, 'base64'));
      const r = result.value;
      if (r.fatal) throw new Error(r.fatal);
      if (r.info.hasShell && r.info.shell !== sc.expect) r.shell.unshift(`expected ${sc.expect} mode, got ${r.info.shell}`);
      results.push({ sc, r });
    }
  } finally {
    b.close();
    server?.close();
  }

  // ---- cross-run rules
  // without the kit: the phone must keep its ratio when the window gets shorter (the squash bug)
  for (const state of new Set(results.map((x) => x.sc.state))) {
    const frames = results.filter((x) => x.sc.state === state && x.sc.expect === 'frame' && !x.r.info.hasShell);
    const ratio = ([w, h]) => w / h;
    const ref = results.find((x) => x.sc.base === 'frame-1440x900' && !x.r.info.hasShell)?.r.info.root;
    for (const f of frames) {
      if (ref && f.sc.base !== 'frame-1440x900' && Math.abs(ratio(f.r.info.root) / ratio(ref) - 1) > 0.01) {
        f.r.shell.push(`app root ${f.r.info.root.join('×')} vs ${ref.join('×')} at 1440×900: the phone is squashed (one axis capped, e.g. max-height: 100vh)`);
      }
    }
  }
  // text must grow with the user's font size (px font sizes ignore it)
  for (const big of results.filter((x) => x.sc.fontPx)) {
    const normal = results.find((x) => x.sc.state === big.sc.state && x.sc.base === 'native-412');
    if (normal?.r.info.medianFont && big.r.info.medianFont / normal.r.info.medianFont < 1.3) {
      big.r.textScale = [`at 200% text the median text is ${big.r.info.medianFont}px vs ${normal.r.info.medianFont}px: sizes are not in rem/em`];
    }
  }

  // ---- report
  const lines = [];
  const log = (l = '') => { console.log(l); lines.push(l); };
  let fails = 0;
  log(`mobile-app-design-fundamental check — ${url}`);
  log(`screenshots: ${OUT}`);
  for (const [key, level, label] of RULES) {
    if (key === 'rawColour') {
      const all = results.flatMap(({ r }) => r.rawColour || []);
      const seen = new Map();
      for (const x of all) if (!seen.has(x.at)) seen.set(x.at, x.value);
      const counts = new Map();
      for (const v of seen.values()) counts.set(v, (counts.get(v) || 0) + 1);
      const status = seen.size ? level : 'PASS';
      log(`${status.padEnd(4)}  ${label}${seen.size ? ` (${seen.size} declarations, ${counts.size} distinct values)` : ''}`);
      if (seen.size) {
        const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, n]) => `${v} ×${n}`);
        log(`        most used: ${top.join(' · ')}`);
        for (const at of [...seen.keys()].slice(0, 3)) log(`        ${at}`);
      }
      continue;
    }
    // group the same message across runs: "message [run, run]", or bare when every run has it
    const by = new Map();
    for (const { sc, r } of results) for (const m of r[key] || []) { if (!by.has(m)) by.set(m, []); if (!by.get(m).includes(sc.id)) by.get(m).push(sc.id); }
    const status = by.size ? level : 'PASS';
    if (status === 'FAIL') fails++;
    log(`${status.padEnd(4)}  ${label}${by.size ? ` (${by.size})` : ''}`);
    const where = (ids) => (ids.length === results.length ? '' : ids.length <= 2 ? `  [${ids.join(', ')}]` : `  [${ids.slice(0, 2).join(', ')} +${ids.length - 2}]`);
    const shown = [...by].map(([m, ids]) => `${m}${where(ids)}`);
    for (const h of shown.slice(0, 8)) log(`        ${h}`);
    if (shown.length > 8) log(`        … ${shown.length - 8} more`);
  }
  const full = results.find((x) => x.sc.full)?.r.typeCount;
  if (full) {
    const st = full.styles.length, wt = full.weights.length;
    const lvl = st > 5 || wt > 2 ? 'WARN' : 'PASS';
    log(`${lvl.padEnd(4)}  content text styles ${st} (≤ 4 + hero; bars excluded), weights ${wt} (≤ 2): ${full.styles.join(', ')}`);
  }
  if (results.some((x) => x.r.info.hasShell)) log(`modes: ${results.map(({ sc, r }) => `${sc.id}=${r.info.shell}${r.info.shell === 'frame' ? `@${r.info.scale}` : ''}`).join('  ')}`);
  if (REPORT) { fs.mkdirSync(path.dirname(path.resolve(REPORT)), { recursive: true }); fs.writeFileSync(REPORT, `\`\`\`\n${lines.join('\n')}\n\`\`\`\n`); }
  process.exit(fails ? 1 : 0);
};

main().catch((e) => { console.error(`check failed: ${e.message}`); process.exit(2); });
