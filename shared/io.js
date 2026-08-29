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

/* ── the version ──
   One number for the whole suite, because the apps share a foundation and
   "which version" is only a useful question if it has one answer. It goes in
   every backup and on every sheet, so a file found later says what wrote it.

   Bumped by hand, and only when something changed that a person would notice
   or that changes the shape of stored data. VERSIONS.md says what each one
   did. */
const VERSION = '0.1.9';

const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
const apps = Object.create(null);
const BK = a => 'mb.backup.' + a;
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const toast = (h, o) => g.UI ? g.UI.toast(h, o) : console.log(h.replace(/<[^>]+>/g, ''));

/* ── a column that stores an id and shows a word ──
   `kind` on a journal line is stored as `todo`, because that is a stable key
   the code can branch on. In a spreadsheet you are reading it, and a column of
   lowercase slugs is a column you have to translate in your head. Worse, the
   Journal tab and the Tracked tab both have a column called Kind holding two
   completely different vocabularies.

   A column spec may carry a third element: a plain map of stored value to the
   word for it. The sheet gets the word, and typing the word back in stores the
   value again. Matching on the way in is case-insensitive and also accepts the
   raw stored value, so a sheet written before this still imports and so does
   one where somebody typed "todo" in lower case.

   Anything not in the map passes through untouched — an unknown value is data,
   and quietly blanking it would be worse than showing it raw. */
const colMap = col => {
  /* A function, resolved at export time, so a table spec written near the top
     of a file can name a vocabulary declared further down it without tripping
     over the order things are defined in. */
  const m = typeof col[2] === 'function' ? col[2]() : col[2];
  return (m && typeof m === 'object') ? m : null;
};
function labelFor(col, v) {
  const map = colMap(col);
  if (!map) return v;
  return Object.prototype.hasOwnProperty.call(map, v) ? map[v] : v;
}
function storedFor(col, v) {
  const map = colMap(col);
  if (!map || v == null || v === '') return v;
  const want = String(v).trim().toLowerCase();
  for (const k in map) {
    if (String(map[k]).toLowerCase() === want) return k;
    if (String(k).toLowerCase() === want) return k;
  }
  return v;
}

/* ── whatever the spreadsheet thinks a date is ──
   Half of every row id is its date, and the store only accepts YYYY-MM-DD.
   A sheet will hand back any of four things for the same cell:

     "2026-08-21"                a plain string, already right
     "2026-08-20T16:00:00.000Z"  a Date cell, ISO'd by Apps Script
     a real Date object          SheetJS with cellDates on
     45890                       an Excel serial, if the cell lost its format

   All four mean the 21st of August. Anything else in that slot silently
   becomes a second row for a fact that already has one.

   The timestamp forms are read in LOCAL time on purpose. Apps Script turned
   the sheet's own midnight into UTC, so the Z-string above is the 21st here
   and slicing off its first ten characters would file it as the 20th — a
   quietly wrong date instead of a duplicate, which is the worse of the two.
   Excel serials are counted in whole days and have no timezone to get wrong.
*/
const DATE_OK = /^\d{4}-\d{2}-\d{2}$/;
const pad2 = n => String(n).padStart(2, '0');
const localDate = ms => {
  const d = new Date(ms);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
};
function sheetDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isFinite(+v) ? localDate(+v) : null;
  /* an Excel serial: days since 1899-12-30, the epoch that makes Excel's own
     leap-year bug come out right. Built as a UTC instant and read back as a
     UTC date, so no timezone is involved in either direction. */
  if (typeof v === 'number' && isFinite(v)) {
    if (v < 1 || v > 200000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate());
  }
  const str = String(v).trim();
  if (!str) return null;
  if (DATE_OK.test(str)) return str;
  const ms = Date.parse(str);
  return isFinite(ms) ? localDate(ms) : null;
}

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
  /* A full-width blank, not an empty array. A ragged row is fine in a file you
     download and fatal to a sheet: setValues writes a rectangle and throws on
     anything else, which aborts the whole write. */
  cal.push(new Array(window_.length + 1).fill(''));
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

const DOT = '·';

const IO = {
  /** an app describes itself once: which types it owns, and any sheets of its
      own it wants in the spreadsheet */
  VERSION: VERSION,

  register(spec) {
    apps[spec.app] = Object.assign({ types: [], sheets: null, tables: null, name: spec.app }, spec);
    /* An app that says who it is has said enough. Keeping the sheet up to date
       is not something each app should have to remember to switch on. */
    try { Mirror.watch(spec.app); } catch (e) {}
    /* And read the sheet once, now. watch() only ever fired after THIS device
       wrote something, so a device that had nothing new never learned what the
       other one had done - open STATUS on the laptop after logging on the
       phone and it sat there showing yesterday. */
    try { Mirror.onOpen(spec.app); } catch (e) {}
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

  /* ── every tab is a rectangle ──
     Google's setValues takes a range and a grid and insists they match. One
     short row anywhere throws, the tab is abandoned, and because the tabs are
     written in a loop everything after it is abandoned too. STATUS put a blank
     spacer row in its calendar, so the first tab failed and no sync ever wrote
     anything — for weeks, while reporting success.

     Any app can make that mistake. So no tab leaves here ragged: rows are
     padded to the widest, holes become empty strings, and undefined never
     survives, because setValues rejects that as well. */
  rect(rows) {
    if (!rows || !rows.length) return rows || [];
    let w = 0;
    rows.forEach(r => { if (r && r.length > w) w = r.length; });
    return rows.map(r => {
      const line = new Array(w);
      for (let i = 0; i < w; i++) {
        const v = r ? r[i] : null;
        line[i] = (v === undefined || v === null) ? '' : v;
      }
      return line;
    });
  },

  /* ── what a tab is called ──
     The name of the data, and nothing else. Tabs used to be stamped with the
     app that wrote them — STATUS · Food — and that name was a claim the app
     was not entitled to make. Food is food. Build a dedicated nutrition
     tracker later, let it take over the type the way the data model already
     prescribes, and the sheet ends up holding a live FUEL · Food beside a
     stale STATUS · Food. Two tabs for one thing, and no way to tell from
     inside the sheet which one is still being written.

     The same argument applies to a read-out. STATUS · TDEE looks like STATUS's
     arithmetic, but TDEE is a fact about the body, and a nutrition app would
     compute the same one. Naming it after today's writer is a rename waiting
     to happen.

     Ownership is not lost, it is recorded instead of spelled: _Settings
     carries a line per type saying which app writes it. Handing a type over
     then changes one line rather than orphaning a tab.

     The cost, said plainly: two apps that both want the tab called Daily will
     overwrite each other. Nothing here can detect that, because an app only
     knows the specs registered on its own page. It is a naming decision to
     make once, when the second app is written. */
  tabName(appId, name) { return name; },

  /** the prefix tabs used to carry, so the sheet can drop the old ones */
  oldPrefix(appId) { return IO.spec(appId).name.toUpperCase() + ' · '; },

  /** which registered app declares itself the writer of a type */
  owner(type) {
    const hit = Object.keys(apps).filter(a => (apps[a].types || []).indexOf(type) > -1);
    return hit.length ? hit[0] : null;
  },

  /** how much a pull actually brought in. `merged` is counted like the rest:
      a weight arriving from the other device is a change, and a sync that
      reports nothing while the numbers move is how you stop trusting it. */
  came(got) { return (got.changed || 0) + (got.added || 0) + (got.merged || 0); },

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

  /** every declared table for an app, as rows ready to write into a sheet.

      With `since`, only the rows written after it. The header always goes,
      because a tab the sheet has never seen has to be given one. */
  tables(appId, since) {
    const S = IO.spec(appId), R = g.Rec;
    if (!S.tables || !R) return [];
    return S.tables.map(t => {
      const head = ['id', 'date'].concat(t.cols.map(c => c[1])).concat(['edited', 'by']);
      const rows = [head];
      R.all(t.type).forEach(r => {
        if (since && !(r.updated_at > since)) return;
        const line = [r.key, r.date || ''];
        t.cols.forEach(c => {
          const v = IO.reach(r.payload, c[0]);
          line.push(v == null ? '' : labelFor(c, v));
        });
        /* the stamp every row carries, so a clash has something to settle it */
        line.push(new Date(r.updated_at).toISOString(), r.by || 'phone');
        rows.push(line);
      });
      /* `key` is which column the sheet matches on to update a line in place.
         Column one is the id, so a changed set updates the line it is already
         on instead of the tab being rewritten around it. */
      return { name: IO.tabName(appId, t.name), table: t, rows: rows, editable: true, key: 0 };
    });
  },

  /** Whatever a spreadsheet put in the date column, as YYYY-MM-DD or null. */
  sheetDate: sheetDate,

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
      /* A date cell reaches us as a Date object turned into an ISO timestamp,
         never as the YYYY-MM-DD the store requires. Left alone it becomes half
         of a second row id for a fact that already has one — see repairDates
         in records.js for what that did to the journal. Normalised here, at
         the boundary, because this is the one place a sheet's idea of a date
         becomes ours. Read back in local time: the sheet meant its own
         midnight, and slicing the string would file it a day early. */
      const date = sheetDate(line[1]);
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
        v = storedFor(c, v);
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
  /* ── the settings a backup has to carry ──
     Rows are only half of what makes the app yours. The theme, the palette you
     edited, the sound pack, the day, whether it buzzes, the sheet link — none
     of those are rows. They are plain localStorage keys written by the shared
     layer, and none of them were in a backup.

     So restoring after reinstalling gave back every measurement and none of
     the appearance, which is a backup that does not restore the thing you were
     using. There was a `localKeys` hook for apps to declare their own and no
     app had ever used it — a hook nobody calls is not a feature.

     These belong to the foundation rather than to any one app, so the
     foundation collects them and every app gets it for nothing. */
  APPEARANCE: ['suite_skin', 'suite_palettes', 'suite_skins_custom', 'mb.day', 'mb.mobile', 'mb.mirror', 'mb.sfx'],

  localBits(appId) {
    const out = {};
    try {
      Object.keys(localStorage).forEach(k => {
        /* prefix match, so suite_skin.status and mb.sfx.status come too */
        if (!IO.APPEARANCE.some(pre => k === pre || k.indexOf(pre + '.') === 0)) return;
        out[k] = localStorage.getItem(k);
      });
    } catch (e) {}
    const S = IO.spec(appId);
    if (S.localKeys) S.localKeys().forEach(k => { out[k] = localStorage.getItem(k); });
    return out;
  },

  /* ── everything, as two tabs ──
     A save file that restores your measurements and not your app is not a save
     file. These two tabs are the whole of it, and they are the same content
     the .json backup carries, built by the same function so the two cannot
     disagree.

     _Data     every row: what you logged, and every setting the app stores as
               a row, which is where the calorie and macro targets live.
     _Settings the things that are not rows at all — the theme, the palette you
               edited, the sound pack, the day, whether it buzzes, the sheet
               link. Written by the shared layer straight to storage, so no
               amount of exporting rows would ever have caught them.

     Named with a leading underscore so they sort to the end and read as
     machinery rather than as something to look at. The header says so too,
     because a tab full of JSON invites exactly one question. */
  bagTabs(appId, since) {
    const bag = IO.bagFor(appId);
    /* The id goes in the SECOND column, never the first. Restore reads column
       one and needs to find the row's JSON sitting there, so the key the sheet
       matches on goes beside it rather than in front of it. */
    /* The banner goes on every push, delta included, because the tab is now
       written line by line and the script has to know the first line is not
       one of them. */
    const data = [['Motherbase rows. Do not edit by hand, the readable tabs are the ones to look at.']];
    bag.rows.forEach(r => {
      if (since && !(r.updated_at > since)) return;
      data.push([JSON.stringify(r), r.id]);
    });

    const set = [['Setting', 'Value']];
    /* first two lines say what wrote this and when, so a sheet found in a year
       identifies itself without anybody having to remember */
    set.push(['motherbase.version', VERSION]);
    set.push(['motherbase.written', new Date().toISOString()]);
    /* Which app writes which kind of thing. Recorded here rather than spelled
       into tab names, so handing a type to a new app is one line changing
       instead of a tab going stale beside a new one. */
    (IO.spec(appId).types || []).forEach(t => set.push(['owns.' + t, appId]));
    Object.keys(bag.local || {}).sort().forEach(k => set.push([k, bag.local[k]]));

    return [
      /* ── the one tab that is never cleared ──

         Every other tab is rewritten whole on a full push, and for a readable
         tab that is right: the device sending it has the whole picture.

         _Data is different, because a device might not. Open STATUS on the
         laptop for the first time and it holds nothing; if its first sync
         rewrote this tab, a fortnight of weights would go off the sheet in one
         move. The phone would still have them — nothing here can reach across
         and delete a row on another device — but the sheet is the backup, and a
         backup that empties itself when you open a second device is not one.

         So this tab is matched on the row id and updated in place, always.
         Rows only ever arrive. A row that really was deleted arrives as its own
         tombstone, which is a line to write rather than a line to leave out. */
      { name: IO.bagName(appId), rows: data, machine: true, key: 1, head: 1, upsert: 1 },
      /* two columns and a version stamp: cheap enough to send whole every time,
         and it is the tab that says what wrote the file */
      { name: IO.setName(appId), rows: set, machine: true, whole: true },
    ];
  },

  /* ── one machinery tab per app, and it has to be ──

     These two used to be called _Data and _Settings flat, by every app. Six
     apps sync to one sheet, because the link is one setting for the whole
     suite — and a full push clears the tab before it writes. So BLOCK's push
     erased STATUS's rows, STATUS's next push erased BLOCK's, and _Settings,
     which is sent whole every single time, was whichever app pushed last.

     It looked like sync being flaky. It was two apps writing one address.
     A readable tab is named after the data, because food is food no matter
     who logs it. A machinery tab is the opposite: it is one app's save file,
     and naming it after that app is not a claim, it is the fact. */
  bagName(appId) { return '_Data ' + DOT + ' ' + appId; },
  setName(appId) { return '_Settings ' + DOT + ' ' + appId; },

  /** the flat names these tabs had before they were split per app, so a sheet
      or a workbook written by the old code still reads back */
  OLDBAG: ['_Data', '_data', 'Data'],
  OLDSET: ['_Settings', '_settings'],

  /** the rows out of one _Data grid. The banner line and anything somebody
      typed in by hand are not JSON and are skipped rather than guessed at. */
  bagRows(grid) {
    const out = [];
    (grid || []).forEach(line => {
      const cell = line && line[0];
      if (typeof cell !== 'string' || cell.charAt(0) !== '{') return;
      try { out.push(JSON.parse(cell)); } catch (e) {}
    });
    return out;
  },

  /** read those two tabs back into a restorable bag */
  bagFromTabs(tabs, appId) {
    const local = {};
    const pick = (names) => { for (let i = 0; i < names.length; i++) if (tabs[names[i]]) return tabs[names[i]]; return null; };
    const rows = IO.bagRows(pick((appId ? [IO.bagName(appId)] : []).concat(IO.OLDBAG)));
    const set = pick((appId ? [IO.setName(appId)] : []).concat(IO.OLDSET));
    (set || []).slice(1).forEach(line => {
      if (!line || !line[0] || line[0] === 'Setting') return;
      local[String(line[0])] = line[1] == null ? '' : String(line[1]);
    });
    return { kind: 'motherbase-backup', v: 1, rows: rows, local: local };
  },

  /** everything one app owns, in the shape restore() expects. One builder, so
      the backup file and the spreadsheet's Data tab cannot drift apart. */
  bagFor(appId) {
    const S = IO.spec(appId), R = g.Rec;
    const types = S.types.concat(['tick', 'activity']);
    const rows = R.export(types).concat(R.export(['setting']).filter(r => String(r.key).indexOf(appId + '.') === 0));
    return {
      kind: 'motherbase-backup', v: 1, version: VERSION, app: appId, at: new Date().toISOString(),
      types: types, rows: rows,
      local: IO.localBits(appId),
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
    let painted = false;
    if (bag.local) Object.keys(bag.local).forEach(k => {
      if (bag.local[k] == null) return;
      try { localStorage.setItem(k, bag.local[k]); painted = painted || k.indexOf('suite_') === 0; } catch (e) {}
    });
    /* A theme that is restored but not repainted looks exactly like a theme
       that was not restored. */
    if (painted && g.Skins && g.Skins.restore) { try { g.Skins.restore(); } catch (e) {} }
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
            /* The machinery tabs carry the app's name now — _Data · status —
               so match on the front of the name rather than on the whole of
               it, and keep reading the flat names a workbook saved by older
               code still uses. */
            const tabs = {};
            let dataName = null, setName = null;
            Object.keys(wb.Sheets).forEach(nm => {
              const n = String(nm);
              if (!dataName && (n.indexOf('_Data') === 0 || n === 'Data')) dataName = nm;
              if (!setName && n.indexOf('_Settings') === 0) setName = nm;
            });
            if (dataName) tabs['_Data'] = X.utils.sheet_to_json(wb.Sheets[dataName], { header: 1 });
            if (setName) tabs['_Settings'] = X.utils.sheet_to_json(wb.Sheets[setName], { header: 1 });
            if (!tabs._Data) throw new Error('that spreadsheet has no _Data tab, so there is nothing to restore from, and only exports made by this app carry one');
            const bag = IO.bagFromTabs(tabs);
            if (!bag.rows.length) throw new Error('the _Data tab had no rows in it');
            res(bag);
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

      /* The same two machinery tabs the sheet gets, from the same builder, so
         a workbook and the mirror always carry identical contents. */
      IO.bagTabs(appId).forEach(t => {
        const ws2 = X.utils.aoa_to_sheet(t.rows);
        ws2['!cols'] = [{ wch: 90 }, { wch: 60 }];
        X.utils.book_append_sheet(wb, ws2, t.name);
      });

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

  /* ── one tab, as plain CSV ──
     The spreadsheet export needs SheetJS off a CDN, so it is the one thing in
     here that stops working on a plane. A CSV needs nothing: it is built from
     the same rows, by the same builders, and every spreadsheet on earth opens
     it. One tab at a time, because handing a phone five files at once means
     five share sheets in a row. */
  exportCsv(appId) {
    const tabs = IO.workbook(appId).concat(IO.bagTabs(appId));
    if (!tabs.length) return toast('nothing to export yet');
    const stamp = g.Day.today();
    const pick = t => save('motherbase-' + appId + '-' + t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + stamp + '.csv',
      csv(IO.rect(t.rows)), 'text/csv;charset=utf-8')
      .then(done => toast(done ? '<b>' + esc(t.name) + '</b> exported' : 'nothing saved', done ? null : { bad: true }));
    if (!g.UI || !g.UI.menu) return pick(tabs[0]);
    g.UI.menu(0, 0, tabs.map(t => ({
      label: t.name, note: Math.max(0, t.rows.length - 1) + ' rows', icon: '▤', fn: () => pick(t),
    })), { title: 'EXPORT WHICH' });
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

    opt('▦', 'Export a spreadsheet', 'Every tab, readable, and it restores too.', () => IO.export(appId));
    opt('▤', 'Export one tab as CSV', 'Works with no internet. Pick which.', () => IO.exportCsv(appId));

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
const watching = Object.create(null);
/* `pushed` is the line between what the sheet has and what it has not: rows
   written after it are the next push, and it only moves when the sheet
   confirms. A failed sync therefore needs no queue and no retry list — the
   boundary simply does not move, and the same rows go again next time.
   `full` is when the derived tabs (Calendar, Log) were last rebuilt, `seen`
   is the last edit we have read out of each tab, and `sheetV` is which
   version of the script the sheet is running. */
let mcfg = { url: '', on: 0, at: null, pushed: {}, seen: {}, full: {}, sig: {}, sheetV: 0 };
const mread = () => { try { Object.assign(mcfg, JSON.parse(localStorage.getItem(MKEY) || '{}')); } catch (e) {} };
mread();

/* The per-app boundaries, which every frame writes and none of them owns. */
const MPARTS = ['pushed', 'seen', 'full', 'sig'];
const msave = () => {
  try {
    /* Each app runs in its own frame with its own copy of this object, and
       they all write it back. Writing the whole thing blind means the last
       frame to finish erases what the others recorded - the blob problem in
       miniature, in the one file that exists to stop blobs. So the boundaries
       are merged with whatever is on disk, ours winning only for the app we
       actually pushed. A boundary that goes backwards costs a resend, which
       is safe; one that gets erased costs a tab that never goes up. */
    let disk = {};
    try { disk = JSON.parse(localStorage.getItem(MKEY) || '{}'); } catch (e) {}
    MPARTS.forEach(k => { mcfg[k] = Object.assign({}, disk[k] || {}, mcfg[k] || {}); });
    localStorage.setItem(MKEY, JSON.stringify(mcfg));
  } catch (e) {}
};

/* Another frame pasted the link, or finished a push. localStorage tells every
   OTHER document on the origin, which is exactly the case that was broken:
   the home screen keeps each app alive in a frame, so an app opened before
   the link was pasted read an empty config once and never looked again. It
   answered "no link" to every sync for the rest of the session. */
g.addEventListener('storage', e => { if (e.key === MKEY) mread(); });

/* The link used to live in a `setting` row belonging to one app, because the
   mirror belonged to one app. Moving it to the suite moved where it is kept,
   which strands whatever was already pasted — the app looks configured and
   has no link. Carry it across once, the first time an app asks. */
function adoptOldLink(appId) {
  if (mcfg.url || !g.Rec) return;
  try {
    const old = g.Rec.setting(appId, 'mirror');
    if (old && old.url) { mcfg.url = old.url; if (old.on) mcfg.on = old.on; msave(); }
  } catch (e) {}
}

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
  /** an app asking for the settings is the first chance to carry an old link
      across, so do it here too */
  adopt(appId) { adoptOldLink(appId); return Mirror.settings; },
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
  tabs(appId, opts) {
    opts = opts || {};
    const since = opts.since || '';
    const edit = IO.tables(appId, since).map(t => ({ name: t.name, rows: t.rows, editable: true, key: t.key }));
    const taken = {};
    edit.forEach(t => { taken[t.name.toLowerCase()] = 1; });

    /* The derived tabs — a calendar with the days across the top, a log of
       every tick — are worked out from the rows rather than stored, so there
       is no such thing as the three of them that changed. They are rebuilt
       whole or not at all, which is why a background sync leaves them alone
       and the daily one puts them right. */
    const read = [];
    if (opts.views) IO.sheets(appId).forEach(s => {
      const name = IO.tabName(appId, s.name);
      /* a plural read-out and a singular table are the same thing */
      const key = name.toLowerCase().replace(/s$/, '');
      if (taken[name.toLowerCase()] || taken[key] || taken[key + 's']) return;
      taken[name.toLowerCase()] = 1;
      read.push({ name: name, rows: s.rows, editable: false, whole: true });
    });
    /* the machinery last, so the sheet is a complete save file rather than a
       pretty view of one */
    const all = read.concat(edit).concat(IO.bagTabs(appId, since))
      .map(t => Object.assign({}, t, { rows: IO.rect(t.rows) }));
    if (!since) return all;
    /* a tab whose only line is its header changed nothing, and sending it says
       nothing at exactly the cost of saying something */
    return all.filter(t => t.whole || t.rows.length > ((t.head || t.key === 0) ? 1 : 0));
  },

  /* ── 0: what does the sheet hold? ──

     One small answer: how many lines are in each tab and when each was last
     typed in. Worth its own trip because it replaces a much bigger one — the
     pull used to download every tab in full in order to discover you had not
     touched the sheet since Tuesday. */
  index(appId) {
    adoptOldLink(appId);
    if (!mcfg.url) return Promise.resolve({ v: 0, skipped: 'no link' });
    return jsonp(mcfg.url, { app: appId, want: 'index' }, 12000).then(r => {
      if (r && r.index) {
        mcfg.sheetV = r.v || 2; msave();
        return { v: mcfg.sheetV, index: r.index, pushedAt: r.pushedAt || {} };
      }
      /* A deployment running the older script has never heard of an index and
         answers with the whole spreadsheet instead. Not wasted: that is what
         the pull was about to ask for, so it is carried through rather than
         fetched a second time. */
      if (r && r.tabs) { mcfg.sheetV = 1; msave(); return { v: 1, dump: r.tabs }; }
      return { v: 0 };
    }).catch(() => ({ v: 0, failed: 1 }));
  },

  /* ── 1 and 2: pull and resolve ── */
  pull(appId, pre) {
    adoptOldLink(appId);
    if (!mcfg.url) return Promise.resolve({ skipped: 'no link' });
    const S = IO.spec(appId);
    const apply = tabs => {
      const out = { changed: 0, added: 0, clashes: 0 };
      (S.tables || []).forEach(t => {
        /* the old prefixed name too: anything typed into it before the
           rename is still real, and the pull runs before the push that
           retires it */
        const grid = tabs[IO.tabName(appId, t.name)] || tabs[t.name] || tabs[IO.oldPrefix(appId) + t.name];
        if (!grid) return;
        const diff = IO.readTable(appId, t.name, grid);
        out.changed += diff.changed.length;
        out.added += diff.added.length;
        out.clashes += diff.clashes.length;
        IO.applyTable(appId, diff);                 /* never deletes on a pull */
        diff.clashes.forEach(c => IO.logConflict(appId, c));
      });

      /* ── the rows no table describes ──

         A table is one line per thing with its fields in columns, so only a
         payload that is flat can have one. A weight is not flat: `ev` holds a
         list of timestamped entries, because "weigh once" and "log mood five
         times" are the same shape underneath. There is no honest column for a
         list, so `ev` has no table — and for a long time that meant it had no
         way home either. It went up in _Data, and _Data was never read back.

         That is the bug this fixes, and it was never only about weight. `day`,
         `acct`, `shot`, the ticks and the app's own settings are all in the
         same position: written to the sheet every push, and never once pulled
         down. One device logged, the other went on showing yesterday.

         Merged, not applied. Every row carries `updated_at` and the store's
         rule decides — the newer write wins, per row — which is the same rule
         a restore follows and the reason a stale sheet cannot overwrite work
         done since. Tombstones come through it too, so a reading deleted on
         the phone is deleted on the laptop instead of quietly returning. */
      if (g.Rec) {
        /* Ours first, then the flat _Data an older sheet still holds — rows
           written before the tabs were split per app are real rows, and one
           merge salvages them instead of stranding them. */
        let rows = [];
        [IO.bagName(appId)].concat(IO.OLDBAG).forEach(n => {
          if (tabs[n]) rows = rows.concat(IO.bagRows(tabs[n]));
        });
        if (rows.length) out.merged = g.Rec.merge(rows);
      }
      return out;
    };

    /* an older sheet already handed us everything it has */
    if (pre && pre.dump) return Promise.resolve(apply(pre.dump));

    if (pre && pre.index) {
      const want = Object.keys(pre.index).filter(n => {
        const at = pre.index[n] && pre.index[n].edited;
        return at && at > (mcfg.seen[appId + '|' + n] || '');
      });
      /* ── asking for _Data, which nobody types in ──

         `edited` is stamped by onEdit, and onEdit only fires when a human
         types into a tab with an id column. _Data is neither: the script
         writes it, and its first cell is a warning rather than a header. So
         its stamp is forever empty, the filter above always skips it, and the
         one tab holding every row without a table was the one tab never asked
         for.

         The push receipt says it instead. `mb.at.<app>` is stamped by
         whichever device last pushed, so a stamp that is neither the one we
         last read nor the one we last wrote means the OTHER device has been
         busy and _Data is worth the download. Our own push is excluded on
         purpose: pulling back what we just sent is a large answer to a
         question we already knew. */
      const stamp = (pre.pushedAt || {})[appId] || '';
      const bagKey = appId + '|_Data';
      const seenBag = mcfg.seen[bagKey] || '';
      /* Skipping our own push is only safe once we have read the tab at all.
         A device that has never read it does not know what else is in there:
         the laptop's first sync pushed, so the last stamp was its own, and on
         that reasoning it went on skipping the one tab holding the phone's
         entire history. Never read means always read. */
      const mineLast = !!seenBag && stamp === (mcfg.pushed[appId] || '');
      const bagTabsWanted = [];
      if (mcfg.sheetV >= 3 && stamp && stamp !== seenBag && !mineLast) {
        bagTabsWanted.push(IO.bagName(appId));
        /* a sheet still carrying the flat tab from before the split */
        if (pre.index['_Data']) bagTabsWanted.push('_Data');
        bagTabsWanted.forEach(n => { if (want.indexOf(n) < 0) want.push(n); });
      }

      /* Nobody has typed in the sheet since we last looked, so there is
         nothing to read. This is the ordinary case and it now costs nothing. */
      if (!want.length) return Promise.resolve({ skipped: 'nothing new', changed: 0, added: 0, clashes: 0 });
      return jsonp(mcfg.url, { app: appId, want: 'tables', only: want.join(',') }).then(reply => {
        if (!reply || !reply.tabs) return { skipped: 'nothing came back', failed: 1 };
        const out = apply(reply.tabs);
        /* moved only after the rows are in, so a failure half way through
           means we read the tab again rather than skip it forever */
        want.forEach(n => {
          if (bagTabsWanted.indexOf(n) > -1) mcfg.seen[bagKey] = stamp;
          else mcfg.seen[appId + '|' + n] = pre.index[n].edited;
        });
        msave();
        return out;
      });
    }

    return jsonp(mcfg.url, { app: appId, want: 'tables' }).then(reply => {
      if (!reply || !reply.tabs) return { skipped: 'nothing came back', failed: 1 };
      return apply(reply.tabs);
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
  push(appId, quiet, opts) {
    adoptOldLink(appId);
    opts = opts || {};
    if (!mcfg.url) {
      if (!quiet) toast('Paste the link first', { bad: true });
      return Promise.resolve({ state: 'failed', missing: 0, of: 0 });
    }
    /* Sending only what changed needs a sheet that can update one line in
       place. An older deployment rewrites whole tabs, so it gets whole tabs,
       and nothing breaks on the day between pasting the new script and
       deploying it. */
    const canDelta = mcfg.sheetV >= 2 && !!mcfg.pushed[appId];
    /* The derived tabs are rebuilt on a full push. Once a day is enough for a
       calendar view: it is a read-out, and a read-out being a few hours behind
       is visible, where a set going missing is not. */
    const stale = !mcfg.full[appId] || (Date.now() - (Date.parse(mcfg.full[appId]) || 0) > 20 * 3600 * 1000);
    const full = !!opts.full || !canDelta || stale;
    /* Take the boundary BEFORE reading the rows, never after. A set logged
       while this push is still in the air is newer than this stamp and goes
       next time; stamping afterwards would step straight over it. */
    const at = new Date().toISOString();

    /* ── sending everything, and clearing nothing ──

       A full push rewrites each tab: the sheet clears it and writes what it was
       handed. That is right when the device doing it holds the whole picture,
       and wrong when it does not. Open STATUS on the laptop for the first time
       and it holds almost nothing; a rewrite from there would take a fortnight
       of weights off the sheet in one move.

       A version 3 script protects _Data itself, because it is told to match
       that tab line by line. An older one has never heard of that, and the
       window between updating the app and redeploying the script is exactly
       when a second device gets set up.

       So the question is not how much to send — it is always everything — but
       whether this device has earned the right to clear. It has if the sheet
       can protect the save file itself, or if we have read the save file at
       least once and therefore hold what is in it. Otherwise the same rows go
       up matched on their ids instead, which adds and updates and never
       removes. Nothing is skipped either way, so the boundary stays honest. */
    const idx = (opts.index && opts.index.index) || {};
    const bagHas = ((idx[IO.bagName(appId)] || {}).rows) || 0;
    /* nobody has pushed since we did, so what is up there came from us */
    const oursAlready = !!mcfg.pushed[appId] &&
      ((opts.index && opts.index.pushedAt) || {})[appId] === mcfg.pushed[appId];
    const wholePicture = mcfg.sheetV >= 3 ||     /* the sheet protects the save file itself */
      !!mcfg.seen[appId + '|_Data'] ||           /* we have read it, so we hold what it holds */
      bagHas <= 1 ||                             /* there is nothing up there to lose */
      oursAlready;                               /* we are the one who put it there */
    const clearing = full && wholePicture;
    /* The derived read-outs — the calendar, the log, the daily totals — are
       rewritten whole by whoever sends them, so they belong to the same rule.
       A laptop with no meals on it should not blank the daily totals on its
       way past. */
    let tabs = Mirror.tabs(appId, { since: full ? '' : mcfg.pushed[appId], views: clearing });
    /* The settings tab is small and always built, which would make every idle
       sync a write of fourteen unchanged lines. Compare it with what was sent
       last time instead, and an afternoon where nothing was logged costs one
       question and no answer. The signature moves only when the sheet
       confirms, like every other boundary here. */
    let sig = null;
    if (!full) {
      const now = JSON.stringify((tabs.filter(t => t.name === '_Settings')[0] || {}).rows || []);
      if (now === mcfg.sig[appId]) tabs = tabs.filter(t => t.name !== '_Settings');
      else sig = now;
    }
    if (!tabs.length) return Promise.resolve({ state: 'clean', tabs: 0 });
    /* Tabs this app wrote under the old prefixed name. The sheet drops them
       after writing the new ones, because a rename that leaves the old tab
       behind is how you end up reading last month's data and believing it. */
    const body = JSON.stringify({ app: appId, at: at, mode: clearing ? 'full' : 'delta',
      tabs: tabs, retire: IO.oldPrefix(appId) });
    /* text/plain sidesteps the CORS preflight Apps Script cannot answer */
    const head = { 'Content-Type': 'text/plain;charset=utf-8' };

    /* Asking the sheet what it now holds, rather than believing the request
       that appeared to succeed. A POST to an Apps Script web app resolves even
       when the script threw — an old deployment reading body.sheets against a
       payload that carries body.tabs fails silently and answers 200 — so the
       only honest confirmation is the sheet saying it has the rows. */
    /* Three outcomes, not two, because "it did not fail" is not the same as
       "it worked" and reporting them as one is how an app tells you it synced
       while the sheet sits untouched.

         confirmed   the sheet says it has the rows
         unconfirmed the request went and the sheet would not answer
         failed      the sheet answered and does not have them

       The caller phrases from this rather than from whether a promise
       rejected. */
    const landed = () => jsonp(mcfg.url, { app: appId, want: 'index' }, 12000).then(r => {
      if (r && r.index) {
        mcfg.sheetV = r.v || 2;
        /* The sheet echoes back the stamp it was handed, so "did it land" is a
           comparison instead of a guess at row counts. Counting broke the
           moment we started sending deltas: twelve lines were never meant to
           make the tab twelve lines long. */
        if (((r.pushedAt || {})[appId] || '') === at) {
          mcfg.pushed[appId] = at;
          if (clearing) mcfg.full[appId] = at;
          if (sig) mcfg.sig[appId] = sig;
          mcfg.at = g.Day.today(); msave();
          return { state: 'confirmed', tabs: tabs.length, mode: clearing ? 'full' : 'delta' };
        }
        return { state: 'failed', missing: tabs.length, of: tabs.length };
      }
      /* an older sheet cannot echo anything, so fall back to counting rows */
      const want = {};
      tabs.forEach(t => { want[t.name] = t.rows.length; });
      return jsonp(mcfg.url, { app: appId, want: 'stat' }, 12000).then(r2 => {
        const stat = (r2 && r2.stat) || {};
        const missing = Object.keys(want).filter(n => !stat[n]);
        const short = Object.keys(want).filter(n => stat[n] && stat[n] < want[n]);
        if (missing.length) return { state: 'failed', missing: missing.length, of: tabs.length };
        mcfg.pushed[appId] = at; mcfg.full[appId] = at;
        mcfg.at = g.Day.today(); msave();
        return { state: 'confirmed', tabs: tabs.length, short: short.length };
      });
    }).catch(() => ({ state: 'unconfirmed', tabs: tabs.length }));

    const speak = res => {
      if (!quiet) {
        if (res.state === 'failed') {
          toast('The sheet did not take <b>' + res.missing + '</b> of ' + res.of +
            ' tabs, which usually means the deployment is running older code.', { bad: true, ms: 8000 });
        } else if (res.state === 'unconfirmed') {
          toast('Sent <b>' + res.tabs + '</b> tabs and the sheet would not confirm, so open it and check.',
            { bad: true, ms: 8000 });
        } else if (res.short) {
          toast('Synced, though <b>' + res.short + '</b> tabs came out shorter than sent.');
        } else {
          toast('Synced <b>' + res.tabs + '</b> tabs, and the sheet confirms it.');
        }
      }
      return res;
    };

    return fetch(mcfg.url, { method: 'POST', redirect: 'follow', headers: head, body: body })
      .then(() => landed()).then(speak)
      .catch(() => {
        /* An Apps Script web app answers a POST with a redirect, and reading
           across that redirect needs permission the browser will not always
           grant — Safari least of all. no-cors sends the same request and
           refuses to show us the answer, which is a fair trade when the answer
           was only ever "ok". The write still happens. */
        return fetch(mcfg.url, { method: 'POST', mode: 'no-cors', headers: head, body: body })
          .then(() => landed()).then(speak)
          .catch(() => {
            if (!quiet) toast(Mirror.why(), { bad: true, ms: 7000 });
            return { state: 'failed', missing: tabs.length, of: tabs.length };
          });
      });
  },

  /** Why a sync probably failed.

      "Could not reach the sheet" is true and useless. Every one of these has
      the same symptom and a different fix, and the link itself tells us which
      is likely — so say the likely one rather than making him guess. */
  why() {
    const u = mcfg.url || '';
    if (!u) return 'Paste the link first.';
    if (u.indexOf('script.google.com') < 0)
      return 'That link is not an Apps Script web app, so check you copied the one ending in /exec.';
    if (!/\/exec\s*$/.test(u))
      return 'That link should end in /exec, and a link ending in /dev only works while you are signed in.';
    return 'Could not reach the sheet, and the usual cause is pasting new code without deploying it again, so try Deploy, Manage deployments, the pencil, Version New version.';
  },

  /** the whole round trip, in the order that makes it safe */
  sync(appId, quiet, opts) {
    if (!mcfg.url) return Promise.resolve(false);
    if (!quiet) toast('Syncing…');
    let idx = null;
    return Mirror.index(appId)
      .then(pre => { idx = pre; return Mirror.pull(appId, pre).catch(() => ({ skipped: 'could not read', failed: 1 })); })
      .then(got => {
        /* ── read first, and if the read failed, do not write ──

           A push rewrites the readable tabs whole. Doing that straight after a
           read that failed means writing over a sheet we have just proved we
           cannot see — and the thinner the device, the more it erases. The
           boundary in `pushed` has not moved, so the same rows go up on the
           next attempt; there is nothing to queue and nothing to lose by
           waiting. */
        if (got && got.failed) {
          if (!quiet) toast('Could not read the sheet, so nothing was sent. ' + Mirror.why(), { bad: true, ms: 8000 });
          return false;
        }
        return Mirror.push(appId, true, Object.assign({ index: idx }, opts || {})).then(res => {
        const ok2 = res && (res.state === 'confirmed' || res.state === 'clean');
        if (!quiet) {
          if (res && res.state === 'clean') toast('Already up to date.');
          else if (!res || res.state === 'failed') toast(Mirror.why(), { bad: true, ms: 8000 });
          else if (res.state === 'unconfirmed') {
            toast('Sent <b>' + res.tabs + '</b> tabs and the sheet would not confirm, so open it and check.',
              { bad: true, ms: 8000 });
          } else if (got && got.clashes) toast('Synced, and <b>' + got.clashes + '</b> older sheet edits were kept aside.');
          else if (got && (got.changed || got.added || got.merged)) toast('Synced, with <b>' + IO.came(got) + '</b> changes from the sheet.');
          else toast('Synced <b>' + res.tabs + '</b> tabs, and the sheet confirms it.');
        }
        if (ok2 && res.state === 'confirmed' && g.Sfx) g.Sfx.play('complete', { level: 2 });
        return ok2;
        });
      });
  },

  /** ── keeping up without being asked ──

      Three moments, and none of them is a button. On open, because the sheet
      may have been typed in on a laptop since. Half a minute after the last
      thing he logs, because syncing on every tap would send a set, then the
      same set with its weight corrected, then again. And the moment the app
      goes out of view, which is the best one of the three: the work is done,
      the phone is about to be locked, and nobody is waiting on it.

      There is no retry queue, deliberately. What goes next time is decided by
      the boundary in `pushed`, and that only moves when the sheet confirms —
      so a sync that fails leaves the boundary where it was and the same rows
      go again at the next moment. A queue would be a second copy of a fact
      the store already holds. */
  watch(appId) {
    if (watching[appId]) return false;
    watching[appId] = 1;
    let dirty = 0, t = null;
    const run = () => {
      clearTimeout(t); t = null;
      if (!dirty || !mcfg.on || !mcfg.url) return;
      dirty = 0;
      Mirror.sync(appId, true).then(ok => { if (!ok) dirty = 1; }, () => { dirty = 1; });
    };
    if (g.Rec && g.Rec.on) g.Rec.on(() => { dirty = 1; clearTimeout(t); t = setTimeout(run, 30000); });

    /* Hidden means the phone is being locked or the tab is being left: push
       what is waiting before it goes. Visible means you have just come back to
       this device, which is exactly the moment the other one's work matters,
       so read first and then send. */
    if (g.document) g.document.addEventListener('visibilitychange', () => {
      if (g.document.visibilityState === 'hidden') { run(); return; }
      if (!mcfg.on || !mcfg.url) return;
      Mirror.onOpen(appId).then(() => { if (dirty) run(); });
    });

    /* A pull while you are actually looking at it, so a screen left open on
       the desk catches up on its own. Forty five seconds, Tom's number, which
       is about 1,900 calls a day against Apps Script's 20,000.

       Two guards, and the second one matters more than it looks. The home
       screen keeps every app it has opened in an iframe and hides the ones
       you are not on with display:none. Those documents still report
       themselves visible, so without the size check six hidden apps would
       each be polling the sheet behind a screen showing one. A display:none
       frame does no layout, so its body measures zero. */
    setInterval(() => {
      if (!mcfg.on || !mcfg.url) return;
      if (!g.document || g.document.visibilityState !== 'visible') return;
      const b = g.document.body;
      if (b && !b.getBoundingClientRect().width) return;
      Mirror.onOpen(appId);
    }, 45000);
    return true;
  },

  /** on open, quietly. Never blocks anything and never says anything unless
      it actually brought something back. */
  onOpen(appId) {
    if (!mcfg.url || !mcfg.on) return Promise.resolve(false);
    return Mirror.index(appId).then(pre => Mirror.pull(appId, pre)).then(got => {
      if (got && (got.changed || got.added || got.merged)) {
        toast('<b>' + IO.came(got) + '</b> changes came in from the sheet.');
        if (g.Rec) g.Rec.reload && g.Rec.reload();
      }
      return true;
    }).catch(() => false);
  },

  /** The Apps Script to paste. Generated here so it cannot drift from the
      protocol above. */
  script() {
    return [
      '/* Motherbase sheet bridge, version 3. Paste into Extensions > Apps Script,',
      '   then Deploy > New deployment > Web app, execute as me, access anyone.',
      '',
      '   Version 2 can update one line in place instead of rewriting a whole tab.',
      '   That is what lets the phone send the eight sets you did this morning',
      '   rather than all twelve thousand of them, every time.',
      '',
      '   Version 3 hands back a tab the app asks for by name. Everything with no',
      '   readable tab of its own, such as a weight, a mood, or the note on a day,',
      '   lives in the _Data tab, and that tab has a warning across the top rather',
      '   than a header, so the old rule refused to send it. It went up and never',
      '   came back down. This is the half that lets the other device read it.',
      '',
      '   It also never clears that tab, so opening the app on a second device',
      '   cannot empty the sheet. */',
      '',
      'var MB_V = 3;',
      '',
      'function mbProps() { return PropertiesService.getScriptProperties(); }',
      '',
      'function mbReply(e, obj) {',
      '  var body = JSON.stringify(obj);',
      '  var cb = (e && e.parameter) ? e.parameter.callback : null;',
      '  if (cb) return ContentService.createTextOutput(cb + "(" + body + ")")',
      '    .setMimeType(ContentService.MimeType.JAVASCRIPT);',
      '  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);',
      '}',
      '',
      '/* setValues writes a rectangle and throws on anything else, so square it off */',
      'function mbSquare(rows) {',
      '  var w = 0;',
      '  rows.forEach(function (r) { if (r && r.length > w) w = r.length; });',
      '  return { w: w, grid: rows.map(function (r) {',
      '    var line = [];',
      '    for (var i = 0; i < w; i++) {',
      '      var v = r ? r[i] : "";',
      '      if (v === null) v = "";',
      '      if (v === undefined) v = "";',
      '      line.push(v);',
      '    }',
      '    return line;',
      '  }) };',
      '}',
      '',
      'function mbWriteTab(ss, t, mode) {',
      '  var rows = t.rows;',
      '  if (!rows) rows = [];',
      '  if (!rows.length) return;',
      '  var sq = mbSquare(rows);',
      '  var grid = sq.grid, w = sq.w;',
      '  var sh = ss.getSheetByName(t.name);',
      '  var whole = false;',
      '  if (mode !== "delta") whole = true;',
      '  if (t.whole) whole = true;',
      '  if (t.key === null) whole = true;',
      '  if (t.key === undefined) whole = true;',
      '',
      '  /* A tab nobody has seen, or one somebody has emptied, gets everything we',
      '     have rather than a handful of lines with no header above them. */',
      '  if (!sh) { sh = ss.insertSheet(t.name); whole = true; }',
      '  if (sh.getLastRow() < 1) whole = true;',
      '',
      '  /* A tab that must never lose a line it was not sent. _Data is the save',
      '     file, and a device that has only just been opened does not have the',
      '     whole of it to send, so its lines are matched on the id and updated',
      '     in place, even when everything else is being rewritten. */',
      '  if (t.upsert && sh.getLastRow() > 0) whole = false;',
      '',
      '  if (whole) {',
      '    sh.clear();',
      '    sh.getRange(1, 1, grid.length, w).setValues(grid);',
      '    sh.setFrozenRows(1);',
      '    if (t.editable) sh.getRange(1, 1, 1, w).setFontWeight("bold");',
      '    return;',
      '  }',
      '',
      '  /* Match on the key column, update what is already there, append the rest.',
      '     One read of that column and one write per changed line, so the cost is',
      '     the size of the change and not the size of the tab. */',
      '  var last = sh.getLastRow();',
      '  var keyCol = t.key + 1;',
      '  var have = {};',
      '  if (last > 1) {',
      '    var keys = sh.getRange(2, keyCol, last - 1, 1).getValues();',
      '    for (var i = 0; i < keys.length; i++) have[String(keys[i][0])] = i + 2;',
      '  }',
      '  var append = [];',
      '  var from = 0;                       /* skip the header line we were sent */',
      '  if (t.editable) from = 1;',
      '  if (t.head) from = 1;',
      '  for (var j = from; j < grid.length; j++) {',
      '    var line = grid[j];',
      '    var at = have[String(line[t.key])];',
      '    if (at) sh.getRange(at, 1, 1, w).setValues([line]);',
      '    else append.push(line);',
      '  }',
      '  if (append.length) sh.getRange(last + 1, 1, append.length, w).setValues(append);',
      '}',
      '',
      'function doPost(e) {',
      '  var body = JSON.parse(e.postData.contents);',
      '  var ss = SpreadsheetApp.getActiveSpreadsheet();',
      '  var tabs = body.tabs;',
      '  if (!tabs) tabs = body.sheets;',
      '  if (!tabs) tabs = [];',
      '  var mode = body.mode;',
      '  if (!mode) mode = "full";',
      '  var wrote = [];',
      '  var failed = [];',
      '  tabs.forEach(function (t) {',
      '    /* One bad tab must not take the rest with it. Without this the whole',
      '       write is abandoned at the first problem and the sheet is left exactly',
      '       as it was, which looks identical to never having been called. */',
      '    try { mbWriteTab(ss, t, mode); wrote.push(t.name); }',
      '    catch (err) { failed.push(t.name + ": " + err); }',
      '  });',
      '',
      '  /* Tabs written under an older name. Dropped only after the new ones exist,',
      '     so nothing is ever deleted before its replacement is there. */',
      '  if (body.retire) {',
      '    ss.getSheets().forEach(function (sh) {',
      '      try {',
      '        if (sh.getName().indexOf(body.retire) === 0 && ss.getSheets().length > 1) ss.deleteSheet(sh);',
      '      } catch (err) {}',
      '    });',
      '  }',
      '',
      '  /* The receipt. The app asks for this back and compares it with what it',
      '     sent, which is how it knows the write landed. Counting rows cannot say',
      '     that any more: a delta of twelve lines was never meant to leave the tab',
      '     twelve lines long. */',
      '  if (!failed.length && body.app && body.at) mbProps().setProperty("mb.at." + body.app, body.at);',
      '',
      '  return ContentService.createTextOutput(JSON.stringify({ ok: failed.length === 0, v: MB_V, wrote: wrote, failed: failed }))',
      '    .setMimeType(ContentService.MimeType.JSON);',
      '}',
      '',
      '/* The pull. Answers as JavaScript so a script tag can read it, because a web',
      '   app cannot reliably answer a cross-origin fetch. */',
      'function doGet(e) {',
      '  var ss = SpreadsheetApp.getActiveSpreadsheet();',
      '  var want = (e && e.parameter) ? e.parameter.want : null;',
      '',
      '  /* What is in here, in one small answer: how many lines each tab holds and',
      '     when it was last typed in. The app asks this before every sync, and most',
      '     of the time the answer means it downloads nothing at all. */',
      '  if (want === "index") {',
      '    var all = mbProps().getProperties();',
      '    var index = {}, pushedAt = {};',
      '    ss.getSheets().forEach(function (sh) {',
      '      var n = sh.getName();',
      '      var ed = all["mb.edited." + n];',
      '      if (!ed) ed = "";',
      '      index[n] = { rows: sh.getLastRow(), edited: ed };',
      '    });',
      '    Object.keys(all).forEach(function (k) {',
      '      if (k.indexOf("mb.at.") === 0) pushedAt[k.substring(6)] = all[k];',
      '    });',
      '    return mbReply(e, { ok: true, v: MB_V, index: index, pushedAt: pushedAt });',
      '  }',
      '',
      '  /* A receipt in the old shape, kept so an app running older code than this',
      '     sheet still gets an answer it understands. */',
      '  if (want === "stat") {',
      '    var stat = {};',
      '    ss.getSheets().forEach(function (sh) { stat[sh.getName()] = sh.getLastRow(); });',
      '    return mbReply(e, { ok: true, v: MB_V, stat: stat });',
      '  }',
      '',
      '  /* Only the tabs asked for, when the app names them. It knows which ones',
      '     were typed in from the index, so there is no reason to send the rest. */',
      '  var only = null;',
      '  var tz = ss.getSpreadsheetTimeZone();',
      '  if (e && e.parameter && e.parameter.only) only = String(e.parameter.only).split(",");',
      '  var out = {};',
      '  ss.getSheets().forEach(function (sh) {',
      '    var name = sh.getName();',
      '    if (only && only.indexOf(name) < 0) return;',
      '    var vals = sh.getDataRange().getValues();',
      '    if (!vals.length) return;',
      '    /* Only the tabs with an id column can be read back: a scratch tab',
      '       somebody made by hand is not data. A tab the app named outright is',
      '       different: it asked for that one, and _Data (every row that has no',
      '       table, which is where a weight and a mood live) opens with a warning',
      '       rather than a header, so the guard alone would never let it home. */',
      '    if (String(vals[0][0]).toLowerCase() !== "id" && !(only && only.indexOf(name) > -1)) return;',
      '    out[name] = vals.map(function (row) {',
      '      /* Column 1 is the row date and belongs to the calendar, not the',
      '         clock: ISO would push the sheet local midnight back into the',
      '         previous day in UTC and the app would file it a day early.',
      '         Every other Date here is a real instant and stays ISO. */',
      '      return row.map(function (c, i) {',
      '        if (!(c instanceof Date)) return c;',
      '        return i === 1 ? Utilities.formatDate(c, tz, "yyyy-MM-dd") : c.toISOString();',
      '      });',
      '    });',
      '  });',
      '  return mbReply(e, { ok: true, v: MB_V, tabs: out });',
      '}',
      '',
      '/* Stamps the row you just edited, so the app can tell whether the sheet or',
      '   the phone changed it last. Without a time on it the phone would win every',
      '   disagreement by default.',
      '',
      '   It also notes the tab against the clock, which is what the index reports.',
      '   That is the whole change check: the app compares one string instead of',
      '   downloading a tab to find out that nobody touched it.',
      '',
      '   Named onEdit on purpose: Google runs a function with that exact name by',
      '   itself whenever somebody types in the sheet. There is nothing to set up and',
      '   no permission to grant. It also does not fire when this script writes,',
      '   which is what we want: a push from the phone must not mark its own rows as',
      '   edited in the sheet. */',
      'function onEdit(e) {',
      '  var sh = e.range.getSheet();',
      '  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];',
      '  if (String(head[0]).toLowerCase() !== "id") return;',
      '  var at = head.indexOf("edited");',
      '  var by = head.indexOf("by");',
      '  if (at < 0) return;',
      '  var row = e.range.getRow();',
      '  if (row < 2) return;',
      '  var now = new Date().toISOString();',
      '  sh.getRange(row, at + 1).setValue(now);',
      '  if (by > -1) sh.getRange(row, by + 1).setValue("sheet");',
      '  mbProps().setProperty("mb.edited." + sh.getName(), now);',
      '}',
    ].join('\n');
  },
};
IO.mirror = Mirror;

/* ── the home screen asking an app to sync itself ──

   Motherbase cannot sync TRAIN's tabs on TRAIN's behalf. Which tabs exist,
   and how a row flattens into a line somebody can type into, live in the
   registration inside TRAIN's own page — the home screen has never run it and
   has no way to know. So the home screen asks, and each app answers for
   itself. The link is already suite-wide, so this is only about who does the
   work, not about pasting anything twice.

   Quiet by design. Six apps each announcing success is six snackbars for one
   button press, so the answers go back as data and the asker says it once. */
g.addEventListener('message', e => {
  const m = e.data;
  if (!m || m.mb !== 2) return;

  /* "are you on the shared drawer?" — answered at once, before any syncing.
     Half the suite still keeps its own storage and loads none of this, so it
     never answers, and the asker must not sit waiting on apps that cannot
     reply. Asking is also the only honest way to know: the day BLOCK moves
     onto the store it starts answering, and nothing here has to be edited to
     notice. */
  if (m.ping) {
    try { e.source && e.source.postMessage({ mb: 2, pong: 1, apps: Object.keys(apps) }, '*'); } catch (err) {}
    return;
  }
  if (!m.sync) return;
  const back = out => { try { e.source && e.source.postMessage(Object.assign({ mb: 2, synced: 1 }, out), '*'); } catch (err) {} };
  const ids = Object.keys(apps);
  if (!ids.length) return back({ app: null, ok: false, why: 'no app is registered in this frame' });
  if (!Mirror.ready()) return back({ app: ids[0], ok: false, why: Mirror.why() });
  /* The button means "put the sheet right", so it sends everything including
     the derived views. The automatic ones send only what changed. */
  Promise.all(ids.map(id => Mirror.sync(id, true, { full: !!m.full }).then(ok => !!ok, () => false)))
    .then(res => back({ app: ids.join(','), ok: res.every(Boolean), why: res.every(Boolean) ? '' : Mirror.why() }));
});

g.IO = IO;
})(window);
