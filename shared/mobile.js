/* ══════════════════════ MOTHERBASE · MOBILE ══════════════════════
   The layer that makes a page stop feeling like a page.

   Everything in here exists to remove one specific tell — the small
   giveaways that say "you are looking at a website on a phone" rather than
   "you are using an app". The tells, and what fixes each:

     the grey flash when you tap something      → tap highlight off, real press state
     the quarter-second pause before a tap lands → touch-action:manipulation
     the whole page zooming when you tap a field → inputs never under 16px
     the page bouncing past its own top          → overscroll contained
     the keyboard covering the field you're in   → visualViewport, live --kb
     a dialog landing in the middle of the screen→ bottom sheets, dragged away
     the back gesture leaving the app entirely   → a back stack overlays sit on
     content jammed under the notch              → safe-area insets, everywhere
     nothing happening when you press            → haptics, sound, instant state

   Load it and it works. There is nothing to call and nothing to configure:

     <scr'+'ipt src="../shared/mobile.js"></scr'+'ipt>

   (the tag is split in that comment on purpose — a literal closing script tag
   inside inline code ends the script element, even inside a comment.)

   What you can call, when you want more than the defaults:

     Mobile.sheet({title, body, actions})   a real bottom sheet, drag to dismiss
     Mobile.actions('TITLE', [...])         the contextual menu, from the bottom
     Mobile.feedback('tick')                haptic + sound, one call, both platforms
     Mobile.field(input, 'decimal')         the right keyboard, the right return key
     Mobile.form(container)                 Next through the fields, Done on the last
     Mobile.swipe(row, {left:{...}})        swipe a row to act on it
     Mobile.trap(closeFn)                   system back closes your thing, not the app

   Honest about the platform: iPhone Safari has no vibration API, so haptics
   are Android-only. That is why every shared component pairs a haptic with a
   sound cue — the feedback lands on both, just through different senses.
*/
(function (g) {
'use strict';

const doc = document, root = doc.documentElement;
const UA = navigator.userAgent || '';

/* ── what we are running on ────────────────────────────────────────────── */
const ios = /iP(hone|ad|od)/.test(UA) || (/Macintosh/.test(UA) && navigator.maxTouchPoints > 1);
const android = /Android/.test(UA);
const touch = (matchMedia && matchMedia('(pointer:coarse)').matches) || navigator.maxTouchPoints > 0;
const standalone = navigator.standalone === true || (matchMedia && matchMedia('(display-mode:standalone)').matches);
const reduced = () => matchMedia && matchMedia('(prefers-reduced-motion:reduce)').matches;

/* Sheets, not centred dialogs, whenever a thumb is driving and the screen is
   narrow enough that a centred box would have nowhere to sit. A tablet in
   landscape gets the desktop treatment, which is correct. */
const compact = () => innerWidth <= 640;
const sheetish = () => compact() || (touch && innerWidth <= 900);

/* ── settings ──
   Read straight from localStorage on purpose, the same way day.js does:
   Records depends on this file being up, not the other way round. */
const KEY = 'mb.mobile';
let cfg = { haptics: true };
try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {} };

/* ── the base stylesheet ──
   Written only in tokens, each with a fallback, so it looks right whether or
   not skins.js has painted the page yet. */
function base() {
  if (doc.getElementById('mb-mobile-css')) return;
  const s = doc.createElement('style'); s.id = 'mb-mobile-css';
  s.textContent = `
:root{--kb:0px}

/* The tap highlight is the single loudest "this is a web page" signal. */
*{-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}

/* No 300ms wait for a possible double-tap, and no double-tap zoom on things
   you are meant to press. Anything that sets its own touch-action — a canvas,
   a map — wins, because those selectors are more specific than these. */
a,button,label,select,summary,[role=button],[role=tab],[role=switch]{touch-action:manipulation}
button,[role=button],[role=tab]{-webkit-user-select:none;user-select:none}

/* The page itself must not rubber-band past its own edges. Scrollable regions
   inside it keep their momentum and stop their scroll from escaping upward. */
body{overscroll-behavior-y:none}
.mb-scroll{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}

/* 44px of hit area without 44px of ink. The pseudo-element is centred on the
   control and does not affect layout, so a 24px checkbox stays a 24px
   checkbox and still catches a thumb. */
@media (pointer:coarse){
  .mb-tap{position:relative}
  .mb-tap::after{content:'';position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);width:max(100%,var(--tap,44px));height:max(100%,var(--tap,44px))}
  /* Safari zooms the whole page when you focus a field under 16px. Nothing
     says "website" faster. */
  input,select,textarea{font-size:max(16px,1em)}
  /* A scrollbar is a mouse affordance. */
  .mb-scroll{scrollbar-width:none}
  .mb-scroll::-webkit-scrollbar{width:0;height:0}
}

/* Press feedback. Set the moment a finger lands, dropped if the finger moves
   — so starting a scroll on a button does not look like pressing it. */
.mb-press{transition:transform var(--dur-tap,90ms) var(--ease-out,ease),
  background-color var(--dur-tap,90ms) linear,opacity var(--dur-tap,90ms) linear}
.mb-press[data-press]{transform:scale(.965)}
.mb-press.flat[data-press]{transform:none;background-color:var(--surface-3,#1a2430)}
.mb-press.lift[data-press]{transform:none;box-shadow:var(--e-1)}

/* Keyboard is up: anything that says so can lift itself clear. */
.mb-kbpad{padding-bottom:calc(var(--kb) + var(--safe-b,0px))}

/* While something is over the page, the page underneath does not scroll.
   overflow:hidden and not position:fixed on purpose — fixed reflows a flex
   body and loses the scroll position, which shows as a jump. */
.mb-locked{overflow:hidden}

/* The button. Defined here, in the lowest layer, so there is exactly one of
   it — ui.js styles nothing that this file already styles. */
.mb-btn{min-height:var(--tap,44px);padding:0 var(--s-4,16px);cursor:pointer;
  border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-md,10px);
  background:var(--surface-2,#131b26);color:var(--text-2,#7f93a8);
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);
  font-weight:var(--w-bold,700);letter-spacing:var(--track-cap,.18em)}
.mb-btn.go{background:var(--accent,#7ee8fa);border-color:var(--accent,#7ee8fa);
  color:var(--accent-fg,#04212a);box-shadow:var(--e-1)}
.mb-btn.bad{border-color:var(--danger,#ff6b81);color:var(--danger,#ff6b81)}
.mb-btn.quiet{border-color:transparent;background:none}
.mb-btn:disabled{opacity:.45;cursor:default}
.mb-btn:focus-visible{outline:2px solid var(--focus,#7ee8fa);outline-offset:2px}
/* Hover is a mouse idea. On a touch screen it sticks after a tap and looks
   broken, so it only exists where there is a real pointer. */
@media (hover:hover) and (pointer:fine){
  .mb-btn:hover{color:var(--text-1,#dbe7f0);border-color:var(--text-muted,#5b6d80)}
  .mb-btn.go:hover{background:var(--accent-hover,#7ee8fa)}
  .mb-act:hover{background:var(--surface-3,#1a2430)}
  .mb-x:hover{color:var(--text-1,#dbe7f0)}
}

/* ── the sheet ── */
.mb-veil{position:fixed;inset:0;z-index:8900;background:var(--overlay,rgba(4,7,11,.72));
  opacity:0;transition:opacity var(--dur-med,240ms) var(--ease-out,ease);
  -webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}
.mb-veil.on{opacity:1}
.mb-sheet{position:fixed;left:0;right:0;bottom:0;z-index:8901;
  display:flex;flex-direction:column;max-height:min(92vh,var(--mb-h,92vh));
  margin:0 auto;width:100%;max-width:var(--mb-w,560px);
  background:var(--surface-1,#0e141d);color:var(--text-1,#dbe7f0);
  border-top:1px solid var(--border-strong,#2b3a4d);
  border-radius:var(--radius-sheet,20px) var(--radius-sheet,20px) 0 0;
  box-shadow:var(--e-5,0 20px 40px rgba(0,0,0,.4));
  font-family:var(--font-body,system-ui);font-size:var(--f-2,14px);
  padding-bottom:calc(var(--safe-b,0px) + var(--kb));
  transform:translateY(100%);
  transition:transform var(--dur-sheet,360ms) var(--ease-sheet,cubic-bezier(.32,.72,0,1))}
.mb-sheet.on{transform:translateY(0)}
/* On a wide screen the same component becomes a centred card. One dialog,
   two shapes — never two different dialogs to keep in step. */
.mb-sheet.wide{position:fixed;top:50%;bottom:auto;left:50%;right:auto;
  transform:translate(-50%,-46%) scale(.98);opacity:0;
  width:min(var(--mb-w,560px),94vw);border-radius:var(--radius-lg,16px);
  border:1px solid var(--border-strong,#2b3a4d);padding-bottom:0;
  transition:transform var(--dur-med,240ms) var(--ease-out,ease),opacity var(--dur-med,240ms)}
.mb-sheet.wide.on{transform:translate(-50%,-50%) scale(1);opacity:1}
.mb-grab{flex:0 0 auto;padding:10px 0 4px;display:flex;justify-content:center;
  touch-action:none;cursor:grab}
.mb-grab i{width:38px;height:4px;border-radius:var(--radius-full,999px);
  background:var(--border-strong,#2b3a4d);display:block}
.mb-sheet.wide .mb-grab{display:none}
.mb-sheet-head{flex:0 0 auto;display:flex;align-items:center;gap:var(--s-2,8px);
  padding:var(--s-2,8px) var(--s-4,16px) var(--s-3,12px);touch-action:none}
.mb-sheet.wide .mb-sheet-head{padding-top:var(--s-4,16px);touch-action:auto}
.mb-sheet-head h3{margin:0;flex:1;min-width:0;font-family:var(--font-display,system-ui);
  font-size:var(--f-1,12px);font-weight:var(--w-bold,700);letter-spacing:var(--track-cap,.18em);
  color:var(--text-muted,#5b6d80)}
.mb-x{flex:0 0 auto;width:32px;height:32px;border:0;border-radius:var(--radius-full,999px);
  background:var(--surface-2,#131b26);color:var(--text-2,#7f93a8);font-size:15px;line-height:1;cursor:pointer}
.mb-sheet-body{padding:0 var(--s-4,16px);line-height:var(--lh-body,1.6);min-height:0;flex:1 1 auto}
.mb-sheet-body>p{margin:0 0 var(--s-3,12px);color:var(--text-2,#7f93a8)}
.mb-sheet-foot{flex:0 0 auto;display:flex;gap:var(--s-2,8px);
  padding:var(--s-3,12px) var(--s-4,16px) var(--s-4,16px)}
.mb-sheet-foot .mb-btn{flex:1}
.mb-sheet.wide .mb-sheet-foot{justify-content:flex-end}
.mb-sheet.wide .mb-sheet-foot .mb-btn{flex:0 0 auto;min-width:104px}

/* ── the action list, used by menus and by pickers ── */
.mb-acts{display:flex;flex-direction:column;gap:var(--s-1,4px)}
.mb-act{display:flex;align-items:center;gap:var(--s-3,12px);width:100%;text-align:left;
  min-height:var(--tap,44px);padding:var(--s-3,12px) var(--s-3,12px);border:0;cursor:pointer;
  border-radius:var(--radius-md,10px);background:var(--surface-2,#131b26);
  color:var(--text-1,#dbe7f0);font:inherit;font-size:var(--f-3,16px)}
.mb-act .ic{flex:0 0 auto;width:22px;text-align:center;color:var(--accent,#7ee8fa)}
.mb-act .t{flex:1;min-width:0}
.mb-act .t small{display:block;color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);
  line-height:1.45;margin-top:2px}
.mb-act.bad{color:var(--danger,#ff6b81)}
.mb-act.on{color:var(--accent,#7ee8fa)}
.mb-act.on::after{content:'✓';margin-left:auto;flex:0 0 auto}

/* ── swipe actions behind a row ──
   The wrapper holds the corners so the action revealed behind the row is not
   a square poking out from under a rounded one. Give it its own radius if the
   row it wraps has a different one. */
.mb-swipe{position:relative;overflow:hidden;touch-action:pan-y;
  border-radius:var(--radius-md,10px)}
.mb-swipe>.mb-swipe-face{position:relative;z-index:1;background:inherit;
  transition:transform var(--dur-med,240ms) var(--ease-out,ease)}
.mb-swipe>.mb-swipe-back{position:absolute;inset:0;display:flex;align-items:stretch;z-index:0}
.mb-swipe>.mb-swipe-back button{border:0;cursor:pointer;font:inherit;
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);
  letter-spacing:var(--track-cap,.18em);color:#fff;padding:0 var(--s-5,24px);min-width:92px}
.mb-swipe>.mb-swipe-back .r{margin-left:auto}

@media (prefers-reduced-motion:reduce){
  .mb-veil,.mb-sheet,.mb-press,.mb-swipe>.mb-swipe-face{transition:none!important}
  .mb-sheet{transform:none}
}
`;
  doc.head.appendChild(s);
}

/* ── the shell ──
   Runs once. Everything here is inert on a desktop browser. */
function chrome() {
  /* viewport-fit=cover is what lets env(safe-area-inset-*) return anything
     other than zero. Doing it here means an app gets safe areas by loading
     this file, without editing its head. */
  let vp = doc.querySelector('meta[name=viewport]');
  if (!vp) { vp = doc.createElement('meta'); vp.name = 'viewport'; doc.head.appendChild(vp); vp.content = 'width=device-width,initial-scale=1'; }
  if (!/viewport-fit/.test(vp.content)) vp.content = vp.content.replace(/\s*$/, '') + ',viewport-fit=cover';
  /* user-scalable=no is an accessibility failure and iOS ignores it anyway.
     Pinch zoom stays; the double-tap delay is handled by touch-action. */
  vp.content = vp.content.replace(/,?\s*user-scalable=no/g, '');

  if (ios && !doc.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
    const m = doc.createElement('meta');
    m.name = 'apple-mobile-web-app-capable'; m.content = 'yes';
    doc.head.appendChild(m);
    const s = doc.createElement('meta');
    s.name = 'apple-mobile-web-app-status-bar-style'; s.content = 'black-translucent';
    doc.head.appendChild(s);
  }

  root.classList.toggle('mb-ios', ios);
  root.classList.toggle('mb-android', android);
  root.classList.toggle('mb-touch', touch);
  root.classList.toggle('mb-standalone', !!standalone);

  /* iOS only fires :active when the document has a touch listener. One empty
     listener buys every :active rule in every app. */
  doc.addEventListener('touchstart', function () {}, { passive: true });
}

/* ── press state ──────────────────────────────────────────────────────────
   A finger that lands and then moves was starting a scroll, not pressing a
   button. Native lists behave exactly this way and it is very noticeable when
   an interface does not. */
let pressed = null, px = 0, py = 0;
function dropPress() { if (pressed) { pressed.removeAttribute('data-press'); pressed = null; } }
function wirePress() {
  addEventListener('pointerdown', e => {
    const t = e.target && e.target.closest && e.target.closest('.mb-press');
    if (!t || t.disabled) return;
    pressed = t; px = e.clientX; py = e.clientY; t.setAttribute('data-press', '');
  }, { passive: true });
  addEventListener('pointerup', dropPress, { passive: true });
  addEventListener('pointercancel', dropPress, { passive: true });
  addEventListener('pointermove', e => {
    if (pressed && Math.abs(e.clientY - py) + Math.abs(e.clientX - px) > 10) dropPress();
  }, { passive: true });
  addEventListener('scroll', dropPress, { passive: true, capture: true });
}

/* ── haptics ──
   Android and desktop Chrome have the Vibration API. iPhone Safari does not,
   and no amount of wishing changes that. Callers should use feedback(), which
   plays a sound cue as well, so the response lands on both platforms.

   A browser refuses to vibrate until the page has been touched at least once,
   and complains in the console every time it refuses. So we wait for the
   first real gesture, exactly as sound.js waits to be allowed to make noise. */
let touched = false;
addEventListener('pointerdown', () => { touched = true; }, { once: true, capture: true });
addEventListener('keydown', () => { touched = true; }, { once: true, capture: true });
const BUZZ = {
  nav: 4,
  tick: 8, untick: 8, select: 6, toggle: 12, open: 6, close: 6,
  success: [10, 40, 18], complete: [12, 40, 12, 40, 24],
  warn: [16, 60, 16], error: [22, 60, 22, 60, 22], heavy: 22,
};
/* which sound cue goes with which moment — the vocabulary is sound.js's */
const CUE = {
  nav: 'blip',
  tick: 'tick', untick: 'untick', select: 'drop', toggle: 'tick', open: 'open',
  close: 'close', success: 'done', complete: 'complete', warn: 'error', error: 'error', heavy: 'drop',
};

/* ── the back stack ───────────────────────────────────────────────────────
   Android's back gesture and iOS's edge swipe both mean "go back one step".
   Without this they mean "leave the app", which is a terrible thing to happen
   because you wanted to close a sheet. Each overlay pushes a history entry
   and pops it when it closes, so the stack always matches what is on screen. */
const traps = [];
let popping = false, ignore = 0;
addEventListener('popstate', () => {
  if (ignore > 0) { ignore--; return; }
  const t = traps.pop();
  if (!t) return;
  popping = true;
  try { t.fn(); } finally { popping = false; }
});

/* ── keyboard ─────────────────────────────────────────────────────────────
   --kb is the number of pixels the keyboard is covering, live. Anything that
   must stay visible adds it to its own bottom padding. 60px of threshold
   keeps a collapsing URL bar from being mistaken for a keyboard. */
function wireKeyboard() {
  const vv = g.visualViewport;
  if (!vv) return;
  let raf = 0;
  const sync = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
      const up = kb > 60;
      root.style.setProperty('--kb', (up ? kb : 0) + 'px');
      root.classList.toggle('mb-kb', up);
    });
  };
  vv.addEventListener('resize', sync);
  vv.addEventListener('scroll', sync);
  sync();

  /* A field that opens the keyboard should not then be under it. */
  doc.addEventListener('focusin', e => {
    const t = e.target;
    if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    setTimeout(() => {
      try { t.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' }); } catch (x) { }
    }, 260);
  });
}

/* ── fields ───────────────────────────────────────────────────────────────
   type=number is a trap on a phone: it shows spinners, refuses half-typed
   values, and hands back an empty string for anything it dislikes. text plus
   inputmode gives the numeric keypad and keeps the characters. */
const KINDS = {
  text:     { type: 'text', autocapitalize: 'sentences', enterkeyhint: 'done' },
  name:     { type: 'text', autocapitalize: 'words', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done' },
  number:   { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'done' },
  decimal:  { type: 'text', inputmode: 'decimal', pattern: '[0-9.]*', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'done' },
  money:    { type: 'text', inputmode: 'decimal', pattern: '[0-9.]*', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'done' },
  search:   { type: 'search', inputmode: 'search', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'search' },
  email:    { type: 'email', inputmode: 'email', autocomplete: 'email', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'done' },
  tel:      { type: 'tel', inputmode: 'tel', autocomplete: 'tel', enterkeyhint: 'done' },
  url:      { type: 'url', inputmode: 'url', autocorrect: 'off', autocapitalize: 'none', enterkeyhint: 'go' },
  date:     { type: 'date' },
  time:     { type: 'time' },
  note:     { autocapitalize: 'sentences', enterkeyhint: 'enter' },
};

/* Nested sheets are allowed, so the lock counts rather than toggles. */
let locks = 0;
function lock() { if (locks++ === 0) root.classList.add('mb-locked'); }
function unlock() { if (--locks <= 0) { locks = 0; root.classList.remove('mb-locked'); } }

/* ── the sheet ─────────────────────────────────────────────────────────── */
function sheet(o) {
  base(); o = o || {};
  const wide = o.wide != null ? o.wide : !sheetish();

  const veil = doc.createElement('div'); veil.className = 'mb-veil';
  const panel = doc.createElement('div'); panel.className = 'mb-sheet' + (wide ? ' wide' : '');
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
  if (o.width) panel.style.setProperty('--mb-w', o.width + 'px');

  const grab = doc.createElement('div'); grab.className = 'mb-grab';
  grab.appendChild(doc.createElement('i'));
  panel.appendChild(grab);

  const head = doc.createElement('div'); head.className = 'mb-sheet-head';
  const h3 = doc.createElement('h3'); h3.textContent = o.title || '';
  head.appendChild(h3);
  if (o.dismissable !== false) {
    const x = doc.createElement('button');
    x.className = 'mb-x mb-press mb-tap'; x.type = 'button';
    x.setAttribute('aria-label', 'Close'); x.textContent = '✕';
    x.onclick = () => handle.close();
    head.appendChild(x);
  }
  panel.appendChild(head);

  const body = doc.createElement('div'); body.className = 'mb-sheet-body mb-scroll';
  panel.appendChild(body);

  let closed = false, release = null;
  const handle = {
    /* `box` is the name every existing caller uses for the outer element.
       Both names point at the same node — renaming it would break them. */
    body: body, panel: panel, box: panel, veil: veil, wide: wide,
    close(v) {
      if (closed) return; closed = true;
      if (release) release();
      veil.classList.remove('on');
      panel.classList.remove('on');
      const bye = () => { veil.remove(); panel.remove(); };
      reduced() ? bye() : setTimeout(bye, 320);
      doc.removeEventListener('keydown', onKey);
      unlock();
      if (g.Sfx) g.Sfx.play('close');
      if (o.onClose) o.onClose(v);
    },
  };

  if (typeof o.body === 'function') o.body(body, handle);
  else if (o.body != null) body.innerHTML = o.body;

  if (o.actions && o.actions.length) {
    const foot = doc.createElement('div'); foot.className = 'mb-sheet-foot';
    o.actions.forEach(a => {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'mb-btn mb-press mb-tap' + (a.kind ? ' ' + a.kind : '');
      b.textContent = a.label;
      b.onclick = () => {
        Mobile.haptic(a.kind === 'bad' ? 'warn' : 'select');
        const r = a.fn ? a.fn(handle) : undefined;
        if (r !== false) handle.close(a.value);
      };
      foot.appendChild(b);
    });
    panel.appendChild(foot);
  }

  function onKey(e) {
    if (e.key === 'Escape' && o.dismissable !== false) { e.stopPropagation(); handle.close(); }
    if (e.key === 'Enter' && o.enter && !/TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); o.enter(handle); }
  }
  doc.addEventListener('keydown', onKey);

  if (o.dismissable !== false) veil.onclick = () => handle.close();
  /* Dragging on the backdrop must not scroll whatever is behind it. */
  veil.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

  doc.body.appendChild(veil);
  doc.body.appendChild(panel);
  lock();
  if (o.dismissable !== false) release = Mobile.trap(() => handle.close());
  if (!wide) dragToDismiss(panel, veil, body, () => handle.close());

  /* Force the layout to settle, then flip the class in the same tick. Doing
     this on requestAnimationFrame looks equivalent and is not: a backgrounded
     or throttled tab never runs the frame, and the sheet stays off screen for
     good. Reading offsetHeight is synchronous and always happens. */
  void panel.offsetHeight;
  veil.classList.add('on'); panel.classList.add('on');
  if (g.Sfx) g.Sfx.play('open');
  /* Never steal focus into a field on a phone — that throws the keyboard up
     over the sheet the instant it opens. o.focus asks for it explicitly. */
  if (o.focus) setTimeout(() => { const f = body.querySelector('input,textarea,select'); if (f) f.focus(); }, 380);
  return handle;
}

/* Drag the sheet down to put it away. Starts on the grab handle or the title
   bar, or anywhere in the body once the body is scrolled to its top — which
   is what every native sheet does and what a thumb expects. */
function dragToDismiss(panel, veil, scroller, close) {
  let dragging = false, y0 = 0, dy = 0, vy = 0, lastY = 0, lastT = 0, h = 0;

  const begin = y => {
    dragging = true; y0 = lastY = y; dy = vy = 0;
    h = panel.offsetHeight || 400;
    panel.style.transition = 'none';
  };
  const move = y => {
    const raw = y - y0;
    dy = raw > 0 ? raw : raw / 4;             /* upward gets resistance, not travel */
    const now = performance.now();
    if (now > lastT) { vy = (y - lastY) / (now - lastT); lastT = now; lastY = y; }
    panel.style.transform = 'translateY(' + dy + 'px)';
    veil.style.opacity = String(Math.max(0, 1 - dy / h));
  };
  const end = () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    veil.style.opacity = '';
    /* Either far enough, or fast enough. Flicking a sheet away should work
       even when it has barely moved. */
    if (dy > h * 0.28 || vy > 0.65) { panel.style.transform = ''; close(); }
    else { panel.style.transform = ''; }
  };

  /* pointer events on the handle and the title bar */
  let id = null;
  const onDown = e => {
    if (id !== null) return;
    id = e.pointerId; begin(e.clientY);
    try { panel.setPointerCapture(id); } catch (x) {}
  };
  panel.addEventListener('pointerdown', e => {
    if (!e.target.closest('.mb-grab,.mb-sheet-head')) return;
    if (e.target.closest('button')) return;
    onDown(e);
  });
  panel.addEventListener('pointermove', e => { if (e.pointerId === id && dragging) move(e.clientY); });
  const up = e => { if (e.pointerId === id) { id = null; end(); } };
  panel.addEventListener('pointerup', up);
  panel.addEventListener('pointercancel', up);

  /* touch path for the body, only while it is already at the top */
  let ty = 0, armed = false;
  scroller.addEventListener('touchstart', e => {
    armed = scroller.scrollTop <= 0 && e.touches.length === 1;
    ty = e.touches[0].clientY;
  }, { passive: true });
  scroller.addEventListener('touchmove', e => {
    if (!armed || id !== null) return;
    const y = e.touches[0].clientY;
    if (!dragging) {
      if (y - ty < 8) { if (y - ty < -4) armed = false; return; }
      begin(ty);
    }
    e.preventDefault();                       /* we are driving now, not the scroller */
    move(y);
  }, { passive: false });
  scroller.addEventListener('touchend', () => { armed = false; end(); }, { passive: true });
  scroller.addEventListener('touchcancel', () => { armed = false; end(); }, { passive: true });
}

/* ── swipe a row ───────────────────────────────────────────────────────── */
/* == hold to open a menu ==================================================
   Two gestures start identically and must not be confused:

     a SHORT hold (~500ms) opens a contextual menu — "what can I do with this?"
     a LONG hold (~900ms) picks the thing up to move it — "put this elsewhere"

   They are separated by time on purpose, because separating them by anything
   else means guessing at intent. 500ms is roughly the platform convention for
   a context menu and is comfortably longer than a slow tap.

   A hold that has fired must not also fire the click underneath it, or opening
   the menu about a thing also toggles that thing. That is what the capture
   listener below is for.

   On a desktop the same call wires right-click, because that is what
   right-click has always meant — one call, both surfaces. */
function hold(el, fn, opts) {
  base();
  opts = opts || {};
  const delay = opts.delay || 500;
  let timer = null, sx = 0, sy = 0, fired = false, id = null;
  const cancel = () => { clearTimeout(timer); timer = null; id = null; };

  el.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;  /* right-click has its own path */
    if (opts.skip && e.target.closest(opts.skip)) return;
    id = e.pointerId; sx = e.clientX; sy = e.clientY; fired = false;
    timer = setTimeout(() => {
      fired = true; timer = null;
      /* The buzz is the only signal that the hold registered. Without it you
         cannot tell a working long-press from a dead one until the menu
         appears, by which point you have already held too long. */
      Mobile.haptic('heavy');
      fn(e);
    }, delay);
  }, { passive: true });

  /* Movement means this was a scroll or a drag, not a hold. */
  el.addEventListener('pointermove', e => {
    if (id === null || e.pointerId !== id) return;
    if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) cancel();
  }, { passive: true });

  el.addEventListener('pointerup', cancel, { passive: true });
  el.addEventListener('pointercancel', cancel, { passive: true });

  el.addEventListener('click', e => {
    if (!fired) return;
    fired = false;
    e.preventDefault(); e.stopPropagation();
  }, true);

  el.addEventListener('contextmenu', e => {
    if (opts.skip && e.target.closest(opts.skip)) return;
    e.preventDefault();
    fn(e);
  });

  /* iOS puts its own callout (Copy / Look Up) over a long press on text, and
     nothing else suppresses it. */
  el.style.webkitTouchCallout = 'none';
  return el;
}


function swipe(row, opts) {
  base();
  opts = opts || {};
  const face = doc.createElement('div'); face.className = 'mb-swipe-face';
  while (row.firstChild) face.appendChild(row.firstChild);
  const back = doc.createElement('div'); back.className = 'mb-swipe-back';
  row.classList.add('mb-swipe');
  row.appendChild(back); row.appendChild(face);

  const make = (spec, side) => {
    const b = doc.createElement('button');
    b.type = 'button'; b.className = side; b.textContent = spec.label;
    b.style.background = spec.color || 'var(--danger,#ff6b81)';
    b.onclick = () => { reset(); Mobile.haptic('warn'); spec.fn && spec.fn(); };
    back.appendChild(b);
    return b;
  };
  const right = opts.right ? make(opts.right, 'r') : null;   /* revealed by swiping left */
  const left = opts.left ? make(opts.left, 'l') : null;
  const W = 96;

  let x0 = 0, dx = 0, on = false, live = false;
  const set = v => { face.style.transform = v ? 'translateX(' + v + 'px)' : ''; };
  const reset = () => { on = false; face.style.transition = ''; set(0); };

  row.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    x0 = e.touches[0].clientX; dx = 0; live = false;
    face.style.transition = 'none';
  }, { passive: true });
  row.addEventListener('touchmove', e => {
    dx = e.touches[0].clientX - x0;
    if (!live) { if (Math.abs(dx) < 10) return; live = true; }
    if (dx < 0 && !right) dx = dx / 5;
    if (dx > 0 && !left) dx = dx / 5;
    set(Math.max(-W * 1.4, Math.min(W * 1.4, dx)));
  }, { passive: true });
  row.addEventListener('touchend', () => {
    face.style.transition = '';
    if (dx < -W * .55 && right) { on = true; set(-W); Mobile.haptic('select'); }
    else if (dx > W * .55 && left) { on = true; set(W); Mobile.haptic('select'); }
    else reset();
    live = false;
  }, { passive: true });

  /* one row open at a time, and a tap anywhere else puts it away */
  doc.addEventListener('pointerdown', e => { if (on && !row.contains(e.target)) reset(); }, { passive: true });
  return { reset: reset, face: face };
}

/* ── the API ───────────────────────────────────────────────────────────── */
const Mobile = {
  ios: ios, android: android, touch: touch, standalone: !!standalone,
  compact: compact, sheetish: sheetish, reduced: reduced,
  KINDS: KINDS,

  get haptics() { return cfg.haptics !== false; },
  setHaptics(on) { cfg.haptics = !!on; save(); return Mobile; },

  /** vibrate, where the platform has it. Returns whether anything happened. */
  haptic(kind) {
    if (cfg.haptics === false || !touched) return false;
    const p = BUZZ[kind] || BUZZ.tick;
    try { return navigator.vibrate ? navigator.vibrate(p) !== false : false; } catch (e) { return false; }
  },

  /** the one every component calls: buzz where there is a motor, sound
      everywhere, so an iPhone and a Pixel both answer the tap. */
  feedback(kind, opts) {
    Mobile.haptic(kind);
    if (g.Sfx && CUE[kind]) g.Sfx.play(CUE[kind], opts);
    return Mobile;
  },

  /** the system back gesture closes this, instead of leaving the app.
      Returns a release function to call when you close it yourself. */
  trap(fn) {
    const rec = { fn: fn };
    traps.push(rec);
    try { history.pushState({ mb: traps.length }, ''); } catch (e) {}
    return function release() {
      const i = traps.indexOf(rec);
      if (i < 0) return;
      const wasTop = i === traps.length - 1;
      traps.splice(i, 1);
      /* Only unwind history for the entry actually on top, and only when the
         close did not already come from a popstate. */
      if (wasTop && !popping) { ignore++; try { history.back(); } catch (e) {} }
    };
  },

  sheet: sheet,
  swipe: swipe,
  /** hold to open a contextual menu; right-click does the same with a mouse.
      opts.delay raises the threshold — use ~900 for pick-up-to-move, so the
      two gestures stay tellable apart. opts.skip is a selector for children
      that should keep their own behaviour. */
  hold: hold,

  /** the contextual menu, as a sheet on a phone.
      items: [{label, note, icon, kind:'bad', on:true, fn}] or '-' */
  actions(title, items, opts) {
    opts = opts || {};
    return sheet({
      title: title, width: opts.width || 460, dismissable: true,
      body: (b, h) => {
        const list = doc.createElement('div'); list.className = 'mb-acts';
        (items || []).forEach(it => {
          if (it === '-') { const hr = doc.createElement('hr'); hr.style.cssText = 'border:0;border-top:1px solid var(--border);margin:6px 2px'; return list.appendChild(hr); }
          const b2 = doc.createElement('button');
          b2.type = 'button';
          b2.className = 'mb-act mb-press flat' + (it.kind ? ' ' + it.kind : '') + (it.on ? ' on' : '');
          b2.innerHTML = (it.icon ? '<span class="ic">' + it.icon + '</span>' : '') +
            '<span class="t">' + String(it.label).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) +
            (it.note ? '<small>' + String(it.note).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</small>' : '') + '</span>';
          b2.onclick = () => { Mobile.feedback('select'); h.close(); setTimeout(() => it.fn && it.fn(), 60); };
          list.appendChild(b2);
        });
        b.appendChild(list);
      },
      actions: opts.cancel === false ? null : [{ label: opts.cancelLabel || 'CANCEL' }],
    });
  },

  /** the right keyboard and the right return key for one field */
  field(input, kind, opts) {
    const k = KINDS[kind] || KINDS.text;
    Object.keys(k).forEach(a => {
      if (a === 'type' && input.tagName === 'TEXTAREA') return;
      input.setAttribute(a, k[a]);
    });
    if (opts && opts.enter) input.setAttribute('enterkeyhint', opts.enter);
    if (opts && opts.placeholder) input.placeholder = opts.placeholder;
    if (opts && opts.autocomplete) input.setAttribute('autocomplete', opts.autocomplete);
    return input;
  },

  /** Next moves down the fields, Done on the last one closes the keyboard.
      Without this, Enter reloads a form or does nothing, which is the most
      website-like thing a phone app can do. */
  form(container, onDone) {
    const fields = [].slice.call(container.querySelectorAll('input:not([type=hidden]),textarea,select'))
      .filter(f => !f.disabled && f.type !== 'button');
    fields.forEach((f, i) => {
      const last = i === fields.length - 1;
      if (f.tagName !== 'TEXTAREA' && !f.getAttribute('enterkeyhint')) {
        f.setAttribute('enterkeyhint', last ? 'done' : 'next');
      }
      f.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || f.tagName === 'TEXTAREA') return;
        e.preventDefault();
        if (last) { f.blur(); onDone && onDone(); }
        else fields[i + 1].focus();
      });
    });
    return fields;
  },

  /** make anything feel pressable: press state, hit area, feedback, action */
  pressable(el, fn, kind) {
    el.classList.add('mb-press', 'mb-tap');
    if (fn) el.addEventListener('click', e => { Mobile.feedback(kind || 'select'); fn(e); });
    return el;
  },
};

/* ── boot ── */
base();
chrome();
wirePress();
wireKeyboard();

g.Mobile = Mobile;
})(window);
