/* ══════════════════════ MOTHERBASE · UI ══════════════════════
   The shared furniture: toasts, dialogs, confirms, menus, and the standard
   Settings panel every app opens.

   Apps may look different — themes are chosen per app on purpose — but a
   dialog should be a dialog everywhere. This is what makes the suite read as
   one product wearing different jackets instead of four unrelated apps.

   Every colour here is a skin token with a fallback, so this file looks right
   whether or not skins.js has painted the page yet.

     <script src="shared/ui.js"></script>
     UI.toast('saved');
     await UI.confirm('Delete this routine?', 'The tick history stays.');
     UI.settings('block', [{id:'rules', name:'RULES', draw(el){…}}]);
*/
(function (g) {
'use strict';

const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const beep = (cue, o) => { if (g.Sfx) g.Sfx.play(cue, o); };

/* ── the stylesheet ──
   mobile.js owns the sheet, the button and the press states; this file owns
   the furniture that sits on top of them. When mobile.js is not loaded — an
   app that has not been wired to it yet — the LEGACY block at the bottom puts
   back the desktop styling those pieces used to have, so nothing an older app
   already relies on loses its face. */
function css() {
  if (document.getElementById('mb-ui-css')) return;
  const s = el('style'); s.id = 'mb-ui-css';
  s.textContent = `
/* ── the snackbar ──
   Sits above the home indicator and above the keyboard, never under either.
   An undo action holds it open longer, because a message you might act on is
   not the same as a message you only read. */
.mb-toast{position:fixed;left:50%;z-index:9000;
  bottom:calc(var(--s-5,24px) + var(--safe-b,0px) + var(--kb,0px));
  transform:translate(-50%,14px) scale(.97);opacity:0;pointer-events:none;
  display:flex;align-items:center;gap:var(--s-3,12px);
  padding:var(--s-3,12px) var(--s-4,16px);font-size:var(--f-2,14px);
  transition:opacity var(--dur-med,240ms) var(--ease-out,ease),transform var(--dur-med,240ms) var(--ease-out,ease);
  background:var(--surface-3,#1a2430);color:var(--text-1,#dbe7f0);
  border-radius:var(--radius-full,999px);box-shadow:var(--e-4,0 15px 25px rgba(0,0,0,.3));
  font-family:var(--font-body,system-ui);max-width:min(460px,calc(100vw - 24px))}
.mb-toast.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}
.mb-toast .msg{flex:1;min-width:0;line-height:1.4}
.mb-toast b{color:var(--accent,#7ee8fa)}
.mb-toast.bad b{color:var(--danger,#ff6b81)}
.mb-toast .act{flex:0 0 auto;border:0;background:none;cursor:pointer;font:inherit;
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);font-weight:var(--w-bold,700);
  letter-spacing:var(--track-cap,.18em);color:var(--accent,#7ee8fa);padding:0 var(--s-1,4px)}

/* ── rows and options, the furniture of every settings pane ── */
.mb-row{display:flex;align-items:center;gap:var(--s-3,12px);padding:var(--s-3,12px) 0;
  min-height:var(--tap,44px);border-bottom:1px solid var(--border,#1e2a38)}
.mb-row:last-child{border-bottom:0}
.mb-row .lbl{flex:1;min-width:0}
.mb-row .lbl b{display:block;font-weight:var(--w-bold,700);font-size:var(--f-2,14px);color:var(--text-1,#dbe7f0)}
.mb-row .lbl span{display:block;color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);line-height:1.5;margin-top:2px}
/* No border here on purpose. Two background colours already separate the row
   from the pane, and a border on top of that is one separator too many. */
.mb-opt{display:flex;align-items:center;gap:var(--s-3,12px);width:100%;text-align:left;
  margin-bottom:var(--s-2,8px);cursor:pointer;min-height:var(--tap,44px);
  padding:var(--s-3,12px);border:0;border-radius:var(--radius-md,10px);
  background:var(--surface-2,#131b26);color:inherit;font:inherit}
.mb-opt.bad{color:var(--danger,#ff6b81)}
.mb-opt .ic{width:20px;text-align:center;color:var(--accent,#7ee8fa);flex:0 0 auto}
.mb-opt .t{flex:1;min-width:0}
.mb-opt .t b{display:block;font-size:var(--f-2,14px)}
.mb-opt .t span{color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);line-height:1.5}

.mb-group{font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);
  font-weight:var(--w-bold,700);letter-spacing:var(--track-cap,.18em);
  color:var(--text-muted,#5b6d80);margin:var(--s-5,24px) 0 var(--s-2,8px)}
.mb-group:first-child{margin-top:var(--s-2,8px)}

/* ── the segmented control ──
   Replaces the desktop tab strip. Thumb-sized, one visible group, and the
   selection slides instead of blinking, so it reads as one physical control
   rather than five buttons that happen to be next to each other. */
.mb-seg{position:relative;display:flex;gap:2px;padding:3px;flex:0 0 auto;
  background:var(--surface-2,#131b26);border-radius:var(--radius-md,10px);
  overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mb-seg::-webkit-scrollbar{height:0}
.mb-seg i.ind{position:absolute;top:3px;bottom:3px;left:0;border-radius:calc(var(--radius-md,10px) - 3px);
  background:var(--surface-1,#0e141d);box-shadow:var(--e-1,0 1px 3px rgba(0,0,0,.3));pointer-events:none;
  transition:transform var(--dur-med,240ms) var(--ease-out,ease),width var(--dur-med,240ms) var(--ease-out,ease)}
.mb-seg button{position:relative;z-index:1;flex:1 0 auto;min-height:38px;padding:0 var(--s-3,12px);
  border:0;background:none;cursor:pointer;white-space:nowrap;
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);font-weight:var(--w-bold,700);
  letter-spacing:.1em;color:var(--text-muted,#5b6d80);
  transition:color var(--dur-fast,140ms) linear}
.mb-seg button.on{color:var(--text-1,#dbe7f0)}

/* ── the switch ──
   The one control whose state has to be readable without reading anything. */
.mb-sw{flex:0 0 auto;width:50px;height:30px;border:0;padding:2px;cursor:pointer;
  border-radius:var(--radius-full,999px);background:var(--surface-3,#1a2430);
  transition:background-color var(--dur-med,240ms) var(--ease-out,ease)}
.mb-sw i{display:block;width:26px;height:26px;border-radius:50%;background:var(--text-muted,#5b6d80);
  box-shadow:var(--e-1,0 1px 3px rgba(0,0,0,.3));
  transition:transform var(--dur-med,240ms) var(--ease-sheet,ease),background-color var(--dur-med,240ms)}
.mb-sw.on{background:var(--accent,#7ee8fa)}
.mb-sw.on i{transform:translateX(20px);background:var(--accent-fg,#04212a)}

/* ── chips, sliders, fields ── */
.mb-chips{display:flex;flex-wrap:wrap;gap:var(--s-2,8px)}
.mb-chip{min-height:var(--tap,44px);padding:0 var(--s-4,16px);cursor:pointer;
  border:1px solid var(--border,#1e2a38);border-radius:var(--radius-full,999px);
  background:var(--surface-2,#131b26);color:var(--text-2,#7f93a8);font:inherit;font-size:var(--f-2,14px)}
.mb-chip.on{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa);background:var(--surface-3,#1a2430)}
.mb-range{width:100%;height:var(--tap,44px);accent-color:var(--accent,#7ee8fa);background:none}
.mb-sel,.mb-input{min-height:var(--tap,44px);width:100%;
  background:var(--surface-2,#131b26);border:1px solid var(--border,#1e2a38);
  border-radius:var(--radius-md,10px);padding:0 var(--s-3,12px);color:inherit;font:inherit;
  font-size:var(--f-3,16px)}
/* A native select on a phone opens the system picker, which is exactly right.
   Only its closed-state chrome is replaced, never the picker itself. */
.mb-sel{-webkit-appearance:none;appearance:none;padding-right:var(--s-6,32px);
  background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),
    linear-gradient(135deg,currentColor 50%,transparent 50%);
  background-position:calc(100% - 17px) 55%,calc(100% - 12px) 55%;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat}
.mb-input:focus,.mb-sel:focus{outline:2px solid var(--focus,#7ee8fa);outline-offset:-1px}
.mb-swatch{width:44px;height:34px;flex:0 0 auto;padding:0;cursor:pointer;
  border:1px solid var(--border,#1e2a38);border-radius:var(--radius-sm,6px);background:none}

/* ── the desktop popover menu ──
   Only ever seen with a mouse: on a phone UI.menu opens an action sheet. */
.mb-menu{position:fixed;z-index:9100;min-width:190px;padding:5px;
  background:var(--surface-1,#0e141d);border:1px solid var(--border-strong,#2b3a4d);
  border-radius:var(--radius-md,10px);box-shadow:var(--e-3,0 10px 20px rgba(0,0,0,.3));
  font-family:var(--font-body,system-ui);font-size:var(--f-2,14px)}
.mb-menu button{display:block;width:100%;text-align:left;padding:8px 10px;border:0;background:none;
  cursor:pointer;color:var(--text-2,#7f93a8);border-radius:var(--radius-sm,6px);font:inherit}
.mb-menu button.bad{color:var(--danger,#ff6b81)}
.mb-menu hr{border:0;border-top:1px solid var(--border,#1e2a38);margin:4px 2px}

/* Hover is a mouse idea. On a touch screen it sticks after a tap and looks
   broken, so it only exists where there is a real pointer. */
@media (hover:hover) and (pointer:fine){
  .mb-opt:hover{background:var(--surface-3,#1a2430)}
  .mb-chip:hover{border-color:var(--accent,#7ee8fa);color:var(--text-1,#dbe7f0)}
  .mb-seg button:hover{color:var(--text-2,#7f93a8)}
  .mb-menu button:hover{background:var(--surface-2,#131b26);color:var(--text-1,#dbe7f0)}
  .mb-menu button.bad:hover{color:var(--danger,#ff6b81)}
  .mb-toast .act:hover{color:var(--accent-hover,#7ee8fa)}
}
@media (prefers-reduced-motion:reduce){.mb-toast,.mb-seg i.ind,.mb-sw,.mb-sw i{transition:none}}
`;
  document.head.appendChild(s);

  /* ── LEGACY ──
     Only reached by a page that loads ui.js without mobile.js. Everything in
     here used to live in this file and now lives in mobile.js; this is a copy
     so an app that has not been migrated keeps exactly the dialog it had. */
  if (!g.Mobile) {
    const l = el('style'); l.id = 'mb-ui-legacy';
    l.textContent = `
.mb-btn{padding:7px 15px;border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-sm,8px);
  background:none;cursor:pointer;font-family:var(--font-display,system-ui);font-size:11px;letter-spacing:.1em;
  color:var(--text-2,#7f93a8)}
.mb-btn:hover{color:var(--text-1,#dbe7f0);border-color:var(--text-muted,#5b6d80)}
.mb-btn.go{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa);background:var(--surface-2,#131b26)}
.mb-btn.bad{border-color:var(--danger,#ff6b81);color:var(--danger,#ff6b81)}
.mb-btn:focus-visible{outline:2px solid var(--focus,#7ee8fa);outline-offset:2px}
.mb-veil{position:fixed;inset:0;z-index:8900;display:flex;align-items:center;justify-content:center;padding:20px;
  background:var(--overlay,rgba(4,7,11,.72));backdrop-filter:blur(3px)}
.mb-sheet{position:relative;width:min(var(--mb-w,520px),96vw);max-height:88vh;display:flex;flex-direction:column;
  background:var(--surface-1,#0e141d);color:var(--text-1,#dbe7f0);
  border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-md,14px);
  box-shadow:0 30px 80px -30px #000;font-family:var(--font-body,system-ui);font-size:13px;overflow:hidden}
.mb-grab{display:none}
.mb-sheet-head{display:flex;align-items:center;gap:8px;padding:16px 18px 12px;flex:0 0 auto}
.mb-sheet-head h3{margin:0;flex:1;font-family:var(--font-display,system-ui);font-size:13px;font-weight:600;
  letter-spacing:.18em;color:var(--accent,#7ee8fa)}
.mb-x{width:30px;height:30px;border:0;border-radius:50%;background:none;color:var(--text-muted,#5b6d80);cursor:pointer}
.mb-sheet-body{padding:0 18px 4px;overflow:auto;flex:1;min-height:0;line-height:1.65}
.mb-sheet-foot{display:flex;gap:8px;justify-content:flex-end;padding:14px 18px 16px;flex:0 0 auto;
  border-top:1px solid var(--border,#1e2a38);margin-top:12px}
.mb-act{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 12px;border:0;
  cursor:pointer;border-radius:var(--radius-md,10px);background:var(--surface-2,#131b26);color:inherit;font:inherit}
`;
    document.head.appendChild(l);
  }
}

let toastEl, toastT;
/* Every overlay in the suite goes through mobile.js when it is loaded, which
   is what makes the same call site a bottom sheet on a phone and a centred
   card on a laptop. Without mobile.js these fall back to the plain versions,
   so nothing that already calls UI breaks. */
const M = () => g.Mobile;
const buzz = (kind, opts) => { const m = M(); if (m) m.feedback(kind, opts); else if (g.Sfx) g.Sfx.play(kind === 'warn' ? 'error' : 'drop'); };

const UI = {
  el: el, esc: esc,

  /** The snackbar. `opts.action = {label, fn}` turns it into an undo. */
  toast(html, opts) {
    css(); opts = opts || {};
    if (!toastEl) { toastEl = el('div', 'mb-toast'); document.body.appendChild(toastEl); }
    toastEl.className = 'mb-toast' + (opts.bad ? ' bad' : '');
    toastEl.innerHTML = '';
    const msg = el('div', 'msg'); msg.innerHTML = html;
    toastEl.appendChild(msg);
    if (opts.action) {
      const a = el('button', 'act mb-tap', esc(opts.action.label));
      a.type = 'button';
      a.onclick = () => { clearTimeout(toastT); toastEl.classList.remove('on'); buzz('select'); opts.action.fn(); };
      toastEl.appendChild(a);
    }
    void toastEl.offsetHeight;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    /* Long enough to notice, and longer again when there is something to
       press — a message you might act on is not one you only read. */
    toastT = setTimeout(() => toastEl.classList.remove('on'), opts.ms || (opts.action ? 6000 : 2600));
    if (opts.bad) buzz('warn'); else if (opts.action) buzz('select');
  },

  /** Delete something and offer it straight back. Nothing in this suite
      should ever destroy work without a way out of it. */
  undo(message, fn, opts) {
    UI.toast(message, Object.assign({ action: { label: 'UNDO', fn: fn } }, opts || {}));
  },

  /** the one dialog. `body` is a function that fills the content element.
      A bottom sheet on a phone, a centred card on a desktop, same call. */
  dialog(o) {
    css();
    const m = M();
    if (m) return m.sheet(o);
    return legacyDialog(o);
  },

  /** a real confirm, in the app's own clothes. The destructive button is
      filled rather than outlined, because it is the one you must not mistap. */
  confirm(question, detail, opts) {
    opts = opts || {};
    return new Promise(res => {
      let done = false;
      UI.dialog({
        title: opts.title || 'CONFIRM',
        width: 420,
        body: b => {
          b.appendChild(el('p', null, '<b style="color:var(--text-1,#dbe7f0);font-size:var(--f-4,18px);' +
            'font-weight:var(--w-bold,700);line-height:1.4">' + esc(question) + '</b>'));
          if (detail) b.appendChild(el('p', null, esc(detail)));
        },
        actions: [
          { label: opts.no || 'CANCEL', fn: () => { done = true; res(false); } },
          { label: opts.yes || 'YES', kind: opts.danger ? 'bad' : 'go', fn: () => { done = true; res(true); } },
        ],
        onClose: () => { if (!done) res(false); },
      });
    });
  },

  /** items: [{label, note, icon, kind, on, fn}] or '-' for a divider.
      x and y are where a mouse was; a phone ignores them and comes up from
      the bottom, which is where a thumb already is. */
  menu(x, y, items, opts) {
    css(); UI.closeMenus();
    const m = M();
    if (m && m.sheetish()) return m.actions((opts && opts.title) || '', items, opts);

    const box = el('div', 'mb-menu');
    items.forEach(it => {
      if (it === '-') return box.appendChild(el('hr'));
      const b = el('button', it.kind || '', esc(it.label));
      b.onclick = () => { UI.closeMenus(); buzz('select'); it.fn && it.fn(); };
      box.appendChild(b);
    });
    box.style.left = '-9999px'; document.body.appendChild(box);
    const r = box.getBoundingClientRect();
    box.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    box.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    setTimeout(() => document.addEventListener('pointerdown', UI.closeMenus, { once: true }), 0);
    return box;
  },
  closeMenus() { document.querySelectorAll('.mb-menu').forEach(n => n.remove()); },

  /* ── components ──
     Small, and deliberately so. An app that needs a control that is not here
     should say why before adding one. */

  /** the segmented control. items:[{id,name}] — returns the element. */
  segmented(items, value, onChange) {
    css();
    const box = el('div', 'mb-seg');
    const ind = el('i', 'ind');
    box.appendChild(ind);
    let cur = value;
    const slide = () => {
      const b = box.querySelector('button.on');
      if (!b) return;
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
      /* keep the live one on screen when the strip is wider than the phone */
      if (b.offsetLeft < box.scrollLeft || b.offsetLeft + b.offsetWidth > box.scrollLeft + box.clientWidth) {
        box.scrollTo({ left: Math.max(0, b.offsetLeft - 12), behavior: 'smooth' });
      }
    };
    items.forEach(it => {
      const b = el('button', it.id === cur ? 'on' : '', esc(it.name));
      b.type = 'button';
      b.onclick = () => {
        if (it.id === cur) return;
        cur = it.id;
        box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        slide(); buzz('select');
        onChange && onChange(it.id);
      };
      box.appendChild(b);
    });
    /* Place the indicator before it is ever painted, so it does not slide in
       from zero the first time. Synchronous for the same reason the sheet is:
       a frame callback is not guaranteed to run. */
    ind.style.transition = 'none';
    setTimeout(() => { slide(); ind.style.transition = ''; }, 0);
    box.select = id => { const b = [].find.call(box.querySelectorAll('button'), (x, i) => items[i].id === id); if (b) b.click(); };
    return box;
  },

  /** the switch. Returns the element; read `.on` for its state. */
  toggle(on, onChange) {
    css();
    const b = el('button', 'mb-sw' + (on ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.appendChild(el('i'));
    b.on = !!on;
    b.onclick = () => {
      b.on = !b.on;
      b.classList.toggle('on', b.on);
      b.setAttribute('aria-checked', b.on ? 'true' : 'false');
      buzz('toggle');
      onChange && onChange(b.on);
    };
    return b;
  },

  /** a settings row with a label, a description and a control on the right */
  row(title, note, control) {
    const r = el('div', 'mb-row');
    r.appendChild(el('div', 'lbl', '<b>' + esc(title) + '</b>' + (note ? '<span>' + note + '</span>' : '')));
    if (control) r.appendChild(control);
    return r;
  },

  /** an input that already knows which keyboard it wants */
  field(kind, opts) {
    css();
    opts = opts || {};
    const i = el(kind === 'note' ? 'textarea' : 'input', 'mb-input');
    if (kind === 'note') i.rows = opts.rows || 3;
    const m = M();
    if (m) m.field(i, kind, opts); else i.type = 'text';
    if (opts.placeholder) i.placeholder = opts.placeholder;
    if (opts.value != null) i.value = opts.value;
    return i;
  },

  /* ── the standard settings panel ──
     Look and Sound are per app on purpose: ARC can be Monarch while BLOCK is
     Ice. Day and Feel are shared, because two apps disagreeing about what day
     it is, or about whether the phone buzzes, is how a suite stops feeling
     like one product. */
  settings(appId, extraTabs) {
    css();
    const tabs = [];

    if (g.Skins) tabs.push({ id: 'look', name: 'LOOK', draw: drawLook.bind(null, appId) });
    if (g.Sfx) tabs.push({ id: 'sound', name: 'SOUND', draw: drawSound.bind(null, appId) });
    if (g.Mobile) tabs.push({ id: 'feel', name: 'FEEL', draw: drawFeel });
    if (g.Day) tabs.push({ id: 'day', name: 'DAY', draw: drawDay });
    if (g.IO) tabs.push({ id: 'data', name: 'DATA', draw: el2 => g.IO.panel(el2, appId) });
    (extraTabs || []).forEach(t => tabs.push(t));

    let active = tabs[0] && tabs[0].id;
    return UI.dialog({
      title: 'SETTINGS · ' + String(appId || '').toUpperCase(),
      width: 560,
      body: (body, h) => {
        /* The strip sits outside the scrolling area, so it stays put while
           the pane under it moves. A tab bar that scrolls away is a web page. */
        const pane = el('div');
        const show = id => {
          active = id;
          pane.innerHTML = '';
          const t = tabs.filter(x => x.id === active)[0];
          if (t) t.draw(pane, h);
          body.scrollTop = 0;
        };
        const bar = UI.segmented(tabs, active, show);
        bar.style.margin = '0 var(--s-4,16px) var(--s-3,12px)';
        h.box.insertBefore(bar, body);
        body.appendChild(pane);
        show(active);
      },
      actions: [{ label: 'DONE', kind: 'go' }],
    });
  },
};

/* ── the plain dialog ──
   Reached only when mobile.js is not loaded. Same markup as the sheet so the
   LEGACY stylesheet can dress it, and the same handle shape so no caller can
   tell which one it got. */
function legacyDialog(o) {
  const veil = el('div', 'mb-veil'), box = el('div', 'mb-sheet');
  if (o.width) box.style.setProperty('--mb-w', o.width + 'px');
  box.appendChild(el('div', 'mb-grab'));
  const head = el('div', 'mb-sheet-head');
  head.appendChild(el('h3', null, esc(o.title || '')));
  box.appendChild(head);
  const body = el('div', 'mb-sheet-body');
  box.appendChild(body);
  const handle = {
    body: body, box: box, panel: box, wide: true,
    close(v) {
      veil.remove(); document.removeEventListener('keydown', onKey);
      if (g.Sfx) g.Sfx.play('close');
      if (o.onClose) o.onClose(v);
    },
  };
  if (typeof o.body === 'function') o.body(body, handle); else if (o.body) body.innerHTML = o.body;
  if (o.actions && o.actions.length) {
    const foot = el('div', 'mb-sheet-foot');
    o.actions.forEach(a => {
      const b = el('button', 'mb-btn' + (a.kind ? ' ' + a.kind : ''), esc(a.label));
      b.onclick = () => { const r = a.fn ? a.fn(handle) : undefined; if (r !== false) handle.close(a.value); };
      foot.appendChild(b);
    });
    box.appendChild(foot);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); handle.close(); }
    if (e.key === 'Enter' && o.enter && !/TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); o.enter(handle); }
  }
  document.addEventListener('keydown', onKey);
  veil.onclick = e => { if (e.target === veil && o.dismissable !== false) handle.close(); };
  veil.appendChild(box); document.body.appendChild(veil);
  if (g.Sfx) g.Sfx.play('open');
  setTimeout(() => { const f = box.querySelector('input,select,button.go'); if (f) f.focus(); }, 40);
  return handle;
}

/* ── feel ──
   The one tab that is about the hands rather than the eyes. */
function drawFeel(pane) {
  const M = g.Mobile;
  pane.appendChild(el('div', 'mb-group', 'HOW IT ANSWERS — SHARED BY EVERY APP'));

  const canBuzz = !!navigator.vibrate;
  pane.appendChild(UI.row('Vibrate on a tap',
    canBuzz
      ? 'A short buzz when something lands, a longer one when something finishes.'
      : 'This phone or browser has no vibration. <b>iPhone Safari has none at all</b>, so on an iPhone the sound is the whole of the feedback.',
    UI.toggle(M.haptics && canBuzz, on => { M.setHaptics(on); if (on) M.haptic('success'); })));

  pane.appendChild(UI.row('Feel it', 'Tap, finish, then a whole day done.', (() => {
    const b = el('button', 'mb-btn mb-press mb-tap', 'PLAY');
    b.type = 'button';
    b.onclick = () => {
      M.feedback('tick');
      setTimeout(() => M.feedback('success'), 260);
      setTimeout(() => M.feedback('complete', { level: 3 }), 620);
    };
    return b;
  })()));

  pane.appendChild(el('div', 'mb-group', 'THIS DEVICE'));
  const bits = [
    M.ios ? 'iPhone or iPad' : M.android ? 'Android' : 'desktop',
    M.touch ? 'touch screen' : 'mouse and keyboard',
    M.standalone ? 'installed to the home screen' : 'running in the browser',
    canBuzz ? 'can vibrate' : 'cannot vibrate',
    M.reduced() ? 'motion reduced in system settings' : 'full motion',
  ];
  pane.appendChild(el('p', null, '<span style="color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);line-height:1.6">' +
    esc(bits.join(' · ')) + '</span>'));

  if (!M.standalone && M.touch) {
    pane.appendChild(el('p', null, '<span style="color:var(--warn,#ffb347);font-size:var(--f-1,12px);line-height:1.6">' +
      'Add this to your home screen and it opens without the browser bars, gets the full screen, ' +
      'and stops iOS clearing its data after seven days of not being opened.</span>'));
  }
}

/* ── settings tabs ── */
/* Two layers, kept visibly separate because they are separate:
   the THEME is picked per app, the COLOURS belong to that theme and follow it
   into every app that wears it. */
function drawLook(appId, pane) {
  const S = g.Skins;
  S.injectPickerCSS();

  pane.appendChild(el('div', 'mb-group', 'THEME — THIS APP ONLY'));
  const wrap = el('div');
  wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  pane.appendChild(wrap);

  const colours = el('div');
  S.picker(wrap, {
    custom: false,
    onChange: () => { if (g.Sfx) g.Sfx.play('drop'); paintColours(); },
  });
  pane.appendChild(colours);
  paintColours();

  function paintColours() {
    const skin = S.current || S.get(S.list()[0].id);
    const id = skin.id;
    let pal = S.paletteFor(id);
    colours.innerHTML = '';

    colours.appendChild(el('div', 'mb-group',
      'COLOURS — ' + esc(skin.name.toUpperCase()) +
      (S.isCustomised(id) ? ' <span style="color:var(--accent,#7ee8fa)">· EDITED</span>' : '')));
    colours.appendChild(el('p', null,
      'These belong to the theme, so every app set to ' + esc(skin.name) + ' gets them.'));

    /* live while you drag, saved when you let go */
    const live = () => S.apply(skin, pal);
    const commit = () => { S.savePalette(id, pal); paintColours(); };

    S.FIELDS.forEach(([key, label]) => {
      const row = el('div', 'mb-row');
      row.appendChild(el('div', 'lbl', '<b>' + esc(label) + '</b>'));
      const c = el('input', 'mb-swatch mb-tap');
      c.type = 'color'; c.value = pal[key];
      c.oninput = () => { pal[key] = c.value; live(); };
      c.onchange = commit;
      row.appendChild(c);
      colours.appendChild(row);
    });

    const nrow = el('div', 'mb-row');
    nrow.appendChild(el('div', 'lbl', '<b>Node &amp; chart colours</b><span>The six ARC paints with.</span>'));
    const strip = el('div');
    strip.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
    pal.colors.forEach((hex, i) => {
      /* 44 wide even though the ink is small: six swatches in a row is the
         easiest thing in this panel to mis-tap. */
      const c = el('input', 'mb-swatch mb-tap');
      c.type = 'color'; c.value = hex;
      c.style.width = '38px';
      c.oninput = () => { pal.colors[i] = c.value; live(); };
      c.onchange = commit;
      strip.appendChild(c);
    });
    nrow.appendChild(strip);
    colours.appendChild(nrow);

    const warn = S.check({ bg: pal.bg, panel: pal.panel, accent: pal.acc, text: pal.ink });
    colours.appendChild(el('p', null, warn.ok
      ? '<span style="color:var(--success,#6ee7a8);font-size:12px">Readable — good contrast on both counts.</span>'
      : '<span style="color:var(--warn,#ffb347);font-size:12px">Hard to read: ' +
        (warn.accentOnBg < 3 ? 'the accent is too close to the background. ' : '') +
        (warn.textOnPanel < 4.5 ? 'the text is too close to the cards.' : '') + '</span>'));

    const acts = el('div', 'mb-row');
    acts.appendChild(el('div', 'lbl', S.isCustomised(id)
      ? '<b>Back to normal</b><span>Throws away your colours and repaints ' + esc(skin.name) + ' as it ships.</span>'
      : '<b>Use this everywhere</b><span>Sets every other app to this theme. Their own colours are untouched.</span>'));
    if (S.isCustomised(id)) {
      const b = el('button', 'mb-btn bad mb-press mb-tap', 'RESET COLOURS');
      b.onclick = () => { S.clearPalette(id); S.apply(skin); pal = S.paletteFor(id); paintColours(); UI.toast('reset to the theme’s own colours'); };
      acts.appendChild(b);
    } else {
      const b = el('button', 'mb-btn mb-press mb-tap', 'APPLY TO ALL');
      b.onclick = () => {
        try {
          Object.keys(localStorage).filter(k => k.indexOf('suite_skin.') === 0).forEach(k => localStorage.setItem(k, id));
          localStorage.setItem('suite_skin', id);
          UI.toast('every app is now <b>' + esc(skin.name) + '</b>');
        } catch (e) { UI.toast('could not save that', { bad: true }); }
      };
      acts.appendChild(b);
    }
    colours.appendChild(acts);
  }
}

function drawSound(appId, pane) {
  const S = g.Sfx, cur = S.settings;
  pane.appendChild(el('div', 'mb-group', 'SOUND THEME — THIS APP ONLY'));
  const chips = el('div', 'mb-chips');
  S.PACKS.forEach(p => {
    const c = el('button', 'mb-chip mb-press mb-tap' + (cur.pack === p.id ? ' on' : ''), esc(p.name));
    c.onclick = () => { S.pack(p.id); S.preview(p.id); pane.innerHTML = ''; drawSound(appId, pane); };
    chips.appendChild(c);
  });
  pane.appendChild(chips);

  pane.appendChild(el('div', 'mb-group', 'INSTRUMENT'));
  const vrow = el('div', 'mb-row');
  vrow.appendChild(el('div', 'lbl', '<b>Voice</b><span>The same theme played on a different instrument.</span>'));
  const sel = el('select', 'mb-sel');
  sel.appendChild(Object.assign(el('option', null, 'theme default'), { value: '' }));
  S.VOICES.forEach(v => { const o = el('option', null, v); o.value = v; if (cur.voice === v) o.selected = true; sel.appendChild(o); });
  sel.onchange = () => { S.voice(sel.value); S.preview(); };
  vrow.appendChild(sel); pane.appendChild(vrow);

  const volrow = el('div', 'mb-row');
  volrow.appendChild(el('div', 'lbl', '<b>Volume</b>'));
  const r = el('input', 'mb-range'); r.type = 'range'; r.min = 0; r.max = 100; r.value = Math.round(cur.vol * 100);
  r.style.maxWidth = '180px';
  r.oninput = () => S.volume(r.value / 100);
  r.onchange = () => S.play('done');
  volrow.appendChild(r); pane.appendChild(volrow);

  const mrow = el('div', 'mb-row');
  mrow.appendChild(el('div', 'lbl', '<b>Sound in this app</b><span>Every app remembers its own.</span>'));
  const mb = UI.toggle(!cur.mute, on => { S.mute(!on); if (on) S.play('done'); });
  mrow.appendChild(mb); pane.appendChild(mrow);

  const trow = el('div', 'mb-row');
  trow.appendChild(el('div', 'lbl', '<b>Hear it</b><span>Tick, finish, then a full completion.</span>'));
  const tb = el('button', 'mb-btn mb-press mb-tap', 'PLAY');
  tb.onclick = () => S.preview();
  trow.appendChild(tb); pane.appendChild(trow);
}

function drawDay(pane) {
  const D = g.Day;
  pane.appendChild(el('div', 'mb-group', 'WHEN YOUR DAY TURNS OVER — SHARED BY EVERY APP'));
  pane.appendChild(el('p', null,
    'Anything logged before <b>' + D.startsAt + ':00</b> counts as the day before. ' +
    'A session at 2am belongs to the day you were still in, not the one the clock says.'));

  const row = el('div', 'mb-row');
  row.appendChild(el('div', 'lbl', '<b>My day starts at</b><span>Everything else follows from this.</span>'));
  const sel = el('select', 'mb-sel');
  for (let h = 0; h <= 11; h++) { const o = el('option', null, String(h).padStart(2, '0') + ':00'); o.value = h; if (D.startsAt === h) o.selected = true; sel.appendChild(o); }
  sel.onchange = () => { D.set({ startsAt: +sel.value }); pane.innerHTML = ''; drawDay(pane); UI.toast('saved'); };
  row.appendChild(sel); pane.appendChild(row);

  const info = el('div', 'mb-row');
  info.appendChild(el('div', 'lbl', '<b>Right now</b><span>Today is <b>' + D.today() + '</b> · rolls over in ' +
    Math.floor(D.untilRollover() / 60) + 'h ' + (D.untilRollover() % 60) + 'm · ' +
    (D.isClosed(D.today()) ? 'closed, still open to edits' : 'still running') + '</span>'));
  pane.appendChild(info);
  pane.appendChild(el('p', null, '<span style="color:var(--text-muted,#5b6d80);font-size:11.5px">Past dates can always be edited, whatever these are set to.</span>'));
}

g.UI = UI;
})(window);
