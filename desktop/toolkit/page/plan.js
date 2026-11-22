/* My plan, printing, the one-tap counter, guided timers and the values sort.
   The page's own code calls ToolkitPlan(api) once with what these parts need. */
const JOURNAL_DAILY = ["h-log", "p-3good", "c-pdl", "p-proof", "s-mode", "s-diary", "c-amon", "d-mastery", "c-sleep", "c-restrict", "c-worry", "p-strength", "c-tr", "p-savour"];
const JOURNAL_WEEKLY = ["h-review", "p-carried", "p-mastery", "d-body", "c-asched", "l-modes"];
const JOURNAL_MONTHLY = ["a-vlq", "s-rate", "h-ab"];
const POCKET = ["h-ii", "h-bright", "s-flash", "a-anchor", "d-stop", "d-soothe", "d-menu", "n-surf", "n-kind", "d-facts", "h-lapse"];
const BODY_PARTS = ["Feet", "Lower legs", "Knees", "Thighs", "Hips", "Belly", "Chest", "Hands and arms", "Shoulders and neck", "Face and head"];
const MUSCLES = ["Hands and forearms", "Upper arms", "Face", "Neck and shoulders", "Chest and back", "Belly", "Legs", "Feet"];
/* Each step: say, secs. rate: minutes at which to ask for a 0 to 10 rating (into a table column). breath: paced breathing. tally: a counter field. mins: the field that gets the minutes. */
const TIMERS = {
  "n-surf": { steps: [{ say: "Rate the urge, then find where it sits in your body.", secs: 60 }, { say: "Breathe and watch it. Let it rise and fall. Do not act on it.", secs: 1140 }], rate: { table: "wave", at: [0, 5, 10, 15, 20] } },
  "n-3min": { steps: [{ say: "Notice what is here: thoughts, feelings, sensations. No fixing.", secs: 60 }, { say: "Gather your attention on the breath, low in the belly.", secs: 60 }, { say: "Widen it to the whole body, breathing as one.", secs: 60 }] },
  "n-scan": { steps: BODY_PARTS.map(function (p) { return { say: p + ": notice what is there, then let it go.", secs: 60 }; }), mins: "mins" },
  "a-leaves": { steps: [{ say: "Put each thought on a leaf and let the stream carry it. Pulled in? Press the button, then go back to the stream.", secs: 300 }], tally: { k: "pulled", label: "I got pulled in" }, mins: "mins" },
  "d-reset": { steps: [{ say: "Paced breathing: in for 4, out for 6.", secs: 300 }], breath: [4, 6], mins: "mins" },
  "c-relax": { steps: MUSCLES.map(function (p) { return { say: p + ": tense for 5 seconds, then let go and notice the difference.", secs: 110 }; }) },
  "c-worry": { steps: [{ say: "Go through today's parked worries. Which still matter, and what is one thing you will do?", secs: 900 }] },
  "a-repeat": { steps: [{ say: "Say the word out loud, fast, over and over.", secs: 45 }] }
};

function ToolkitPlan(api) {
  'use strict';
  const $ = api.$, esc = api.esc, byId = api.byId;
  const LST = 'toolwall.taps.v1', LSV = 'toolwall.vsort.v1';
  let taps = api.readLS(LST, {});
  const DAY = 864e5;

  /* ── helpers ── */
  function kitIds(states) { const p = api.picks(); return Object.keys(p).filter(function (id) { return byId[id] && (states || ['try', 'pick', 'keep']).indexOf(p[id].s) >= 0; }); }
  function allEntries() { const e = api.entries(); return Object.keys(e).filter(function (k) { return byId[e[k].tool]; }).map(function (k) { return Object.assign({ id: k }, e[k]); }).sort(function (a, b) { return b.at < a.at ? -1 : 1; }); }
  function latest(id) { return api.entriesFor(id)[0] || null; }
  function headOf(e) { return api.buildSummary(byId[e.tool], e.v).head; }
  function dayStart(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
  function tapTimes() { return Object.keys(taps).map(function (k) { return Date.parse(taps[k].at); }).filter(function (n) { return !isNaN(n); }); }
  function countBetween(a, b) { return tapTimes().filter(function (t) { return t >= a && t < b; }).length; }
  function fmtDate(d) { return new Date(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }); }
  function round1(n) { return Math.round(n * 10) / 10; }
  function btn(label, attrs, ghost) { return '<button type="button" class="btn small' + (ghost ? ' ghost' : '') + '" ' + attrs + '>' + esc(label) + '</button>'; }

  /* ── the one-tap counter ── */
  function saveTap(id) {
    api.writeLS(LST, taps);
    const db = api.db(); if (!db) return;
    const ref = db.collection('taps').doc(id);
    (taps[id] ? ref.set(taps[id]) : ref.delete()).catch(function () {});
  }
  function tap() {
    const id = 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    taps[id] = { at: new Date().toISOString() };
    saveTap(id); render();
    undoToast('Counted. ' + countBetween(dayStart(Date.now()), Date.now() + 1) + ' today.', function () { delete taps[id]; saveTap(id); render(); });
  }
  let undoTimer = null;
  function undoToast(text, undo) {
    let el = $('#undobar');
    if (!el) { el = document.createElement('div'); el.id = 'undobar'; el.className = 'toast undobar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<span>' + esc(text) + '</span><button type="button" class="btn small ghost">Undo</button>';
    el.hidden = false;
    el.querySelector('button').onclick = function () { clearTimeout(undoTimer); el.hidden = true; undo(); api.toast('Taken back'); };
    clearTimeout(undoTimer); undoTimer = setTimeout(function () { el.hidden = true; }, 6000);
  }
  function stats() {
    const now = Date.now(), t0 = dayStart(now) + DAY;
    const s = { today: countBetween(dayStart(now), t0), week: countBetween(t0 - 7 * DAY, t0), last: countBetween(t0 - 14 * DAY, t0 - 7 * DAY), any: tapTimes().length };
    const p = api.picks(), starts = kitIds(['try']).map(function (id) { return p[id].start; }).filter(Boolean).sort();
    if (starts.length) {
      const st = Date.parse(starts[0] + 'T00:00:00'), days = Math.max(1, Math.round((t0 - st) / DAY));
      const before = countBetween(st - 14 * DAY, st), since = countBetween(st, t0);
      s.test = { start: starts[0], days: days, before: round1(before / 2), since: round1(since / days * 7), nb: before, ns: since };
    }
    return s;
  }

  /* ── the plan view ── */
  function patternName() {
    const e = allEntries().filter(function (x) { return x.v && typeof x.v.pattern === 'string' && x.v.pattern.trim(); })[0];
    return e ? e.v.pattern.trim() : '';
  }
  function weakest() {
    const e = latest('l-check'); if (!e) return '';
    const t = api.calcText(byId['l-check'], e.v, 'check::');
    return /^Answer/.test(t) ? '' : t;
  }
  function row(text, open, extra) { return '<button type="button" class="prow" ' + open + '><span>' + esc(text) + '</span>' + (extra ? '<em>' + esc(extra) + '</em>' : '') + '</button>'; }
  function openEntry(e) { return 'data-eopen="' + e.id + '"'; }
  function openTool(id) { return 'data-open="' + id + '"'; }
  function section(title, hint, body, empty) {
    return '<section class="ppanel"><h2>' + esc(title) + '</h2>' + (hint ? '<p class="hint">' + esc(hint) + '</p>' : '') + (body || '<p class="none">' + esc(empty) + '</p>') + '</section>';
  }
  function boardLane(lane) {
    const b = api.board();
    return Object.keys(b).filter(function (k) { return b[k].lane === lane && byId[b[k].tool]; }).sort(function (x, y) { return b[y].at < b[x].at ? -1 : 1; }).map(function (k) { return b[k]; });
  }
  function learnedHTML() {
    const out = [], seen = {};
    boardLane('learn').forEach(function (c) { if (out.length < 4 && api.entries()[c.entry]) { seen[c.entry] = 1; out.push(row(c.head, 'data-eopen="' + c.entry + '"', byId[c.tool].n)); } });
    ['l-loop', 'l-payoff', 'l-check', 'h-cues', 'c-abc'].forEach(function (id) { const e = latest(id); if (e && !seen[e.id] && out.length < 4) { seen[e.id] = 1; out.push(row(headOf(e), openEntry(e), byId[id].n)); } });
    return out.join('');
  }
  function plansHTML() {
    const out = [], seen = {};
    boardLane('plan').forEach(function (c) { if (out.length < 5 && api.entries()[c.entry]) { seen[c.entry] = 1; out.push(row(c.head, 'data-eopen="' + c.entry + '"', byId[c.tool].n)); } });
    kitIds().filter(function (id) { const s = byId[id].stage; return s === 'plan' || s === 'dec'; }).forEach(function (id) { const e = latest(id); if (e && !seen[e.id] && out.length < 5) { seen[e.id] = 1; out.push(row(headOf(e), openEntry(e), byId[id].n)); } });
    return out.join('');
  }
  function runningHTML() {
    const p = api.picks(), now = dayStart(Date.now());
    const tr = kitIds(['try']).sort(function (a, b) { return (p[a].start || '') < (p[b].start || '') ? -1 : 1; });
    const kept = kitIds(['keep']), picked = kitIds(['pick']);
    let h = tr.map(function (id) {
      const st = p[id].start ? Date.parse(p[id].start + 'T00:00:00') : now, d = Math.round((now - st) / DAY) + 1;
      return row(byId[id].n, openTool(id), d >= 28 ? 'day ' + d + ': test it' : 'day ' + d + ' of 28');
    }).join('');
    if (picked.length) h += '<p class="sub2">Picked, not started: ' + picked.map(function (id) { return '<button type="button" class="link" ' + openTool(id) + '>' + esc(byId[id].n) + '</button>'; }).join(', ') + '</p>';
    if (kept.length) h += '<p class="sub2">Kept: ' + kept.map(function (id) { return '<button type="button" class="link" ' + openTool(id) + '>' + esc(byId[id].n) + '</button>'; }).join(', ') + '</p>';
    return h;
  }
  function momentIds() { return kitIds().filter(function (id) { return POCKET.indexOf(id) >= 0 || byId[id].stage === 'mom'; }); }
  function momentHTML() {
    const ids = momentIds(); if (!ids.length) return '';
    return ids.slice(0, 3).map(function (id) {
      const t = byId[id], e = latest(id);
      const body = e ? '<p>' + esc(headOf(e)) + '</p>' : (t.s ? '<ol>' + t.s.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '<p>' + esc(t.d) + '</p>');
      return '<div class="pcard"><button type="button" class="link" ' + openTool(id) + '>' + esc(t.n) + (TIMERS[id] ? ' (timer inside)' : '') + '</button>' + body + '</div>';
    }).join('') + (ids.length > 3 ? '<p class="sub2">Also: ' + ids.slice(3).map(function (id) { return '<button type="button" class="link" ' + openTool(id) + '>' + esc(byId[id].n) + '</button>'; }).join(', ') + '</p>' : '');
  }
  function journalIds() {
    const k = kitIds();
    let d = JOURNAL_DAILY.filter(function (id) { return k.indexOf(id) >= 0; }), w = JOURNAL_WEEKLY.filter(function (id) { return k.indexOf(id) >= 0; }), m = JOURNAL_MONTHLY.filter(function (id) { return k.indexOf(id) >= 0; });
    const suggested = !d.length && !w.length;
    if (suggested) d = ['h-log', 'p-3good'];
    if (!w.length) w = ['h-review'];
    return { d: d, w: w, m: m, suggested: suggested };
  }
  function doneSince(id, since) { return api.entriesFor(id).some(function (e) { return Date.parse(e.at) >= since; }); }
  function todayHTML() {
    const j = journalIds(), t0 = dayStart(Date.now());
    let h = j.d.map(function (id) { const ok = doneSince(id, t0); return row(byId[id].n, openTool(id), ok ? 'done today' : 'not yet'); }).join('');
    h += j.w.map(function (id) { const ok = doneSince(id, t0 - 6 * DAY); return row(byId[id].n, openTool(id), ok ? 'done this week' : 'due this week'); }).join('');
    h += j.m.map(function (id) { const ok = doneSince(id, t0 - 29 * DAY); return row(byId[id].n, openTool(id), ok ? 'done this month' : 'due this month'); }).join('');
    return (j.suggested ? '<p class="sub2">Suggested until you mark a journal tool Trying.</p>' : '') + h;
  }
  function winsHTML() {
    const out = boardLane('win').slice(0, 3).map(function (c) { return row(c.head, 'data-eopen="' + c.entry + '"', byId[c.tool].n); });
    const e = allEntries()[0];
    if (e) { const nx = api.nextOf(byId[e.tool])[0]; if (nx) out.push('<div class="pnext"><b>Next:</b> <button type="button" class="link" ' + openTool(nx.id) + '>' + esc(byId[nx.id].n) + '</button>. ' + esc(nx.why) + '.</div>'); }
    return out.join('');
  }
  function headHTML() {
    const s = stats(), name = patternName(), weak = weakest();
    let num = '<div class="pnum"><b>' + s.week + '</b><span>times in the last 7 days</span><span class="mut">' + s.last + ' the 7 days before · ' + s.today + ' today</span></div>';
    if (s.test) num += '<div class="pnum"><b>' + s.test.since + '</b><span>a week since you started trying, ' + esc(fmtDate(s.test.start)) + '</span><span class="mut">' + s.test.before + ' a week in the 14 days before' + (s.test.nb < 5 || s.test.ns < 5 ? ' · under 5 counted in a phase, no verdict yet' : '') + '</span></div>';
    return '<section class="phead"><div class="pt"><span class="pkicker">My plan</span><h2>' + esc(name || 'No pattern named yet') + '</h2>' +
      (weak ? '<p>' + esc(weak) + '</p>' : '<p class="mut">The capability, opportunity, motivation check names what is missing. ' + '<button type="button" class="link" ' + openTool('l-check') + '>Run it</button></p>') + '</div>' +
      '<div class="pcount">' + num + '<div class="ptap"><button type="button" class="btn" id="tapnow">It happened: count it</button><span class="mut">One press each time the pattern happens. Nothing else is asked.</span></div></div></section>';
  }
  function planHTML() {
    const nothing = !Object.keys(api.picks()).length && !allEntries().length && !tapTimes().length;
    if (nothing) return '<div class="empty">Your plan fills in as you save entries and mark tools Trying.<div class="row" style="justify-content:center;margin-top:12px">' + btn('Start the pattern log', openTool('h-log')) + btn('Run the first check', openTool('l-check'), 1) + '</div></div>';
    return headHTML() + '<div class="pgrid">' +
      section('What I have learned', 'Why the pattern runs and what it gets you.', learnedHTML(), 'Save a Habit loop or Payoff finder entry to see it here.') +
      section('My plans', 'What you have decided to do, and when.', plansHTML(), 'Save an If-then plan to see it here.') +
      section('Running now', 'Tools marked Trying, by day. Test each one on day 28.', runningHTML(), 'Open a tool and press Trying.') +
      section('When the urge hits', 'Your in-the-moment tools. These print as pocket cards.', momentHTML(), 'Mark an in-the-moment tool, such as Urge surfing, as Trying.') +
      section('Journal', 'What is due today, this week and this month.', todayHTML(), '') +
      section('Wins and next', 'Proof it is working, and the best next tool.', winsHTML(), 'Wins show here once you add review entries to your board.') +
      '</div><div class="row pprint">' + btn('Print my plan', 'data-print="plan"') + btn('Print pocket cards', 'data-print="cards"', 1) + btn('Print a journal week', 'data-print="journal"', 1) +
      '<span class="mut">Printing opens your printer window. Pick Save as PDF there to keep a file.</span></div>';
  }
  function render() { const el = $('#v-plan'); if (el && !el.hidden) el.innerHTML = planHTML(); }

  /* ── printing ── */
  function lines(n) { let h = ''; for (let i = 0; i < n; i++) h += '<div class="pl"></div>'; return h; }
  function boxes(max, min) { let h = '<div class="pbx">'; for (let i = min || 0; i <= max; i++) h += '<span>' + i + '</span>'; return h + '</div>'; }
  function printField(f) {
    const lab = '<div class="plab">' + esc(f.l) + '</div>';
    switch (f.t) {
      case 'head': return '<h4>' + esc(f.l) + '</h4>';
      case 'info': return '<p class="pinfo">' + esc(f.l) + '</p>';
      case 'calc': case 'date': return '';
      case 'text': return '<div class="pf">' + lab + lines(1) + '</div>';
      case 'long': return '<div class="pf">' + lab + lines(3) + '</div>';
      case 'time': case 'num': return '<div class="pf pshort">' + lab + '<div class="pl"></div>' + (f.u ? '<span>' + esc(f.u) + '</span>' : '') + '</div>';
      case 'rate': return '<div class="pf">' + lab + boxes(f.max) + '</div>';
      case 'choice': case 'multi': return '<div class="pf">' + lab + '<div class="popts">' + f.o.map(function (o) { return '<span>' + esc(o) + '</span>'; }).join('') + '</div></div>';
      case 'list': { let h = '<div class="pf">' + lab; for (let i = 1; i <= f.n; i++) h += '<div class="pnl"><span>' + i + '.</span><div class="pl"></div></div>'; return h + '</div>'; }
      case 'table': {
        const n = f.rows ? f.rows.length : f.n;
        let h = '<div class="pf">' + lab + '<table class="ptbl"><tr>' + f.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr>';
        for (let r = 0; r < n; r++) h += '<tr>' + f.cols.map(function (c, ci) { return '<td>' + (f.rows && ci === 0 ? esc(f.rows[r]) : '') + '</td>'; }).join('') + '</tr>';
        return h + '</table></div>';
      }
      case 'grid': return '<div class="pf">' + lab + f.rows.map(function (r) { return '<div class="pgr"><span>' + esc(r) + '</span>' + boxes(f.max, f.max === 6 ? 1 : 0) + '</div>'; }).join('') + '</div>';
    }
    return '';
  }
  function logTable() {
    const cols = ['Time', 'Where', 'Felt just before', 'Mood before 0-10', 'What it got me', 'Mood after 0-10'];
    let h = '<table class="ptbl plog"><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    for (let r = 0; r < 6; r++) h += '<tr>' + cols.map(function () { return '<td></td>'; }).join('') + '</tr>';
    return h + '</table><p class="pinfo">What it got me: relief, avoidance, stimulation, comfort, control or connection.</p>';
  }
  function toolBlock(id) {
    const t = byId[id];
    return '<section class="ptool"><h3>' + esc(t.n) + '</h3>' + (id === 'h-log' ? logTable() : t.tp.filter(function (f) { return f.k !== 'pattern'; }).map(printField).join('')) + '</section>';
  }
  function journalPages() {
    const j = journalIds(), name = patternName(), start = dayStart(Date.now());
    let h = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start + i * DAY + 12 * 36e5);
      h += '<div class="ppage"><div class="pphead"><h2>' + esc(d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })) + '</h2><span>' + esc(name ? 'Pattern: ' + name : 'Journal') + '</span></div>' +
        '<div class="pf pshort"><div class="plab">Times it happened today</div><div class="pl"></div></div>' + j.d.map(toolBlock).join('') + '</div>';
    }
    const wk = j.w.concat(j.m);
    if (wk.length) h += '<div class="ppage"><div class="pphead"><h2>Week of ' + esc(fmtDate(start)) + '</h2><span>Weekly page</span></div>' + wk.map(toolBlock).join('') + '</div>';
    return h;
  }
  function pocketCards() {
    let ids = momentIds();
    const blank = !ids.length;
    if (blank) ids = POCKET.slice();
    const cards = ids.map(function (id) {
      const t = byId[id], e = latest(id);
      let body;
      if (e) { const sm = api.buildSummary(t, e.v); body = '<p class="pbig">' + esc(sm.head) + '</p>' + sm.lines.slice(0, 3).map(function (l) { return '<p><b>' + esc(l[0]) + ':</b> ' + esc(l[1]) + '</p>'; }).join(''); }
      else body = (t.s ? '<ol>' + t.s.slice(0, 5).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '<p>' + esc(t.d) + '</p>') + '<div class="plab">My version</div>' + lines(2);
      return '<div class="pcardp"><h3>' + esc(t.n) + '</h3>' + body + '</div>';
    });
    return '<div class="ppage"><div class="pphead"><h2>Pocket cards</h2><span>' + (blank ? 'Blank set. Mark in-the-moment tools Trying to print your own.' : 'Cut along the lines.') + '</span></div><div class="pcards">' + cards.join('') + '</div></div>';
  }
  function printPlan() {
    const tmp = document.createElement('div'); tmp.innerHTML = planHTML();
    tmp.querySelectorAll('.pprint, .ptap, .hint').forEach(function (n) { n.remove(); });
    tmp.querySelectorAll('button').forEach(function (b) { const s = document.createElement('span'); s.innerHTML = b.innerHTML; b.replaceWith(s); });
    return '<div class="ppage pplan"><div class="pphead"><h2>My plan</h2><span>' + esc(new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })) + '</span></div>' + tmp.innerHTML + '</div>';
  }
  function print(kind) {
    let root = $('#printroot');
    if (!root) { root = document.createElement('div'); root.id = 'printroot'; document.body.appendChild(root); }
    root.innerHTML = kind === 'plan' ? printPlan() : kind === 'cards' ? pocketCards() : journalPages();
    document.body.classList.add('printing');
    setTimeout(function () {
      try { window.print(); } catch (e) { api.toast('Printing is blocked here. Open the toolkit program to print.'); }
      document.body.classList.remove('printing');
    }, 50);
  }

  /* ── guided timers ── */
  let tm = null, tick = null, actx = null;
  function beep(f, len) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f || 660; o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, actx.currentTime); g.gain.exponentialRampToValueAtTime(0.15, actx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (len || 0.35));
      o.start(); o.stop(actx.currentTime + (len || 0.35) + 0.05);
    } catch (e) {}
  }
  function total(spec) { return spec.steps.reduce(function (a, s) { return a + s.secs; }, 0); }
  function elapsed() { return !tm ? 0 : (tm.acc + (tm.run ? (Date.now() - tm.t) / 1000 : 0)); }
  function stepAt(spec, sec) { let a = 0; for (let i = 0; i < spec.steps.length; i++) { a += spec.steps[i].secs; if (sec < a) return i; } return spec.steps.length - 1; }
  function clock(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function timerHTML(t) {
    const spec = TIMERS[t.id]; if (!spec) return '';
    const mine = tm && tm.id === t.id, e = mine ? elapsed() : 0, tot = total(spec), i = stepAt(spec, e);
    const ctl = !mine ? btn('Start the timer', 'data-gt="start"') : (tm.run ? btn('Pause', 'data-gt="pause"') : btn(tm.done ? 'Start again' : 'Carry on', 'data-gt="' + (tm.done ? 'start' : 'resume') + '"')) + btn('Stop', 'data-gt="stop"', 1);
    return '<section class="gtimer" aria-label="Guided timer"><div class="gt-top"><h4>Guided timer</h4><span class="gt-time" id="gt-time">' + clock(tot - e) + '</span></div>' +
      '<div class="gt-bar"><i id="gt-bar" style="width:' + (e / tot * 100) + '%"></i></div>' +
      '<p class="gt-say" id="gt-say">' + esc(mine && tm.done ? 'Done. Fill in the questions below.' : spec.steps[i].say) + '</p>' +
      (spec.breath ? '<p class="gt-breath" id="gt-breath">' + (mine && tm.run ? '' : 'Breathe in for ' + spec.breath[0] + ', out for ' + spec.breath[1] + '.') + '</p>' : '') +
      '<div id="gt-rate"></div>' +
      '<div class="row">' + ctl + (spec.tally && mine ? btn(spec.tally.label + ' (' + (api.ui.form[spec.tally.k] || 0) + ')', 'data-gt="tally"', 1) : '') + '</div>' +
      '<p class="mut">' + (spec.steps.length > 1 ? spec.steps.length + ' steps, ' : '') + clock(tot) + ' in all. A soft tone marks each change.' + (spec.mins ? ' The minutes go into the form when it ends or stops.' : '') + '</p></section>';
  }
  function setField(k, v) { api.ui.form[k] = v; api.redraw(); }
  function rateHTML(spec, m) { let h = '<div class="gt-ask"><b>Rate the urge now, minute ' + m + '.</b><div class="opts">'; for (let i = 0; i <= 10; i++) h += '<button type="button" class="opt" data-gtrate="' + m + ':' + i + '">' + i + '</button>'; return h + '</div></div>'; }
  function onTick() {
    if (!tm || !tm.run) return;
    const spec = TIMERS[tm.id], e = elapsed(), tot = total(spec), i = stepAt(spec, e);
    if (i !== tm.step) { tm.step = i; beep(660); }
    if (spec.rate) {
      const m = Math.floor(e / 60), due = spec.rate.at.filter(function (x) { return x <= m && !tm.rated[x]; });
      if (due.length && tm.asking !== due[0]) { tm.asking = due[0]; beep(880, 0.2); const r = $('#gt-rate'); if (r) r.innerHTML = rateHTML(spec, due[0]); }
    }
    if (e >= tot) { finish(true); return; }
    if (!$('#gt-time') || api.ui.open !== tm.id) return;
    $('#gt-time').textContent = clock(tot - e);
    $('#gt-bar').style.width = (e / tot * 100) + '%';
    $('#gt-say').textContent = spec.steps[i].say;
    if (spec.breath) { const cyc = spec.breath[0] + spec.breath[1], p = e % cyc, inn = p < spec.breath[0]; $('#gt-breath').textContent = (inn ? 'Breathe in ' : 'Breathe out ') + Math.ceil(inn ? spec.breath[0] - p : cyc - p); }
  }
  function finish(done) {
    const spec = TIMERS[tm.id];
    tm.acc = elapsed(); tm.run = false; tm.done = !!done; clearInterval(tick);
    if (done) { beep(523, 0.5); setTimeout(function () { beep(784, 0.6); }, 250); }
    if (spec.mins && api.ui.open === tm.id) api.ui.form[spec.mins] = Math.max(1, Math.round(tm.acc / 60));
    api.redraw();
  }
  function onTimer(el) {
    const act = el.dataset.gt, id = api.ui.open, spec = TIMERS[id];
    if (act === 'start') { tm = { id: id, t: Date.now(), acc: 0, run: true, step: 0, rated: {}, asking: null, done: false }; beep(660); clearInterval(tick); tick = setInterval(onTick, 250); api.redraw(); onTick(); }
    else if (act === 'pause') { tm.acc = elapsed(); tm.run = false; clearInterval(tick); api.redraw(); }
    else if (act === 'resume') { tm.t = Date.now(); tm.run = true; tick = setInterval(onTick, 250); api.redraw(); }
    else if (act === 'stop') { finish(false); tm = null; api.redraw(); }
    else if (act === 'tally') { setField(spec.tally.k, (+api.ui.form[spec.tally.k] || 0) + 1); }
  }
  function onRate(el) {
    const parts = el.dataset.gtrate.split(':'), m = +parts[0], v = parts[1], spec = TIMERS[api.ui.open];
    const rows = (api.ui.form[spec.rate.table] || []).map(function (r) { return r.slice(); }), ri = spec.rate.at.indexOf(m);
    while (rows.length <= ri) rows.push([]);
    rows[ri][0] = String(m); rows[ri][1] = v;
    tm.rated[m] = 1; tm.asking = null;
    setField(spec.rate.table, rows);
  }
  function toolClosed(id) { if (tm && tm.id !== id && tm.run) { tm.acc = elapsed(); tm.run = false; clearInterval(tick); } }

  /* ── values sort ── */
  function vs() { return api.readLS(LSV, { i: 0, a: {} }); }
  function sortHTML(t) {
    if (t.id !== 'a-values') return '';
    const s = vs(), n = VALUES.length, done = s.i >= n;
    const lot = VALUES.filter(function (v) { return s.a[v] === 2; }), some = VALUES.filter(function (v) { return s.a[v] === 1; });
    let h = '<section class="gtimer vsort" aria-label="Values sort"><div class="gt-top"><h4>Sort the values one at a time</h4><span class="mut">' + Math.min(s.i, n) + ' of ' + n + '</span></div>';
    if (!done) {
      h += '<p class="vs-word">' + esc(VALUES[s.i]) + '</p><div class="row">' + btn('Matters a lot', 'data-vs="2"') + btn('Somewhat', 'data-vs="1"', 1) + btn('Not much', 'data-vs="0"', 1) + (s.i ? btn('Back one', 'data-vs="back"', 1) : '') + '</div>';
    } else {
      h += '<p><b>Matters a lot (' + lot.length + '):</b> ' + esc(lot.join(', ') || 'none') + '</p><p class="mut">Somewhat: ' + esc(some.join(', ') || 'none') + '</p>' +
        '<div class="row">' + btn('Put these in the form', 'data-vs="use"') + btn('Sort again', 'data-vs="reset"', 1) + '</div>' +
        (lot.length > 5 ? '<p class="mut">More than five: pick your top five from them in the table below.</p>' : '');
    }
    return h + '</section>';
  }
  function onSort(el) {
    const s = vs(), a = el.dataset.vs;
    if (a === 'back') s.i = Math.max(0, s.i - 1);
    else if (a === 'reset') { s.i = 0; s.a = {}; }
    else if (a === 'use') {
      const lot = VALUES.filter(function (v) { return s.a[v] === 2; });
      api.ui.form.vals = lot.slice();
      if (lot.length <= 5) { const rows = (api.ui.form.top || []).map(function (r) { return r.slice(); }); lot.forEach(function (v, i) { while (rows.length <= i) rows.push([]); if (!rows[i][0]) rows[i][0] = v; }); api.ui.form.top = rows; }
      api.toast('Added to the form. Press Save entry to keep it.');
    } else { s.a[VALUES[s.i]] = +a; s.i++; }
    api.writeLS(LSV, s); api.redraw();
  }

  /* ── wiring ── */
  document.addEventListener('click', function (e) {
    if (e.target.closest('#tapnow')) { tap(); return; }
    const pr = e.target.closest('[data-print]'); if (pr) { print(pr.dataset.print); return; }
    const gt = e.target.closest('[data-gt]'); if (gt) { onTimer(gt); return; }
    const gr = e.target.closest('[data-gtrate]'); if (gr) { onRate(gr); return; }
    const so = e.target.closest('[data-vs]'); if (so) { onSort(so); return; }
  });
  return {
    render: render,
    extraFill: function (t) { return timerHTML(t) + sortHTML(t); },
    afterDraw: function () { if (tm && tm.asking != null && api.ui.open === tm.id) { const r = $('#gt-rate'); if (r) r.innerHTML = rateHTML(TIMERS[tm.id], tm.asking); } },
    toolClosed: toolClosed,
    getTaps: function () { return taps; },
    setTaps: function (v) { taps = v; api.writeLS(LST, taps); },
    hasAny: function () { return Object.keys(api.picks()).length > 0 || Object.keys(api.entries()).length > 0 || tapTimes().length > 0; },
    tapsText: function () { const s = stats(); return s.any ? 'PATTERN COUNT: ' + s.week + ' in the last 7 days, ' + s.last + ' the 7 days before' + (s.test ? '; ' + s.test.since + ' a week since ' + s.test.start + ', ' + s.test.before + ' a week in the 14 days before' : '') + '.\n' : ''; }
  };
}
