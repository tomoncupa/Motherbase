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
   and quietly blanking it would be worse than showing it raw.

   A FOURTH element lists the names the column used to have. Columns are matched
   to the sheet by their heading, so renaming one would otherwise leave every
   sheet already written unable to find it. Say what it was called and both
   spellings land in the same field. */
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

  /* Which version of the Apps Script this build writes. The sheet reports its
     own back as `sheetV` when it answers, so the two can be compared and a
     sheet running an old script can say so instead of failing in ways nobody
     can place. */
  SCRIPT_V: 4,

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

  /* ══════════════ PHOTOGRAPHING A COMPONENT ══════════════

     Turns a live element into a see-through PNG, so an app can hand somebody a
     picture of a real screen rather than a second drawing of one that has to
     be kept in step. STATUS shares its Today card with it. Anything with a
     card worth showing can use it: a session in TRAIN, a map in ARC.

     THE ONE THING THAT MATTERS, and it cost three rounds of fixes in STATUS to
     find. An SVG has no page. A component lifted out of one loses everything
     the page was HANDING DOWN to it, and these apps hand down nearly all of
     their appearance - the text colour, the typeface and all ninety-odd theme
     tokens live on the page, not on the component. Carrying a few of those
     over by hand is how STATUS's calories came out black and then its labels
     came out serif: one cause, fixed one symptom at a time.

     So the wrapper inside the picture BECOMES the page. Not a chosen list: the
     whole computed style of the real body, every property, read at the moment
     the picture is taken. Whatever the page was handing down, the wrapper
     hands down, and nothing has to be remembered. It costs about 12KB. Then it
     is flattened back into a plain empty box, because it is standing in for
     the page's inheritance and not for its appearance - the picture has no
     background, which is the whole point of an overlay.

     The element has to be laid out before it can be measured. Pass one that is
     already on screen, or pass a loose one with `width` and it is laid out off
     screen at that width and tidied up afterwards.

       IO.shot(node, {
         w, h    the picture, default 1080 x 1920
         fill    how much of the width the component takes, default .88
         anchor  where its middle sits, top to bottom, default .46
         width   CSS width to lay a loose node out at, default 390
         scrim   paint a soft dark gradient behind it, so the picture reads on
                 a bright photograph as well as a dark one
         before  run once it is laid out and the fonts have arrived, for
                 anything that has to measure before the picture is taken
       })  ->  Promise of a data URL
  */
  shot(node, opts) {
    opts = opts || {};
    const W = opts.w || 1080, H = opts.h || 1920;
    const fill = opts.fill == null ? 0.88 : opts.fill;
    const anchor = opts.anchor == null ? 0.46 : opts.anchor;

    let stage = null;
    if (!node.isConnected) {
      stage = el('div');
      stage.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;width:' +
        (opts.width || 390) + 'px';
      stage.appendChild(node);
      document.body.appendChild(stage);
    }
    const done = () => { if (stage) stage.remove(); };

    /* A webfont that has not arrived renders as a fallback inside the SVG too,
       so the picture would be in a different face from the screen. */
    const fonts = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();

    return fonts.then(() => {
      if (opts.before) opts.before(node);

      const box = node.getBoundingClientRect();
      const cw = Math.max(1, Math.ceil(box.width)), ch = Math.max(1, Math.ceil(box.height));

      /* Where the element was parked is not part of what it looks like. A
         caller who positioned it themselves - fixed at left:-9999px, say, the
         usual way to lay something out off screen - would otherwise have that
         carried into the picture, and the picture would come back empty with
         nothing to see wrong in it. Caught by the check in _smoke.html the
         first time it ran, which is the point of that check.

         Measured from the real one, drawn from a copy with its position let
         go. Margin goes with it: a bounding box does not include margin, so
         leaving it on would shift the drawing off the size just measured. */
      const flat = n => {
        const c = n.cloneNode(true);
        c.style.position = 'static';
        c.style.inset = 'auto';
        c.style.left = c.style.top = c.style.right = c.style.bottom = 'auto';
        c.style.margin = '0';
        c.style.float = 'none';
        return c;
      };
      /* Scaled up whole rather than blown up afterwards: everything inside
         renders at the final size, so the type stays sharp. */
      const scale = (W * fill) / cw;
      const sw = cw * scale, sh = ch * scale;
      const ox = (W - sw) / 2;
      const oy = Math.max(0, H * anchor - sh / 2);

      /* ── the page, stood in for ── */
      const bcs = getComputedStyle(document.body);
      let stand = '';
      for (let i = 0; i < bcs.length; i++) {
        const prop = bcs[i];
        stand += prop + ':' + bcs.getPropertyValue(prop) + ';';
      }
      stand += 'display:block;position:static;inset:auto;margin:0;padding:0;border:0;' +
        'background:none;box-shadow:none;filter:none;transform:none;opacity:1;' +
        'overflow:visible;width:' + Math.ceil(sw) + 'px;height:auto;' +
        'min-width:0;max-width:none;min-height:0;max-height:none;';

      /* The class rules the component is drawn with, and the theme's own
         stylesheet over them. Everything handed down is on the wrapper, so
         this is only here for what a rule states outright. */
      const sheets = Array.prototype.map.call(document.querySelectorAll('style'),
        n => n.textContent).join(String.fromCharCode(10));

      /* ── the scrim ──
         A photo can be any brightness, and a see-through card on a white sky
         is unreadable. The general answer is not a light mode and a dark mode
         to choose between - it is to put your own darkness underneath, which
         is what every app that overlays text on a photo does.

         Softest at the top, deepest below the content, so it reads as the
         picture getting darker towards the bottom rather than as a box. */
      let scrim = '';
      if (opts.scrim) {
        const mid = Math.max(0, Math.min(1, (oy + sh / 2) / H));
        scrim =
          '<defs><linearGradient id="mbscrim" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#000" stop-opacity="0"/>' +
          '<stop offset="' + Math.max(0.01, mid - 0.34).toFixed(3) + '" stop-color="#000" stop-opacity="0.10"/>' +
          '<stop offset="' + mid.toFixed(3) + '" stop-color="#000" stop-opacity="0.42"/>' +
          '<stop offset="1" stop-color="#000" stop-opacity="0.72"/>' +
          '</linearGradient></defs>' +
          '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#mbscrim)"/>';
      }

      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">' +
        scrim +
        '<foreignObject x="' + ox + '" y="' + oy + '" width="' + sw + '" height="' + sh + '">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" style="' + esc(stand) + '">' +
        '<style>' + sheets + '</style>' +
        '<div style="width:' + cw + 'px;transform:scale(' + scale + ');transform-origin:top left">' +
        new XMLSerializer().serializeToString(flat(node)) + '</div></div></foreignObject></svg>';

      return new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const cv = el('canvas');
          cv.width = W; cv.height = H;
          cv.getContext('2d').drawImage(img, 0, 0);
          res(cv.toDataURL('image/png'));
        };
        img.onerror = () => rej(new Error('could not draw the picture'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      });
    }).then(png => { done(); return png; }, err => { done(); throw err; });
  },

  /** IO.shot, then hand it to the person. `name` gets .png put on it. */
  /* ── handing the picture over ──
     Tom, 2026-09-06: "I want the export to automatically save to photos,
     rather than dealing with the share menu."

     A web page CANNOT write to the photo library. That is an iOS rule, not
     something to code around, and any claim otherwise is wrong. What it can do
     is hand the file to the operating system, which is what the phone's own
     share sheet is - and on iOS "Save Image" is the first thing in it.

     That is still better than what was here. `<a download>` is the documented
     iOS trap: on a phone it can silently do nothing at all, which is the worst
     of both, and where it works it puts the file in Files rather than Photos.

     The catch is timing. iOS only allows a share inside the gesture that asked
     for it, and the picture takes a moment to draw - measured at about 40ms,
     which is inside what Safari allows. If the gesture has expired anyway, the
     picture is put on screen and a long press adds it to Photos, which needs
     no permission from anybody. */
  saveShot(node, name, opts) {
    const file = String(name || 'shot').replace(/\.png$/i, '') + '.png';
    return IO.shot(node, opts).then(png => {
      return IO.handOver(png, file).then(() => png);
    }, err => { toast(esc(err.message), { bad: true }); throw err; });
  },

  /** data URL -> Blob, so the file can be handed to the system as a file. */
  _blobOf(dataUrl) {
    const parts = String(dataUrl).split(',');
    const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'image/png';
    const bin = atob(parts[1]);
    const n = bin.length, u = new Uint8Array(n);
    for (let i = 0; i < n; i++) u[i] = bin.charCodeAt(i);
    return new Blob([u], { type: mime });
  },

  handOver(png, fileName) {
    let f = null;
    try { f = new File([IO._blobOf(png)], fileName, { type: 'image/png' }); } catch (e) {}

    if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
      return navigator.share({ files: [f] })
        .then(() => { toast('Saved'); },
              err => {
                /* A cancel is not a failure and must not nag. Anything else
                   means the gesture is gone, so fall back to the picture. */
                if (err && (err.name === 'AbortError' || /abort|cancel/i.test(err.message || ''))) return;
                return IO._showShot(png, fileName);
              });
    }

    /* No share at all: a desktop, where a download is exactly right. */
    if (!/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const a = el('a');
      a.download = fileName; a.href = png; a.click();
      toast('Picture saved');
      return Promise.resolve();
    }
    return IO._showShot(png, fileName);
  },

  /** The picture, full screen. Hold it and iOS offers Add to Photos. */
  _showShot(png, fileName) {
    const veil = el('div', 'mb-shotveil');
    const img = el('img');
    img.src = png; img.alt = fileName;
    const say = el('div', 'mb-shotsay', 'Press and hold the picture, then <b>Add to Photos</b>');
    const close = el('button', 'mb-shotx', 'Done');
    close.onclick = () => veil.remove();
    veil.onclick = e => { if (e.target === veil) veil.remove(); };
    veil.appendChild(img); veil.appendChild(say); veil.appendChild(close);
    document.body.appendChild(veil);
    return Promise.resolve();
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

  /** ── which column of the sheet is which field ──

      The header line, matched by NAME. It used to be counted instead: column
      three of the sheet was the third field declared, and that held right up
      until a column was added in the middle of the list.

      When Calcium went in between Potassium and Caffeine, every sheet already
      written had thirteen food columns and the app went looking for fourteen.
      So Caffeine read the old Price, Price read the column after it — the
      `edited` stamp — and a food that cost 180 pesos came back costing 2026,
      which is not a price, it is the year the row was last touched. The pull
      runs before the push, so the wreckage went straight back up to the sheet
      and both copies agreed on it.

      Names cannot drift like that. A column the sheet does not have is left
      alone rather than guessed at, which is the whole lesson: a reader that
      cannot find a field must decline to write one, never take whatever is
      standing in that position.

      Returns null when the grid has no header to read, because a tab whose
      first line is data is one we have no honest way to interpret. */
  columns(t, head) {
    if (!head || !head.length) return null;
    const norm = v => String(v == null ? '' : v).trim().toLowerCase();
    const seen = {};
    head.forEach((h, i) => { const k = norm(h); if (k && !(k in seen)) seen[k] = i; });
    /* The same guard the Apps Script uses. Without it a tab of pure data would
       have its first line silently eaten as a header. */
    if (seen.id !== 0) return null;
    const find = c => {
      const names = [c[1]].concat(c[3] || []);   /* the name now, then any it used to have */
      for (let i = 0; i < names.length; i++) {
        const at = seen[norm(names[i])];
        if (at != null) return at;
      }
      return -1;
    };
    const at = t.cols.map(find);
    return {
      id: 0,
      date: seen.date == null ? 1 : seen.date,
      at: at,
      edited: seen.edited == null ? -1 : seen.edited,
      /* what this sheet has never heard of, so a caller can say so */
      missing: t.cols.filter((c, i) => at[i] < 0).map(c => c[1]),
    };
  },

  /** Read one table's grid back and work out what changed.
      Returns {changed, added, removed, clashes} without writing anything, so a
      caller can show the damage before doing it. */
  readTable(appId, tableName, grid) {
    const S = IO.spec(appId), R = g.Rec;
    const t = (S.tables || []).filter(x => x.name === tableName)[0];
    const out = { changed: [], added: [], removed: [], clashes: [], missing: [] };
    if (!t || !grid || grid.length < 2) return out;
    const col = IO.columns(t, grid[0]);
    /* No header, no reading. Returning nothing leaves the store exactly as it
       was, and the next full push gives the tab a header it can be read by. */
    if (!col) { out.noHeader = true; return out; }
    out.missing = col.missing;

    const seen = {};
    grid.slice(1).forEach(line => {
      if (!line || !line.length) return;
      const id = String(line[col.id] || '').trim();
      /* A date cell reaches us as a Date object turned into an ISO timestamp,
         never as the YYYY-MM-DD the store requires. Left alone it becomes half
         of a second row id for a fact that already has one — see repairDates
         in records.js for what that did to the journal. Normalised here, at
         the boundary, because this is the one place a sheet's idea of a date
         becomes ours. Read back in local time: the sheet meant its own
         midnight, and slicing the string would file it a day early. */
      const date = sheetDate(line[col.date]);
      /* Only the columns this sheet actually has can say a line is empty. One
         it has never heard of is not blank, it is absent. */
      const blank = t.cols.every((c, i) => col.at[i] < 0 ||
        String(line[col.at[i]] == null ? '' : line[col.at[i]]).trim() === '');
      if (id) seen[id] = true;

      if (id && blank) { out.removed.push({ key: id, date: date }); return; }
      if (blank) return;

      const prev = id ? R.row(t.type, date, id) : null;
      const payload = prev ? JSON.parse(JSON.stringify(prev.payload)) : {};
      let differs = false;
      t.cols.forEach((c, i) => {
        if (col.at[i] < 0) return;               /* not in this sheet, so not ours to change */
        let v = line[col.at[i]];
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
      const sheetAt = col.edited < 0 ? 0 : (Date.parse(line[col.edited] || '') || 0);
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
    /* ── a row bigger than a cell ──

       Google Sheets refuses any cell over 50,000 characters, and a 360px photo
       of a receipt is about 52,000 once it is text. The sheet then refuses the
       whole batch, the push never confirms, the boundary never moves, and the
       same batch — photo included — fails again on every sync. Nothing logged
       on the phone after one photo ever reached the laptop, and the laptop,
       which takes no photos, synced the other way without a hitch.

       So a long row is cut into pieces: the first in column one where it has
       always been, the id still in column two, the rest from column three on.
       Thirty thousand, because a spreadsheet download has a lower limit still
       (32,767) and this same tab goes into that file. `bagRows` joins them. */
    bag.rows.forEach(r => {
      if (since && !(r.updated_at > since)) return;
      const json = JSON.stringify(r);
      const line = [json.slice(0, CELL_MAX), r.id];
      for (let i = CELL_MAX; i < json.length; i += CELL_MAX) line.push(json.slice(i, i + CELL_MAX));
      data.push(line);
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
      { name: IO.bagName(appId), rows: data, machine: true, key: 1, head: 1, upsert: 1, order: 90 },
      /* two columns and a version stamp: cheap enough to send whole every time,
         and it is the tab that says what wrote the file */
      { name: IO.setName(appId), rows: set, machine: true, whole: true, order: 91 },
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
      /* Joined a piece at a time, stopping at the first join that parses. A
         line updated in place keeps whatever cells the old, longer version
         left to its right, and those are stale — but a whole row parses
         before it reaches them, so they are never read. */
      let json = cell;
      for (let i = 2; ; i++) {
        try { out.push(JSON.parse(json)); return; } catch (e) {}
        const more = line[i];
        if (typeof more !== 'string' || !more) return;
        json += more;
      }
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
    /* Waits for the file, like backup() does. This one stamped every app as
       backed up before the share sheet had even been answered, so cancelling
       it marked the whole suite safe — the exact failure backup() was made
       careful about, still live in the button next to it. */
    return save('motherbase-all-' + g.Day.today() + '.json', JSON.stringify(bag), 'application/json')
      .then(done => {
        if (!done) { toast('nothing saved', { bad: true }); return false; }
        Object.keys(apps).forEach(a => { try { localStorage.setItem(BK(a), g.Day.today()); } catch (e) {} });
        toast('<b>' + bag.rows.length + '</b> rows backed up, every app');
        return true;
      });
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

  /** The "backed up Nd ago" line, as HTML. One builder, so the line cannot
      say one thing when the panel opens and a different thing after a
      backup. */
  freshLine(appId) {
    const n = IO.staleDays(appId), R = g.Rec;
    const stats = R ? R.stats() : { live: 0, kb: 0 };
    return (n === null ? '<b style="color:var(--warn,#ffb347)">Never backed up.</b>'
      : n === 0 ? 'Backed up <b>today</b>.' : 'Backed up <b>' + n + 'd ago</b>.') +
      ' <span style="opacity:.6">' + stats.live + ' rows \u00b7 ' + stats.kb + 'kb</span>';
  },

  /* ── the DATA tab, identical in every app ── */
  panel(pane, appId) {
    /* ── the line updates when the thing it describes changes ──

       Tom, 2026-09-10: "If I back up, it still says backed up 14 days ago."

       It did, on purpose, and the note that used to be here said so: the pane
       was not repainted because redrawing it from inside a button's own
       handler rebuilds the node that handler is attached to. That hazard is
       real and the conclusion drawn from it was not. Backing up and being told
       you have not backed up in a fortnight is the app calling you a liar, and
       "it will be right next time you open this" is not a thing anybody can be
       expected to know.

       So the LINE is repainted, not the pane. It is one text node that owns no
       handlers, so rewriting it cannot pull the ground out from under the
       button that asked for it. */
    const fresh = el('p', null, IO.freshLine(appId));
    pane.appendChild(fresh);
    const repaint = () => { try { fresh.innerHTML = IO.freshLine(appId); } catch (e) {} };

    const opt = (ic, t, d, fn, cls) => {
      const b = el('button', 'mb-opt mb-press flat' + (cls ? ' ' + cls : ''));
      b.innerHTML = '<span class="ic">' + ic + '</span><span class="t"><b>' + t + '</b><span>' + d + '</span></span>';
      b.onclick = fn; pane.appendChild(b); return b;
    };

    opt('⭳', 'Back up', 'The file that can be restored.', () => IO.backup(appId).then(repaint));
    opt('⭱', 'Restore', 'From a backup or an exported spreadsheet. Fills in what is missing, never overwrites newer.',
      () => IO.pick(f => IO.readAny(f).then(bag => {
        const c = IO.restore(bag, 'merge');
        toast(c ? '<b>' + c + '</b> rows restored' : 'nothing to restore — this device is already up to date');
        repaint();   /* the row count moved even when the backup date did not */
      }).catch(e => toast(esc(e.message), { bad: true }))));
    opt('⟲', 'Rewind', 'Replaces everything with the file. Discards anything newer.',
      () => IO.pick(f => IO.readAny(f).then(bag =>
        (g.UI ? g.UI.confirm('Rewind to the backup from ' + (bag.at || '?') + '?', 'Anything newer than the file is discarded.', { yes: 'REWIND', danger: true }) : Promise.resolve(confirm('Rewind?')))
          .then(ok => { if (!ok) return; const c = IO.restore(bag, 'replace'); toast('<b>' + c + '</b> rows restored'); repaint(); })
      ).catch(e => toast(esc(e.message), { bad: true }))), 'bad');

    opt('▦', 'Export a spreadsheet', 'Every tab, readable, and it restores too.', () => IO.export(appId));
    opt('▤', 'Export one tab as CSV', 'Works with no internet. Pick which.', () => IO.exportCsv(appId));

    opt('⌫', 'Delete this app’s data', 'Ticks and activities are shared and stay.',
      () => (g.UI ? g.UI.confirm('Delete all of ' + IO.spec(appId).name + '’s data?', 'Back up first. This cannot be undone.', { yes: 'DELETE', danger: true }) : Promise.resolve(confirm('Delete?')))
        .then(ok => { if (!ok) return; const c = g.Rec.clear(IO.spec(appId).types); toast('<b>' + c + '</b> rows deleted'); repaint(); }), 'bad');
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
/* the longest piece of a _Data row one cell is given; see bagTabs */
const CELL_MAX = 30000;
const watching = Object.create(null);

/* ── one attempt at a time, and never a stuck one ──

   Boot, coming back to the app, the forty five second tick and the debounce
   after a change can all want to sync at once, and two in the air at the same
   time race for the same boundary. So an app syncs one at a time.

   Held as a TIME rather than as a promise, because on a phone the promise is
   the thing that goes missing: background the app and the tab is frozen mid
   request, so nothing resolves, nothing rejects, and a flag set on the way in
   is never cleared on the way out. A stamp expires on its own. */
/* ── the sync log ──

   Tom, 2026-09-09: "The sync error codes don't actually mean anything or help
   at all, they just worry the users. Configure them to be useful to you since
   you're the one actually debugging."

   Right on both halves. A red banner reading "the sheet did not take 3 of 5
   tabs, which usually means the deployment is running older code" tells a
   user something is broken, gives them nothing they can do, and is wrong as
   often as it is right. Meanwhile the sync that mattered - the automatic one,
   on the phone - was SILENT, so the one failure worth knowing about left no
   trace at all. That is how a phone went weeks without pushing.

   So the two audiences are split. The person gets plain sentences and only
   ever gets a red one when there is something they can actually do. Every
   attempt, silent ones included, writes a line here instead.

   Kept short on purpose, in localStorage rather than in the store, because a
   diagnostic is not data: it must not sync, must not appear in a backup, and
   must not grow. Sixty lines is a couple of days of ticks and about 6KB.

   Keys are short because there are sixty of them:
     t  when, local, to the second      a  which app
     w  what triggered it: open, tick, edit, hidden, back, manual
     r  how it ended: ok, skip, fail
     y  the reason code, when it is not ok
     ms how long it took                v  the script version the sheet answered with
     o  was this device holding unsent rows when it started
     p  the push: state/mode/tabs       g  what the pull brought: changed+added+merged
   Anything absent was not reached. */
const LOGKEY = 'mb.mirror.log';
const LOG_MAX = 60;
const two = n => (n < 10 ? '0' : '') + n;
const logRead = () => { try { return JSON.parse(localStorage.getItem(LOGKEY) || '[]'); } catch (e) { return []; } };
/* An uneventful attempt is one that reached the sheet and found nothing to do
   in either direction. There are about 1,900 of those a day at one tick every
   forty five seconds, and sixty lines of "nothing to do" would push the one
   failure worth reading off the end long before Tom got round to copying it.
   So a run of identical quiet ones collapses to a single line with a count and
   the time of the most recent, and anything that actually happened - rows in,
   rows out, a skip, a failure - always takes a line of its own. */
const quietLine = l => l && l.r === 'ok' && !l.g && !l.p && !l.c && !l.y;
const sameKind = (a, b) => a.a === b.a && a.w === b.w && a.r === b.r && a.y === b.y;

function mlog(entry) {
  try {
    const d = new Date();
    const line = Object.assign({
      t: two(d.getMonth() + 1) + '-' + two(d.getDate()) + ' ' +
         two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()),
    }, entry);
    const all = logRead();
    const last = all[all.length - 1];
    if (last && quietLine(last) && quietLine(line) && sameKind(last, line)) {
      last.n = (last.n || 1) + 1;
      last.t = line.t;
      last.ms = line.ms;
    } else all.push(line);
    localStorage.setItem(LOGKEY, JSON.stringify(all.slice(-LOG_MAX)));
  } catch (e) {}
}

const inflight = Object.create(null);
const BUSY_MS = 60000;
const busy = appId => !!inflight[appId] && (Date.now() - inflight[appId]) < BUSY_MS;
const hold = appId => { inflight[appId] = Date.now(); };
const release = appId => { inflight[appId] = 0; };
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

/** ask the sheet for its editable tabs, by script tag

    ── how long to wait ──

    Twelve seconds, and fifteen for the bigger call, which is what the sync log
    off Tom's iPhone says is too short. Nine failures in a row came in at almost
    exactly 27 seconds, which is those two numbers added up: both calls ran out
    the clock rather than going wrong. An Apps Script web app that has not been
    touched for a while cold-starts, and a cold start on mobile data regularly
    takes longer than twelve seconds before it has even begun.

    A timeout that is shorter than the thing it is waiting for does not protect
    anybody. It just converts a slow sync into a failed one.

    The error says WHICH, because "could not reach the sheet" covers three
    different faults and only one of them is worth acting on. */
const JSONP_MS = 30000;
function jsonp(url, params, ms) {
  return new Promise((res, rej) => {
    const cb = 'mbcb' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
    const sep = url.indexOf('?') > -1 ? '&' : '?';
    const q = Object.keys(params || {}).map(k => k + '=' + encodeURIComponent(params[k])).join('&');
    const tag = document.createElement('script');
    let done = false;
    const clean = () => { delete g[cb]; tag.remove(); };
    const fail = (code, msg) => {
      const e = new Error(msg); e.code = code;
      if (done) return; done = true; clearTimeout(timer); clean(); rej(e);
    };
    const timer = setTimeout(() => fail('timeout', 'the sheet did not answer in time'),
      ms || JSONP_MS);
    g[cb] = data => { if (done) return; done = true; clearTimeout(timer); clean(); res(data); };
    tag.onerror = () => fail('unreachable', 'could not reach the sheet');
    tag.src = url + sep + q + '&callback=' + cb;
    document.head.appendChild(tag);
  });
}

/* An Apps Script that throws answers with something, just not with tabs. Worth
   telling apart from silence, because one is the script and one is the network
   and they need different people to fix them. */
/* A read that downloaded fine and then crashed while taking the rows in used
   to log as "read-failed:?", because the catch threw the error away. The PC
   logged that fifteen times in a row on 2026-09-13 and it said nothing about
   which line. The message and where it came from are the whole diagnosis. */
function threwWhy(e) {
  const msg = String((e && e.message) || e || 'unknown').replace(/\s+/g, ' ').slice(0, 120);
  const at = /([\w-]+\.(?:js|html)):(\d+):\d+/.exec(String((e && e.stack) || ''));
  return 'threw:' + msg + (at ? ' @' + at[1] + ':' + at[2] : '');
}

function readWhy(reply) {
  if (!reply) return 'no-reply';
  if (reply.error) return 'script-error:' + String(reply.error).slice(0, 80);
  return 'no-tabs';
}

const Mirror = {
  /** an app asking for the settings is the first chance to carry an old link
      across, so do it here too */
  adopt(appId) { adoptOldLink(appId); return Mirror.settings; },
  get settings() { return Object.assign({}, mcfg); },
  set(patch) { Object.assign(mcfg, patch || {}); msave(); return Mirror.settings; },
  get url() { return mcfg.url; },
  ready() { return !!mcfg.url; },

  /** Is this device holding rows the sheet has not confirmed?

      `pushed[appId]` is the line: rows written after it have not landed. That
      line lives in localStorage and only moves when the sheet says it has the
      rows, so it survives a reload, a discarded tab and a phone that was put
      in a pocket mid-request. Asking it is what makes a push recoverable
      without a retry queue — which is what the comment on `watch` always
      claimed, and was not true while the trigger was a flag in memory.

      No boundary at all means nothing has ever landed, so everything is
      outstanding. */
  outstanding(appId) {
    const R = g.Rec;
    if (!R || !R.newerThan) return false;
    const since = mcfg.pushed[appId];
    if (!since) return true;
    const S = IO.spec(appId);
    /* the same set the push sends: what the app owns, the shared vocabulary,
       and the app's own settings */
    if (R.newerThan((S.types || []).concat(['tick', 'activity']), since)) return true;
    return R.newerThan(['setting'], since, appId + '.');
  },

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
    /* ── the order the tabs sit in ──
       A number per tab, not a position, so the sheet can sort what it was
       given and leave every tab it has never heard of exactly where it is.
       Ten for the ones you type into, twenty for the read-outs, ninety for
       the machinery. A read-out may name its own — STATUS's Summary asks for
       0, which is how it ends up leftmost. */
    const edit = IO.tables(appId, since).map((t, i) =>
      ({ name: t.name, rows: t.rows, editable: true, key: t.key, order: 10 + i }));
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
      read.push({ name: name, rows: s.rows, editable: false, whole: true,
        order: s.order == null ? 20 + read.length : s.order });
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
    return jsonp(mcfg.url, { app: appId, want: 'index' }, 25000).then(r => {
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
    }).catch(e => ({ v: 0, failed: 1, why: (e && e.code) || 'threw' }));
  },

  /** Has anything gone into _Data that this device has not read?

      `seen[app|_Data]` is the push stamp this device is caught up to. It moves
      when we read the tab, and when we push having already been caught up —
      so our own push does not send us back to download what we just sent.

      ── why it is not "was the last push ours?" ──

      It used to be, and that answer hides the other device. The sheet keeps
      ONE stamp, and whoever pushes last overwrites it. So: the laptop pushes
      an edit, the phone opens, its read times out on a cold start, it sends
      its own rows anyway — and now the last push is the phone's. Every sync
      after that the phone said "that one was mine" and skipped _Data, and the
      laptop's edit never arrived until the laptop happened to push again.
      Changes went phone to laptop and stalled laptop to phone.

      Now our own push only counts as read if we had read everything before
      it. If we had not, `seen` stays behind, the stamp differs, and the next
      sync reads the tab — our rows and theirs, merged on updated_at, so the
      extra download costs nothing but time.

      One gap is left, and it is narrow: the other device pushing in the few
      seconds between our read and our own push landing. Closing it needs the
      sheet to keep more than one stamp, which is a script change. */
  bagIsNew(appId, pre) {
    const stamp = ((pre && pre.pushedAt) || {})[appId] || '';
    return mcfg.sheetV >= 3 && !!stamp && stamp !== (mcfg.seen[appId + '|_Data'] || '');
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
      const bagTabsWanted = [];
      if (Mirror.bagIsNew(appId, pre)) {
        bagTabsWanted.push(IO.bagName(appId));
        /* a sheet still carrying the flat tab from before the split */
        if (pre.index['_Data']) bagTabsWanted.push('_Data');
        bagTabsWanted.forEach(n => { if (want.indexOf(n) < 0) want.push(n); });
      }

      /* Nobody has typed in the sheet since we last looked, so there is
         nothing to read. This is the ordinary case and it now costs nothing. */
      if (!want.length) return Promise.resolve({ skipped: 'nothing new', changed: 0, added: 0, clashes: 0 });
      return jsonp(mcfg.url, { app: appId, want: 'tables', only: want.join(',') }).then(reply => {
        if (!reply || !reply.tabs) return { skipped: 'nothing came back', failed: 1, why: readWhy(reply) };
        const out = apply(reply.tabs);
        /* moved only after the rows are in, so a failure half way through
           means we read the tab again rather than skip it forever */
        want.forEach(n => {
          if (bagTabsWanted.indexOf(n) > -1) mcfg.seen[bagKey] = stamp;
          else mcfg.seen[appId + '|' + n] = pre.index[n].edited;
        });
        msave();
        return out;
      }, e => ({ skipped: 'could not read', failed: 1, why: (e && e.code) || 'threw' }));
    }

    return jsonp(mcfg.url, { app: appId, want: 'tables' }).then(reply => {
      if (!reply || !reply.tabs) return { skipped: 'nothing came back', failed: 1, why: readWhy(reply) };
      return apply(reply.tabs);
    }, e => ({ skipped: 'could not read', failed: 1, why: (e && e.code) || 'threw' }));
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
    /* ── a delta is safe when a read has just failed ──

       `opts.delta` means "send, but only in the kind that cannot erase". A
       delta is matched on row ids: it adds and it updates, and there is no
       tab-clearing step in it anywhere. Only a FULL push rewrites tabs, and
       that is the one thing a device must not do after a read it could not
       complete.

       This is what was keeping Tom's phone mute. Read first and do not write
       after a failed read is the right rule and it was being applied to both
       kinds of push, so a sheet that was slow to answer - which on iOS over
       mobile data was nearly always - blocked the write as well. Four days of
       logging sat on the phone behind a rule that only needed to stop half of
       it. */
    /* The derived tabs are rebuilt on a full push. Once a day is enough for a
       calendar view: it is a read-out, and a read-out being a few hours behind
       is visible, where a set going missing is not. */
    const stale = !mcfg.full[appId] || (Date.now() - (Date.parse(mcfg.full[appId]) || 0) > 20 * 3600 * 1000);
    /* A delta cannot be forced when there is no boundary to delta FROM, so
       canDelta still has the final say. The twenty-hour staleness rebuild of
       the derived read-outs is a nicety and stands aside for a recovery push:
       a calendar tab a few hours behind is visible, a lost set is not. */
    const full = opts.delta ? (!canDelta) : (!!opts.full || !canDelta || stale);
    /* Take the boundary BEFORE reading the rows, never after. A set logged
       while this push is still in the air is newer than this stamp and goes
       next time; stamping afterwards would step straight over it. */
    const at = new Date().toISOString();
    /* Were we caught up on _Data when this push began? Only then does our own
       stamp count as read once it lands. Worked out from the index this sync
       read just now and the `seen` the pull just moved, never from memory. */
    const bagKey = appId + '|_Data';
    const before = ((opts.index && opts.index.pushedAt) || {})[appId] || '';
    const caughtUp = !!before && before === (mcfg.seen[bagKey] || '');

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
    /* ── a recovery push writes only what cannot erase ──

       `mode: "delta"` stops the sheet clearing a tab, with one exception: a tab
       the app marks `whole` is still cleared and rewritten, and _Settings is
       marked whole because it is small and sent every time. That is fine on an
       ordinary sync, where the read succeeded and this device therefore holds
       what the sheet holds.

       It is not fine here. A recovery push happens precisely because we could
       NOT read, so anything this device would rewrite whole it would be
       rewriting blind — and for _Settings that means the theme and sound the
       other device picked. The rows themselves are safe either way, because
       they live in _Data as `setting` rows and merge on updated_at, but there
       is no reason to touch the readable copy while half blind.

       So a recovery push drops every whole-rewrite tab and sends only the
       upsert kind. What it cannot send now, it sends on the next sync that
       manages to read. */
    if (opts.delta) tabs = tabs.filter(t => !t.whole);
    if (!tabs.length) return Promise.resolve({ state: 'clean', tabs: 0 });

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
    const landed = () => jsonp(mcfg.url, { app: appId, want: 'index' }, 25000).then(r => {
      if (r && r.index) {
        mcfg.sheetV = r.v || 2;
        /* The sheet echoes back the stamp it was handed, so "did it land" is a
           comparison instead of a guess at row counts. Counting broke the
           moment we started sending deltas: twelve lines were never meant to
           make the tab twelve lines long. */
        if (((r.pushedAt || {})[appId] || '') === at) {
          mcfg.pushed[appId] = at;
          if (caughtUp) mcfg.seen[bagKey] = at;
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
      return jsonp(mcfg.url, { app: appId, want: 'stat' }, 25000).then(r2 => {
        const stat = (r2 && r2.stat) || {};
        const missing = Object.keys(want).filter(n => !stat[n]);
        const short = Object.keys(want).filter(n => stat[n] && stat[n] < want[n]);
        if (missing.length) return { state: 'failed', missing: missing.length, of: tabs.length };
        mcfg.pushed[appId] = at; mcfg.full[appId] = at;
        mcfg.at = g.Day.today(); msave();
        return { state: 'confirmed', tabs: tabs.length, short: short.length };
      });
    }).catch(() => ({ state: 'unconfirmed', tabs: tabs.length }));

    /* Said plainly, and not in red. None of these is something to do anything
       about: the boundary has not moved, so whatever did not land goes again
       by itself. The detail that would actually diagnose it is in the sync
       log, where it does not have to be frightening to be complete. */
    const speak = res => {
      if (!quiet) {
        if (res.state === 'failed') {
          toast('Nothing went up this time. It will go again — <b>settings → sync</b> shows what the sheet is running.');
        } else if (res.state === 'unconfirmed') {
          toast('Sent. The sheet did not answer back, which some browsers always do.');
        } else if (res.short) {
          toast('Synced <b>' + res.tabs + '</b> tabs.');
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
            const f = Mirror.fault();
            if (!quiet) toast(f.say, f.act ? { bad: true, ms: 7000 } : null);
            return { state: 'failed', missing: tabs.length, of: tabs.length };
          });
      });
  },

  /** Why a sync probably failed — split into what to SAY and what to LOG.

      `act` is the whole point. Three of these are a thing the person can fix
      in ten seconds and should be told about in red. The fourth is "it did not
      go through this time", which is transient far more often than not — no
      signal, a frozen tab, Google being slow — and self-heals, because the
      boundary did not move and the same rows go again on the next attempt.
      Painting that red taught him to ignore red.

      The old text for that case advised redeploying the Apps Script, which is
      a real fix for a real cause and the wrong thing to say to somebody who
      walked into a lift. The version line in Settings already reports an out
      of date deployment, from the sheet's own answer rather than from a
      guess, so that advice lives where it can be true. */
  fault() {
    const u = mcfg.url || '';
    if (!u) return { code: 'no-link', act: true, say: 'Paste the sheet link in first.' };
    if (u.indexOf('script.google.com') < 0)
      return { code: 'bad-link-host', act: true,
               say: 'That link is not the Apps Script one. Copy the one that ends in /exec.' };
    if (!/\/exec\s*$/.test(u))
      return { code: 'bad-link-dev', act: true,
               say: 'That link should end in /exec. A /dev one only works while you are signed in.' };
    return { code: 'unreachable', act: false,
             say: 'Could not reach the sheet just now. Nothing was lost, and it will go again on its own.' };
  },

  /** kept because callers already say why(); it is the sentence half */
  why() {
    return Mirror.fault().say;
  },

  /** the whole round trip, in the order that makes it safe */
  sync(appId, quiet, opts) {
    if (!mcfg.url) { mlog({ a: appId, w: 'manual', r: 'skip', y: 'no-link' }); return Promise.resolve(false); }
    if (!quiet) toast('Syncing…');
    const t0 = Date.now();
    const mline = { a: appId, w: quiet ? 'auto' : 'manual', o: Mirror.outstanding(appId) ? 1 : 0 };
    let idx = null;
    return Mirror.index(appId)
      .then(pre => { idx = pre; return Mirror.pull(appId, pre).catch(e => ({ skipped: 'could not read', failed: 1, why: threwWhy(e) })); })
      .then(got => {
        /* ── read first, and if the read failed, do not write ──

           A push rewrites the readable tabs whole. Doing that straight after a
           read that failed means writing over a sheet we have just proved we
           cannot see — and the thinner the device, the more it erases. The
           boundary in `pushed` has not moved, so the same rows go up on the
           next attempt; there is nothing to queue and nothing to lose by
           waiting. */
        if (got && got.failed) {
          const f = Mirror.fault();
          const why = 'read-failed:' + ((got && got.why) || (idx && idx.why) || f.code);
          /* Pressing the button and being told the sheet could not be read,
             while four days of logging sits on the phone, is the app declining
             to try the half of the job that was always safe. */
          if (!Mirror.outstanding(appId) || f.act) {
            mline.r = 'fail'; mline.y = why; mline.ms = Date.now() - t0; mlog(mline);
            if (!quiet) toast(f.say, f.act ? { bad: true, ms: 8000 } : null);
            return false;
          }
          return Mirror.push(appId, true, { index: idx, delta: true }).then(res => {
            const sent = !!(res && (res.state === 'confirmed' || res.state === 'clean'));
            mline.r = sent ? 'ok' : 'fail';
            mline.y = why + (sent ? '+sent-anyway' : '+' + (res && res.state || 'push-failed'));
            mline.p = (res && res.state || '?') + '/' + (res && res.mode || '-') + '/' + (res && res.tabs || 0);
            mline.ms = Date.now() - t0; mlog(mline);
            if (!quiet) {
              toast(sent
                ? 'Could not read the sheet, so sent what was waiting and read nothing. <b>' +
                  (res.tabs || 0) + '</b> tabs went up.'
                : f.say, (!sent && f.act) ? { bad: true, ms: 8000 } : null);
            }
            return sent;
          }, () => {
            mline.r = 'fail'; mline.y = why + '+push-threw';
            mline.ms = Date.now() - t0; mlog(mline);
            if (!quiet) toast(f.say, f.act ? { bad: true, ms: 8000 } : null);
            return false;
          });
        }
        return Mirror.push(appId, true, Object.assign({ index: idx }, opts || {})).then(res => {
        const ok2 = res && (res.state === 'confirmed' || res.state === 'clean');
        mline.v = (idx && idx.v) || 0;
        mline.g = IO.came(got || {}) || 0;
        mline.p = (res && res.state || '?') + '/' + (res && res.mode || '-') + '/' + (res && res.tabs || 0);
        mline.r = ok2 ? 'ok' : 'fail';
        if (!ok2) mline.y = (res && res.state === 'unconfirmed') ? 'no-confirm' : Mirror.fault().code;
        mline.ms = Date.now() - t0;
        mlog(mline);
        if (!quiet) {
          if (res && res.state === 'clean') toast('Already up to date.');
          else if (!res || res.state === 'failed') {
            const f = Mirror.fault();
            toast(f.say, f.act ? { bad: true, ms: 8000 } : null);
          } else if (res.state === 'unconfirmed') {
            toast('Sent. The sheet did not answer back, which some browsers always do.');
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

      Four moments, and none of them is a button. On open, ten seconds after
      the last thing he logs, the moment the app goes out of view, and every
      forty five seconds while he is looking at it.

      There is no retry queue, deliberately. What goes next time is decided by
      the boundary in `pushed`, and that only moves when the sheet confirms —
      so a sync that fails leaves the boundary where it was and the same rows
      go again at the next moment. A queue would be a second copy of a fact
      the store already holds.

      ── why that was not true, and what it cost ──

      Every one of those moments used to be gated on `dirty`, a flag in memory
      saying "something changed since this page loaded". That IS a second copy
      of a fact the store already holds, and it is the copy a phone loses.

      Background a phone browser and the tab is frozen within a fraction of a
      second, then discarded. So: log a meal, pocket the phone. `dirty` was
      cleared on the way into the sync, the request froze in mid air, and the
      handler that would have set it back never ran because a frozen promise
      neither resolves nor rejects. Come back, and the page is a fresh load
      with `dirty` at zero — and open, becoming visible and the forty five
      second tick all only ever PULLED. Nothing pushed until he logged
      something new, and then that push froze the same way.

      A laptop never showed it: the tab stays alive and visible, so the ten
      second timer actually fires with the page still running.

      Now every moment asks `Mirror.outstanding`, which reads the boundary in
      localStorage against the rows in the store. Both survive a reload, so a
      push that died in a pocket is retried the next time the app is opened
      rather than being forgotten. */
  watch(appId) {
    if (watching[appId]) return false;
    watching[appId] = 1;
    let t = null;
    /* One path for all four moments. `onOpen` reads, then sends whatever the
       boundary says is still here, and holds the one-at-a-time lock while it
       does — so the debounce, the tick and coming back to the app cannot end
       up racing each other for the same boundary. */
    const run = (why) => {
      clearTimeout(t); t = null;
      if (!mcfg.on || !mcfg.url) return;
      Mirror.onOpen(appId, why || 'edit');
    };
    /* Ten seconds, not thirty. The debounce is there so that correcting a
       weight straight after typing it sends one row and not three, and ten is
       long enough for that. Thirty was long enough for the phone to be back in
       a pocket, which made the timer that was meant to be the common case into
       the one that almost never fired. */
    if (g.Rec && g.Rec.on) g.Rec.on(() => { clearTimeout(t); t = setTimeout(() => run('edit'), 10000); });

    /* Hidden means the phone is being locked or the tab is being left: try to
       push what is waiting before it goes, knowing it may well be frozen
       before the request lands. That is now a bonus rather than the only
       chance. Visible means you have just come back to this device, which is
       exactly the moment the other one's work matters, so read first and then
       send. */
    if (g.document) g.document.addEventListener('visibilitychange', () => {
      if (g.document.visibilityState === 'hidden') { run('hidden'); return; }
      if (!mcfg.on || !mcfg.url) return;
      Mirror.onOpen(appId, 'back');
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
      Mirror.onOpen(appId, 'tick');
    }, 45000);
    return true;
  },

  /** on open, quietly. Never blocks anything and never says anything unless
      it actually brought something back.

      Reads, and then sends anything this device is still holding. It used to
      only read, which is why a phone could pull for a week and never once
      push: this is the moment that runs on boot, on coming back to the app and
      on every forty five second tick, and it was the only reliable moment a
      phone had. The send is silent and costs nothing when the boundary says
      there is nothing outstanding, which is the ordinary case.

      Read first, and if the read failed do not write — the same rule the
      manual button follows, and for the same reason: a push rewrites the
      readable tabs whole, so writing after a failed read is writing over a
      sheet we have just proved we cannot see. */
  onOpen(appId, why) {
    const w = why || 'open';
    /* Logged, not ignored. "Nothing happened and I do not know why" was the
       whole problem: a sync that declines to run is as worth a line as one
       that fails, and these three are the difference between "the phone is
       broken" and "the toggle is off". */
    if (!mcfg.url) { mlog({ a: appId, w: w, r: 'skip', y: 'no-link' }); return Promise.resolve(false); }
    if (!mcfg.on) { mlog({ a: appId, w: w, r: 'skip', y: 'switched-off' }); return Promise.resolve(false); }
    if (busy(appId)) { mlog({ a: appId, w: w, r: 'skip', y: 'already-running' }); return Promise.resolve(false); }
    hold(appId);
    const t0 = Date.now();
    const held = Mirror.outstanding(appId);
    let idx = null, line = { a: appId, w: w, o: held ? 1 : 0 };
    const job = Mirror.index(appId)
      .then(pre => {
        idx = pre;
        line.v = (pre && pre.v) || 0;
        if (pre && pre.failed) line.y = 'sheet-silent';
        return Mirror.pull(appId, pre).catch(e => ({ failed: 1, why: threwWhy(e) }));
      })
      .then(got => {
        line.g = IO.came(got || {}) || 0;
        if (got && got.clashes) line.c = got.clashes;
        if (got && (got.changed || got.added || got.merged)) {
          toast('<b>' + IO.came(got) + '</b> changes came in from the sheet.');
          if (g.Rec) g.Rec.reload && g.Rec.reload();
        }
        const readFailed = !!(got && got.failed);
        if (readFailed) line.y = 'read-failed:' + ((got && got.why) || (idx && idx.why) || '?');
        /* Nothing of ours to send, so a failed read is the end of it. */
        if (!held) return !readFailed;
        /* A read that failed still allows the kind of push that cannot erase.
           Without this the phone stayed silent for four days behind a rule
           meant only to stop a full rewrite. */
        return Mirror.push(appId, true, { index: idx, delta: readFailed }).then(res => {
          line.p = (res && res.state || '?') + '/' + (res && res.mode || '-') + '/' + (res && res.tabs || 0);
          if (res && res.state === 'failed') line.y = (readFailed ? line.y + '+' : '') + 'sheet-refused';
          if (res && res.state === 'unconfirmed') line.y = (readFailed ? line.y + '+' : '') + 'no-confirm';
          return !!(res && (res.state === 'confirmed' || res.state === 'clean'));
        }, () => { line.y = (readFailed ? line.y + '+' : '') + 'push-threw'; return false; });
      })
      .catch(e => { line.y = (line.y ? line.y + '+' : '') + threwWhy(e); return false; });
    const done = ok => {
      release(appId);
      line.r = ok ? 'ok' : 'fail';
      line.ms = Date.now() - t0;
      mlog(line);
      return ok;
    };
    return job.then(done, () => done(false));
  },

  /** The last sixty sync attempts, newest last. Read by the button in
      Settings that copies them out, and by anyone debugging this. */
  log() { return logRead(); },
  /** only so the checks can drive the collapsing without a network */
  logProbe(entry) { mlog(entry); },
  clearLog() { try { localStorage.removeItem(LOGKEY); } catch (e) {} },

  /** The log as something Tom can paste into a conversation.

      One line per attempt and a header saying what device wrote it, because
      the first question about a sync bug is always "which of the two is this"
      and the second is "what does the sheet think it is running". */
  logText() {
    const rows = logRead();
    const head = [
      'MOTHERBASE SYNC LOG',
      'written  ' + new Date().toString(),
      'device   ' + (g.navigator ? g.navigator.userAgent : 'unknown'),
      'link     ' + (mcfg.url ? (/\/exec\s*$/.test(mcfg.url) ? 'set, ends /exec' : 'set, DOES NOT end /exec') : 'not set'),
      'auto     ' + (mcfg.on ? 'on' : 'OFF'),
      'app script v' + IO.SCRIPT_V + ', sheet answered v' + (mcfg.sheetV || 0),
      'last confirmed push per app:',
    ];
    Object.keys(mcfg.pushed || {}).forEach(a => head.push('  ' + a + '  ' + mcfg.pushed[a]));
    if (!Object.keys(mcfg.pushed || {}).length) head.push('  (none ever confirmed)');
    head.push('');
    head.push('t=FINISHED at (local) w=what-triggered-it r=result y=why');
    head.push('o=had-unsent-rows ms=took v=sheet-version-that-answered');
    head.push('g=rows-in p=push(state/mode/tabs) n=quiet-runs-collapsed');
    head.push('');
    if (!rows.length) return head.concat(['(no attempts recorded yet)']).join('\n');
    return head.concat(rows.map(r => Object.keys(r).map(k => k + '=' + r[k]).join(' '))).join('\n');
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
      '   cannot empty the sheet.',
      '',
      '   Version 4 puts the tabs in order, colours them for what they are, and',
      '   hides the machinery. Green means type in me. Blue means I am worked out',
      '   for you and I get rewritten. Grey and hidden is the save file. It moves',
      '   no tab it was not handed, so any tab of your own is left alone. */',
      '',
      'var MB_V = ' + IO.SCRIPT_V + ';',
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
      '/* ── the tabs, put in order and marked for what they are ──',
      '',
      '   Cosmetic, and deliberately so: nothing here reads or writes a single',
      '   value. It runs only on a full write, which is about once a day, so it',
      '   costs nothing on the syncs that happen while you are using the app.',
      '',
      '   A tab this script was not given is never moved, never coloured and',
      '   never hidden. Your own tabs are yours. They will end up sitting after',
      '   the ones the app owns, because the app tabs are moved to the front. */',
      'function mbTidy(ss, tabs) {',
      '  var want = [];',
      '  tabs.forEach(function (t) { if (t.order !== null && t.order !== undefined) want.push(t); });',
      '  want.sort(function (a, b) { return a.order - b.order; });',
      '  /* Where everything already is, in one call, so a tab that is already in',
      '     the right place costs nothing. Nothing normally moves after the first',
      '     run, and every call into a spreadsheet is a round trip, so the steady',
      '     state should be reads and not writes. */',
      '  var at = {};',
      '  ss.getSheets().forEach(function (sh, i) { at[sh.getName()] = i + 1; });',
      '  var pos = 1;',
      '  want.forEach(function (t) {',
      '    var sh = ss.getSheetByName(t.name);',
      '    if (!sh) return;',
      '    try {',
      '      /* The machinery goes grey and out of sight. It is the save file and',
      '         a row of it means nothing to read, so the honest thing is to stop',
      '         offering it. Hidden, never deleted. */',
      '      if (t.machine) {',
      '        sh.setTabColor("#9aa0a6");',
      '        if (!sh.isSheetHidden()) sh.hideSheet();',
      '        return;',
      '      }',
      '      /* Green means type in me. Blue means I am worked out for you and',
      '         I will be rewritten, so anything you put here will not last. */',
      '      sh.setTabColor(t.editable ? "#188038" : "#1a73e8");',
      '      if (sh.isSheetHidden()) sh.showSheet();',
      '      if (at[t.name] !== pos) { ss.setActiveSheet(sh); ss.moveActiveSheet(pos); }',
      '      pos = pos + 1;',
      '    } catch (err) {}',
      '  });',
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
      '  /* Order, colour and hide. After the writing, so every tab it wants to',
      '     move already exists, and only on a full write, because dragging tabs',
      '     about on every background sync would be work for nothing. */',
      '  if (mode !== "delta") { try { mbTidy(ss, tabs); } catch (err) {} }',
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
