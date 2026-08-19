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

function css() {
  if (document.getElementById('mb-ui-css')) return;
  const s = el('style'); s.id = 'mb-ui-css';
  s.textContent = `
.mb-toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,18px);opacity:0;pointer-events:none;
  z-index:9000;padding:9px 15px;font-size:12.5px;transition:opacity .2s,transform .2s;
  background:var(--surface-1,#0e141d);color:var(--text-1,#dbe7f0);
  border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-md,9px);
  box-shadow:0 12px 40px -14px rgba(0,0,0,.8);font-family:var(--font-body,system-ui);max-width:min(420px,90vw)}
.mb-toast.on{opacity:1;transform:translate(-50%,0)}
.mb-toast b{color:var(--accent,#7ee8fa)}
.mb-toast.bad{border-color:var(--danger,#ff6b81)}
.mb-toast.bad b{color:var(--danger,#ff6b81)}
.mb-veil{position:fixed;inset:0;z-index:8900;display:flex;align-items:center;justify-content:center;padding:20px;
  background:var(--overlay,rgba(4,7,11,.72));backdrop-filter:blur(3px);animation:mb-fade var(--dur-fast,140ms) ease}
@keyframes mb-fade{from{opacity:0}to{opacity:1}}
.mb-dialog{width:min(var(--mb-w,520px),96vw);max-height:88vh;display:flex;flex-direction:column;
  background:var(--surface-1,#0e141d);color:var(--text-1,#dbe7f0);
  border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-md,14px);
  box-shadow:0 30px 80px -30px #000;font-family:var(--font-body,system-ui);font-size:13px;overflow:hidden}
.mb-dialog h3{margin:0;padding:16px 18px 12px;font-family:var(--font-display,system-ui);
  font-size:13px;font-weight:600;letter-spacing:.18em;color:var(--accent,#7ee8fa);flex:0 0 auto}
.mb-body{padding:0 18px 4px;overflow:auto;flex:1;min-height:0;line-height:1.65}
.mb-body p{margin:0 0 12px;color:var(--text-2,#7f93a8)}
.mb-foot{display:flex;gap:8px;justify-content:flex-end;padding:14px 18px 16px;flex:0 0 auto;
  border-top:1px solid var(--border,#1e2a38);margin-top:12px}
.mb-btn{padding:7px 15px;border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-sm,8px);
  background:none;cursor:pointer;font-family:var(--font-display,system-ui);font-size:11px;letter-spacing:.1em;
  color:var(--text-2,#7f93a8)}
.mb-btn:hover{color:var(--text-1,#dbe7f0);border-color:var(--text-muted,#5b6d80)}
.mb-btn.go{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa);background:var(--surface-2,#131b26)}
.mb-btn.bad{border-color:var(--danger,#ff6b81);color:var(--danger,#ff6b81)}
.mb-btn:focus-visible{outline:2px solid var(--focus,#7ee8fa);outline-offset:2px}
.mb-tabs{display:flex;gap:3px;padding:0 18px 12px;flex-wrap:wrap;flex:0 0 auto}
.mb-tabs button{padding:5px 12px;border:1px solid transparent;border-radius:var(--radius-sm,6px);background:none;
  cursor:pointer;font-family:var(--font-display,system-ui);font-size:11px;letter-spacing:.12em;color:var(--text-muted,#5b6d80)}
.mb-tabs button:hover{color:var(--text-1,#dbe7f0)}
.mb-tabs button.on{color:var(--accent,#7ee8fa);border-color:var(--border,#1e2a38);background:var(--surface-2,#131b26)}
.mb-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--border,#1e2a38)}
.mb-row:last-child{border-bottom:0}
.mb-row .lbl{flex:1;min-width:0}
.mb-row .lbl b{display:block;font-weight:600;font-size:13px;color:var(--text-1,#dbe7f0)}
.mb-row .lbl span{color:var(--text-muted,#5b6d80);font-size:11.5px;line-height:1.5}
.mb-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;margin-bottom:8px;cursor:pointer;
  padding:11px 12px;border:1px solid var(--border,#1e2a38);border-radius:var(--radius-md,10px);
  background:var(--surface-2,#131b26);color:inherit;font:inherit}
.mb-opt:hover{border-color:var(--accent,#7ee8fa)}
.mb-opt.bad:hover{border-color:var(--danger,#ff6b81)}
.mb-opt .ic{width:18px;text-align:center;color:var(--accent,#7ee8fa);flex:0 0 auto}
.mb-opt .t{flex:1;min-width:0}
.mb-opt .t b{display:block;font-size:13px}
.mb-opt .t span{color:var(--text-muted,#5b6d80);font-size:11.5px;line-height:1.5}
.mb-group{font-family:var(--font-display,system-ui);font-size:10px;letter-spacing:.18em;
  color:var(--text-muted,#5b6d80);margin:18px 0 9px}
.mb-chips{display:flex;flex-wrap:wrap;gap:8px}
.mb-chip{padding:6px 12px;border:1px solid var(--border,#1e2a38);border-radius:20px;cursor:pointer;
  background:var(--surface-2,#131b26);color:var(--text-2,#7f93a8);font:inherit;font-size:11.5px}
.mb-chip:hover{border-color:var(--accent,#7ee8fa);color:var(--text-1,#dbe7f0)}
.mb-chip.on{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa)}
.mb-range{width:100%;accent-color:var(--accent,#7ee8fa)}
.mb-sel{background:var(--surface-2,#131b26);border:1px solid var(--border,#1e2a38);
  border-radius:var(--radius-sm,8px);padding:7px 9px;color:inherit;font:inherit}
.mb-menu{position:fixed;z-index:9100;min-width:180px;padding:5px;
  background:var(--surface-1,#0e141d);border:1px solid var(--border-strong,#2b3a4d);
  border-radius:var(--radius-md,10px);box-shadow:0 18px 44px -18px #000;font-family:var(--font-body,system-ui);font-size:12.5px}
.mb-menu button{display:block;width:100%;text-align:left;padding:7px 10px;border:0;background:none;cursor:pointer;
  color:var(--text-2,#7f93a8);border-radius:var(--radius-sm,6px);font:inherit}
.mb-menu button:hover{background:var(--surface-2,#131b26);color:var(--text-1,#dbe7f0)}
.mb-menu button.bad:hover{color:var(--danger,#ff6b81)}
.mb-menu hr{border:0;border-top:1px solid var(--border,#1e2a38);margin:4px 2px}
@media (prefers-reduced-motion:reduce){.mb-toast,.mb-veil{transition:none;animation:none}}
`;
  document.head.appendChild(s);
}

let toastEl, toastT;
const UI = {
  el: el, esc: esc,

  toast(html, opts) {
    css(); opts = opts || {};
    if (!toastEl) { toastEl = el('div', 'mb-toast'); document.body.appendChild(toastEl); }
    toastEl.className = 'mb-toast' + (opts.bad ? ' bad' : '');
    toastEl.innerHTML = html;
    requestAnimationFrame(() => toastEl.classList.add('on'));
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), opts.ms || 2600);
    if (opts.bad) beep('error');
  },

  /** the one dialog. `body` is a function that fills the content element. */
  dialog(o) {
    css();
    const veil = el('div', 'mb-veil'), box = el('div', 'mb-dialog');
    if (o.width) box.style.setProperty('--mb-w', o.width + 'px');
    if (o.title) box.appendChild(el('h3', null, esc(o.title)));
    const body = el('div', 'mb-body');
    box.appendChild(body);
    const handle = {
      body: body, box: box,
      close(v) {
        veil.remove(); document.removeEventListener('keydown', onKey);
        beep('close');
        if (o.onClose) o.onClose(v);
      },
    };
    if (typeof o.body === 'function') o.body(body, handle); else if (o.body) body.innerHTML = o.body;
    if (o.actions && o.actions.length) {
      const foot = el('div', 'mb-foot');
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
    beep('open');
    setTimeout(() => { const f = box.querySelector('input,select,button.go'); if (f) f.focus(); }, 40);
    return handle;
  },

  /** a real confirm, in the app's own clothes */
  confirm(question, detail, opts) {
    opts = opts || {};
    return new Promise(res => {
      let done = false;
      UI.dialog({
        title: opts.title || 'CONFIRM',
        width: 420,
        body: b => {
          b.appendChild(el('p', null, '<b style="color:var(--text-1,#dbe7f0);font-size:14px">' + esc(question) + '</b>'));
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

  /** items: [{label, fn, kind}] or '-' for a divider */
  menu(x, y, items) {
    css(); UI.closeMenus();
    const m = el('div', 'mb-menu');
    items.forEach(it => {
      if (it === '-') return m.appendChild(el('hr'));
      const b = el('button', it.kind || '', esc(it.label));
      b.onclick = () => { UI.closeMenus(); it.fn && it.fn(); };
      m.appendChild(b);
    });
    m.style.left = '-9999px'; document.body.appendChild(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    m.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    setTimeout(() => document.addEventListener('pointerdown', UI.closeMenus, { once: true }), 0);
    return m;
  },
  closeMenus() { document.querySelectorAll('.mb-menu').forEach(n => n.remove()); },

  /* ── the standard settings panel ──
     Look and Sound are per app on purpose: ARC can be Monarch while BLOCK is
     Ice. Day is shared, because two apps disagreeing about what day it is is
     how numbers start disagreeing. */
  settings(appId, extraTabs) {
    css();
    const tabs = [];

    if (g.Skins) tabs.push({ id: 'look', name: 'LOOK', draw: drawLook.bind(null, appId) });
    if (g.Sfx) tabs.push({ id: 'sound', name: 'SOUND', draw: drawSound.bind(null, appId) });
    if (g.Day) tabs.push({ id: 'day', name: 'DAY', draw: drawDay });
    if (g.IO) tabs.push({ id: 'data', name: 'DATA', draw: el2 => g.IO.panel(el2, appId) });
    (extraTabs || []).forEach(t => tabs.push(t));

    let active = tabs[0] && tabs[0].id;
    return UI.dialog({
      title: 'SETTINGS · ' + String(appId || '').toUpperCase(),
      width: 560,
      body: (body, h) => {
        const bar = el('div', 'mb-tabs'), pane = el('div');
        h.box.insertBefore(bar, body);
        body.appendChild(pane);
        const paint = () => {
          bar.innerHTML = '';
          tabs.forEach(t => {
            const b = el('button', t.id === active ? 'on' : '', t.name);
            b.onclick = () => { active = t.id; paint(); };
            bar.appendChild(b);
          });
          pane.innerHTML = '';
          const t = tabs.filter(x => x.id === active)[0];
          if (t) t.draw(pane, h);
        };
        paint();
      },
      actions: [{ label: 'DONE', kind: 'go' }],
    });
  },
};

/* ── settings tabs ── */
function drawLook(appId, pane) {
  const S = g.Skins;
  S.injectPickerCSS();
  pane.appendChild(el('div', 'mb-group', 'THEME — THIS APP ONLY'));
  const wrap = el('div'); wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px';
  pane.appendChild(wrap);
  S.picker(wrap, { onChange: () => { if (g.Sfx) g.Sfx.play('drop'); } });

  const row = el('div', 'mb-row');
  row.appendChild(el('div', 'lbl', '<b>Use this theme everywhere</b><span>Sets every other app to the same skin. Nothing else about them changes.</span>'));
  const b = el('button', 'mb-btn', 'APPLY TO ALL');
  b.onclick = () => {
    const id = S.current && S.current.id; if (!id) return;
    try {
      Object.keys(localStorage).filter(k => k.indexOf('suite_skin.') === 0).forEach(k => localStorage.setItem(k, id));
      localStorage.setItem('suite_skin', id);
      UI.toast('every app is now <b>' + esc(S.current.name) + '</b>');
    } catch (e) { UI.toast('could not save that', { bad: true }); }
  };
  row.appendChild(b);
  pane.appendChild(row);
}

function drawSound(appId, pane) {
  const S = g.Sfx, cur = S.settings;
  pane.appendChild(el('div', 'mb-group', 'SOUND THEME — THIS APP ONLY'));
  const chips = el('div', 'mb-chips');
  S.PACKS.forEach(p => {
    const c = el('button', 'mb-chip' + (cur.pack === p.id ? ' on' : ''), esc(p.name));
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
  mrow.appendChild(el('div', 'lbl', '<b>Mute this app</b><span>Other apps keep their own setting.</span>'));
  const mb = el('button', 'mb-btn' + (cur.mute ? '' : ' go'), cur.mute ? 'MUTED' : 'ON');
  mb.onclick = () => { S.mute(!S.mute()); pane.innerHTML = ''; drawSound(appId, pane); if (!S.mute()) S.play('done'); };
  mrow.appendChild(mb); pane.appendChild(mrow);

  const trow = el('div', 'mb-row');
  trow.appendChild(el('div', 'lbl', '<b>Hear it</b><span>Tick, finish, then a full completion.</span>'));
  const tb = el('button', 'mb-btn', 'PLAY');
  tb.onclick = () => S.preview();
  trow.appendChild(tb); pane.appendChild(trow);
}

function drawDay(pane) {
  const D = g.Day;
  pane.appendChild(el('div', 'mb-group', 'WHEN YOUR DAY TURNS OVER — SHARED BY EVERY APP'));
  pane.appendChild(el('p', null,
    'Anything logged before <b>' + D.startsAt + ':00</b> counts as the day before. ' +
    'A session at 2am belongs to the day you were still in, not the one the clock says.'));

  const mk = (title, note, get, set, lo, hi) => {
    const row = el('div', 'mb-row');
    row.appendChild(el('div', 'lbl', '<b>' + title + '</b><span>' + note + '</span>'));
    const sel = el('select', 'mb-sel');
    for (let h = lo; h <= hi; h++) { const o = el('option', null, String(h).padStart(2, '0') + ':00'); o.value = h; if (get() === h) o.selected = true; sel.appendChild(o); }
    sel.onchange = () => { set(+sel.value); pane.innerHTML = ''; drawDay(pane); UI.toast('saved'); };
    row.appendChild(sel); pane.appendChild(row);
  };
  mk('New day starts at', 'Which date a tick lands on.', () => D.startsAt, v => D.set({ startsAt: v }), 0, 11);
  mk('Day is closed at', 'When it counts as finished and gets scored. Sits before the rollover, so there is a grace window to log late.', () => D.closesAt, v => D.set({ closesAt: v }), 0, 23);

  const info = el('div', 'mb-row');
  info.appendChild(el('div', 'lbl', '<b>Right now</b><span>Today is <b>' + D.today() + '</b> · rolls over in ' +
    Math.floor(D.untilRollover() / 60) + 'h ' + (D.untilRollover() % 60) + 'm · ' +
    (D.isClosed(D.today()) ? 'closed, still open to edits' : 'still running') + '</span>'));
  pane.appendChild(info);
  pane.appendChild(el('p', null, '<span style="color:var(--text-muted,#5b6d80);font-size:11.5px">Past dates can always be edited, whatever these are set to.</span>'));
}

g.UI = UI;
})(window);
