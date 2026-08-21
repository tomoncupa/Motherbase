/* ══════════════════════ MOTHERBASE · IO ══════════════════════
   Backup, restore and export. Per app, same button, same shape everywhere.

   Two different jobs, deliberately not mixed up:

     BACKUP  — a .json of this app's rows. Restorable. Boring on purpose.
     EXPORT  — a spreadsheet you can actually read. Not restorable, and the
               panel says so, because a readable file that quietly loses the
               tombstones is a trap if you think it is a backup.

   Restore MERGES by default rather than replacing: every row carries
   `updated_at`, so bringing back an old backup can only fill in what is
   missing, never overwrite something newer. Replace is there too, behind a
   confirm, for when you genuinely want to rewind.

   The spreadsheet is built with SheetJS if it loads, and falls back to plain
   CSV if it does not — per the standing rule that no dependency may be one the
   app cannot run without.

     <script src="shared/io.js"></script>
     IO.register({ app:'block', name:'BLOCK', types:['lane','item','routine'] });
*/
(function (g) {
'use strict';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const apps = Object.create(null);
const BK = a => 'mb.backup.' + a;
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toast = (h, o) => g.UI ? g.UI.toast(h, o) : console.log(h.replace(/<[^>]+>/g, ''));

/* Handing a file to the user, on a platform that does not really do downloads.

   `<a download>` is ignored by iOS Safari and does nothing at all inside a
   home-screen web app: no file, no error, no hint that it failed. Since a
   backup is the only safety net local-only data has, silently not producing
   one is the worst bug in this file.

   So: the share sheet where there is one, which is how you actually save a
   file on an iPhone (Save to Files, or send it to yourself), and the anchor
   everywhere else. Returns a promise that resolves true only if the file
   really went somewhere, so the caller can decide whether to claim a backup
   happened. */
function save(name, data, mime) {
  const type = mime || 'text/plain;charset=utf-8';
  const blob = data instanceof Blob ? data : new Blob([data], { type: type });

  const anchor = () => {
    const a = el('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);        /* Safari ignores a detached anchor */
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    return true;
  };

  const file = (function () {
    try { return new File([blob], name, { type: type }); } catch (e) { return null; }
  })();

  if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
    return navigator.share({ files: [file], title: name })
      .then(() => true)
      /* AbortError means they closed the share sheet — nothing was saved, and
         we must not go on to claim a backup was made. */
      .catch(e => (e && e.name === 'AbortError') ? false : anchor());
  }
  return Promise.resolve(anchor());
}
const cell = v => { v = String(v == null ? '' : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
const csv = rows => rows.map(r => r.map(cell).join(',')).join('\r\n');

/* ── the standard sheets every app gets for free, built from the shared store ── */
/** Calendar and Log are built from ticks, which are shared by every app — so
    they are in every app's export regardless of what that app owns. */
function tickSheets(days) {
  const R = g.Rec, D = g.Day;
  if (!R || !D) return [];
  const acts = R.map('activity');
  const name = id => (acts[id] && acts[id].name) || id;

  const ticks = R.all('tick');
  const log = [['Date', 'Activity', 'Source', 'Logged at']];
  ticks.forEach(r => log.push([r.date, name(r.key), (r.payload && r.payload.src) || '', r.updated_at]));

  /* the one you actually look at: things down the side, days across the top */
  const window_ = D.last(days || 60);
  const ids = [];
  ticks.forEach(r => { if (ids.indexOf(r.key) === -1 && window_.indexOf(r.date) > -1) ids.push(r.key); });
  ids.sort((a, b) => name(a).localeCompare(name(b)));
  const done = Object.create(null);
  ticks.forEach(r => done[r.date + '|' + r.key] = true);

  const cal = [['Activity'].concat(window_)];
  ids.forEach(id => cal.push([name(id)].concat(window_.map(d => done[d + '|' + id] ? true : ''))));
  cal.push([]);
  cal.push(['Total'].concat(window_.map(d => ids.filter(id => done[d + '|' + id]).length)));

  return [
    { name: 'Calendar', rows: cal, widths: [26].concat(window_.map(() => 11)) },
    { name: 'Log', rows: log, widths: [12, 26, 12, 24] },
  ];
}

function loadXLSX() {
  if (g.XLSX) return Promise.resolve(g.XLSX);
  return new Promise(res => {
    const s = el('script'); s.src = CDN;
    s.onload = () => res(g.XLSX || null);
    s.onerror = () => res(null);
    document.head.appendChild(s);
    setTimeout(() => res(g.XLSX || null), 6000);
  });
}

const IO = {
  /** an app describes itself once: which types it owns, and any sheets of its
      own it wants in the spreadsheet */
  register(spec) {
    apps[spec.app] = Object.assign({ types: [], sheets: null, tables: null, name: spec.app }, spec);
    return IO;
  },

  /* ══════════════ EDITABLE TABLES ══════════════

     Two kinds of tab, and the difference is not taste, it is arithmetic.

     A TABLE is one line per real thing. Line 4 is the chicken breast. Change
     165 to 170 and there is exactly one row to save it to, so it can be typed
     into freely — in the sheet, on a laptop, forty rows at a time.

     A SHEET is maths done on those things. "Monday: 2,340 kcal" is not stored
     anywhere; it is the seven meals added up on the way to the screen. Typing
     over it has no row to land in — which meal got bigger? — so the only
     honest options are to guess or to discard, and both are worse than not
     offering the box. Change the meals and the total changes itself.

     So: everything one-per-thing is editable, nothing derived is. That is the
     whole rule, and it is why STATUS can hand you its food database to edit in
     bulk while its daily summary stays a read-out.

     An app declares its tables and io.js does the rest — building the tab,
     reading it back, and deciding what won:

       IO.register({ app:'status', types:[…],
         tables: [
           { name:'Food', type:'food',
             cols:[['name','Name'],['brand','Brand'],['base.kcal','Calories']] },
         ] });

     `id` is the first column and it is how a line keeps its identity across a
     round trip. Blank id means a new thing. Clearing a line's text means
     delete it. Both are what somebody editing a spreadsheet would expect,
     which is the point.                                                     */

  /** What a tab is called. One function decides, because two places deciding
      is how the same table ends up with two names and the sheet grows a
      duplicate nobody notices — tables() was using the app id and the mirror
      was using its display name, which agree for STATUS and would not for the
      next app. */
  tabName(appId, name) { return IO.spec(appId).name.toUpperCase() + ' · ' + name; },

  /** the value at a dotted path, so a table can expose nested fields flat */
  reach(o, path) {
    return String(path).split('.').reduce((v, k) => (v == null ? v : v[k]), o);
  },
  plant(o, path, val) {
    const parts = String(path).split('.');
    let cur = o;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
    return o;
  },

  /** every declared table for an app, as rows ready to write into a sheet */
  tables(appId) {
    const S = IO.spec(appId), R = g.Rec;
    if (!S.tables || !R) return [];
    return S.tables.map(t => {
      const head = ['id', 'date'].concat(t.cols.map(c => c[1])).concat(['edited', 'by']);
      const rows = [head];
      R.all(t.type).forEach(r => {
        const line = [r.key, r.date || ''];
        t.cols.forEach(c => {
          const v = IO.reach(r.payload, c[0]);
          line.push(v == null ? '' : v);
        });
        /* the stamp every row carries, so a clash has something to settle it */
        line.push(new Date(r.updated_at).toISOString(), r.by || 'phone');
        rows.push(line);
      });
      return { name: IO.tabName(appId, t.name), table: t, rows: rows, editable: true };
    });
  },

  /** Read one table's grid back and work out what changed.
      Returns {changed, added, removed, clashes} without writing anything, so a
      caller can show the damage before doing it. */
  readTable(appId, tableName, grid) {
    const S = IO.spec(appId), R = g.Rec;
    const t = (S.tables || []).filter(x => x.name === tableName)[0];
    const out = { changed: [], added: [], removed: [], clashes: [] };
    if (!t || !grid || grid.length < 2) return out;

    const seen = {};
    grid.slice(1).forEach(line => {
      if (!line || !line.length) return;
      const id = String(line[0] || '').trim();
      const date = String(line[1] || '').trim() || null;
      const blank = t.cols.every((c, i) => String(line[2 + i] == null ? '' : line[2 + i]).trim() === '');
      if (id) seen[id] = true;

      if (id && blank) { out.removed.push({ key: id, date: date }); return; }
      if (blank) return;

      const prev = id ? R.row(t.type, date, id) : null;
      const payload = prev ? JSON.parse(JSON.stringify(prev.payload)) : {};
      let differs = false;
      t.cols.forEach((c, i) => {
        let v = line[2 + i];
        if (typeof v === 'string') v = v.trim();
        /* a column that held a number keeps holding one */
        const was = IO.reach(payload, c[0]);
        if (typeof was === 'number' || (was == null && v !== '' && isFinite(v) && String(v).trim() !== '')) {
          const n = parseFloat(v);
          if (isFinite(n)) v = n;
        }
        if (v === '') v = null;
        if (JSON.stringify(was == null ? null : was) !== JSON.stringify(v)) {
          IO.plant(payload, c[0], v);
          differs = true;
        }
      });

      if (!prev) { out.added.push({ key: id || null, date: date, payload: payload, type: t.type }); return; }
      if (!differs) return;

      /* Newest wins, per row, the same rule the store already merges by. The
         sheet stamps its own edits; if the phone's is newer the phone keeps
         it, and the loser is recorded rather than dropped so nothing vanishes
         without a trace. */
      /* updated_at is an ISO string, so both sides get parsed to numbers.
         Comparing a number against the string silently coerced to NaN and no
         clash was ever detected — the sheet always appeared to win. */
      const sheetAt = Date.parse(line[2 + t.cols.length] || '') || 0;
      const ourAt = Date.parse(prev.updated_at) || 0;
      if (sheetAt && ourAt && sheetAt < ourAt) {
        out.clashes.push({
          type: t.type, key: id, date: date, table: tableName,
          kept: 'phone', at: prev.updated_at,
          theirs: payload, ours: prev.payload,
        });
        return;
      }
      out.changed.push({ type: t.type, key: id, date: date, payload: payload });
    });

    /* a line deleted outright in the sheet, rather than emptied */
    R.all(t.type).forEach(r => { if (!seen[r.key]) out.removed.push({ key: r.key, date: r.date, gone: true }); });
    return out;
  },

  /** apply what readTable found */
  applyTable(appId, diff, opts) {
    const R = g.Rec;
    opts = opts || {};
    let n = 0;
    (diff.changed || []).forEach(c => { R.set(c.type, c.date, c.key, c.payload); n++; });
    (diff.added || []).forEach(a => {
      const key = a.key || (R.USER + '-' + Date.now().toString(36) + '-' + (n).toString(36));
      R.set(a.type, a.date, key, a.payload); n++;
    });
    /* Deleting from a spreadsheet is easy to do by accident, so it only
       happens when the caller says so. */
    if (opts.allowDelete) (diff.removed || []).forEach(r0 => { R.del(r0.type || diff.type, r0.date, r0.key); n++; });
    return n;
  },
  spec(appId) { return apps[appId] || { app: appId, name: appId, types: [] }; },

  /* ── backup ── */
  /** everything one app owns, in the shape restore() expects. One builder, so
      the backup file and the spreadsheet's Data tab cannot drift apart. */
  bagFor(appId) {
    const S = IO.spec(appId), R = g.Rec;
    const types = S.types.concat(['tick', 'activity']);
    const rows = R.export(types).concat(R.export(['setting']).filter(r => String(r.key).indexOf(appId + '.') === 0));
    return {
      kind: 'motherbase-backup', v: 1, app: appId, at: new Date().toISOString(),
      types: types, rows: rows,
      local: S.localKeys ? S.localKeys().reduce((o, k) => { o[k] = localStorage.getItem(k); return o; }, {}) : undefined,
    };
  },

  backup(appId) {
    const S = IO.spec(appId), R = g.Rec;
    if (!R) return toast('no store loaded', { bad: true });
    const bag = IO.bagFor(appId);
    const rows = bag.rows;
    /* The stamp is written when the file lands, not when the button is
       pressed. It used to be set unconditionally, so on an iPhone — where the
       download silently did nothing — the app would report a backup that did
       not exist. Now a cancelled share leaves the warning up, which is
       correct: nothing was saved. */
    return save('motherbase-' + appId + '-' + g.Day.today() + '.json', JSON.stringify(bag), 'application/json')
      .then(done => {
        if (!done) { toast('nothing saved', { bad: true }); return false; }
        try { localStorage.setItem(BK(appId), g.Day.today()); } catch (e) {}
        toast('<b>' + rows.length + '</b> rows backed up');
        if (g.Sfx) g.Sfx.play('done');
        return true;
      });
  },
  /** every app at once — the belt-and-braces one, lives on the home screen */
  backupAll() {
    const R = g.Rec;
    const bag = { kind: 'motherbase-backup', v: 1, app: '*', at: new Date().toISOString(), rows: R.export() };
    save('motherbase-all-' + g.Day.today() + '.json', JSON.stringify(bag), 'application/json');
    Object.keys(apps).forEach(a => { try { localStorage.setItem(BK(a), g.Day.today()); } catch (e) {} });
    toast('<b>' + bag.rows.length + '</b> rows backed up, every app');
  },

  read(file) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { try { res(JSON.parse(fr.result)); } catch (e) { rej(new Error('that file is not a backup')); } };
      fr.onerror = () => rej(new Error('could not read that file'));
      fr.readAsText(file);
    });
  },
  /** merge is the safe default: newer rows win, nothing already newer is lost */
  restore(bag, mode) {
    const R = g.Rec;
    if (!bag || bag.kind !== 'motherbase-backup') throw new Error('not a Motherbase backup');
    if (mode === 'replace' && bag.rows) {
      const types = []; bag.rows.forEach(r => { if (types.indexOf(r.type) === -1) types.push(r.type); });
      R.clear(types);
    }
    if (bag.local) Object.keys(bag.local).forEach(k => { try { localStorage.setItem(k, bag.local[k]); } catch (e) {} });
    return R.merge(bag.rows || []);
  },
  pick(onFile) {
    const i = el('input'); i.type = 'file';
    i.accept = '.json,.xlsx,application/json';
    i.onchange = () => { if (i.files[0]) onFile(i.files[0]); };
    i.click();
  },

  /** Read either kind back. A .json is the plain backup; an .xlsx is the
      spreadsheet, whose Data tab holds the same rows. */
  readAny(file) {
    if (!/\.xlsx$/i.test(file.name || '')) return IO.read(file);
    return loadXLSX().then(X => {
      if (!X) throw new Error('the spreadsheet library did not load — use the .json backup, or try again on a connection');
      return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => {
          try {
            const wb = X.read(new Uint8Array(fr.result), { type: 'array' });
            const ws = wb.Sheets['Data'];
            if (!ws) throw new Error('that spreadsheet has no Data tab, so there is nothing to restore from. Only exports made by this app carry one.');
            const aoa = X.utils.sheet_to_json(ws, { header: 1 });
            const rows = [];
            aoa.forEach(line => {
              const cell = line && line[0];
              if (typeof cell !== 'string' || cell.charAt(0) !== '{') return;
              try { rows.push(JSON.parse(cell)); } catch (e) {}
            });
            if (!rows.length) throw new Error('the Data tab had no rows in it');
            res({ kind: 'motherbase-backup', v: 1, rows: rows });
          } catch (e) { rej(e); }
        };
        fr.onerror = () => rej(new Error('could not read that file'));
        fr.readAsArrayBuffer(file);
      });
    });
  },

  /* ── the readable export ── */
  sheets(appId, days) {
    const S = IO.spec(appId);
    return tickSheets(days).concat(S.sheets ? S.sheets() : []);
  },

  /** everything that goes in the workbook: the read-outs, then the tables you
      can type into, then the exact rows. Named so the three are never confused
      for each other at a glance. */
  workbook(appId, days) {
    const read = IO.sheets(appId, days).map(x => Object.assign({}, x, { name: x.name }));
    return read.concat(IO.tables(appId));
  },
  export(appId) {
    const sheets = IO.sheets(appId);
    if (!sheets.length) return toast('nothing to export yet');
    toast('building the spreadsheet…');
    return loadXLSX().then(X => {
      const stamp = g.Day.today();
      if (!X) {                                        /* CDN blocked or offline — CSV still works */
        sheets.forEach(s => save('motherbase-' + appId + '-' + s.name.toLowerCase() + '-' + stamp + '.csv', csv(s.rows), 'text/csv;charset=utf-8'));
        toast('CSV exported — <b>spreadsheet library unavailable</b>');
        return;
      }
      const wb = X.utils.book_new();
      IO.tables(appId).forEach(t => sheets.push(t));
      sheets.forEach(s => {
        const ws = X.utils.aoa_to_sheet(s.rows);
        if (s.widths) ws['!cols'] = s.widths.map(w => ({ wch: w }));
        X.utils.book_append_sheet(wb, ws, s.name.slice(0, 28));
      });

      /* ── the Data tab ──
         The readable tabs are a view: they round numbers, drop fields and
         reshape everything for a human, so they cannot be read back without
         guessing. That is why an export used to say "not restorable".

         So the workbook carries the rows themselves as well, one JSON row per
         line on a tab at the end. The file is now both things at once — open
         it and read it, or hand it back to the app and it restores exactly.
         Two files that mean nearly the same thing is how you end up restoring
         the wrong one. */
      const raw = [['Motherbase rows — do not edit. The readable tabs are the ones to look at.']];
      IO.bagFor(appId).rows.forEach(r => raw.push([JSON.stringify(r)]));
      const rws = X.utils.aoa_to_sheet(raw);
      rws['!cols'] = [{ wch: 120 }];
      X.utils.book_append_sheet(wb, rws, 'Data');

      return save('motherbase-' + appId + '-' + stamp + '.xlsx',
        new Blob([X.write(wb, { bookType: 'xlsx', type: 'array' })],
          { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
        .then(done => {
          if (!done) return toast('nothing saved', { bad: true });
          toast('spreadsheet exported — <b>' + (sheets.length + 1) + ' tabs</b>, and it restores');
          if (g.Sfx) g.Sfx.play('complete', { level: 2 });
        });
    });
  },

  lastBackup(appId) { return localStorage.getItem(BK(appId)); },
  staleDays(appId) {
    const d = IO.lastBackup(appId);
    return d == null ? null : g.Day.diff(g.Day.today(), d);
  },
  isStale(appId, limit) { const n = IO.staleDays(appId); return n === null || n >= (limit || 14); },

  /* ── the DATA tab, identical in every app ── */
  panel(pane, appId) {
    const n = IO.staleDays(appId), R = g.Rec;
    const stats = R ? R.stats() : { live: 0, kb: 0 };

    pane.appendChild(el('p', null,
      (n === null ? '<b style="color:var(--warn,#ffb347)">Never backed up.</b>'
        : n === 0 ? 'Backed up <b>today</b>.' : 'Backed up <b>' + n + 'd ago</b>.') +
      ' <span style="opacity:.6">' + stats.live + ' rows · ' + stats.kb + 'kb</span>'));

    const opt = (ic, t, d, fn, cls) => {
      const b = el('button', 'mb-opt mb-press flat' + (cls ? ' ' + cls : ''));
      b.innerHTML = '<span class="ic">' + ic + '</span><span class="t"><b>' + t + '</b><span>' + d + '</span></span>';
      b.onclick = fn; pane.appendChild(b); return b;
    };

    /* No repaint of this pane afterwards: opt() closes over `pane` and
       redrawing it from inside a handler rebuilds the node that handler is
       attached to, which locks the renderer. The line updates next open. */
    opt('⭳', 'Back up', 'The file that can be restored.', () => IO.backup(appId));
    opt('⭱', 'Restore', 'From a backup or an exported spreadsheet. Fills in what is missing, never overwrites newer.',
      () => IO.pick(f => IO.readAny(f).then(bag => {
        const c = IO.restore(bag, 'merge');
        toast(c ? '<b>' + c + '</b> rows restored' : 'nothing to restore — this device is already up to date');
      }).catch(e => toast(esc(e.message), { bad: true }))));
    opt('⟲', 'Rewind', 'Replaces everything with the file. Discards anything newer.',
      () => IO.pick(f => IO.readAny(f).then(bag =>
        (g.UI ? g.UI.confirm('Rewind to the backup from ' + (bag.at || '?') + '?', 'Anything newer than the file is discarded.', { yes: 'REWIND', danger: true }) : Promise.resolve(confirm('Rewind?')))
          .then(ok => { if (!ok) return; const c = IO.restore(bag, 'replace'); toast('<b>' + c + '</b> rows restored'); })
      ).catch(e => toast(esc(e.message), { bad: true }))), 'bad');

    opt('▦', 'Spreadsheet', 'Readable, and it restores too.', () => IO.export(appId));

    opt('⌫', 'Delete this app’s data', 'Ticks and activities are shared and stay.',
      () => (g.UI ? g.UI.confirm('Delete all of ' + IO.spec(appId).name + '’s data?', 'Back up first. This cannot be undone.', { yes: 'DELETE', danger: true }) : Promise.resolve(confirm('Delete?')))
        .then(ok => { if (!ok) return; const c = g.Rec.clear(IO.spec(appId).types); toast('<b>' + c + '</b> rows deleted'); }), 'bad');
  },
};


  /* ══════════════ THE MIRROR ══════════════

     One Google Sheet for the whole suite. One link, pasted once, shared by
     every app — because "the sheet is the save file" stops being true the
     moment there are four of them.

     The config lives in localStorage rather than in a row, for the same reason
     day.js keeps its own: this has to work before the store is up, and every
     app has to see the same value.

     ── how a sync goes ──

       1. PULL. Ask the sheet for its editable tabs.
       2. RESOLVE. readTable() works out what changed there, and for each row
          the newer edit wins. The loser is written to a `conflict` row rather
          than dropped.
       3. APPLY. Write the winners into the store.
       4. PUSH. Send everything back, so the sheet and the phone agree.

     Pulling before pushing is what makes a push safe. Push first and you
     overwrite whatever you typed in the sheet since last time, which is the
     bug in the version this replaces — it called sh.clear() on every tab.

     ── why the pull is JSONP ──

     An Apps Script web app does not reliably answer the CORS preflight a
     cross-origin fetch needs, and an opaque no-cors response is unreadable.
     A <script> tag has never needed permission to cross origins, so the pull
     asks for JavaScript and the script wraps the answer in a callback. It is
     an old technique and it is the one that works here. Nothing is sent: a
     GET carries no data out, and the sheet is his own.                      */

const MKEY = 'mb.mirror';
let mcfg = { url: '', on: 0, at: null };
try { Object.assign(mcfg, JSON.parse(localStorage.getItem(MKEY) || '{}')); } catch (e) {}
const msave = () => { try { localStorage.setItem(MKEY, JSON.stringify(mcfg)); } catch (e) {} };

/** ask the sheet for its editable tabs, by script tag */
function jsonp(url, params, ms) {
  return new Promise((res, rej) => {
    const cb = 'mbcb' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const sep = url.indexOf('?') > -1 ? '&' : '?';
    const q = Object.keys(params || {}).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    const tag = document.createElement('script');
    let done = false;
    const clean = () => { delete g[cb]; tag.remove(); };
    const timer = setTimeout(() => {
      if (done) return; done = true; clean();
      rej(new Error('the sheet did not answer'));
    }, ms || 15000);
    g[cb] = data => { if (done) return; done = true; clearTimeout(timer); clean(); res(data); };
    tag.onerror = () => { if (done) return; done = true; clearTimeout(timer); clean(); rej(new Error('could not reach the sheet')); };
    tag.src = url + sep + q + '&callback=' + cb;
    document.head.appendChild(tag);
  });
}

const Mirror = {
  get settings() { return Object.assign({}, mcfg); },
  set(patch) { Object.assign(mcfg, patch || {}); msave(); return Mirror.settings; },
  get url() { return mcfg.url; },
  ready() { return !!mcfg.url; },

  /** Every tab this app owns: the read-outs, then the ones you can type into.

      Two tabs cannot share a name — a sheet has one tab per name, so the
      second would silently overwrite the first and half the data would appear
      to vanish. Where an app has both a read-out and an editable table of the
      same thing, the editable one wins and the read-out is dropped: it is the
      same data, and offering a rounded copy beside a typable original is how
      somebody ends up editing the wrong one. */
  tabs(appId) {
    const edit = IO.tables(appId).map(t => ({ name: t.name, rows: t.rows, editable: true }));
    const taken = {};
    edit.forEach(t => { taken[t.name.toLowerCase()] = 1; });

    const read = [];
    IO.sheets(appId).forEach(s => {
      const name = IO.tabName(appId, s.name);
      /* a plural read-out and a singular table are the same thing */
      const key = name.toLowerCase().replace(/s$/, '');
      if (taken[name.toLowerCase()] || taken[key] || taken[key + 's']) return;
      taken[name.toLowerCase()] = 1;
      read.push({ name: name, rows: s.rows, editable: false });
    });
    return read.concat(edit);
  },

  /* ── 1 and 2: pull and resolve ── */
  pull(appId) {
    if (!mcfg.url) return Promise.resolve({ skipped: 'no link' });
    return jsonp(mcfg.url, { app: appId, want: 'tables' }).then(reply => {
      if (!reply || !reply.tabs) return { skipped: 'nothing came back' };
      const S = IO.spec(appId);
      const out = { changed: 0, added: 0, clashes: 0 };
      (S.tables || []).forEach(t => {
        const full = IO.tabName(appId, t.name);
        const grid = reply.tabs[full] || reply.tabs[t.name];
        if (!grid) return;
        const diff = IO.readTable(appId, t.name, grid);
        out.changed += diff.changed.length;
        out.added += diff.added.length;
        out.clashes += diff.clashes.length;
        IO.applyTable(appId, diff);                 /* never deletes on a pull */
        diff.clashes.forEach(c => IO.logConflict(appId, c));
      });
      return out;
    });
  },

  /** A row the sheet wanted to change and lost. Kept as a row of its own so
      the hub can show it — nothing is overwritten without a trace. */
  logConflict(appId, c) {
    const R = g.Rec;
    if (!R) return;
    R.set('conflict', g.Day.today(), appId + '-' + c.type + '-' + c.key + '-' + Date.now().toString(36), {
      app: appId, type: c.type, row: c.key, table: c.table,
      kept: c.kept, at: c.at, ours: c.ours, theirs: c.theirs,
    });
  },

  /* ── 4: push ── */
  push(appId, quiet) {
    if (!mcfg.url) { if (!quiet) toast('Paste the link first', { bad: true }); return Promise.resolve(false); }
    const tabs = Mirror.tabs(appId);
    return fetch(mcfg.url, {
      method: 'POST', redirect: 'follow',
      /* text/plain sidesteps the CORS preflight Apps Script cannot answer */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ app: appId, at: new Date().toISOString(), tabs: tabs }),
    }).then(() => {
      Mirror.set({ at: g.Day.today() });
      if (!quiet) toast('Synced <b>' + tabs.length + '</b> tabs.');
      return true;
    }).catch(() => {
      if (!quiet) toast('Could not reach the sheet, so nothing was sent and nothing was lost.', { bad: true });
      return false;
    });
  },

  /** the whole round trip, in the order that makes it safe */
  sync(appId, quiet) {
    if (!mcfg.url) return Promise.resolve(false);
    if (!quiet) toast('Syncing…');
    return Mirror.pull(appId)
      .catch(() => ({ skipped: 'could not read' }))
      .then(got => Mirror.push(appId, true).then(sent => {
        if (!quiet) {
          if (!sent) toast('Could not reach the sheet, so nothing was lost.', { bad: true });
          else if (got && got.clashes) toast('Synced, and <b>' + got.clashes + '</b> older sheet edits were kept aside.');
          else if (got && (got.changed || got.added)) toast('Synced, with <b>' + (got.changed + got.added) + '</b> changes from the sheet.');
          else toast('Synced.');
        }
        if (sent && g.Sfx) g.Sfx.play('complete', { level: 2 });
        return sent;
      }));
  },

  /** on open, quietly. Never blocks anything and never says anything unless
      it actually brought something back. */
  onOpen(appId) {
    if (!mcfg.url || !mcfg.on) return Promise.resolve(false);
    return Mirror.pull(appId).then(got => {
      if (got && (got.changed || got.added)) {
        toast('<b>' + (got.changed + got.added) + '</b> changes came in from the sheet.');
        if (g.Rec) g.Rec.reload && g.Rec.reload();
      }
      return true;
    }).catch(() => false);
  },

  /** The Apps Script to paste. Generated here so it cannot drift from the
      protocol above. */
  script() {
    return [
      '/* Motherbase sheet bridge. Paste into Extensions > Apps Script,',
      '   then Deploy > New deployment > Web app, execute as me, access anyone. */',
      '',
      'function doPost(e) {',
      '  var body = JSON.parse(e.postData.contents);',
      '  var ss = SpreadsheetApp.getActiveSpreadsheet();',
      '  (body.tabs || body.sheets || []).forEach(function (t) {',
      '    var sh = ss.getSheetByName(t.name) || ss.insertSheet(t.name);',
      '    sh.clear();',
      '    if (t.rows && t.rows.length) {',
      '      sh.getRange(1, 1, t.rows.length, t.rows[0].length).setValues(t.rows);',
      '      sh.setFrozenRows(1);',
      '      if (t.editable) sh.getRange(1, 1, 1, t.rows[0].length).setFontWeight("bold");',
      '    }',
      '  });',
      '  return ContentService.createTextOutput(JSON.stringify({ ok: true }))',
      '    .setMimeType(ContentService.MimeType.JSON);',
      '}',
      '',
      '/* The pull. Answers as JavaScript so a script tag can read it, because',
      '   a web app cannot reliably answer a cross-origin fetch. */',
      'function doGet(e) {',
      '  var ss = SpreadsheetApp.getActiveSpreadsheet();',
      '  var out = {};',
      '  ss.getSheets().forEach(function (sh) {',
      '    var name = sh.getName();',
      '    var vals = sh.getDataRange().getValues();',
      '    if (!vals.length) return;',
      '    /* only the tabs with an id column can be read back */',
      '    if (String(vals[0][0]).toLowerCase() !== "id") return;',
      '    out[name] = vals.map(function (row) {',
      '      return row.map(function (c) {',
      '        return (c instanceof Date) ? c.toISOString() : c;',
      '      });',
      '    });',
      '  });',
      '  var body = JSON.stringify({ ok: true, tabs: out });',
      '  var cb = e && e.parameter && e.parameter.callback;',
      '  if (cb) return ContentService.createTextOutput(cb + "(" + body + ")")',
      '    .setMimeType(ContentService.MimeType.JAVASCRIPT);',
      '  return ContentService.createTextOutput(body)',
      '    .setMimeType(ContentService.MimeType.JSON);',
      '}',
      '',
      '/* Stamps the row you just edited, so the app can tell whether the sheet',
      '   or the phone changed it last. Without a time on it the phone would win',
      '   every disagreement by default.',
      '',
      '   Named onEdit on purpose: Google runs a function with that exact name by',
      '   itself whenever somebody types in the sheet. There is nothing to set up',
      '   and no permission to grant. It also does not fire when this script',
      '   writes, which is what we want: a push from the phone must not mark its',
      '   own rows as edited in the sheet. */',
      'function onEdit(e) {',
      '  var sh = e.range.getSheet();',
      '  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];',
      '  if (String(head[0]).toLowerCase() !== "id") return;',
      '  var at = head.indexOf("edited"), by = head.indexOf("by");',
      '  if (at < 0) return;',
      '  var row = e.range.getRow();',
      '  if (row < 2) return;',
      '  sh.getRange(row, at + 1).setValue(new Date().toISOString());',
      '  if (by > -1) sh.getRange(row, by + 1).setValue("sheet");',
      '}',
    ].join('\n');
  },
};
IO.mirror = Mirror;

g.IO = IO;
})(window);
