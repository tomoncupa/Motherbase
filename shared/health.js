/* ══════════════════════ MOTHERBASE · HEALTH ══════════════════════
   The cheap version of a test suite. Not "does this feature work" — that is a
   suite I would have to maintain forever. This answers the only question that
   actually matters when you cannot read code:

       is my data okay?

   Written once, zero work per app, and every app can show the answer.

     <script src="shared/health.js"></script>
     Health.check();      // → { ok, issues:[…], stats }
*/
(function (g) {
'use strict';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const Health = {
  check() {
    const R = g.Rec, D = g.Day, issues = [];
    const add = (level, msg, n) => issues.push({ level: level, msg: msg, n: n || 0 });

    if (!R) { add('bad', 'The store is not loaded — this page cannot see your data.'); return done(issues, {}); }

    const rows = R.export(), seen = Object.create(null);
    let bad = 0, futures = 0, orphans = 0, dupes = 0, tombs = 0;
    const acts = R.map('activity');
    const today = D ? D.today() : new Date().toISOString().slice(0, 10);

    rows.forEach(r => {
      if (!r.id || !r.type || !r.updated_at) { bad++; return; }
      if (r.date && !DATE.test(r.date)) bad++;
      if (r.date && r.date > today) futures++;
      if (r.deleted) tombs++;
      if (seen[r.id]) dupes++; else seen[r.id] = 1;
      if (r.type === 'tick' && !r.deleted && Object.keys(acts).length && !acts[r.key]) orphans++;
    });

    if (bad) add('bad', bad + ' rows are malformed and were skipped.', bad);
    if (dupes) add('bad', dupes + ' duplicate rows — two records claim the same fact.', dupes);
    if (futures) add('warn', futures + ' ticks are dated in the future. Usually a clock or timezone slip.', futures);
    if (orphans) add('warn', orphans + ' ticks point at an activity that no longer exists. They still count, they just show as an id.', orphans);
    if (tombs > rows.length * 0.4 && tombs > 50) add('warn', 'Most of your rows are deleted leftovers. Tidying would speed things up.', tombs);

    /* storage headroom — the one failure that arrives with no warning */
    let used = 0;
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); used += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {}
    const mb = used / 1048576;
    if (mb > 4.2) add('bad', 'Browser storage is nearly full (' + mb.toFixed(1) + 'MB of about 5MB). Back up and tidy now.');
    else if (mb > 3) add('warn', 'Browser storage is ' + mb.toFixed(1) + 'MB of about 5MB.');

    /* a backup that never happens is the most common way local data dies */
    if (g.IO) {
      const stale = Object.keys(g.IO._apps || {}).length ? null : undefined;
      const n = g.IO.staleDays && g.IO.staleDays(Health.app || 'app');
      if (n === null) add('warn', 'No backup has ever been made on this device.');
      else if (n >= 14) add('warn', 'Last backup was ' + n + ' days ago.');
      void stale;
    }

    return done(issues, Object.assign(R.stats(), { storageMB: Math.round(mb * 10) / 10 }));
  },

  /** one line for a status bar */
  summary() {
    const r = Health.check();
    if (r.ok) return { ok: true, text: r.stats.live + ' rows, all healthy' };
    const bad = r.issues.filter(i => i.level === 'bad').length;
    return { ok: false, text: bad ? bad + ' problem' + (bad === 1 ? '' : 's') + ' found' : r.issues.length + ' thing' + (r.issues.length === 1 ? '' : 's') + ' to look at' };
  },

  /** drop-in panel for a settings tab */
  panel(pane) {
    const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
    const r = Health.check();
    pane.appendChild(el('p', null, r.ok
      ? '<b style="color:var(--success,#6ee7a8)">Everything checks out.</b> ' + r.stats.live + ' rows, ' + r.stats.storageMB + 'MB used.'
      : '<b style="color:var(--warn,#ffb347)">' + r.issues.length + ' thing' + (r.issues.length === 1 ? '' : 's') + ' to look at.</b>'));
    r.issues.forEach(i => {
      const row = el('div', 'mb-row');
      row.appendChild(el('div', 'lbl', '<b style="color:var(--' + (i.level === 'bad' ? 'danger,#ff6b81' : 'warn,#ffb347') + ')">' +
        (i.level === 'bad' ? 'Problem' : 'Worth knowing') + '</b><span>' + i.msg + '</span>'));
      pane.appendChild(row);
    });
    const types = r.stats.types || {};
    pane.appendChild(el('div', 'mb-group', 'WHAT IS STORED'));
    Object.keys(types).sort().forEach(t => {
      const row = el('div', 'mb-row');
      row.appendChild(el('div', 'lbl', '<b>' + t + '</b><span>' + types[t] + ' rows</span>'));
      pane.appendChild(row);
    });
  },
};

function done(issues, stats) {
  return { ok: !issues.some(i => i.level === 'bad'), clean: issues.length === 0, issues: issues, stats: stats };
}

g.Health = Health;
})(window);
