/* PHONE: what the iPhone knows and the suite cannot ask (2026-11-16).

   Tom: "my Safari history, my screen time, my steps, and all that ... as
   automatic and as low friction as possible", for him first and then for
   clients. A web page cannot read Apple Health, background location or Screen
   Time. An iPhone Shortcut can read Health and location, and can note when a
   chosen app opens and closes. Screen Time and Safari history stay sealed by
   Apple; nothing here pretends otherwise.

   THE PIPE. The Shortcut sends a small parcel, {k, v}, with one plain web
   request to `phone/<code>` in LIVE SYNC's database. No sign-in on the phone:
   the code is the address. The database lets anyone holding the code ADD to
   that inbox and only the signed-in owner READ it, because the owner keeps
   the same code at `u/<uid>/phone` (the rules are in CLOUD.md). So a leaked
   code lets someone post junk into an inbox, and never read a thing.

   THE READER is this file, in the top document of any signed-in page. It
   claims each parcel with a transaction that deletes it, so two devices open
   at once never both take one, and turns it into ordinary rows:

     k: 'steps'  v: "2026-11-16 8514" lines, or one number for today
                 -> STATUS's `ev` reading for `steps` on each day
     k: 'sleep'  the same shape, hours -> `ev` for `sleep`
     k: 'place'  v: "lat,lon"          -> a `pplace` row, dated, keyed by time
     k: 'app'    v: "Instagram open" / "Instagram close"
                 -> a `papp` row per app per day, its open spans

   A reading from the phone is one entry in that day's list marked
   `src: 'phone'`, and a newer phone figure replaces the older one rather than
   stacking. A figure typed by hand stays in the list; STATUS shows the latest.
   The same figure sent again changes nothing, so a figure he typed after the
   phone's last send keeps winning until the phone has something new.

   When a parcel was sent comes from its push id, which Firebase stamps on its
   own clock, so an app closed at 9:02 counts at 9:02 even if no device read
   it until morning.

   Nothing here works from a folder, in the demo, or in a frame. */
(function (g) {
  'use strict';
  if (g.Phone) return;
  var VERSION = '0.1.0';
  var CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  var KEYLEN = 24;
  var MAXSPAN = 4 * 3600 * 1000;   /* an app "open" for longer is a missed close */
  var on = false, key = '', inbox = null, timer = 0, rowsDrawn = [];

  function isTop() { try { return g.top === g; } catch (e) { return false; } }
  function R() { return g.Rec; }
  function dayOf(ms) { return g.Day ? g.Day.of(ms) : new Date(ms).toISOString().slice(0, 10); }
  function today() { return dayOf(Date.now()); }
  function num(s) { var n = parseFloat(String(s).replace(/,/g, '')); return isFinite(n) ? n : null; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'app'; }

  /** when a push id was made, on Firebase's clock */
  function pushTime(id) {
    var t = 0;
    for (var i = 0; i < 8; i++) { var c = CHARS.indexOf(id.charAt(i)); if (c < 0) return 0; t = t * 64 + c; }
    return t > 1.6e12 && t < Date.now() + 864e5 ? t : 0;
  }

  /* "2026-11-16 8514" lines, or a lone number meaning today. Future days and
     anything that is not a number are left out. */
  function perDay(v) {
    var out = [], s = String(v == null ? '' : v), re = /(\d{4}-\d{2}-\d{2})[^\d\n-]+([\d.,]+)/g, m, t = today();
    while ((m = re.exec(s))) out.push([m[1], num(m[2])]);
    if (!out.length && num(s) != null && /^\s*[\d.,]+\s*$/.test(s)) out.push([t, num(s)]);
    return out.filter(function (x) { return x[1] != null && x[0] <= t; });
  }

  function reading(field, pairs, dec) {
    var Rec = R(), n = 0, now = Date.now();
    pairs.forEach(function (p) {
      var v = dec ? Math.round(p[1] * 10) / 10 : Math.round(p[1]);
      if (!(v > 0)) return;
      var had = Rec.get('ev', p[0], field) || {}, e = Array.isArray(had.e) ? had.e : [];
      var mine = e.filter(function (x) { return x && x.src === 'phone'; });
      if (mine.length && mine[mine.length - 1].v === v) return;
      var keep = e.filter(function (x) { return !(x && x.src === 'phone'); });
      keep.push({ t: now + n, v: v, src: 'phone' });
      Rec.set('ev', p[0], field, Object.assign({}, had, { e: keep }));
      n++;
    });
    return n;
  }

  function place(v, t) {
    var m = String(v).match(/(-?\d{1,3}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)/);
    if (!m) return 0;
    var lat = Math.round(+m[1] * 1e5) / 1e5, lon = Math.round(+m[2] * 1e5) / 1e5;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return 0;
    R().set('pplace', dayOf(t), String(t), { lat: lat, lon: lon, t: t });
    return 1;
  }

  function app(v, t) {
    var m = String(v).trim().match(/^(.+?)[\s:|-]+(open|opened|close|closed)$/i);
    if (!m) return 0;
    var Rec = R(), name = m[1].trim().slice(0, 60), k = slug(name), opening = /^open/i.test(m[2]), d = dayOf(t);
    var had = Rec.get('papp', d, k) || {}, row = Object.assign({ name: name, spans: [] }, had);
    row.spans = Array.isArray(row.spans) ? row.spans.slice() : [];
    if (opening) { row.open = t; Rec.set('papp', d, k, row); return 1; }
    var from = row.open, fromDay = d;
    if (!from) {
      /* opened before midnight: the open is on yesterday's row */
      var y = g.Day ? g.Day.shift(d, -1) : '', yr = y && Rec.get('papp', y, k);
      if (yr && yr.open) { from = yr.open; fromDay = y; }
    }
    if (!from || t <= from || t - from > MAXSPAN) { if (row.open) { row.open = null; Rec.set('papp', d, k, row); } return 0; }
    if (fromDay !== d) {
      var mid = new Date(t); mid.setHours(0, 0, 0, 0);
      var yrow = Object.assign({}, Rec.get('papp', fromDay, k));
      yrow.spans = (yrow.spans || []).concat([[from, +mid]]); yrow.open = null;
      Rec.set('papp', fromDay, k, yrow);
      from = +mid;
    }
    row.spans.push([from, t]); row.open = null;
    Rec.set('papp', d, k, row);
    return 1;
  }

  /** one parcel in. Answers how many rows it changed. */
  function take(p, t) {
    if (!p || typeof p !== 'object') return 0;
    var k = String(p.k || '').toLowerCase(), v = p.v;
    if (k === 'steps') return reading('steps', perDay(v), false);
    if (k === 'sleep') return reading('sleep', perDay(v), true);
    if (k === 'place') return place(v, t);
    if (k === 'app') return app(v, t);
    return 0;
  }

  function heard(k, t, n) {
    var Rec = R(), had = Rec.get('phone', null, '') || {};
    Rec.set('phone', null, '', Object.assign({}, had, { at: t, k: k, n: n }));
  }

  /* Claim a parcel by deleting it in a transaction; whoever's delete lands
     takes it. A parcel this device cannot read is put back, never lost. */
  function claim(snap) {
    var got = null, id = snap.key;
    snap.ref.transaction(function (cur) {
      if (cur == null) { got = null; return; }
      got = cur; return null;
    }, function (err, done) {
      if (err || !done || !got) return;
      var t = pushTime(id) || Date.now();
      try { var n = take(got, t); heard(String(got.k || ''), t, n); redraw(); }
      catch (e) { try { snap.ref.set(got); } catch (x) {} }
    }, false);
  }

  function rand() {
    var a = new Uint8Array(KEYLEN), s = '';
    (g.crypto || g.msCrypto).getRandomValues(a);
    for (var i = 0; i < KEYLEN; i++) s += CHARS.charAt(a[i] % 64);
    return s.replace(/^-/, 'm');
  }

  function account() {
    if (!g.Cloud || !g.Cloud.db) return Promise.reject(new Error('live sync is not here yet'));
    return g.Cloud.db();
  }

  /** the inbox code, made the first time anyone asks */
  function code(make) {
    return account().then(function (me) {
      var at = me.db.ref('u/' + me.uid + '/phone');
      return at.once('value').then(function (s) {
        var have = s.val();
        if (typeof have === 'string' && have.length >= 20) return have;
        if (!make) return '';
        var k = rand();
        return at.set(k).then(function () { return k; });
      });
    });
  }

  function listen() {
    if (inbox || !isTop() || g.MB_DEMO) return;
    var C = g.Cloud;
    if (!C || !C.state || !C.state().live) return;
    account().then(function (me) {
      return code(false).then(function (k) {
        if (!k || inbox) return;
        key = k;
        inbox = me.db.ref('phone/' + k);
        inbox.on('child_added', claim, function () { inbox = null; });
      });
    }).catch(function () {});
  }

  function start() {
    if (on || !isTop() || g.MB_DEMO || !g.Cloud) return;
    on = true;
    if (g.Cloud.on) g.Cloud.on(function () { listen(); redraw(); });
    listen();
    timer = setInterval(listen, 60000);
  }

  /* ── the row under LIVE SYNC: YOUR IPHONE ── */
  var SHORTCUT = '';   /* the iCloud link to the Shortcut, once Tom has shared it */

  function ago(t) {
    var s = (Date.now() - t) / 1000;
    if (s < 90) return 'just now';
    if (s < 5400) return Math.round(s / 60) + ' min ago';
    if (s < 129600) return Math.round(s / 3600) + ' h ago';
    return Math.round(s / 86400) + ' days ago';
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function lastLine() {
    var Rec = R(), p = Rec && Rec.get('phone', null, '');
    if (!p || !p.at) return 'Not connected yet. It sends your steps, and more if you want, with no app to install.';
    var what = { steps: 'steps', sleep: 'sleep', place: 'a place', app: 'an app opening or closing' }[p.k] || 'something';
    var st = Rec.get('ev', today(), 'steps'), e = st && st.e && st.e.filter(function (x) { return x && x.src === 'phone'; });
    var steps = e && e.length ? ' Today: <b>' + Number(e[e.length - 1].v).toLocaleString('en-US') + '</b> steps.' : '';
    return 'Last heard from your iPhone <b>' + ago(p.at) + '</b>, with ' + what + '.' + steps;
  }

  function redraw() {
    rowsDrawn = rowsDrawn.filter(function (r) { return r.isConnected; });
    rowsDrawn.forEach(function (r) { var p = r.querySelector('p'); if (p) p.innerHTML = lastLine(); });
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {}
    t.remove(); return Promise.resolve();
  }

  function connect() {
    var UI = g.UI, toast = function (m, o) { if (UI && UI.toast) UI.toast(m, o); };
    code(true).then(function (k) {
      key = k; listen();
      if (!UI || !UI.dialog) return;
      UI.dialog({
        title: 'CONNECT YOUR IPHONE',
        width: 460,
        body: function (b) {
          b.appendChild(el('p', null, '<b>1.</b> Copy your code. It is private: it lets your iPhone post into your Motherbase.'));
          var c = el('div', 'mb-input', esc(k));
          c.style.cssText = 'font-family:var(--font-mono,monospace);overflow-wrap:anywhere;user-select:all;-webkit-user-select:all';
          b.appendChild(c);
          var cb = el('button', 'mb-btn go mb-press mb-tap', 'Copy my code');
          cb.style.cssText = 'width:100%;margin-top:var(--s-2,8px)';
          cb.onclick = function () { copy(k).then(function () { toast('Code copied'); }); };
          b.appendChild(cb);
          b.appendChild(el('p', null, '<b>2.</b> ' + (SHORTCUT
            ? 'Get the Shortcut and tap <b>Add Shortcut</b>. Paste your code when it asks.'
            : 'The Shortcut link is not published yet. Your coach will send it.')));
          if (SHORTCUT) {
            var sb = el('button', 'mb-btn mb-press mb-tap', 'Get the Shortcut');
            sb.style.cssText = 'width:100%';
            sb.onclick = function () { g.open(SHORTCUT, '_blank'); };
            b.appendChild(sb);
          }
          b.appendChild(el('p', null, '<b>3.</b> In the Shortcuts app: Automation, the + button, <b>Charger</b>, Is Connected, then pick the Motherbase Shortcut and <b>Run Immediately</b>. Now every time the phone goes on charge, your steps come in.'));
        },
        actions: [{ label: 'DONE', kind: 'go', fn: function () {} }],
      });
    }).catch(function (e) { toast(e && e.message ? e.message : 'Sign in to live sync first', { bad: true }); });
  }

  function row(wrap) {
    if (!wrap || wrap.querySelector('.mb-phone') || g.MB_DEMO) return;
    var C = g.Cloud, s = C && C.state ? C.state() : null;
    if (!s || !s.live) return;
    var w = el('div', 'mb-phone');
    w.appendChild(el('div', 'mb-group', 'YOUR IPHONE'));
    w.appendChild(el('p', null, lastLine()));
    var b = el('button', 'mb-btn mb-press mb-tap', 'Connect your iPhone');
    b.style.cssText = 'width:100%;margin-top:var(--s-2,8px)';
    b.onclick = connect;
    w.appendChild(b);
    var dev = wrap.querySelector('.mb-devices');
    if (dev) wrap.insertBefore(w, dev); else wrap.appendChild(w);
    rowsDrawn.push(w);
  }

  g.Phone = {
    VERSION: VERSION,
    start: start,
    row: row,
    connect: connect,
    code: code,
    /* for the smoke checks: one parcel straight in, no database */
    _take: take,
    _perDay: perDay,
    _pushTime: pushTime,
  };

  start();
  if (typeof document !== 'undefined') {
    var ws = document.querySelectorAll('.mb-live-sync');
    for (var i = 0; i < ws.length; i++) row(ws[i]);
  }
})(typeof window !== 'undefined' ? window : this);
