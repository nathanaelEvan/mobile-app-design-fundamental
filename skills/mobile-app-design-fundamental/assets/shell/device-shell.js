/*
  device-shell.js — mobile-app-design-fundamental
  Load it in <head> WITHOUT defer/async, so the mode is set before the first paint:
    <link rel="stylesheet" href="/device-shell/device-shell.css">
    <script src="/device-shell/device-shell.js"></script>

  Modes
    native  a phone, a tablet in hand, an installed PWA, or a window 480px wide or less:
            no frame, the app fills the screen and uses the device's safe areas.
    frame   a desktop with a mouse: the app sits in a phone frame scaled to fit, with a status
            bar, and the mouse behaves like a finger (drag to scroll, no text selection).
    ?frame=on / ?frame=off in the URL forces a mode (screenshots, testing).

  API: window.DeviceShell = { mode, scale, setStatusBar('dark' | 'light'), refresh() }
*/
(() => {
  'use strict';

  const root = document.documentElement;
  const forced = new URLSearchParams(location.search).get('frame');
  const mq = {
    coarse: matchMedia('(pointer: coarse)'),
    narrow: matchMedia('(max-width: 480px)'),
    standalone: matchMedia('(display-mode: standalone)'),
    reduce: matchMedia('(prefers-reduced-motion: reduce)'),
  };

  const api = { mode: 'native', scale: 1, setStatusBar, refresh };
  window.DeviceShell = api;

  function pickMode() {
    if (forced === 'on') return 'frame';
    if (forced === 'off') return 'native';
    const phoneLike = mq.coarse.matches || mq.narrow.matches || mq.standalone.matches || navigator.standalone === true;
    return phoneLike ? 'native' : 'frame';
  }

  function setStatusBar(tone) {
    root.dataset.statusbar = tone === 'light' ? 'light' : 'dark';
  }

  // ------------------------------------------------------------ mode and scale

  let shell = null;
  let screen = null;

  function readSize() {
    const w = Number(shell?.dataset.width) || 412;
    const h = Number(shell?.dataset.height) || 915;
    root.style.setProperty('--dsh-w', `${w}px`);
    root.style.setProperty('--dsh-h', `${h}px`);
    return { w, h };
  }

  function fit() {
    if (api.mode !== 'frame' || !shell) return;
    const { w, h } = readSize();
    const css = getComputedStyle(root);
    const bezel = parseFloat(css.getPropertyValue('--dsh-bezel')) || 12;
    const margin = 24;
    // one factor for both axes: the phone gets smaller, never shorter or narrower than its ratio
    const s = Math.min(1, (innerHeight - margin * 2) / (h + bezel * 2), (innerWidth - margin * 2) / (w + bezel * 2));
    api.scale = Math.max(0.1, s);
    root.style.setProperty('--dsh-scale', String(api.scale));
  }

  function refresh() {
    api.mode = pickMode();
    root.dataset.shell = api.mode;
    if (!root.dataset.statusbar) setStatusBar('dark');
    if (api.mode === 'native') { api.scale = 1; root.style.setProperty('--dsh-scale', '1'); }
    fit();
  }

  refresh();
  for (const m of [mq.coarse, mq.narrow, mq.standalone]) m.addEventListener('change', refresh);
  addEventListener('resize', fit);

  // ------------------------------------------------------------ chrome

  const ICONS = {
    signal: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 11h2v3H1zM5 8h2v6H5zM9 5h2v9H9zM13 2h2v12h-2z"/></svg>',
    wifi: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5 1 6.2a10 10 0 0 1 14 0z"/></svg>',
    battery: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2h6v1h1v12H4V3h1z" opacity=".35"/><path d="M4 6h8v9H4z"/></svg>',
  };

  function clockText() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  function addChrome() {
    if (screen.querySelector(':scope > .dsh-statusbar')) return;
    const bar = document.createElement('div');
    bar.className = 'dsh-statusbar';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = `<span class="dsh-statusbar__time">${clockText()}</span>
      <span class="dsh-statusbar__icons">${ICONS.signal}${ICONS.wifi}${ICONS.battery}</span>`;
    const handle = document.createElement('div');
    handle.className = 'dsh-gesture';
    handle.setAttribute('aria-hidden', 'true');
    screen.prepend(bar);
    screen.append(handle);
    const time = bar.querySelector('.dsh-statusbar__time');
    setInterval(() => { time.textContent = clockText(); }, 15000);
  }

  // ------------------------------------------------------------ mouse as a finger

  const NO_DRAG = 'input, textarea, select, [contenteditable], [data-shell-nodrag], .dsh-statusbar';
  const DRAG_START = 6; // screen px before a press becomes a drag

  function scrollerFor(el) {
    for (let n = el; n && n !== screen; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.touchAction === 'none') return null; // the app handles this gesture itself
      const y = /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight;
      const x = /(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth;
      if (x || y) return { el: n, x, y };
    }
    return null;
  }

  function enableTouchFeel() {
    let g = null;
    let glide = 0;

    screen.addEventListener('pointerdown', (e) => {
      if (api.mode !== 'frame' || e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(glide);
      screen.classList.add('dsh-pressing');
      if (e.target.closest(NO_DRAG)) return;
      const s = scrollerFor(e.target);
      if (!s) return;
      g = { s, id: e.pointerId, x0: e.clientX, y0: e.clientY, left: s.el.scrollLeft, top: s.el.scrollTop,
            dragging: false, samples: [], snap: s.el.style.scrollSnapType, behavior: s.el.style.scrollBehavior };
    });

    screen.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      const dx = (e.clientX - g.x0) / api.scale;
      const dy = (e.clientY - g.y0) / api.scale;
      if (!g.dragging) {
        if (Math.hypot(dx, dy) * api.scale < DRAG_START) return;
        g.dragging = true;
        g.s.el.style.scrollSnapType = 'none';
        g.s.el.style.scrollBehavior = 'auto';
        screen.setPointerCapture(e.pointerId);
      }
      if (g.s.x) g.s.el.scrollLeft = g.left - dx;
      if (g.s.y) g.s.el.scrollTop = g.top - dy;
      g.samples.push({ t: e.timeStamp, dx, dy });
      if (g.samples.length > 6) g.samples.shift();
    });

    function release(e) {
      screen.classList.remove('dsh-pressing');
      if (!g || e.pointerId !== g.id) { g = null; return; }
      const done = g;
      g = null;
      if (!done.dragging) return;
      // a drag is not a tap: swallow the click that follows it
      // (the click, if any, fires in the same event sequence; drop the guard right after)
      const swallow = (c) => { c.preventDefault(); c.stopPropagation(); };
      screen.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => screen.removeEventListener('click', swallow, true), 0);
      const restore = () => {
        done.s.el.style.scrollSnapType = done.snap;
        done.s.el.style.scrollBehavior = done.behavior;
      };
      const a = done.samples[0];
      const b = done.samples[done.samples.length - 1];
      if (mq.reduce.matches || !a || b.t - a.t < 8) { restore(); return; }
      let vx = done.s.x ? -(b.dx - a.dx) / (b.t - a.t) : 0; // px per ms
      let vy = done.s.y ? -(b.dy - a.dy) / (b.t - a.t) : 0;
      let last = performance.now();
      const step = (now) => {
        const dt = now - last;
        last = now;
        done.s.el.scrollLeft += vx * dt;
        done.s.el.scrollTop += vy * dt;
        const decay = Math.pow(0.95, dt / 16);
        vx *= decay; vy *= decay;
        if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) glide = requestAnimationFrame(step);
        else restore();
      };
      glide = requestAnimationFrame(step);
    }

    screen.addEventListener('pointerup', release);
    screen.addEventListener('pointercancel', release);
    screen.addEventListener('lostpointercapture', (e) => { if (g && e.pointerId === g.id) release(e); });
  }

  // ------------------------------------------------------------ boot

  function boot() {
    shell = document.querySelector('[data-device-shell]');
    screen = shell?.querySelector('.dsh-screen');
    if (!shell || !screen) {
      console.warn('[device-shell] missing [data-device-shell] > .dsh-screen');
      return;
    }
    refresh();
    addChrome();
    enableTouchFeel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
