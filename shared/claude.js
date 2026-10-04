/* ══════════════════════════════════════════════════════════════════════════
   CLAUDE — ask about your own rows, and log by talking. Main Menu only.

   Tom, 2026-10-04: "possible to add a claude interface in my motherbase.exe?",
   then "A and B": A, questions about his own data ("how's my bench
   trending"); B, logging by talking ("3 sets bench 80kg").

   Main Menu.exe puts this script on every suite page (desktop/ClaudeBridge.cs)
   and runs the bundled claude.exe on his subscription. Nothing loads it
   anywhere else, and it does nothing without the window's bridge, so a phone,
   a browser or a client never sees it.

   How it works:
     · A gold CLAUDE tab on the right edge opens the panel.
     · Asking hands Claude a copy of the store as files, one per type
       (pictures and long text left out), plus the type table from the root
       CLAUDE.md. Claude reads them with Read and Grep; it cannot write them.
     · Claude answers with words and, when he told it something to log, a list
       of writes. THIS page applies them through the store, at once, each shown
       under the answer with an Undo. Change a row = Rec.patch, never a rebuilt
       payload. A journal line goes through Journal.add like every other app.
     · The conversation lives in the window, not the page, so it follows him
       from app to app.
   ══════════════════════════════════════════════════════════════════════════ */
(function (g) {
'use strict';

const wv = g.chrome && g.chrome.webview;
if (!wv || g.top !== g || g.MB_CLAUDE) return;
g.MB_CLAUDE = true;

const VERSION = '1.0.0';
const doc = g.document;
const me = doc.getElementById('mb-claude-js') || doc.currentScript;
const ROOT = String((me && me.src) || '').replace(/shared\/claude\.js.*$/, '');
const MODEL = 'sonnet';

/* types Claude may read but never write: pictures, other devices, themes,
   the brief the daemon owns, and every app's settings */
const NO_WRITE = { device: 1, setting: 1, skin: 1, cphoto: 1, cref: 1, shot: 1, brief: 1 };
const LONG = 1200;    /* a string longer than this is a picture or pasted text */

let state = { open: false, busy: false, msgs: [], found: true };
let dirty = true;     /* has the store changed since Claude last got a copy */
let typesMd = null;
const applying = {};

/* ── talking to the window ── */
function post(m) { m.mb = 'claude'; try { wv.postMessage(JSON.stringify(m)); } catch (e) {} }
wv.addEventListener('message', function (e) {
  const m = e.data;
  if (!m || m.mb !== 'claude' || m.op !== 'state') return;
  state = m;
  if (!g.Rec) return draw();
  applyNew().then(draw, draw);
});

/* ── the copy Claude reads ── */
function slim(v) {
  if (typeof v === 'string') return v.length > LONG ? '[left out: ' + v.length + ' characters, a picture or long text]' : v;
  if (Array.isArray(v)) return v.map(slim);
  if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = slim(v[k]); return o; }
  return v;
}
function guide() {
  if (typesMd != null) return Promise.resolve(typesMd);
  return fetch(ROOT + 'CLAUDE.md', { cache: 'no-cache' }).then(r => r.ok ? r.text() : '').then(t => {
    const a = t.indexOf('### Ownership'), b = t.indexOf('\n### ', a + 10);
    typesMd = a < 0 ? '' : t.slice(a, b < 0 ? undefined : b);
    return typesMd;
  }).catch(() => (typesMd = ''));
}
function today() { return g.Day && g.Day.today ? g.Day.today() : new Date().toISOString().slice(0, 10); }
function snapshot() {
  const R = g.Rec;
  return Promise.all([R.need(), guide()]).then(function (got) {
    const by = {}, counts = {};
    R.export().forEach(function (r) {
      if (!r || r.deleted) return;
      (by[r.type] = by[r.type] || []).push(JSON.stringify({ date: r.date, key: r.key, payload: slim(r.payload), updated_at: r.updated_at }));
    });
    const files = {};
    Object.keys(by).sort().forEach(function (t) { files['rows/' + t + '.jsonl'] = by[t].join('\n') + '\n'; counts[t] = by[t].length; });
    files['types.md'] = '# What each type is\n\nFrom Motherbase\'s CLAUDE.md. `owner` is the app responsible for the shape.\n\n' + (got[1] || '(could not be read this time)') + '\n';
    files['about.md'] = '# This copy\n\nTaken ' + new Date().toString() + '.\n\nRows per type:\n' +
      Object.keys(counts).map(t => '- ' + t + ': ' + counts[t]).join('\n') + '\n';
    return files;
  });
}

/* ── what Claude is told ── */
const SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    reply: { type: 'string' },
    writes: { type: 'array', items: { type: 'object', properties: {
      do: { type: 'string', enum: ['note', 'add', 'patch', 'delete'] },
      say: { type: 'string' },
      type: { type: 'string' }, date: { type: ['string', 'null'] }, key: { type: 'string' },
      payload: { type: 'object' }, changes: { type: 'object' },
      kind: { type: 'string', enum: ['todo', 'entry', 'event', 'idea'] }, text: { type: 'string' },
    }, required: ['do', 'say'] } },
  },
  required: ['reply', 'writes'],
});

function system() {
  return [
    '# You are the CLAUDE panel inside Motherbase',
    '',
    'Motherbase is Tom\'s life-data suite (training, food, body, money, journal, habits). You are a chat panel in its desktop window. He asks about his data, or tells you something to log.',
    '',
    '## His data',
    '- Your working folder holds a fresh copy of every row: `rows/<type>.jsonl`, one row per line, `{date, key, payload, updated_at}`. `types.md` says what each type holds. `about.md` lists the row counts.',
    '- Files can be big (thousands of TRAIN sets). Grep by date, key or name; do not read a big file whole.',
    '- TRAIN sets point at an exercise by id: look the name up in `rows/exercise.jsonl`. Weights are stored in kg. Spends point at an account in `rows/acct.jsonl`. Money is PHP (₱).',
    '- Count carefully and say what you counted ("12 sets across 4 sessions since 1 Sep"). If the rows do not hold it, say so; never guess a number.',
    '',
    '## Logging',
    'When he tells you something happened, or asks you to log, change or remove something, put it in `writes`. The panel applies each one at once and shows your `say` line with an Undo, so `say` must name exactly what was written ("Bench press 80kg x 8, 3 sets, today").',
    '- A journal line (a bullet, a note, a todo, an event, an idea): `{do:"note", kind, text, date}`. Kind is entry unless he says otherwise. `text` can carry a time ("Train 6pm 90m").',
    '- A new row of any other type: `{do:"add", type, date, payload}`. FIRST read the newest 3 rows of that type and copy their exact field names and shapes. Never invent a field. Use the real ids you find (exercise, food, account). Leave `key` out unless the type\'s key is a meaningful name; the panel makes a timestamp id like the apps do. Timestamps (`t`) are milliseconds since 1970.',
    '- One TRAIN set is one `set` row. "3 sets" is three writes. A set\'s `ord` is its place among THAT exercise\'s sets on that day, from 1.',
    '- To change a row: `{do:"patch", type, date, key, changes}` with only the fields that change (`"base.ca": 120` reaches inside). Never send a whole rebuilt payload.',
    '- `{do:"delete", type, date, key}` only when he asks to remove something.',
    '- Never write these types: ' + Object.keys(NO_WRITE).join(', ') + '.',
    '- If which exercise, food or account is unclear, ask instead of writing.',
    '- A question is not a request to log. No writes unless he asked for one.',
    '',
    '## Replies',
    'Short and plain, for a twelve year old. Answer first. No tables and no headings. Skip the confidence line and the next action for a simple log or a quick answer.',
  ].join('\n');
}

/* ── asking ── */
function ask(text) {
  text = String(text || '').trim();
  if (!text || state.busy) return;
  const R = g.Rec;
  const now = new Date();
  const prompt = 'Today is ' + today() + ', ' + now.toLocaleDateString('en-GB', { weekday: 'long' }) +
    ', ' + now.toTimeString().slice(0, 5) + ' (ms ' + now.getTime() + '). He is on the ' + appName() + ' page.\n\n' + text;
  state.busy = true;
  state.msgs = state.msgs.concat([{ who: 'me', text: text, t: Date.now() }]);
  draw();
  const send = function (files) {
    post({ op: 'ask', text: text, prompt: prompt, system: system(), schema: SCHEMA, model: MODEL, files: files || null });
  };
  if (!R) return send(null);
  if (!dirty) return send(null);
  snapshot().then(function (files) { dirty = false; send(files); }, function () { send(null); });
}
function appName() {
  const p = location.pathname.replace(/\/index\.html$/, '/').split('/').filter(Boolean);
  const last = p[p.length - 1] || '';
  return !last || /motherbase/i.test(last) ? 'home screen' : last.toUpperCase();
}

/* ── writing what Claude said to write ── */
function newKey() {
  return (g.Rec.USER || 'local') + '-' + Date.now().toString(36) + '-' + (newKey.n = (newKey.n || 0) + 1).toString(36) + Math.random().toString(36).slice(2, 5);
}
function needJournal() {
  if (g.Journal && g.Journal.add) return Promise.resolve();
  const load = src => new Promise(res => { const s = doc.createElement('script'); s.src = ROOT + src; s.onload = s.onerror = res; doc.head.appendChild(s); });
  return (g.Day ? Promise.resolve() : load('shared/day.js')).then(() => load('shared/journal.js'));
}
function apply(w) {
  const R = g.Rec;
  const out = { state: 'done' };
  try {
    if (w.do === 'note') {
      if (!g.Journal || !g.Journal.add) throw new Error('the journal would not load');
      const d = w.date || today();
      out.key = g.Journal.add(d, w.kind || 'entry', w.text || w.say);
      out.type = 'note'; out.date = d; out.prev = null;
    } else {
      if (!w.type) throw new Error('no type given');
      if (NO_WRITE[w.type]) throw new Error(w.type + ' is not Claude\'s to write');
      const d = w.date || null;
      if (w.do === 'add') {
        const k = w.key || newKey();
        if (R.has(w.type, d, k)) throw new Error('that row is already there');
        R.set(w.type, d, k, w.payload || {});
        out.key = k; out.date = d; out.prev = null;
      } else if (w.do === 'patch' || w.do === 'delete') {
        if (!R.has(w.type, d, w.key)) throw new Error('row not found');
        out.prev = R.get(w.type, d, w.key);
        if (w.do === 'patch') R.patch(w.type, d, w.key, w.changes || {});
        else R.del(w.type, d, w.key);
        out.date = d;
      } else throw new Error('unknown kind of write');
    }
  } catch (e) { out.state = 'failed'; out.why = String(e && e.message || e); }
  return out;
}
/* What TRAIN does after a set it writes (TRAIN.assertTick): a day with sets
   is ticked Training, qty the number of sets, and a day with none is not.
   Other apps' follow-ups (PR flags, a meal's spend) are worked out when that
   app opens. */
function follow(w) {
  const R = g.Rec;
  if (w.type !== 'set' || !w.date) return;
  const n = R.all('set', { date: w.date }).length;
  if (n > 0) {
    const cur = R.get('tick', w.date, 'training');
    if (!cur || cur.src !== 'train' || cur.qty !== n) {
      R.set('activity', null, 'training', { name: 'Training', cat: 'body' });
      R.set('tick', w.date, 'training', { src: 'train', qty: n });
    }
  } else if (R.has('tick', w.date, 'training')) R.del('tick', w.date, 'training');
}
function undo(i, j) {
  const R = g.Rec, w = state.msgs[i].writes[j];
  if (!w || w.state !== 'done') return;
  if (w.prev == null) {
    R.del(w.type, w.date || null, w.key);
    /* "Paid 250 - lunch" written as a line also wrote a spend keyed off it */
    if (w.do === 'note' && R.has('spend', w.date, 'note-' + w.key)) R.del('spend', w.date, 'note-' + w.key);
  } else R.set(w.type, w.date || null, w.key, w.prev);
  follow(w);
  mark(i, j, { state: 'undone' });
  draw();
}
function mark(i, j, changes) {
  Object.assign(state.msgs[i].writes[j], changes);
  post({ op: 'mark', msg: i, write: j, w: changes });
}
/* Any write still marked new is applied once, by whichever page is open when
   the answer lands, or by the next one if it landed mid-load. */
function applyNew() {
  const todo = [];
  state.msgs.forEach(function (m, i) {
    (m.writes || []).forEach(function (w, j) {
      const id = i + ':' + j;
      if (w.state === 'new' && !applying[id]) { applying[id] = 1; todo.push([i, j, w]); }
    });
  });
  if (!todo.length) return Promise.resolve();
  const notes = todo.some(x => x[2].do === 'note');
  return g.Rec.need().then(() => notes ? needJournal() : null).then(function () {
    todo.forEach(function (x) {
      const out = apply(x[2]);
      mark(x[0], x[1], out);
      if (out.state === 'done') follow(x[2]);
    });
  });
}

/* ══════════════ THE PANEL ══════════════ */
function css() {
  if (doc.getElementById('mb-claude-css')) return;
  const s = doc.createElement('style');
  s.id = 'mb-claude-css';
  s.textContent =
    '#mb-claude-tab{position:fixed;right:0;bottom:120px;z-index:2147482990;writing-mode:vertical-rl;display:flex;align-items:center;justify-content:center;' +
    'min-width:32px;min-height:96px;padding:var(--s-3,12px) var(--s-1,4px);border:0;cursor:pointer;border-radius:6px 0 0 6px;' +
    'background:var(--accent,#F0B323);color:var(--accent-fg,#080B10);font-family:var(--font-display,system-ui);font-weight:var(--w-bold,700);' +
    'font-size:var(--f-2,13px);letter-spacing:.24em;box-shadow:var(--e-2,0 4px 14px rgba(0,0,0,.35))}' +
    '#mb-claude-tab::after{content:"";position:absolute;inset:-6px -2px -6px -12px}' +
    '#mb-claude-tab.busy{animation:mbcl-pulse 1.4s ease-in-out infinite}' +
    '@keyframes mbcl-pulse{50%{opacity:.55}}' +
    '#mb-claude{position:fixed;top:0;right:0;bottom:0;width:min(440px,100vw);z-index:2147482991;display:flex;flex-direction:column;' +
    'background:var(--surface-1,#0E141D);color:var(--text-1,#E8EDF2);border-left:1px solid var(--border-strong,#2A3442);' +
    'box-shadow:var(--e-4,-8px 0 30px rgba(0,0,0,.45));font-family:var(--font-body,system-ui);font-size:var(--f-3,15px);line-height:var(--lh-body,1.5);text-align:left}' +
    '#mb-claude[hidden]{display:none}' +
    '#mb-claude .hd{display:flex;align-items:center;gap:var(--s-2,8px);padding:var(--s-2,8px) var(--s-2,8px) var(--s-2,8px) var(--s-4,16px);border-bottom:1px solid var(--border,#1E2733)}' +
    '#mb-claude .hd b{flex:1;font-family:var(--font-display,system-ui);letter-spacing:.2em;color:var(--accent,#F0B323)}' +
    '#mb-claude button{font:inherit;cursor:pointer}' +
    '#mb-claude .hd button{min-width:44px;min-height:44px;border:0;border-radius:6px;background:transparent;color:var(--text-2,#9AA7B4);' +
    'font-family:var(--font-display,system-ui);letter-spacing:.12em;font-size:var(--f-2,13px);padding:0 var(--s-2,8px)}' +
    '#mb-claude .hd button:hover{background:var(--surface-2,#141B26);color:var(--text-1,#E8EDF2)}' +
    '#mb-claude .log{flex:1;overflow-y:auto;padding:var(--s-4,16px);display:flex;flex-direction:column;gap:var(--s-3,12px)}' +
    '#mb-claude .me{align-self:flex-end;max-width:85%;background:var(--surface-2,#141B26);border:1px solid var(--border,#1E2733);border-radius:6px;padding:var(--s-2,8px) var(--s-3,12px);white-space:pre-wrap}' +
    '#mb-claude .cl{white-space:pre-wrap}' +
    '#mb-claude .err{color:var(--warn,#E0A040)}' +
    '#mb-claude .mbcl-w{display:flex;align-items:center;gap:var(--s-2,8px);margin-top:var(--s-2,8px);padding:var(--s-1,4px) var(--s-1,4px) var(--s-1,4px) var(--s-3,12px);' +
    'border-left:3px solid var(--success,#4CAF7A);background:var(--surface-2,#141B26);border-radius:0 6px 6px 0;font-size:var(--f-2,13px)}' +
    '#mb-claude .mbcl-w span{flex:1}' +
    '#mb-claude .mbcl-w.undone{border-left-color:var(--text-muted,#5E6B78);color:var(--text-muted,#5E6B78)}' +
    '#mb-claude .mbcl-w.undone span{text-decoration:line-through}' +
    '#mb-claude .mbcl-w.failed{border-left-color:var(--danger,#E05050)}' +
    '#mb-claude .mbcl-w button,#mb-claude .act{min-height:44px;min-width:44px;padding:0 var(--s-3,12px);border:1px solid var(--border-strong,#2A3442);border-radius:6px;' +
    'background:var(--surface-3,#1A2230);color:var(--text-1,#E8EDF2);font-family:var(--font-display,system-ui);letter-spacing:.12em;font-size:var(--f-1,12px)}' +
    '#mb-claude .wait{color:var(--text-muted,#5E6B78);font-size:var(--f-2,13px)}' +
    '#mb-claude .empty{color:var(--text-muted,#5E6B78);margin:auto 0}' +
    '#mb-claude .empty p{margin:0 0 var(--s-2,8px)}' +
    '#mb-claude .ft{display:flex;gap:var(--s-2,8px);align-items:flex-end;padding:var(--s-3,12px);border-top:1px solid var(--border,#1E2733)}' +
    '#mb-claude textarea{flex:1;resize:none;min-height:44px;max-height:180px;box-sizing:border-box;padding:var(--s-2,8px) var(--s-3,12px);border-radius:6px;' +
    'border:1px solid var(--border-strong,#2A3442);background:var(--surface-2,#141B26);color:var(--text-1,#E8EDF2);font:inherit}' +
    '#mb-claude textarea:focus{outline:2px solid var(--focus,#F0B323);outline-offset:-1px}' +
    '#mb-claude .send{min-height:44px;min-width:72px;border:0;border-radius:6px;background:var(--accent,#F0B323);color:var(--accent-fg,#080B10);' +
    'font-family:var(--font-display,system-ui);font-weight:var(--w-bold,700);letter-spacing:.14em}' +
    '#mb-claude .send:disabled{opacity:.5;cursor:default}' +
    '#mb-claude .ver{color:var(--text-muted,#5E6B78);font-size:var(--f-1,12px);text-align:center;padding:0 0 var(--s-2,8px)}';
  (doc.head || doc.documentElement).appendChild(s);
}

let tabEl, panel, logEl, box, sendBtn, tick;
function build() {
  css();
  tabEl = doc.createElement('button');
  tabEl.id = 'mb-claude-tab'; tabEl.type = 'button'; tabEl.textContent = 'CLAUDE';
  tabEl.title = 'Ask Claude about your data, or tell it something to log';
  tabEl.onclick = () => setOpen(!state.open);
  panel = doc.createElement('aside');
  panel.id = 'mb-claude'; panel.hidden = true;
  panel.setAttribute('aria-label', 'Claude');
  panel.innerHTML =
    '<div class="hd"><b>CLAUDE</b><button type="button" data-a="new" title="Start a new conversation">NEW</button>' +
    '<button type="button" data-a="close" aria-label="Close" title="Close (Esc)">✕</button></div>' +
    '<div class="log"></div>' +
    '<div class="ft"><textarea rows="1" placeholder="Ask about your data, or tell me what to log"></textarea>' +
    '<button type="button" class="send">SEND</button></div>' +
    '<div class="ver">CLAUDE ' + VERSION + ' · reads a copy of your rows on this PC</div>';
  logEl = panel.querySelector('.log');
  box = panel.querySelector('textarea');
  sendBtn = panel.querySelector('.send');
  panel.querySelector('[data-a=new]').onclick = () => { if (!state.busy) post({ op: 'new' }); };
  panel.querySelector('[data-a=close]').onclick = () => setOpen(false);
  sendBtn.onclick = () => state.busy ? post({ op: 'stop' }) : submit();
  box.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
  });
  box.addEventListener('input', grow);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) { setOpen(false); } }, true);
  logEl.addEventListener('click', function (e) {
    const b = e.target.closest('button[data-undo]');
    if (b) { const p = b.dataset.undo.split(':'); undo(+p[0], +p[1]); return; }
    if (e.target.closest('button[data-signin]')) post({ op: 'login' });
  });
  doc.body.appendChild(panel);
  doc.body.appendChild(tabEl);
}
function grow() { box.style.height = 'auto'; box.style.height = Math.min(box.scrollHeight, 180) + 'px'; }
function submit() {
  if (state.busy) return;
  const t = box.value.trim();
  if (!t) return;
  box.value = ''; grow();
  ask(t);
}
function setOpen(on) {
  state.open = !!on;
  post({ op: 'open', open: state.open });
  draw();
  if (on) setTimeout(() => box.focus(), 0);
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
/* Claude may still bold a word; that much is drawn, the rest stays plain */
function words(s) { return esc(s).replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>'); }

function draw() {
  if (!panel) return;
  tabEl.classList.toggle('busy', !!state.busy);
  panel.hidden = !state.open;
  tabEl.style.display = state.open ? 'none' : '';
  sendBtn.textContent = state.busy ? 'STOP' : 'SEND';
  if (!state.open) return;
  let h = '';
  if (!state.msgs.length) {
    h = '<div class="empty"><p>Ask about your data: "how\'s my bench trending?", "what did I spend on food this week?"</p>' +
      '<p>Or tell me what to log: "3 sets bench 80kg for 8", "paid 450 for lunch", "todo: call the gym tomorrow".</p>' +
      (state.found === false ? '<p class="err">The Claude program was not found on this PC.</p>' : '') + '</div>';
  }
  state.msgs.forEach(function (m, i) {
    if (m.who === 'me') { h += '<div class="me">' + esc(m.text) + '</div>'; return; }
    h += '<div>';
    if (m.text) h += '<div class="cl">' + words(m.text) + '</div>';
    if (m.error) h += '<div class="cl err">' + esc(m.error) + '</div>' +
      (m.kind === 'signin' ? '<button type="button" class="act" data-signin="1">SIGN IN</button>' : '');
    (m.writes || []).forEach(function (w, j) {
      const st = w.state || 'new';
      const label = st === 'failed' ? 'Not written: ' + esc(w.say) + ' (' + esc(w.why) + ')' : esc(w.say);
      h += '<div class="mbcl-w ' + st + '"><span>' + label + '</span>' +
        (st === 'done' ? '<button type="button" data-undo="' + i + ':' + j + '">UNDO</button>' : '') +
        (st === 'undone' ? '<em>Undone</em>' : '') + '</div>';
    });
    h += '</div>';
  });
  if (state.busy) h += '<div class="wait">Reading your data<span data-s></span></div>';
  const atEnd = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40;
  logEl.innerHTML = h;
  if (atEnd || state.busy) logEl.scrollTop = logEl.scrollHeight;
  clearInterval(tick);
  if (state.busy) {
    const t0 = Date.now();
    tick = setInterval(function () {
      const s = logEl.querySelector('[data-s]');
      if (s) s.textContent = ' · ' + Math.round((Date.now() - t0) / 1000) + 's';
    }, 1000);
  }
}

function start() {
  build();
  if (g.Rec && g.Rec.on) g.Rec.on(function () { dirty = true; });
  post({ op: 'hello' });
}
if (doc.body) start(); else doc.addEventListener('DOMContentLoaded', start);
g.MBClaude = { VERSION: VERSION };
})(window);
