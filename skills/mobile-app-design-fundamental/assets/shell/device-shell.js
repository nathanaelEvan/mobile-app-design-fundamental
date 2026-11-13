/*
  device-shell.js — mobile-app-design-fundamental
  Load it in <head> WITHOUT defer/async, so the mode is set before the first paint:
    <link rel="stylesheet" href="/device-shell/device-shell.css">
    <script src="/device-shell/device-shell.js"></script>

  Modes
    native  a phone, a tablet in hand, an installed PWA, or a window 480px wide or less:
            no frame, the app fills the screen and uses the device's safe areas (on a viewport
            wider than 600px, a tablet, the app stays phone-sized in a centred column).
    frame   a desktop with a mouse: the app sits in a phone frame scaled to fit, with a status
            bar, and the mouse behaves like a finger (drag to scroll, no text selection).
    ?frame=on / ?frame=off in the URL forces a mode (screenshots, testing).

  API: window.DeviceShell = { mode, scale, setStatusBar('auto' | 'dark' | 'light'), refresh() }
       window 'deviceshell:change' (CustomEvent, detail { mode, scale }): fired after every
       refresh() and whenever a resize changes the frame scale.
       <html> carries --dsh-screen-left / -top / -width / -height (and -right / -bottom, insets from
       the viewport's edges): the screen's rect in viewport px, which device-shell.css uses to keep
       <dialog> and [popover] (top layer) over the phone. App code does not need them.
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

  // 'light' (light icons, for a dark screen), 'dark', or 'auto' (follow the colour scheme)
  function setStatusBar(tone) {
    if (tone === 'light' || tone === 'dark') root.dataset.statusbar = tone;
    else delete root.dataset.statusbar;
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

  // The screen's rect as drawn (scaled px). Top-layer UI escapes the phone; device-shell.css puts it
  // back over the screen with these. Published in both modes (native uses it on wide viewports).
  function publishScreenRect() {
    if (!screen) return;
    const r = screen.getBoundingClientRect();
    const px = (n) => `${Math.round(n * 100) / 100}px`;
    root.style.setProperty('--dsh-screen-left', px(r.left));
    root.style.setProperty('--dsh-screen-top', px(r.top));
    root.style.setProperty('--dsh-screen-width', px(r.width));
    root.style.setProperty('--dsh-screen-height', px(r.height));
    root.style.setProperty('--dsh-screen-right', px(root.clientWidth - r.right));
    root.style.setProperty('--dsh-screen-bottom', px(root.clientHeight - r.bottom));
  }

  function emitChange() {
    dispatchEvent(new CustomEvent('deviceshell:change', { detail: { mode: api.mode, scale: api.scale } }));
  }

  // returns true when the scale changed
  function fit() {
    const before = api.scale;
    if (api.mode === 'frame' && shell) {
      const { w, h } = readSize();
      const css = getComputedStyle(root);
      const bezel = parseFloat(css.getPropertyValue('--dsh-bezel')) || 12;
      const margin = 24;
      // one factor for both axes: the phone gets smaller, never shorter or narrower than its ratio
      const s = Math.min(1, (innerHeight - margin * 2) / (h + bezel * 2), (innerWidth - margin * 2) / (w + bezel * 2));
      api.scale = Math.max(0.1, s);
      root.style.setProperty('--dsh-scale', String(api.scale));
    }
    publishScreenRect();
    return api.scale !== before;
  }

  function onResize() {
    if (fit()) emitChange();
  }

  function refresh() {
    api.mode = pickMode();
    root.dataset.shell = api.mode;
    if (api.mode === 'native') { api.scale = 1; root.style.setProperty('--dsh-scale', '1'); }
    fit();
    emitChange();
  }

  refresh();
  for (const m of [mq.coarse, mq.narrow, mq.standalone]) m.addEventListener('change', refresh);
  addEventListener('resize', onResize);

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
  const STALE_MS = 60;  // a release this long after the last move is a stop, not a fling
  const LAYER = 'dialog:modal, :popover-open';

  function canScroll(n, axis) {
    const cs = getComputedStyle(n);
    return axis === 'x'
      ? /(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth
      : /(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight;
  }

  // The first ancestor of el (inside the screen) that scrolls on this axis, as a finger finds it.
  // Stops at a modal dialog or popover, so a drag inside one never scrolls the page under it.
  function scrollerFor(el, axis) {
    for (let n = el; n && n !== screen; n = n.parentElement) {
      if (getComputedStyle(n).touchAction === 'none') return null; // the app handles this gesture itself
      if (canScroll(n, axis)) return n;
      if (n.matches(LAYER)) return null;
    }
    return null;
  }

  function enableTouchFeel() {
    let g = null;              // the current press
    let glide = 0;             // momentum frame
    let pendingRestore = null; // puts back the scroller's scroll-snap-type / scroll-behavior

    // ends a running glide and always restores, so the next drag saves the app's own values
    function stopGlide() {
      cancelAnimationFrame(glide);
      glide = 0;
      const restore = pendingRestore;
      pendingRestore = null;
      restore?.();
    }

    screen.addEventListener('pointerdown', (e) => {
      if (api.mode !== 'frame' || e.pointerType !== 'mouse' || e.button !== 0) return;
      stopGlide();
      screen.classList.add('dsh-pressing');
      g = null;
      if (e.target.closest(NO_DRAG)) return;
      g = { target: e.target, id: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false, samples: [] };
    });

    screen.addEventListener('pointermove', (e) => {
      // the button came up outside the screen or the window, so no pointerup reached us
      if (e.pointerType === 'mouse' && !(e.buttons & 1)) {
        if (g || screen.classList.contains('dsh-pressing')) release(e);
        return;
      }
      if (!g || e.pointerId !== g.id) return;
      if (!g.dragging) {
        const rx = e.clientX - g.x0;
        const ry = e.clientY - g.y0;
        if (Math.hypot(rx, ry) < DRAG_START) return;
        // lock to the dominant axis, then find what scrolls on it: a vertical drag that starts on a
        // horizontal chip row scrolls the page, as it does under a finger
        const axis = Math.abs(rx) > Math.abs(ry) ? 'x' : 'y';
        const el = scrollerFor(g.target, axis);
        if (!el) { g = null; return; }
        const snap = el.style.scrollSnapType;
        const behavior = el.style.scrollBehavior;
        Object.assign(g, {
          dragging: true, axis, el, x0: e.clientX, y0: e.clientY,
          start: axis === 'x' ? el.scrollLeft : el.scrollTop,
          restore: () => { el.style.scrollSnapType = snap; el.style.scrollBehavior = behavior; },
        });
        el.style.scrollSnapType = 'none';
        el.style.scrollBehavior = 'auto';
        screen.setPointerCapture(e.pointerId);
      }
      const d = (g.axis === 'x' ? e.clientX - g.x0 : e.clientY - g.y0) / api.scale;
      if (g.axis === 'x') g.el.scrollLeft = g.start - d;
      else g.el.scrollTop = g.start - d;
      g.samples.push({ t: e.timeStamp, d });
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
      pendingRestore = done.restore;
      const a = done.samples[0];
      const b = done.samples[done.samples.length - 1];
      // no fling when motion is reduced, the drag was too short to measure, or it paused before release
      if (mq.reduce.matches || !a || b.t - a.t < 8 || e.timeStamp - b.t > STALE_MS) { stopGlide(); return; }
      let v = -(b.d - a.d) / (b.t - a.t); // px per ms
      const prop = done.axis === 'x' ? 'scrollLeft' : 'scrollTop';
      let last = performance.now();
      const step = (now) => {
        const dt = now - last;
        last = now;
        done.el[prop] += v * dt;
        v *= Math.pow(0.95, dt / 16);
        if (Math.abs(v) > 0.02) glide = requestAnimationFrame(step);
        else stopGlide();
      };
      glide = requestAnimationFrame(step);
    }

    screen.addEventListener('pointerup', release);
    screen.addEventListener('pointercancel', release);
    screen.addEventListener('lostpointercapture', (e) => { if (g && e.pointerId === g.id) release(e); });
    screen.addEventListener('pointerleave', () => { if (!g?.dragging) screen.classList.remove('dsh-pressing'); });

    // The browser's drag-and-drop of images and links fires pointercancel and ends the gesture; a phone
    // has none of it. Elements the app marks draggable="true" keep theirs.
    screen.addEventListener('dragstart', (e) => {
      if (api.mode === 'frame' && !e.target.closest?.('[draggable="true"]')) e.preventDefault();
    });
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
