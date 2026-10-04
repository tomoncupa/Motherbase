/* ══════════════ boot.js — the start screen ══════════════
   Tom, 2026-10-04: "a sort of cool startup animation when we're opening up
   the app", "game start load screen initializing system vibes", and the rule
   that governs all of it: "it should only hide the load time, never cause
   delay".

   A page opts in with one tag in its head, straight after skins.js:
       <script src="shared/boot.js"></script>
   The home screen and the phone apps carry it (the roster's `phone` flag).

   When it plays: the first page a tab or an installed app opens, and only in
   the top document. A reload, a frame, or a second app opened in the same tab
   gets nothing; the tab's sessionStorage remembers. `?boot=1` plays it anyway,
   in a frame too (the smoke checks open it that way), and `?boot=0` never
   does. `?boot=fail` and `?boot=hang` are the smoke's, below.

   How long it stays: exactly as long as the page is still loading, and not
   one frame more. Four stages, each one a segment of the bar, lit when it is
   TRUE rather than on a timer:
     PAGE   the document is parsed, every script has run
     THEME  Skins has applied a theme
     STORE  Rec has every row in memory (the home screen draws nothing before)
     DRAWN  one frame after all three, so what is under it has painted
   Four seconds after the page was asked for it goes regardless, saying which
   stage it was still waiting on. A tap or a key dismisses it at once. The
   exit plays with pointer events off, so the app underneath takes a tap
   while the window is still closing.

   Every line it prints is a fact read off the page: the build is the page's
   mb-version, the store line is Rec's own clock. No fake progress.

   Colours and sizes are tokens. A theme is not applied until the page's own
   script calls Skins.restore, after this has painted, so every var() carries
   a fallback in the scale's own values and a system colour, never a hex.
   The accent's fallback is grey, so the window lights up in the theme's
   colour at the moment the THEME line prints. */
(function (g) {
  'use strict';
  var d = g.document;
  if (!d || g.Boot) return;
  var Boot = { shown: false, stage: {}, done: function () {} };
  g.Boot = Boot;

  var top = false;
  try { top = g.top === g; } catch (e) {}
  var q = (g.location && g.location.search) || '';
  /* two test switches, for the smoke checks: `fail` throws straight after
     the screen goes on, `hang` stops its loop, and the screen must leave
     anyway, by the catch and by the hard stop */
  var fail = /[?&]boot=fail(&|$)/.test(q), hang = /[?&]boot=hang(&|$)/.test(q);
  var force = fail || hang || /[?&]boot=1(&|$)/.test(q), never = /[?&]boot=0(&|$)/.test(q);
  var ss = null;
  try { ss = g.sessionStorage; } catch (e) {}
  var KEY = 'mb.boot', seen = false;
  try { seen = !!(ss && ss.getItem(KEY)); } catch (e) {}
  if (never || (!force && (!top || seen)) || !d.documentElement) return;
  try { if (ss) ss.setItem(KEY, '1'); } catch (e) {}

  var now = function () { return g.performance && g.performance.now ? g.performance.now() : Date.now(); };
  var CAP = 4000;
  var reduced = false;
  try { reduced = g.matchMedia('(prefers-reduced-motion:reduce)').matches; } catch (e) {}

  /* the name on the window, and the build under it */
  var meta = function (n) { var m = d.querySelector('meta[name="' + n + '"]'); return m ? m.getAttribute('content') || '' : ''; };
  var title = (d.title || '').trim().toUpperCase();
  var name = !title || title === 'MAIN MENU' ? 'MOTHERBASE' : title;
  var build = (meta('mb-version').split(',')[0] || '').trim();
  var DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  var MONS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  var t = new Date();
  var date = DAYS[t.getDay()] + ' ' + ('0' + t.getDate()).slice(-2) + ' ' + MONS[t.getMonth()];

  var css =
    '#mb-boot{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;' +
      'color-scheme:dark;background:var(--bg,Canvas);color:var(--text-1,CanvasText);' +
      'padding:var(--safe-t,env(safe-area-inset-top,0px)) var(--gutter,16px) var(--safe-b,env(safe-area-inset-bottom,0px));' +
      'transition:background-color var(--dur-med,240ms) var(--ease-out,ease-out),opacity var(--dur-med,240ms) var(--ease-out,ease-out);' +
      '-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;cursor:default}' +
    '#mb-boot *{box-sizing:border-box;margin:0}' +
    /* the window: a cut corner top left and bottom right, the System shape */
    '#mb-boot .mbb-w{--k:calc(var(--cut,10px) + var(--s-2,8px));position:relative;width:min(calc(var(--s-10,128px) * 3),100%);' +
      'padding:var(--border-width,1px);background:var(--accent,GrayText);' +
      'clip-path:polygon(var(--k) 0,100% 0,100% calc(100% - var(--k)),calc(100% - var(--k)) 100%,0 100%,0 var(--k));' +
      'transition:background-color var(--dur-med,240ms) var(--ease-out,ease-out);transform-origin:50% 50%;animation:mbb-open var(--dur-slow,420ms) var(--ease-out,ease-out) both}' +
    '#mb-boot .mbb-in{position:relative;overflow:hidden;padding:var(--s-5,24px);display:flex;flex-direction:column;gap:var(--s-4,16px);' +
      'background:var(--surface-1,Canvas);' +
      'clip-path:polygon(var(--k) 0,100% 0,100% calc(100% - var(--k)),calc(100% - var(--k)) 100%,0 100%,0 var(--k))}' +
    /* a scan band rolling down the window */
    '#mb-boot .mbb-in::after{content:"";position:absolute;left:0;right:0;top:0;height:var(--s-8,64px);pointer-events:none;' +
      'background:linear-gradient(to bottom,transparent,color-mix(in srgb,var(--accent,GrayText) 14%,transparent),transparent);' +
      'animation:mbb-scan 1.8s linear infinite}' +
    '#mb-boot .mbb-h{display:flex;align-items:center;gap:var(--s-3,12px);font-family:var(--font-display,"Chakra Petch",system-ui,sans-serif);' +
      'font-size:var(--f-1,12px);font-weight:var(--w-bold,700);letter-spacing:var(--track-cap,.18em);color:var(--text-muted,GrayText)}' +
    '#mb-boot .mbb-h .mbb-t{font-weight:inherit;color:var(--text-1,CanvasText)}' +
    '#mb-boot .mbb-h .mbb-r{flex:1;height:var(--border-width,1px);background:var(--accent,GrayText);transform-origin:0 50%;' +
      'animation:mbb-rule var(--dur-slow,420ms) var(--ease-out,ease-out) both;animation-delay:var(--dur-fast,140ms)}' +
    '#mb-boot .mbb-nm{font-family:var(--font-display,"Chakra Petch",system-ui,sans-serif);font-size:var(--f-8,36px);font-weight:var(--w-bold,700);' +
      'line-height:var(--lh-tight,1.25);letter-spacing:var(--track-cap,.18em);white-space:nowrap;overflow:hidden;text-overflow:clip}' +
    '#mb-boot .mbb-nm.mbb-long{font-size:var(--f-6,24px)}' +
    '#mb-boot .mbb-st{font-family:var(--font-mono,ui-monospace,monospace);font-size:var(--f-2,14px);color:var(--text-muted,GrayText);' +
      'letter-spacing:var(--track-cap,.18em)}' +
    '#mb-boot .mbb-st::after{content:"";display:inline-block;width:.6em;height:1em;margin-left:var(--s-1,4px);vertical-align:-.15em;' +
      'background:var(--accent,GrayText);animation:mbb-caret .9s steps(1) infinite}' +
    '#mb-boot .mbb-log{display:flex;flex-direction:column;gap:var(--s-1,4px);min-height:calc(var(--f-1,12px) * 1.6 * 4 + var(--s-1,4px) * 3);' +
      'font-family:var(--font-mono,ui-monospace,monospace);font-size:var(--f-1,12px);line-height:var(--lh-body,1.6);font-variant-numeric:tabular-nums}' +
    '#mb-boot .mbb-l{display:grid;grid-template-columns:calc(var(--f-1,12px) * 6) 1fr auto;gap:var(--s-2,8px);color:var(--text-muted,GrayText);' +
      'animation:mbb-type var(--dur-med,240ms) steps(12,end) both}' +
    '#mb-boot .mbb-l .mbb-v{font-weight:var(--w-body,500);color:var(--text-1,CanvasText);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '#mb-boot .mbb-l .mbb-ok{text-decoration:none;color:var(--text-1,CanvasText)}' +
    '#mb-boot .mbb-bar{display:flex;align-items:center;gap:var(--s-2,8px)}' +
    '#mb-boot .mbb-seg{flex:1;height:var(--s-2,8px);border:var(--border-width,1px) solid var(--border-strong,GrayText);' +
      'transition:background-color var(--dur-fast,140ms) var(--ease-out,ease-out),border-color var(--dur-fast,140ms)}' +
    '#mb-boot .mbb-seg.mbb-on{background:var(--accent,GrayText);border-color:var(--accent,GrayText)}' +
    '#mb-boot .mbb-n{min-width:calc(var(--f-1,12px) * 3);text-align:right;font-family:var(--font-mono,ui-monospace,monospace);' +
      'font-size:var(--f-1,12px);color:var(--text-muted,GrayText);font-variant-numeric:tabular-nums}' +
    /* out: the window folds to a line, the screen lets go */
    '#mb-boot.out{pointer-events:none;opacity:0;transition-delay:0s,var(--dur-fast,140ms)}' +
    '#mb-boot.out .mbb-w{animation:mbb-shut var(--dur-fast,140ms) var(--ease-in,ease-in) both}' +
    /* a desk has the room: a bigger window, the name in the top size */
    '@media (min-width:900px){#mb-boot .mbb-w{width:calc(var(--s-10,128px) * 4)}#mb-boot .mbb-nm{font-size:var(--f-9,48px)}#mb-boot .mbb-nm.mbb-long{font-size:var(--f-7,30px)}}' +
    '@keyframes mbb-open{0%{opacity:0;transform:scale(1.04,.02)}45%{opacity:1;transform:scale(1,.02)}100%{opacity:1;transform:none}}' +
    '@keyframes mbb-shut{0%{transform:none}100%{transform:scale(1.04,.02)}}' +
    '@keyframes mbb-rule{from{transform:scaleX(0)}to{transform:none}}' +
    '@keyframes mbb-scan{from{transform:translateY(-100%)}to{transform:translateY(calc(var(--s-10,128px) * 3))}}' +
    '@keyframes mbb-caret{50%{opacity:0}}' +
    '@keyframes mbb-type{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}' +
    '@media (prefers-reduced-motion:reduce){#mb-boot .mbb-w,#mb-boot.out .mbb-w,#mb-boot .mbb-h .mbb-r,#mb-boot .mbb-l{animation:none}' +
      '#mb-boot .mbb-in::after{display:none}#mb-boot .mbb-st::after{animation:none}}';

  var st = d.createElement('style');
  st.id = 'mb-boot-css';
  st.textContent = css;
  (d.head || d.documentElement).appendChild(st);

  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var STAGES = ['page', 'theme', 'store', 'drawn'];
  var root = d.createElement('div');
  root.id = 'mb-boot';
  root.setAttribute('role', 'status');
  root.setAttribute('aria-label', 'Loading ' + name);
  root.innerHTML =
    '<div class="mbb-w"><div class="mbb-in">' +
      '<div class="mbb-h"><span class="mbb-t">SYSTEM</span><span class="mbb-r"></span><span>' + esc(build ? 'v' + build : '') + '</span></div>' +
      '<div class="mbb-st">INITIALIZING SYSTEM</div>' +
      '<div class="mbb-nm' + (name.length > 10 ? ' mbb-long' : '') + '" aria-hidden="true"></div>' +
      '<div class="mbb-log"></div>' +
      '<div class="mbb-bar">' + STAGES.map(function () { return '<span class="mbb-seg"></span>'; }).join('') + '<span class="mbb-n">0/4</span></div>' +
    '</div></div>';
  /* Never in the way, whatever breaks. Once the screen is on the page, two
     things take it off without asking anything else in this file: a hard
     stop past the cap, armed before any other line can fail, and the catch
     around the rest. An engine nobody tested can lose the animation; it can
     never lose the app under it. */
  var dead = false, tick = null, scr = null;
  var kill = function () {
    dead = true;
    try { clearInterval(tick); clearInterval(scr); } catch (e) {}
    try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e) {}
    try { if (st.parentNode) st.parentNode.removeChild(st); } catch (e) {}
  };
  /* in the head there is no body yet: the screen hangs off <html>, before it */
  d.documentElement.appendChild(root);
  var hardStop = setTimeout(function () { if (!dead) { Boot.why = Boot.why || 'stop'; kill(); } }, CAP + 1500);
  Boot.shown = true;
  try {
  if (fail) throw new Error('boot=fail');
  /* a frame callback has run once the screen has been drawn at least once */
  var framed = false;
  if (g.requestAnimationFrame) g.requestAnimationFrame(function () { framed = true; });
  var $ = function (s) { return root.querySelector(s); };
  var nmEl = $('.mbb-nm'), logEl = $('.mbb-log'), stEl = $('.mbb-st'), nEl = $('.mbb-n'), segs = root.querySelectorAll('.mbb-seg');

  /* the name decodes: random letters settle left to right. Letters and digits
     only, so no glyph falls back to another font and moves the line. */
  var POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var t0 = now();
  /* by the clock, not by ticks: a page busy loading starves the timer, and
     the name catches up the moment it gets a turn */
  var paintName = function () {
    if (dead) return;
    var out = '', lock = (now() - t0) / 40 - 2;
    for (var i = 0; i < name.length; i++) {
      var c = name.charAt(i);
      out += c === ' ' || i < lock ? c : POOL.charAt(Math.floor(Math.random() * POOL.length));
    }
    nmEl.textContent = out;
    if (lock >= name.length) { clearInterval(scr); scr = null; nmEl.textContent = name; }
  };
  if (reduced) nmEl.textContent = name;
  else { paintName(); scr = setInterval(paintName, 32); }

  /* the log: one line per fact, at least 70ms apart so it reads as typing.
     The spacing is drawing only; the exit never waits for the queue. */
  var queue = [], lastLine = 0, lines = {};
  var line = function (k, label, value, ok) {
    if (lines[k]) { lines[k].querySelector('.mbb-v').textContent = value; lines[k].querySelector('.mbb-ok').textContent = ok || ''; return; }
    queue.push([k, label, value, ok]);
  };
  var flush = function () {
    if (!queue.length || now() - lastLine < 70) return;
    var it = queue.shift(), el = d.createElement('div');
    el.className = 'mbb-l';
    el.innerHTML = '<span>&gt; ' + esc(it[1]) + '</span><span class="mbb-v">' + esc(it[2]) + '</span><span class="mbb-ok">' + esc(it[3] || '') + '</span>';
    lines[it[0]] = el;
    logEl.appendChild(el);
    lastLine = now();
  };
  if (build) line('build', 'BUILD', build, '');
  line('date', 'DATE', date, '');

  var stage = Boot.stage, got = 0;
  var mark = function (k) {
    if (stage[k]) return;
    stage[k] = Math.round(now());
    got++;
    for (var i = 0; i < segs.length; i++) segs[i].classList.toggle('mbb-on', i < got);
    nEl.textContent = got + '/4';
  };

  var waitedStore = false, finished = false, hooked = false;
  var poll = function () {
    if (finished || dead) return;
    try { step(); } catch (e) { Boot.why = 'error'; Boot.err = String(e && e.message || e); kill(); }
  };
  var step = function () {
    if (hang) return;
    var t1 = now();
    /* the timer is the floor; these answer the moment a stage lands */
    if (!hooked && g.Rec && g.Rec.ready) { hooked = true; try { g.Rec.ready(poll); } catch (e) {} }
    if (!stage.page && d.readyState !== 'loading') mark('page');
    if (!stage.theme && g.Skins && g.Skins.current) {
      mark('theme');
      line('theme', 'THEME', String(g.Skins.current.name || g.Skins.current.id || '').toUpperCase(), 'OK');
    }
    if (!stage.store && g.Rec && g.Rec.hydrated) {
      mark('store');
      var tm = null;
      try { tm = g.Rec.timing && g.Rec.timing(); } catch (e) {}
      line('store', 'STORE', tm && tm.ready ? 'READY ' + Math.round(tm.ready) + ' MS' : 'READY', 'OK');
    } else if (!stage.store && !waitedStore && t1 > 1500 && g.Rec) {
      waitedStore = true;
      line('store', 'STORE', 'WAITING', '');
    }
    flush();
    if (stage.page && stage.theme && (stage.store || !g.Rec)) {
      if (!g.Rec) mark('store');
      finished = true;
      /* one frame, so what is underneath has painted before this lets go.
         A hidden window gets no frames, so a timer stands in for it. */
      var go = function () { if (go.ran) return; go.ran = true; mark('drawn'); done('ready'); };
      if (g.requestAnimationFrame) g.requestAnimationFrame(function () { setTimeout(go, 0); });
      setTimeout(go, 100);
    } else if (t1 > CAP) {
      finished = true;
      done('cap');
    }
  };

  var gone = false;
  function done(why) {
    if (gone || dead) return;
    gone = true; finished = true;
    try { exit(why); } catch (e) { Boot.err = String(e && e.message || e); kill(); }
  }
  function exit(why) {
    Boot.why = why;
    Boot.at = Math.round(now());
    clearInterval(tick);
    if (scr) { clearInterval(scr); nmEl.textContent = name; }
    root.setAttribute('aria-busy', 'false');
    var missing = STAGES.filter(function (k) { return !stage[k]; });
    stEl.textContent = why === 'cap' && missing.length ? 'WAITING ON ' + missing[0].toUpperCase() : 'SYSTEM READY';
    /* nothing painted yet means nobody saw it: no exit to play */
    var painted = framed;
    try { painted = painted || g.performance.getEntriesByType('paint').length > 0; } catch (e) {}
    clearTimeout(hardStop);
    if (!painted) { kill(); return; }
    root.classList.add('out');
    setTimeout(kill, 700);
  }
  Boot.done = function () { done('call'); };

  root.addEventListener('pointerdown', function () { done('tap'); });
  g.addEventListener('keydown', function k() { g.removeEventListener('keydown', k); done('key'); });
  root.setAttribute('aria-busy', 'true');
  d.addEventListener('DOMContentLoaded', poll);
  tick = setInterval(poll, 40);
  poll();
  } catch (e) { Boot.why = 'error'; Boot.err = String(e && e.message || e); kill(); }
})(typeof window !== 'undefined' ? window : this);
