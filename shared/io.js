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

function save(name, data, mime) {
  const a = el('a');
  a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type: mime || 'text/plain;charset=utf-8' }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
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
    apps[spec.app] = Object.assign({ types: [], sheets: null, name: spec.app }, spec);
    return IO;
  },
  spec(appId) { return apps[appId] || { app: appId, name: appId, types: [] }; },

  /* ── backup ── */
  backup(appId) {
    const S = IO.spec(appId), R = g.Rec;
    if (!R) return toast('no store loaded', { bad: true });
    const types = S.types.concat(['tick', 'activity']);
    const rows = R.export(types).concat(R.export(['setting']).filter(r => String(r.key).indexOf(appId + '.') === 0));
    const bag = {
      kind: 'motherbase-backup', v: 1, app: appId, at: new Date().toISOString(),
      types: types, rows: rows,
      local: S.localKeys ? S.localKeys().reduce((o, k) => { o[k] = localStorage.getItem(k); return o; }, {}) : undefined,
    };
    save('motherbase-' + appId + '-' + g.Day.today() + '.json', JSON.stringify(bag), 'application/json');
    try { localStorage.setItem(BK(appId), g.Day.today()); } catch (e) {}
    toast('<b>' + rows.length + '</b> rows backed up');
    if (g.Sfx) g.Sfx.play('done');
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
    const i = el('input'); i.type = 'file'; i.accept = 'application/json';
    i.onchange = () => { if (i.files[0]) onFile(i.files[0]); };
    i.click();
  },

  /* ── the readable export ── */
  sheets(appId, days) {
    const S = IO.spec(appId);
    return tickSheets(days).concat(S.sheets ? S.sheets() : []);
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
      sheets.forEach(s => {
        const ws = X.utils.aoa_to_sheet(s.rows);
        if (s.widths) ws['!cols'] = s.widths.map(w => ({ wch: w }));
        X.utils.book_append_sheet(wb, ws, s.name.slice(0, 28));
      });
      X.writeFile(wb, 'motherbase-' + appId + '-' + stamp + '.xlsx');
      toast('spreadsheet exported — <b>' + sheets.length + ' tabs</b>');
      if (g.Sfx) g.Sfx.play('complete', { level: 2 });
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
      'Everything lives in this browser, on this machine. ' +
      (n === null ? '<b style="color:var(--warn,#ffb347)">You have never backed this app up.</b>'
        : n === 0 ? 'Last backup: <b>today</b>.' : 'Last backup: <b>' + n + ' day' + (n === 1 ? '' : 's') + ' ago</b>.') +
      ' <span style="opacity:.7">' + stats.live + ' rows · ' + stats.kb + 'kb</span>'));

    const opt = (ic, t, d, fn, cls) => {
      const b = el('button', 'mb-opt mb-press flat' + (cls ? ' ' + cls : ''));
      b.innerHTML = '<span class="ic">' + ic + '</span><span class="t"><b>' + t + '</b><span>' + d + '</span></span>';
      b.onclick = fn; pane.appendChild(b); return b;
    };

    pane.appendChild(el('div', 'mb-group', 'SAFETY NET'));
    opt('⭳', 'Back up ' + esc(IO.spec(appId).name), 'One file with this app’s data. The one that restores.', () => IO.backup(appId));
    opt('⭱', 'Restore from a backup', 'Brings back anything missing. Newer data on this device is never overwritten.',
      () => IO.pick(f => IO.read(f).then(bag => {
        const c = IO.restore(bag, 'merge');
        toast(c ? '<b>' + c + '</b> rows restored' : 'nothing to restore — this device is already up to date');
      }).catch(e => toast(esc(e.message), { bad: true }))));
    opt('⟲', 'Rewind to a backup', 'Replaces this app’s data with the file, discarding anything newer.',
      () => IO.pick(f => IO.read(f).then(bag =>
        (g.UI ? g.UI.confirm('Rewind to the backup from ' + (bag.at || '?') + '?', 'Anything newer than the file is discarded.', { yes: 'REWIND', danger: true }) : Promise.resolve(confirm('Rewind?')))
          .then(ok => { if (!ok) return; const c = IO.restore(bag, 'replace'); toast('<b>' + c + '</b> rows restored'); })
      ).catch(e => toast(esc(e.message), { bad: true }))), 'bad');

    pane.appendChild(el('div', 'mb-group', 'READABLE EXPORT — NOT A BACKUP'));
    opt('▦', 'Export as a spreadsheet', 'Opens straight in Google Sheets or Excel. A calendar tab you can read, a log tab you can pivot.',
      () => IO.export(appId));

    pane.appendChild(el('div', 'mb-group', 'DANGER'));
    opt('⌫', 'Delete ' + esc(IO.spec(appId).name) + '’s data', 'Only this app’s own data. Ticks and activities are shared and stay.',
      () => (g.UI ? g.UI.confirm('Delete all of ' + IO.spec(appId).name + '’s data?', 'Back up first. This cannot be undone.', { yes: 'DELETE', danger: true }) : Promise.resolve(confirm('Delete?')))
        .then(ok => { if (!ok) return; const c = g.Rec.clear(IO.spec(appId).types); toast('<b>' + c + '</b> rows deleted'); }), 'bad');
  },
};

g.IO = IO;
})(window);
