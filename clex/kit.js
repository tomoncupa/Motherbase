/* CLEX — the kit.
 *
 * Tom, 2026-09-15: "Take Clex out of the eco system completely." Until then
 * CLEX loaded seven files from Motherbase's shared folder, read the suite's
 * store for its themes and carried a latch to stop itself writing there. It
 * now loads nothing from the suite and reads and writes none of its data.
 *
 * This file is the little it actually used, and nothing more:
 *
 *   the theme      Block's values, fixed, so CLEX looks as it did
 *   six icons      drawn from data-icon, including buttons added later
 *   Kit.toast      a message along the bottom
 *   Kit.actions    a sheet of choices from the bottom
 *   Kit.confirm    a yes or no, as a promise
 *   Kit.settings   the version line, which is all CLEX's settings ever showed
 *   Kit.trap       the back gesture closes what is open before it leaves
 *   Kit.play       the short tick when an engine is switched
 *
 * CLEX's one piece of state is the game, under clex.game, in index.html.
 * Nothing here touches storage at all.
 */
window.Kit = (function (g) {
  'use strict';

  var doc = g.document, root = doc.documentElement;

  /* ── the theme ──
     Block's values as Motherbase's theme engine worked them out on
     2026-09-15, fixed here so CLEX keeps looking exactly as it did.
     `--line` is deliberately not set: it never was, so the hairlines that
     name it have never drawn, and setting it now would change the look. */
  var TOKENS = {
    '--bg': '#080B10', '--surface-1': '#0E141D', '--surface-2': '#131B26', '--surface-3': '#1B2634',
    '--text-1': '#DBE7F0', '--text-2': '#B8C9D8', '--text-muted': '#7F93A8', '--text-inverse': '#080B10',
    '--border': '#1E2A38', '--border-strong': '#2B3A4D', '--border-width': '1px',
    '--accent': '#F0B323', '--accent-fg': '#000000', '--focus': '#F0B323',
    '--success': '#6EE7A8', '--warn': '#FFB347', '--danger': '#FF6B81',
    '--s-1': '4px', '--s-2': '8px', '--s-3': '12px', '--s-4': '16px', '--s-5': '24px', '--s-6': '32px',
    '--s-10': '128px', '--gutter': '16px', '--tap': '44px',
    '--f-1': '12px', '--f-2': '14px', '--f-3': '16px', '--f-4': '18px', '--f-6': '24px',
    '--w-body': '500', '--w-bold': '700', '--lh-body': '1.6', '--track-cap': '.08em',
    '--font-display': "'Chakra Petch',system-ui,sans-serif",
    '--font-body': "'IBM Plex Sans',system-ui,sans-serif",
    '--font-mono': "'JetBrains Mono','SF Mono',ui-monospace,monospace",
    '--radius-sm': '2px', '--radius-md': '6px', '--radius-lg': '10px', '--radius-sheet': '12px', '--radius-full': '999px',
    '--e-5': 'none', '--dur-tap': '0ms', '--dur-med': '200ms', '--dur-sheet': '320ms',
    '--ease-out': 'cubic-bezier(.2,0,0,1)', '--ease-sheet': 'cubic-bezier(.32,.72,0,1)',
    '--safe-t': 'env(safe-area-inset-top,0px)', '--safe-b': 'env(safe-area-inset-bottom,0px)'
  };
  Object.keys(TOKENS).forEach(function (k) { root.style.setProperty(k, TOKENS[k]); });

  var CSS =
    '*{-webkit-tap-highlight-color:transparent}' +
    'button{touch-action:manipulation}' +
    '.kit-ico{display:block;flex:0 0 auto}' +
    '.kit-toast{position:fixed;left:50%;bottom:calc(var(--s-5) + var(--safe-b));z-index:90;' +
      'transform:translate(-50%,14px);opacity:0;pointer-events:none;max-width:min(460px,calc(100vw - 24px));' +
      'padding:var(--s-3) var(--s-4);background:var(--surface-3);color:var(--text-1);' +
      'border:var(--border-width) solid var(--border);border-radius:var(--radius-full);' +
      'font-family:var(--font-body);font-size:var(--f-2);line-height:1.4;' +
      'transition:opacity var(--dur-med) var(--ease-out),transform var(--dur-med) var(--ease-out)}' +
    '.kit-toast.on{opacity:1;transform:translate(-50%,0)}' +
    '.kit-veil{position:fixed;inset:0;z-index:80;background:rgba(6,8,12,.72);opacity:0;' +
      'transition:opacity var(--dur-med) var(--ease-out)}' +
    '.kit-veil.on{opacity:1}' +
    '.kit-sheet{position:fixed;left:0;right:0;bottom:0;z-index:81;margin:0 auto;width:100%;max-width:560px;' +
      'max-height:88vh;max-height:88svh;display:flex;flex-direction:column;' +
      'background:var(--surface-1);color:var(--text-1);font-family:var(--font-body);font-size:var(--f-2);' +
      'border-top:var(--border-width) solid var(--border-strong);' +
      'border-radius:var(--radius-sheet) var(--radius-sheet) 0 0;padding-bottom:var(--safe-b);' +
      'transform:translateY(100%);transition:transform var(--dur-sheet) var(--ease-sheet)}' +
    '.kit-sheet.on{transform:translateY(0)}' +
    '.kit-head{flex:0 0 auto;padding:var(--s-4) var(--s-4) var(--s-3)}' +
    '.kit-head h3{margin:0;font-family:var(--font-display);font-size:var(--f-1);font-weight:var(--w-bold);' +
      'letter-spacing:var(--track-cap);color:var(--text-muted);text-transform:uppercase}' +
    '.kit-body{flex:1 1 auto;min-height:0;overflow-y:auto;padding:0 var(--s-4);' +
      'display:flex;flex-direction:column;gap:var(--s-1);line-height:var(--lh-body)}' +
    '.kit-act{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;width:100%;' +
      'min-height:var(--tap);padding:var(--s-3);border:0;border-radius:var(--radius-md);' +
      'background:var(--surface-2);color:var(--text-1);font:inherit;font-size:var(--f-3);text-align:left;cursor:pointer}' +
    '.kit-act small{display:block;color:var(--text-muted);font-size:var(--f-1);line-height:1.45}' +
    '.kit-act.bad{color:var(--danger)}' +
    '.kit-hr{border:0;border-top:var(--border-width) solid var(--border);margin:var(--s-1) 0;width:100%}' +
    '.kit-p{margin:0 0 var(--s-2);color:var(--text-2)}' +
    '.kit-p b{color:var(--text-1);font-size:var(--f-4)}' +
    '.kit-foot{flex:0 0 auto;display:flex;gap:var(--s-2);padding:var(--s-3) var(--s-4) var(--s-4)}' +
    '.kit-btn{flex:1;min-height:var(--tap);padding:0 var(--s-4);cursor:pointer;' +
      'border:var(--border-width) solid var(--border-strong);border-radius:var(--radius-md);' +
      'background:var(--surface-2);color:var(--text-2);font-family:var(--font-display);' +
      'font-size:var(--f-1);font-weight:var(--w-bold);letter-spacing:var(--track-cap)}' +
    '.kit-btn.go{background:var(--accent);border-color:var(--accent);color:var(--accent-fg)}' +
    '@media (prefers-reduced-motion:reduce){.kit-toast,.kit-veil,.kit-sheet{transition:none}}';

  function css() {
    if (doc.getElementById('kit-css')) return;
    var s = doc.createElement('style');
    s.id = 'kit-css';
    s.textContent = CSS;
    (doc.head || root).appendChild(s);
  }
  css();

  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ── six icons ──
     The drawings are Motherbase's, copied as they were on 2026-09-15, in
     Block's stroke. A button asks with data-icon; buttons made after load
     are drawn as they arrive. */
  var PATHS = {
    add: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    next: 'M9 5l7 7-7 7',
    undo: 'M4 10h10a5 5 0 010 10h-3M4 10l4.5-4.5M4 10l4.5 4.5',
    cycle: 'M4 9V7.5A3.5 3.5 0 017.5 4H17M20 15v1.5a3.5 3.5 0 01-3.5 3.5H7M17 1l3 3-3 3M7 23l-3-3 3-3',
    settings: 'M12 9.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6M12 5.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13' +
      'M12 5.5V3M12 18.5V21M18.5 12H21M5.5 12H3M16.6 7.4l1.76-1.76M7.4 16.6l-1.76 1.76' +
      'M16.6 16.6l1.76 1.76M7.4 7.4L5.64 5.64'
  };
  function svg(role, size) {
    var d = PATHS[role];
    if (!d) return '';
    size = size || 18;
    return '<svg class="kit-ico" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false"><path d="' + d + '"/></svg>';
  }
  function paint() {
    [].forEach.call(doc.querySelectorAll('[data-icon]'), function (b) {
      var role = b.getAttribute('data-icon');
      if (b.getAttribute('data-icon-drawn') === role) return;
      var m = svg(role);
      if (!m) return;
      b.innerHTML = m;
      b.setAttribute('data-icon-drawn', role);
    });
  }
  var queued = false;
  function watch() {
    paint();
    if (!g.MutationObserver) return;
    new MutationObserver(function () {
      if (queued) return;
      queued = true;
      setTimeout(function () { queued = false; paint(); }, 0);
    }).observe(doc.body, { childList: true, subtree: true });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watch); else watch();

  /* ── a message ── */
  var toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) { toastEl = el('div', 'kit-toast'); toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = String(msg == null ? '' : msg);
    void toastEl.offsetHeight;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove('on'); }, 2600);
  }

  /* ── the back gesture ──
     One history entry stands between the app and leaving it. A back press
     closes the top sheet, or asks each trap in turn whether it had something
     open, and only leaves when nothing did. */
  var sheets = [], traps = [], armed = false;
  function arm() {
    if (armed) return;
    armed = true;
    try { g.history.pushState({ kit: 1 }, ''); } catch (e) {}
  }
  g.addEventListener('popstate', function () {
    if (!armed) return;
    armed = false;
    var top = sheets[sheets.length - 1];
    if (top) { top.close(); return; }
    for (var i = traps.length - 1; i >= 0; i--) {
      if (traps[i]()) { arm(); return; }
    }
    try { g.history.back(); } catch (e) {}
  });
  function trap(fn) { traps.push(fn); arm(); }

  /* ── a sheet from the bottom ── */
  function sheet(title, fill, foot) {
    var veil = el('div', 'kit-veil'), panel = el('div', 'kit-sheet');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    var head = el('div', 'kit-head');
    head.appendChild(el('h3', null, title || ''));
    panel.appendChild(head);
    var body = el('div', 'kit-body');
    panel.appendChild(body);
    var closed = false;
    var handle = {
      body: body, panel: panel, onClose: null,
      close: function (v) {
        if (closed) return;
        closed = true;
        veil.classList.remove('on');
        panel.classList.remove('on');
        setTimeout(function () { veil.remove(); panel.remove(); }, 340);
        doc.removeEventListener('keydown', key);
        var i = sheets.indexOf(handle);
        if (i > -1) sheets.splice(i, 1);
        if (!armed && (sheets.length || traps.length)) arm();
        if (handle.onClose) handle.onClose(v);
      }
    };
    fill(body, handle);
    if (foot && foot.length) {
      var f = el('div', 'kit-foot');
      foot.forEach(function (a) {
        var b = el('button', 'kit-btn' + (a.kind ? ' ' + a.kind : ''), a.label);
        b.type = 'button';
        b.onclick = function () { handle.close(a.value); if (a.fn) a.fn(); };
        f.appendChild(b);
      });
      panel.appendChild(f);
    }
    function key(e) { if (e.key === 'Escape') handle.close(); }
    doc.addEventListener('keydown', key);
    veil.onclick = function () { handle.close(); };
    doc.body.appendChild(veil);
    doc.body.appendChild(panel);
    /* layout first, then the class in the same tick: a frame callback never
       runs in a tab that is not being painted, and the sheet would stay down */
    void panel.offsetHeight;
    veil.classList.add('on');
    panel.classList.add('on');
    sheets.push(handle);
    arm();
    return handle;
  }

  /* items: [{label, note, kind: 'bad', fn}] or '-' for a line */
  function actions(title, items) {
    return sheet(title, function (body, h) {
      (items || []).forEach(function (it) {
        if (!it) return;
        if (it === '-') { body.appendChild(el('hr', 'kit-hr')); return; }
        var b = el('button', 'kit-act' + (it.kind ? ' ' + it.kind : ''));
        b.type = 'button';
        b.appendChild(doc.createTextNode(it.label));
        if (it.note) b.appendChild(el('small', null, it.note));
        b.onclick = function () {
          h.close();
          setTimeout(function () { if (it.fn) it.fn(); }, 60);
        };
        body.appendChild(b);
      });
    }, [{ label: 'CANCEL' }]);
  }

  function confirm(question, detail) {
    return new Promise(function (resolve) {
      var answered = false;
      var h = sheet('CONFIRM', function (body) {
        var q = el('p', 'kit-p');
        q.appendChild(el('b', null, question));
        body.appendChild(q);
        if (detail) body.appendChild(el('p', 'kit-p', detail));
      }, [
        { label: 'CANCEL', fn: function () { answered = true; resolve(false); } },
        { label: 'YES', kind: 'go', fn: function () { answered = true; resolve(true); } }
      ]);
      h.onClose = function () { setTimeout(function () { if (!answered) resolve(false); }, 0); };
    });
  }

  /* The version line, which is all the settings panel ever showed. */
  function settings() {
    var m = doc.querySelector('meta[name="mb-version"]');
    var hit = m && /^\s*([\d.]+)\s*(?:,\s*(\d{4})-(\d{2})-(\d{2}))?/.exec(m.content || '');
    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var line = hit ? 'CLEX ' + hit[1] + (hit[2] ? ', updated ' + (+hit[4]) + ' ' + MON[+hit[3] - 1] + ' ' + hit[2] : '') : 'CLEX';
    return sheet('SETTINGS', function (body) { body.appendChild(el('p', 'kit-p', line)); }, [{ label: 'DONE', kind: 'go' }]);
  }

  /* ── the tick ──
     A short, quiet note, synthesised, the one sound CLEX made. Silent until
     the page has been touched, which is when a browser allows sound. */
  var audio = null;
  function play() {
    try {
      var AC = g.AudioContext || g.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === 'suspended') audio.resume();
      var t = audio.currentTime + 0.001, out = audio.createGain();
      out.gain.setValueAtTime(0, t);
      out.gain.linearRampToValueAtTime(0.17, t + 0.006);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
      out.connect(audio.destination);
      [[1, 1], [3.1, 0.5], [7.3, 0.18]].forEach(function (p) {
        var o = audio.createOscillator(), gn = audio.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25 * p[0], t);
        gn.gain.value = p[1];
        o.connect(gn); gn.connect(out);
        o.start(t); o.stop(t + 0.12);
      });
    } catch (e) {}
  }

  return {
    toast: toast, actions: actions, confirm: confirm, settings: settings,
    trap: trap, play: play, svg: svg, paint: paint, TOKENS: TOKENS
  };
})(window);
