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
    apps[spec.app] = Object.assign({ types: [], sheets: null, name: spec.app }, spec);
    return IO;
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

g.IO = IO;
})(window);
