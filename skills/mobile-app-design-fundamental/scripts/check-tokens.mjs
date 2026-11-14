#!/usr/bin/env node
/*
  check-tokens.mjs — mobile-app-design-fundamental
  Checks the colour tokens themselves, in light and in dark, before any screen uses them: every
  text token against the fills it sits on (4.5:1), every icon and control stroke against the
  surfaces (3:1). Run it at setup and whenever the palette changes, above all when the project
  brings its own palette: the starter values in assets/tokens.css pass, a replaced ramp may not.
  Node 18+. No installs, no browser.

  node check-tokens.mjs <tokens.css> [more.css …]

  Reads custom properties declared on :root / html (the first declaration of each wins), resolves
  var(), light-dark(), color-mix(in oklab | oklch | srgb | srgb-linear) and hex / rgb() / hsl() /
  oklab() / oklch() literals. A fill with alpha is composited over --bg-canvas.
  Pairs come from the naming grammar (color-tokens.md), so tokens the project adds are checked too:
    --on-surface-default / -muted      on canvas, surface-01, -02, -03, neutral-subtle, neutral-default
    --on-surface-subtle / -error       on canvas, surface-01, -02 (on surface-03 use muted)
    --on-<role>-default                on --bg-<role>-default and --bg-<role>-default-pressed
    --on-<role>-subtle-default         on --bg-<role>-subtle (and --bg-selected for brand)
    --icon-surface-* / --icon-action-* on canvas, surface-01, -02           (3:1)
    --icon-on-<role>                   on --bg-<role>-default                (3:1)
    --outline-control / -focus / -error on canvas, surface-01, -02          (3:1)
    --<component>-on[-state]           on --<component>-bg[-state]
  Exempt: --on-disabled (WCAG exempts disabled controls), decorative --outline-neutral and
  --outline-surface-*. A pair whose tokens are missing is skipped; one that cannot be resolved is
  reported as SKIP. Exit 1 when any pair fails.
*/
import fs from 'node:fs';

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.log('usage: node check-tokens.mjs <tokens.css> [more.css …]');
  process.exit(2);
}

// ---------------------------------------------------------------- read the tokens

const vars = {};
for (const f of files) {
  const css = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // innermost blocks only: a :root inside @media is read too, but the first declaration wins
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (!sel.split(',').some((s) => /^\s*(:root|html)\s*$/.test(s))) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) if (!(name in vars)) vars[name] = value.trim();
  }
}

// ---------------------------------------------------------------- colour maths

const clamp = (x) => Math.min(1, Math.max(0, x));
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const srgbToOklab = ({ r, g, b }) => {
  const [lr, lg, lb] = [r, g, b].map(toLin);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const oklabToSrgb = ([L, A, B]) => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return {
    r: clamp(toGam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: clamp(toGam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: clamp(toGam(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  };
};
const hslToSrgb = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return { r: f(0), g: f(8), b: f(4) };
};
const luminance = ({ r, g, b }) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
const ratio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
const hex = ({ r, g, b }) => '#' + [r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('');

// ---------------------------------------------------------------- resolve a value

// split a function's argument list on top-level commas
const args = (s) => {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};
const call = (s, fn) => { const m = s.match(new RegExp(`^${fn}\\(([\\s\\S]*)\\)$`, 'i')); return m && args(m[1]); };
const num = (s, scale = 1) => (s.endsWith('%') ? (parseFloat(s) / 100) * scale : parseFloat(s));
const alphaOf = (s) => (s === undefined || s === 'none' ? 1 : clamp(num(s, 1)));
const NAMED = { white: '#ffffff', black: '#000000' };

function colour(value, mode, seen = new Set()) {
  const v = value.trim();
  let a;
  if ((a = call(v, 'var'))) {
    const name = a[0];
    if (seen.has(name)) throw new Error(`cycle at ${name}`);
    if (name in vars) return colour(vars[name], mode, new Set([...seen, name]));
    if (a[1] !== undefined) return colour(a.slice(1).join(','), mode, seen);
    throw new Error(`${name} is not defined`);
  }
  if ((a = call(v, 'light-dark'))) return colour(a[mode === 'light' ? 0 : 1], mode, seen);
  if ((a = call(v, 'color-mix'))) {
    const space = a[0].replace(/^in\s+/i, '').split(/\s+/)[0].toLowerCase();
    const parts = a.slice(1).map((p) => { const m = p.match(/^([\s\S]*?)\s+([\d.]+%)$/); return m ? { c: colour(m[1], mode, seen), p: parseFloat(m[2]) / 100 } : { c: colour(p, mode, seen), p: null }; });
    let [p1, p2] = [parts[0].p, parts[1].p];
    if (p1 === null && p2 === null) [p1, p2] = [0.5, 0.5];
    else if (p1 === null) p1 = 1 - p2;
    else if (p2 === null) p2 = 1 - p1;
    const sum = p1 + p2, w1 = p1 / sum, w2 = p2 / sum, mult = Math.min(1, sum);
    const [c1, c2] = [parts[0].c, parts[1].c];
    const alpha = c1.a * w1 + c2.a * w2;
    if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
    // premultiplied interpolation: a transparent side adds no hue, only lowers the alpha
    const coords = (c) => {
      if (space === 'oklab' || space === 'oklch') return srgbToOklab(c);
      if (space === 'srgb') return [c.r, c.g, c.b];
      if (space === 'srgb-linear') return [c.r, c.g, c.b].map(toLin);
      throw new Error(`color-mix in ${space} is not supported`);
    };
    const [k1, k2] = [coords(c1), coords(c2)];
    const k = k1.map((x, i) => (x * c1.a * w1 + k2[i] * c2.a * w2) / alpha);
    const rgb = space.startsWith('ok') ? oklabToSrgb(k) : space === 'srgb' ? { r: k[0], g: k[1], b: k[2] } : { r: toGam(k[0]), g: toGam(k[1]), b: toGam(k[2]) };
    return { ...rgb, a: alpha * mult };
  }
  if (/^transparent$/i.test(v)) return { r: 0, g: 0, b: 0, a: 0 };
  if (NAMED[v.toLowerCase()]) return colour(NAMED[v.toLowerCase()], mode, seen);
  if (/^#[0-9a-f]{3,8}$/i.test(v)) {
    let h = v.slice(1);
    if (h.length <= 4) h = [...h].map((x) => x + x).join('');
    const n = (i) => parseInt(h.slice(i, i + 2), 16) / 255;
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 };
  }
  // modern or legacy syntax: rgb(1 2 3 / 50%), rgb(1, 2, 3, .5)
  const fn = v.match(/^(rgba?|hsla?|oklab|oklch)\(([^()]*)\)$/i);
  if (fn) {
    const [body, alpha] = fn[2].split('/');
    const p = body.split(/[\s,]+/).filter(Boolean);
    const al = alphaOf(alpha?.trim() ?? p[3]);
    const kind = fn[1].toLowerCase().replace(/a$/, '');
    if (kind === 'rgb') return { r: clamp(num(p[0], 255) / 255), g: clamp(num(p[1], 255) / 255), b: clamp(num(p[2], 255) / 255), a: al };
    if (kind === 'hsl') return { ...hslToSrgb(parseFloat(p[0]), num(p[1].replace(/%?$/, '%')), num(p[2].replace(/%?$/, '%'))), a: al };
    const L = num(p[0], 1);
    if (kind === 'oklab') return { ...oklabToSrgb([L, num(p[1], 0.4), num(p[2], 0.4)]), a: al };
    const C = num(p[1], 0.4), h = (parseFloat(p[2]) * Math.PI) / 180;
    return { ...oklabToSrgb([L, C * Math.cos(h), C * Math.sin(h)]), a: al };
  }
  throw new Error(`cannot read "${v}"`);
}

// ---------------------------------------------------------------- the pairs

const has = (n) => n in vars;
const SURFACES = ['--bg-canvas', '--bg-surface-01', '--bg-surface-02', '--bg-surface-03'];
const pairs = []; // [fg, bg, min]
const add = (fg, bgs, min) => { for (const bg of bgs) if (has(fg) && has(bg)) pairs.push([fg, bg, min]); };

add('--on-surface-default', [...SURFACES, '--bg-neutral-subtle', '--bg-neutral-default', '--bg-surface-01-pressed', '--bg-neutral-subtle-pressed'], 4.5);
add('--on-surface-muted', [...SURFACES, '--bg-neutral-subtle', '--bg-neutral-default'], 4.5);
add('--on-surface-subtle', SURFACES.slice(0, 3), 4.5);
add('--on-surface-error', SURFACES.slice(0, 3), 4.5);
for (const name of Object.keys(vars)) {
  let m;
  if ((m = name.match(/^--on-([\w]+?)-default$/)) && m[1] !== 'surface') add(name, [`--bg-${m[1]}-default`, `--bg-${m[1]}-default-pressed`, `--bg-${m[1]}-bold`], 4.5);
  if ((m = name.match(/^--on-([\w]+?)-subtle-default$/))) add(name, [`--bg-${m[1]}-subtle`, ...(m[1] === 'brand' ? ['--bg-selected'] : [])], 4.5);
  if (/^--icon-(surface|action)-/.test(name)) add(name, SURFACES.slice(0, 3), 3);
  if ((m = name.match(/^--icon-on-([\w]+)$/))) add(name, [`--bg-${m[1]}-default`], 3);
  if (/^--outline-(control|focus|error)$/.test(name)) add(name, SURFACES.slice(0, 3), 3);
  // component tokens: --chip-on-selected on --chip-bg-selected
  if ((m = name.match(/^--([\w]+)-on(-[\w-]+)?$/)) && !['bg', 'icon', 'outline'].includes(m[1])) add(name, [`--${m[1]}-bg${m[2] || ''}`], 4.5);
}

// ---------------------------------------------------------------- run

let fails = 0, passes = 0, skips = 0;
const lines = [];
for (const mode of ['light', 'dark']) {
  let canvas;
  try { canvas = has('--bg-canvas') ? colour('var(--bg-canvas)', mode) : { r: 1, g: 1, b: 1, a: 1 }; } catch { canvas = { r: 1, g: 1, b: 1, a: 1 }; }
  canvas = over(canvas, mode === 'light' ? { r: 1, g: 1, b: 1 } : { r: 0, g: 0, b: 0 });
  for (const [fg, bg, min] of pairs) {
    try {
      const b = over(colour(`var(${bg})`, mode), canvas);
      const f = over(colour(`var(${fg})`, mode), b);
      const r = ratio(f, b);
      if (r + 1e-9 < min) { fails++; lines.push(`FAIL  ${mode.padEnd(5)}  ${fg} on ${bg}: ${r.toFixed(2)} (needs ${min}) — ${hex(f)} on ${hex(b)}`); } else passes++;
    } catch (e) { skips++; lines.push(`SKIP  ${mode.padEnd(5)}  ${fg} on ${bg}: ${e.message}`); }
  }
}

console.log(`check-tokens: ${pairs.length} pairs × light, dark — ${passes} pass, ${fails} fail, ${skips} skipped`);
for (const l of lines) console.log(l);
if (!pairs.length) console.log('No pairs found: are the semantic tokens declared on :root with the names from color-tokens.md?');
process.exit(fails ? 1 : 0);
