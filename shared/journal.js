/* ══════════════════════════════════════════════════════════════════════════
   JOURNAL — one journal line, the same in every app

   STATUS names the shape of a `note` row: a todo, an entry, an event or an
   idea. LOG, QUESTS and the home screen show and tick the same rows, and until
   2026-09-14 each carried its own copy of STATUS's rules, marked "change all
   of them". LOG's copy had already drifted: it published a todo due next week
   as an event today. One file, so there is nothing to keep in step.

   What lives here:
     KINDS              the four kinds
     place / onDay      which day a line shows on
     notes              every line on a day, unsorted (sorting is the app's)
     parseLine          "Train 2:45pm 90m" into words, a time and a length
     clockLabel ...     how a time reads back
     publishNotes       the ticks that tell the home screen about the journal
     occursAfter        when a repeating todo comes round next
     tick               ticking a todo, or doing a round of a repeating one

   Load after day.js and records.js. Nothing here draws or plays a sound: the
   app says "done" in its own way, and undo is handed back for it to offer.
   ══════════════════════════════════════════════════════════════════════════ */
(function (g) {
'use strict';

const Day = () => g.Day, Rec = () => g.Rec;

const KINDS = [
  { id: 'todo',  label: 'Todo',  plural: 'Todos',   rank: 0, to: 'QUEST' },
  { id: 'entry', label: 'Entry', plural: 'Entries', rank: 1, to: 'LOG' },
  { id: 'event', label: 'Event', plural: 'Events',  rank: 2, to: 'LOG' },
  { id: 'idea',  label: 'Idea',  plural: 'Ideas',   rank: 3, to: 'LOG,SPARK' },
];

/* `key`, `date`, `carried` and `from` describe where a line is being SHOWN,
   not what it is, and must never reach the payload. Setting them to undefined
   does not remove them, so they are deleted properly. */
function bare(x) {
  const o = Object.assign({}, x);
  delete o.key; delete o.date; delete o.carried; delete o.from; delete o.movedAway;
  return o;
}

/* ══════════════ WHICH DAY A LINE SHOWS ON ══════════════
   A row stays on the day it was written. What moves is where it is SHOWN:

   - A todo with a `due` (QUESTS writes one) shows from its due day on, and
     follows you forward from there. `due: ''` is No date and shows nowhere
     until it is done. A row with no `due` at all behaves as it always did.
   - Anything shows on the day it was written.
   - An open todo written before this day follows you forward, `carried`.
   - A todo DONE on this day, written on another, shows here too, `from`.
     Tom, 2026-09-04: "I want done tasks to show up on the day I did them."

   Returns the line as shown, or null. */
function place(r, d) {
  const p = r && r.payload;
  if (!p) return null;
  const D = Day();
  /* MOVED AWAY from this day. Tom, 2026-09-14: "A moved todo is still shown
     as >, but moved to the bottom of the list." `moved` holds the spans of
     days it showed on before each move; on those days it is the same row,
     seen where it used to be, flagged `movedAway`. A todo finished on one of
     those days shows as finished there instead. */
  if (p.kind === 'todo' && Array.isArray(p.moved) && (!p.due || d < p.due) && !(p.done && p.doneOn === d) &&
      p.moved.some(m => m && m.from <= d && d <= m.to))
    return Object.assign({ key: r.key, date: r.date }, p, { movedAway: true });
  if (p.kind === 'todo' && p.due !== undefined && !p.done && !p.cancelled) {
    if (!p.due || p.due > d) return null;
    return Object.assign({ key: r.key, date: r.date }, p, p.due < d ? { carried: D.diff(d, p.due) } : {});
  }
  if (r.date === d) return Object.assign({ key: r.key, date: d }, p);
  if (!r.date) return null;
  if (p.kind === 'todo' && !p.done && !p.cancelled && r.date < d)
    return Object.assign({ key: r.key, date: r.date, carried: D.diff(d, r.date) }, p);
  if (p.kind === 'todo' && p.done && p.doneOn === d)
    return Object.assign({ key: r.key, date: r.date, from: r.date }, p);
  return null;
}
/* whether a line is on this day to be done: a todo that moved away is not */
const onDay = (r, d) => { const x = place(r, d); return !!x && !x.movedAway; };
function notes(date) {
  const d = date || Day().today();
  return Rec().all('note').map(r => place(r, d)).filter(Boolean);
}

/* ══════════════ WRITING A TIME INTO A LINE ══════════════
   "Train 2:45" is a line that says Train and knows it is at 2:45. ONLY AT THE
   END OF THE LINE, which is what makes it safe on by default: "Call Dan about
   the 2:45 train" stays words. Times are 2:45, 2:45pm, 14:45, 9am, "at 8".
   A length needs a unit (45m, 1h, 1h30, 90min), so a bare number never is
   one. A range, "2-4:30", sets both, and needs a colon, am or pm, "at" or
   "from", so "Squat 3-5" stays words.

   THE CLOCK RULE. Tom, 2026-09-14: "Make the time rules universal." A clock
   with no am or pm on today is the next time it comes round; once both have
   gone it stays the evening one. On any other day there is no now to go by,
   so 1 to 6 is the afternoon and 7 to 11 the morning. 12 is noon.

   QUESTS reads dates and times from ANYWHERE in a todo it writes, with its
   own reader; that is QUESTS's, and this is the journal line's. */
const TIME_RE  = /\s+(?:at\s+|@\s*)?(\d{1,2})(?::|\.)(\d{2})\s*(am|pm)?$/i;
const HOUR_RE  = /\s+(?:at\s+|@\s*)?(\d{1,2})\s*(am|pm)$/i;
const BARE_RE  = /\s+(?:at|@)\s*(\d{1,2})$/i;
const RANGE_RE = /\s+(?:(at|from)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i;
const DUR_RE   = /\s+(?:for\s+)?(?:(\d+)\s*h(?:rs?|ours?)?\s*(\d{1,2})?|(\d+)\s*(m|min|mins|minutes?))$/i;

/* minutes past midnight, by the clock rule; `date` is the line's day */
function clockMins(h, mm, ap, date) {
  if (h > 23 || mm > 59) return null;
  if (ap) {
    ap = ap.toLowerCase();
    if (h < 1 || h > 12) return null;
    if (ap === 'pm' && h < 12) h += 12;
    if (ap === 'am' && h === 12) h = 0;
    return h * 60 + mm;
  }
  if (h === 0 || h >= 12) return h * 60 + mm;
  if (!date || date === Day().today()) {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes() <= h * 60 + mm ? h * 60 + mm : (h + 12) * 60 + mm;
  }
  return (h <= 6 ? h + 12 : h) * 60 + mm;
}
const minsHM = v => String(Math.floor(v / 60) % 24).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');

function parseLine(raw, date) {
  let text = String(raw == null ? '' : raw).trim();
  let at = null, dur = null;

  /* the length first: stripping it leaves a clean end for the time */
  const d = text.match(DUR_RE);
  if (d) {
    dur = d[1] != null ? (+d[1] * 60 + (+d[2] || 0)) : +d[3];
    if (!(dur > 0)) dur = null; else text = text.slice(0, d.index).trim();
  }

  let m;
  if (!dur && (m = text.match(RANGE_RE)) && (m[1] || m[3] || m[4] || m[6] || m[7])) {
    const smm = m[3] ? +m[3] : 0, eh = +m[5], emm = m[6] ? +m[6] : 0;
    let s = clockMins(+m[2], smm, m[4] || m[7] || null, date);
    if (s != null && !m[4] && m[7]) {
      const e0 = clockMins(eh, emm, m[7]);
      if (e0 != null && s > e0) s = clockMins(+m[2], smm, m[7].toLowerCase() === 'pm' ? 'am' : 'pm');
    }
    /* the end is the first time that clock comes round after the start */
    let e = m[7] ? clockMins(eh, emm, m[7]) : (eh > 23 || emm > 59 ? null : eh * 60 + emm);
    if (s != null && e != null) {
      if (e <= s) e += (e + 720 > s) ? 720 : 1440;
      at = minsHM(s); dur = e - s;
      text = text.slice(0, m.index).trim();
    }
  }
  if (!at && (m = text.match(TIME_RE))) {
    const v = clockMins(+m[1], +m[2], m[3] || null, date);
    if (v != null) { at = minsHM(v); text = text.slice(0, m.index).trim(); }
  }
  if (!at && (m = text.match(HOUR_RE))) {
    const v = clockMins(+m[1], 0, m[2], date);
    if (v != null) { at = minsHM(v); text = text.slice(0, m.index).trim(); }
  }
  if (!at && (m = text.match(BARE_RE))) {
    const v = +m[1] >= 1 && +m[1] <= 12 ? clockMins(+m[1], 0, null, date) : null;
    if (v != null) { at = minsHM(v); text = text.slice(0, m.index).trim(); }
  }
  /* nothing left but a time is not a line, it is a time: give the text back */
  if (!text) return { text: String(raw).trim(), at: null, dur: null };
  return { text: text, at: at, dur: dur };
}

/* a timestamp as HH:MM */
function hhmm(ms) {
  const d = new Date(ms);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
/* "14:45" as "2:45pm", the way it reads back on screen */
function clockLabel(at) {
  if (!at) return '';
  const [h, m] = at.split(':').map(Number);
  const ap = h < 12 ? 'am' : 'pm', hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + String(m).padStart(2, '0') + ap;
}
const durLabel = d => !d ? '' : (d >= 60 ? (d % 60 ? Math.floor(d / 60) + 'h' + String(d % 60).padStart(2, '0') : Math.floor(d / 60) + 'h') : d + 'm');

/* ══════════════ TELLING THE HOME SCREEN ══════════════
   A tick is the one row every app may write, so it is how the home screen
   hears about the journal without knowing STATUS exists. Each kind ticks its
   own counter, and a line with a time becomes an event, keyed on its text so
   editing the line updates it rather than leaving the old one behind.

   THIS CAN DOUBLE UP, on purpose. A Training block in BLOCK and "Train 2:45"
   here both show. Tom's call: guessing that two names are one thing, and
   guessing wrong, hides something he wrote. `src` is the app writing. */
function publishTimed(d, src) {
  const R = Rec(), want = {};
  src = src || R.appId;
  /* a todo due another day is not an event on the day it was written */
  notes(d).filter(x => x.date === d && x.at && !x.done && !x.cancelled && (!x.due || x.due === d)).forEach(x => {
    const id = 'note-at-' + String(x.text).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    if (!id || id === 'note-at-') return;
    want[id] = 1;
    R.set('activity', null, id, { name: x.text, cat: 'journal' });
    R.set('tick', d, id, { src: src, qty: 1, at: x.at, dur: x.dur || 0 });
  });
  R.all('tick', { date: d }).forEach(r => {
    if (r.key.indexOf('note-at-') === 0 && !want[r.key]) R.del('tick', d, r.key);
  });
}
function publishNotes(date, src) {
  const R = Rec(), d = date || Day().today();
  src = src || R.appId;
  publishTimed(d, src);
  KINDS.forEach(k => {
    const n = R.all('note', { date: d })
      .filter(r => r.payload && r.payload.kind === k.id && !(k.id === 'todo' && r.payload.done)).length;
    const id = 'note-' + k.id;
    R.set('activity', null, id, { name: k.label + 's', cat: 'journal' });
    if (n) R.set('tick', d, id, { src: src, qty: n, to: k.to });
    else R.del('tick', d, id);
  });
}

/* ══════════════ REPEATS ══════════════
   `rep` is {unit, every, days, dom, from, txt}, written by QUESTS. `from` is
   the first due date, so "every 2 weeks" keeps its own rhythm rather than
   drifting to whenever it was ticked. A monthly day is clamped per month when
   the date is worked out, never when it is saved: the 31st stays the 31st. */
const pad = n => String(n).padStart(2, '0');
const parts = s => { const a = s.split('-').map(Number); return { y: a[0], m: a[1] - 1, d: a[2] }; };
const ymd = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);
const lastDay = (y, m) => new Date(y, m + 1, 0).getDate();
function addMonths(s, n, dom) {
  const p = parts(s), t = new Date(p.y, p.m + n, 1);
  return ymd(t.getFullYear(), t.getMonth(), Math.min(dom || p.d, lastDay(t.getFullYear(), t.getMonth())));
}
const weekStart = s => Day().shift(s, -((Day().dow(s) + 6) % 7));

/* the first round strictly after `after`, counted from `anchor` */
function occursAfter(rep, anchor, after) {
  const D = Day(), n = Math.max(1, rep.every || 1);
  if (rep.unit === 'day') {
    if (anchor > after) return anchor;
    return D.shift(anchor, (Math.floor(D.diff(after, anchor) / n) + 1) * n);
  }
  if (rep.unit === 'weekday') {
    let d = D.shift(after, 1);
    while (D.dow(d) === 0 || D.dow(d) === 6) d = D.shift(d, 1);
    return d;
  }
  if (rep.unit === 'week') {
    if (rep.days && rep.days.length) {
      for (let i = 1; i <= 7 * n + 7; i++) {
        const d = D.shift(after, i);
        if (rep.days.indexOf(D.dow(d)) < 0) continue;
        if (n === 1 || Math.round(D.diff(weekStart(d), weekStart(anchor)) / 7) % n === 0) return d;
      }
    }
    if (anchor > after) return anchor;
    return D.shift(anchor, (Math.floor(D.diff(after, anchor) / (7 * n)) + 1) * 7 * n);
  }
  if (rep.unit === 'month') {
    const dom = rep.dom || parts(anchor).d;
    for (let k = 0; k < 1200; k += n) { const d = addMonths(anchor, k, dom); if (d > after) return d; }
  }
  if (rep.unit === 'year') {
    const p = parts(anchor);
    for (let k = 0; k < 200; k += n) { const y = p.y + k, d = ymd(y, p.m, Math.min(p.d, lastDay(y, p.m))); if (d > after) return d; }
  }
  return null;
}

/* The day this round was due: `due`, or the day written for an old row with
   none, or today for No date. And the round after it: after whichever is
   later, that day or today, so ticking a week-late daily todo does not leave
   six rounds overdue. `own` is the date the row lives on. */
const roundDue = (cur, own) => cur.due === undefined ? own : (cur.due || Day().today());
function nextRound(cur, own) {
  const due = roundDue(cur, own), t = Day().today();
  return occursAfter(cur.rep, cur.rep.from || due, due > t ? due : t);
}

/* ══════════════ TICKING A TODO ══════════════
   `date` and `key` are the row's own, not the day being looked at: a carried
   todo is the original seen from later, not a copy.

   opts: day     the day it was done on (default today)
         stamp   the Done time, HH:MM (default now)
         row     the line as shown, used only if the row cannot be read
         src     which app is writing (default the app that declared)
         publish false to leave the journal counters alone

   A PLAIN TODO flips. The Done time IS the tick time, because a field called
   Done showing a time you did not finish at is a lie. But a time you typed is
   yours (Tom, 2026-09-05: "unticking keeps manually put done time"), so the
   tick puts it aside in `byWas` and un-ticking hands it back. `byAuto` says
   whose the current one is. `doneOn` is the day, cleared on un-ticking.

   A REPEATING TODO is not finished, it has done a round: a finished copy on
   the day it was done, pointing back with `of`, and the todo moves on to its
   next round.

   Returns {round, done, next, text, at, undo} or null. Every write merges into
   the row as read, so fields this file has never heard of survive. */
let seq = 0;
const newKey = () => Rec().USER + '-' + Date.now().toString(36) + '-' +
  (seq++).toString(36) + Math.random().toString(36).slice(2, 5);

function tick(date, key, opts) {
  opts = opts || {};
  const R = Rec(), D = Day(), today = D.today(), d = opts.day || today;
  const stamp = opts.stamp || hhmm(Date.now());
  const read = R.get('note', date, key);
  const cur = read || (opts.row ? bare(opts.row) : null);
  if (!cur) return null;
  const pub = days => {
    if (opts.publish === false) return;
    days.filter((x, i) => x && days.indexOf(x) === i).forEach(x => publishNotes(x, opts.src));
  };

  if (!cur.done && cur.rep) {
    const due = roundDue(cur, date);
    const next = nextRound(cur, date);
    const copyKey = newKey();
    R.set('note', d, copyKey, Object.assign({}, cur, {
      t: Date.now(), made: d, ord: R.all('note', { date: d }).length,
      done: 1, doneAt: stamp, doneOn: d, by: stamp, byAuto: 1, byWas: null,
      due: due, rep: null, of: key,
    }));
    if (next) R.set('note', date, key, Object.assign({}, cur, { due: next }));
    pub([d, date]);
    return { round: true, done: true, next: next, text: cur.text, at: cur.at || null,
      undo() { R.del('note', d, copyKey); R.set('note', date, key, cur); pub([d, date]); } };
  }

  const was = !!cur.done;
  R.set('note', date, key, Object.assign({}, cur, {
    done: was ? 0 : 1,
    by: was ? (cur.byWas || null) : stamp,
    byWas: was ? null : (cur.byAuto ? (cur.byWas || null) : (cur.by || null)),
    byAuto: was ? 0 : 1,
    doneAt: was ? null : stamp,
    doneOn: was ? null : d,
  }));
  pub([date]);
  return { round: false, done: !was, next: null, text: cur.text, at: cur.at || null,
    undo() { R.set('note', date, key, cur); pub([date]); } };
}

/* ══════════════ A BULLET, DRAWN ══════════════
   Tom, 2026-09-14: "I want the bullet system in the shared foundation", and
   "I don't want differences between the two when it comes to todo bullets,
   same goes for QUESTS", with STATUS winning where they disagreed. So the
   mark, the words, the time and the done and cancelled looks are drawn here,
   and STATUS, LOG and QUESTS each put them inside a row of their own. The
   row's size and spacing stay the app's, because a line in LOG's timeline is
   not a card in STATUS. A row holding a bullet carries `mb-bullet`, plus
   `done` or `cancelled`; the mark goes in a `.k`, the words in a `.tx`. */

const MARKS = { entry: '·', event: '–', idea: '!' };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* STATUS's values, carried across as they were. The box is 13px of ink and a
   full finger of target: growing the ink would make a list shout, growing the
   reach costs nothing on screen. Done is struck through, you did it; cancelled
   is faded with the box dashed, you decided not to, which is still worth
   keeping. The mark classes are not scoped, because STATUS also draws them on
   its kind buttons. Injected first, so an app's own row rules come after. */
const CSS =
  '.nm-box{width:13px;height:13px;border:1.5px solid currentColor;border-radius:3px;display:block}' +
  '.nm-ch{display:block;font-weight:700}' +
  '.nm-mig{line-height:13px}' +
  '.mb-bullet .k{flex:0 0 auto;width:16px;display:flex;align-items:center;justify-content:center;' +
    'color:var(--accent);font-size:var(--f-3);line-height:1.5;font-family:var(--font-mono);' +
    'position:relative;background:none;border:0;padding:0;cursor:pointer}' +
  '.mb-bullet .k::after{content:"";position:absolute;left:50%;top:50%;' +
    'width:var(--tap);height:var(--tap);transform:translate(-50%,-50%)}' +
  '.mb-bullet .tx{min-width:0;line-height:var(--lh-body);overflow-wrap:anywhere}' +
  '.mb-bullet.done .tx{text-decoration:line-through;color:var(--text-muted)}' +
  '.mb-bullet.done .k{color:var(--text-muted)}' +
  '.mb-bullet.done .nm-box{background:var(--text-muted);border-color:var(--text-muted)}' +
  '.mb-bullet.cancelled{opacity:.45}' +
  '.mb-bullet.cancelled .tx{text-decoration:line-through;text-decoration-style:double}' +
  '.mb-bullet.cancelled .nm-box{border-style:dashed}' +
  '.mb-bullet .at{font-style:normal;font-family:var(--font-mono);font-size:var(--f-1);' +
    'color:var(--accent);margin-left:var(--s-2);white-space:nowrap}' +
  '.mb-bullet .at.wrote{opacity:.6}';
let cssDone = false;
function css() {
  if (cssDone || typeof document === 'undefined' || !document.head) return;
  cssDone = true;
  const s = document.createElement('style');
  s.id = 'mb-journal-css';
  s.textContent = CSS;
  document.head.insertBefore(s, document.head.firstChild);
}

/* The mark says WHEN you are looking, not where the row came from. A box is
   something to do today; `>` is a todo seen on a day that has gone. Tom,
   2026-08-28: "To do Bullets should only show as > on past days." */
function markHTML(kind, past) {
  css();
  if (kind !== 'todo') return '<span class="nm-ch" aria-hidden="true">' + (MARKS[kind] || '·') + '</span>';
  return past ? '<span class="nm-ch nm-mig" aria-hidden="true">&gt;</span>'
              : '<span class="nm-box" aria-hidden="true"></span>';
}

/* The time a line shows. A todo has a start, `at`, and a finish, `by`, which
   the tick writes (`doneAt` on rows from before that). It reads as a span,
   "7:00pm - 7:31pm". Tom, 2026-09-14: no "by". A start alone, or a finish
   alone, shows just that one; a start with no finish carries its length.
   Anything else shows the time typed into it, or else when it was written,
   marked `wrote` so it reads quieter. */
function timeText(x) {
  if (!x) return { s: '', wrote: false };
  const dur = x.dur ? durLabel(x.dur) : '';
  if (x.kind === 'todo') {
    const end = x.by || (x.done ? x.doneAt : null) || null;
    if (x.at && end) return { s: clockLabel(x.at) + ' - ' + clockLabel(end), wrote: false };
    if (x.at) return { s: clockLabel(x.at) + (dur ? ' · ' + dur : ''), wrote: false };
    if (end) return { s: clockLabel(end), wrote: false };
    return { s: dur, wrote: false };
  }
  if (x.at) return { s: clockLabel(x.at) + (dur ? ' · ' + dur : ''), wrote: false };
  if (dur) return { s: dur, wrote: false };
  if (x.t) return { s: clockLabel(hhmm(x.t)), wrote: true };
  return { s: '', wrote: false };
}

/* The clock a line sorts by in time order. Tom, 2026-09-14: its start, "use
   the start time for time sorting"; and "a timeless todo is ordered according
   to tick time, not created time". So: the start if it has one; a ticked todo
   with no start, when it was ticked; anything else, when it was written. One
   sequence, rather than a timed half and an untimed clump. */
function sortClock(x) {
  if (x && x.at) return +String(x.at).replace(':', '');
  if (x && x.kind === 'todo' && x.done && x.doneAt) return +String(x.doneAt).replace(':', '');
  if (x && x.t) return +hhmm(x.t).replace(':', '');
  return 9999;
}

/* The words, then the time, then how long a todo has followed you. The time
   sits after the words because the words are what you scan for. `day` is the
   day being looked at, for a todo finished there but written earlier. */
function textHTML(x, day) {
  css();
  const tm = timeText(x);
  return esc(x.text) +
    (tm.s ? '<i class="at' + (tm.wrote ? ' wrote' : '') + '">' + esc(tm.s) + '</i>' : '') +
    (x.carried ? '<i class="carried">' + x.carried + 'd</i>' : '') +
    (x.from && day ? '<i class="carried">' + Day().diff(day, x.from) + 'd</i>' : '');
}

/* ══════════════ WHAT YOU CAN DO TO A TODO ══════════════
   Each returns a function that puts the row back, or null if there was no
   row. They merge into the row, so fields another app wrote survive. */
function patchNote(date, key, changes, src) {
  const R = Rec(), was = R.get('note', date, key);
  if (!was) return null;
  R.patch('note', date, key, changes);
  publishNotes(date, src);
  return () => { R.set('note', date, key, was); publishNotes(date, src); };
}
/* Tom, 2026-09-14: "Move to tomorrow", in STATUS and LOG and QUESTS alike.
   The row stays on the day it was written. Its `due` becomes tomorrow, which
   is the day rule every app already reads, so it leaves today everywhere at
   once and is waiting tomorrow. */
/* `from` is the day it was being looked at when moved, today by default. The
   days it was showing on up to then are kept in `moved`, so it stays on them
   as > at the bottom. It was showing from its old due day, or from the day it
   was written if it had none; with No date it was showing nowhere. */
function moveToTomorrow(date, key, src, from) {
  const D = Day(), cur = Rec().get('note', date, key);
  if (!cur) return null;
  const to = D.shift(D.today(), 1), on = from || D.today();
  const start = cur.due === undefined ? date : (cur.due || null);
  const moved = Array.isArray(cur.moved) ? cur.moved.slice() : [];
  if (start && start <= on && on < to) moved.push({ from: start, to: on });
  return patchNote(date, key, { due: to, moved: moved }, src);
}
/* Cancelled is not deleted. A task you decided not to do is a real outcome,
   and deleting it pretends it was never planned. */
function cancel(date, key, on, src) {
  return patchNote(date, key, on ? { cancelled: 1, done: 0 } : { cancelled: 0 }, src);
}

/* The todo actions every app's menu carries, in the same words: Move to
   tomorrow, and Cancel it or Put it back. `x` is the line with its own
   `date` and `key`; `after` redraws; each offers an undo. */
function menuItems(x, after, src) {
  if (!x || x.kind !== 'todo') return [];
  const ico = role => (g.Icons && g.Icons.svg) ? g.Icons.svg(role, { size: 18 }) : '';
  const run = (act, say) => () => {
    const back = act();
    if (after) after();
    if (back && g.UI && g.UI.undo) g.UI.undo(say, () => { back(); if (after) after(); });
  };
  const out = [];
  if (!x.done && !x.cancelled && !x.movedAway) out.push({ label: 'Move to tomorrow', icon: ico('next'),
    fn: run(() => moveToTomorrow(x.date, x.key, src, x.day), 'Moved to tomorrow') });
  out.push(x.cancelled
    ? { label: 'Put it back', icon: ico('undo'), fn: run(() => cancel(x.date, x.key, false, src), 'Put back') }
    : { label: 'Cancel it', note: 'Kept, but stops following you', icon: ico('cancel'),
        fn: run(() => cancel(x.date, x.key, true, src), 'Cancelled') });
  return out;
}

g.Journal = {
  KINDS: KINDS,
  bare: bare, place: place, onDay: onDay, notes: notes,
  parseLine: parseLine, clockMins: clockMins, minsHM: minsHM,
  hhmm: hhmm, clockLabel: clockLabel, durLabel: durLabel,
  publishTimed: publishTimed, publishNotes: publishNotes,
  occursAfter: occursAfter, nextRound: nextRound, tick: tick,
  css: css, markHTML: markHTML, timeText: timeText, sortClock: sortClock, textHTML: textHTML,
  moveToTomorrow: moveToTomorrow, cancel: cancel, menuItems: menuItems,
};
})(window);
