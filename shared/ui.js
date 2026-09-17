/* ══════════════════════ MOTHERBASE · UI ══════════════════════
   The shared furniture: toasts, dialogs, confirms, menus, and the standard
   Settings panel every app opens.

   Apps may look different — themes are chosen per app on purpose — but a
   dialog should be a dialog everywhere. This is what makes the suite read as
   one product wearing different jackets instead of four unrelated apps.

   Every colour here is a skin token with a fallback, so this file looks right
   whether or not skins.js has painted the page yet.

     <script src="shared/ui.js"></script>
     UI.toast('saved');
     await UI.confirm('Delete this routine?', 'The tick history stays.');
     UI.settings('block', [{id:'rules', name:'RULES', draw(el){…}}]);
*/
(function (g) {
'use strict';

const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const beep = (cue, o) => { if (g.Sfx) g.Sfx.play(cue, o); };

/* ── the stylesheet ──
   mobile.js owns the sheet, the button and the press states; this file owns
   the furniture that sits on top of them. When mobile.js is not loaded — an
   app that has not been wired to it yet — the LEGACY block at the bottom puts
   back the desktop styling those pieces used to have, so nothing an older app
   already relies on loses its face. */
function css() {
  if (document.getElementById('mb-ui-css')) return;
  const s = el('style'); s.id = 'mb-ui-css';
  s.textContent = `
/* ── the snackbar ──
   Sits above the home indicator and above the keyboard, never under either.
   An undo action holds it open longer, because a message you might act on is
   not the same as a message you only read. */
/* The picture, when the system would not take the file. Held rather than
   downloaded, because a long press is the one route into Photos that needs
   nobody's permission. */
.mb-shotveil{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.86);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:var(--s-4);padding:var(--s-4);padding-bottom:calc(var(--s-4) + env(safe-area-inset-bottom))}
.mb-shotveil img{max-width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius-md)}
.mb-shotsay{color:#fff;font-size:var(--f-2);text-align:center;opacity:.9}
.mb-shotx{min-height:var(--tap);padding:0 var(--s-5);border-radius:var(--radius-sm);
  border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;
  font:inherit;font-size:var(--f-2);cursor:pointer}
/* ── a fold in a settings tab (UI.more) ── */
.mb-more{margin-top:var(--s-4,16px);border-top:1px solid var(--border,#1e2a38)}
.mb-more-h{display:flex;align-items:center;justify-content:space-between;width:100%;
  min-height:var(--tap,44px);padding:0;background:none;border:0;cursor:pointer;
  color:var(--text-2,#b8c9d8);font:inherit;font-size:var(--f-1,12px);
  letter-spacing:var(--track-cap,.08em);text-transform:uppercase}
.mb-more-h i{width:var(--s-2,8px);height:var(--s-2,8px);margin-right:var(--s-2,8px);
  border-right:2px solid currentColor;border-bottom:2px solid currentColor;
  transform:rotate(45deg);transition:transform var(--dur-fast,120ms)}
.mb-more.open .mb-more-h i{transform:rotate(-135deg)}
.mb-more-b{display:none}
.mb-more.open .mb-more-b{display:block}
/* ── the share panel (IO.share) ──
   The picture on a checkerboard, so what is see-through reads as see-through. */
.mb-sharepv{display:flex;justify-content:center;margin-bottom:var(--s-2)}
.mb-sharepv img{height:44vh;height:44svh;max-width:100%;aspect-ratio:9/16;object-fit:contain;
  border-radius:var(--radius-md);border:var(--border-width,1px) solid var(--border);
  background:repeating-conic-gradient(var(--surface-3) 0 25%,var(--surface-2) 0 50%) 0 0/var(--s-4) var(--s-4);
  transition:opacity var(--dur-fast,120ms)}
.mb-sharepv img.wait{opacity:.45}
.mb-sharelbl{font-size:var(--f-1);letter-spacing:var(--track-cap);text-transform:uppercase;
  color:var(--text-muted);margin:var(--s-3) 0 var(--s-2)}
.mb-shotstage{position:fixed;left:-99999px;top:0;pointer-events:none}
/* See-through, for the Transparent and Translucent pictures: the card itself.
   An app can go further for its own inner surfaces. */
.mb-glass{background:color-mix(in srgb,var(--surface-1) 32%,transparent)!important;box-shadow:none!important}
.mb-glass,.mb-glass *{text-shadow:0 1px 2px rgba(0,0,0,.45)}
.mb-timefield{display:flex;gap:var(--s-2);align-items:stretch}
.mb-timefield input{flex:1;min-width:0}
.mb-ampm{flex:none;min-width:56px;min-height:var(--tap);padding:0 var(--s-3);
  border:1px solid var(--border);border-radius:var(--radius-sm);
  background:var(--surface-3);color:var(--text-1);font:inherit;
  font-size:var(--f-1);letter-spacing:.08em;cursor:pointer}
.mb-ampm:disabled{opacity:.4;cursor:default}
.mb-toast{position:fixed;left:50%;z-index:9000;
  bottom:calc(var(--s-5,24px) + var(--safe-b,0px) + var(--kb,0px));
  transform:translate(-50%,14px) scale(.97);opacity:0;pointer-events:none;
  display:flex;align-items:center;gap:var(--s-3,12px);
  padding:var(--s-3,12px) var(--s-4,16px);font-size:var(--f-2,14px);
  transition:opacity var(--dur-med,240ms) var(--ease-out,ease),transform var(--dur-med,240ms) var(--ease-out,ease);
  background:var(--surface-3,#1a2430);color:var(--text-1,#dbe7f0);
  border-radius:var(--radius-full,999px);box-shadow:var(--e-4,0 15px 25px rgba(0,0,0,.3));
  font-family:var(--font-body,system-ui);max-width:min(460px,calc(100vw - 24px))}
.mb-toast.on{opacity:1;transform:translate(-50%,0) scale(1);pointer-events:auto}
.mb-toast .msg{flex:1;min-width:0;line-height:1.4}
.mb-toast b{color:var(--accent,#7ee8fa)}
.mb-toast.bad b{color:var(--danger,#ff6b81)}
.mb-toast .act{flex:0 0 auto;border:0;background:none;cursor:pointer;font:inherit;
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);font-weight:var(--w-bold,700);
  letter-spacing:var(--track-cap,.18em);color:var(--accent,#7ee8fa);padding:0 var(--s-1,4px)}

/* ── rows and options, the furniture of every settings pane ── */
.mb-row{display:flex;align-items:center;gap:var(--s-3,12px);padding:var(--s-3,12px) 0;
  min-height:var(--tap,44px);border-bottom:1px solid var(--border,#1e2a38)}
.mb-row:last-child{border-bottom:0}
.mb-row .lbl{flex:1;min-width:0}
/* A text box or a select is width:100%, so beside a label it claimed the
   whole row and squeezed the label to 0px, at every width. A row holding one
   stacks instead: label, then the field under it. A short box given its own
   max-width stays beside its label. Found by TRAIN, which did this itself. */
.mb-row:has(> .mb-input:not([style*="max-width"])),
.mb-row:has(> .mb-sel){flex-direction:column;align-items:stretch;gap:var(--s-2,8px)}
.mb-row:has(> .mb-input:not([style*="max-width"])) > .lbl,
.mb-row:has(> .mb-sel) > .lbl{flex:none}
.mb-row .lbl b{display:block;font-weight:var(--w-bold,700);font-size:var(--f-2,14px);color:var(--text-1,#dbe7f0)}
.mb-row .lbl span{display:block;color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);line-height:1.5;margin-top:2px}
/* No border here on purpose. Two background colours already separate the row
   from the pane, and a border on top of that is one separator too many. */
.mb-opt{display:flex;align-items:center;gap:var(--s-3,12px);width:100%;text-align:left;
  margin-bottom:var(--s-2,8px);cursor:pointer;min-height:var(--tap,44px);
  padding:var(--s-3,12px);border:0;border-radius:var(--radius-md,10px);
  background:var(--surface-2,#131b26);color:inherit;font:inherit}
.mb-opt.bad{color:var(--danger,#ff6b81)}
.mb-opt .ic{width:20px;text-align:center;color:var(--accent,#7ee8fa);flex:0 0 auto}
.mb-opt .t{flex:1;min-width:0}
.mb-opt .t b{display:block;font-size:var(--f-2,14px)}
.mb-opt .t span{color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);line-height:1.5}

.mb-group{font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);
  font-weight:var(--w-bold,700);letter-spacing:var(--track-cap,.18em);
  color:var(--text-muted,#5b6d80);margin:var(--s-5,24px) 0 var(--s-2,8px)}
.mb-group:first-child{margin-top:var(--s-2,8px)}

/* ── the segmented control ──
   Replaces the desktop tab strip. Thumb-sized, one visible group, and the
   selection slides instead of blinking, so it reads as one physical control
   rather than five buttons that happen to be next to each other. */
.mb-seg{position:relative;display:flex;gap:2px;padding:3px;flex:0 0 auto;
  background:var(--surface-2,#131b26);border-radius:var(--radius-md,10px);
  overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.mb-seg::-webkit-scrollbar{height:0}
.mb-seg i.ind{position:absolute;top:3px;bottom:3px;left:0;border-radius:calc(var(--radius-md,10px) - 3px);
  background:var(--surface-1,#0e141d);box-shadow:var(--e-1,0 1px 3px rgba(0,0,0,.3));pointer-events:none;
  transition:transform var(--dur-med,240ms) var(--ease-out,ease),width var(--dur-med,240ms) var(--ease-out,ease)}
.mb-seg button{position:relative;z-index:1;flex:1 0 auto;min-height:var(--tap,44px);padding:0 var(--s-3,12px);
  border:0;background:none;cursor:pointer;white-space:nowrap;
  font-family:var(--font-display,system-ui);font-size:var(--f-1,12px);font-weight:var(--w-bold,700);
  letter-spacing:.1em;color:var(--text-muted,#5b6d80);
  transition:color var(--dur-fast,140ms) linear}
.mb-seg button.on{color:var(--text-1,#dbe7f0)}

/* ── the switch ──
   The one control whose state has to be readable without reading anything. */
.mb-sw{flex:0 0 auto;width:50px;height:30px;border:0;padding:2px;cursor:pointer;
  border-radius:var(--radius-full,999px);background:var(--surface-3,#1a2430);
  transition:background-color var(--dur-med,240ms) var(--ease-out,ease)}
.mb-sw i{display:block;width:26px;height:26px;border-radius:50%;background:var(--text-muted,#5b6d80);
  box-shadow:var(--e-1,0 1px 3px rgba(0,0,0,.3));
  transition:transform var(--dur-med,240ms) var(--ease-sheet,ease),background-color var(--dur-med,240ms)}
.mb-sw.on{background:var(--accent,#7ee8fa)}
.mb-sw.on i{transform:translateX(20px);background:var(--accent-fg,#04212a)}

/* ── chips, sliders, fields ── */
.mb-chips{display:flex;flex-wrap:wrap;gap:var(--s-2,8px)}
.mb-chip{min-height:var(--tap,44px);padding:0 var(--s-4,16px);cursor:pointer;
  border:1px solid var(--border,#1e2a38);border-radius:var(--radius-full,999px);
  background:var(--surface-2,#131b26);color:var(--text-2,#7f93a8);font:inherit;font-size:var(--f-2,14px)}
.mb-chip.on{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa);background:var(--surface-3,#1a2430)}
.mb-range{width:100%;height:var(--tap,44px);accent-color:var(--accent,#7ee8fa);background:none}
.mb-sel,.mb-input{min-height:var(--tap,44px);width:100%;
  background:var(--surface-2,#131b26);border:1px solid var(--border,#1e2a38);
  border-radius:var(--radius-md,10px);padding:0 var(--s-3,12px);color:inherit;font:inherit;
  font-size:var(--f-3,16px)}
/* A native select on a phone opens the system picker, which is exactly right.
   Only its closed-state chrome is replaced, never the picker itself. */
.mb-sel{-webkit-appearance:none;appearance:none;padding-right:var(--s-6,32px);
  background-image:linear-gradient(45deg,transparent 50%,currentColor 50%),
    linear-gradient(135deg,currentColor 50%,transparent 50%);
  background-position:calc(100% - 17px) 55%,calc(100% - 12px) 55%;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat}
.mb-input:focus,.mb-sel:focus{outline:2px solid var(--focus,#7ee8fa);outline-offset:-1px}
.mb-swatch{width:44px;height:34px;flex:0 0 auto;padding:0;cursor:pointer;
  border:1px solid var(--border,#1e2a38);border-radius:var(--radius-sm,6px);background:none}

/* ── the desktop popover menu ──
   Only ever seen with a mouse: on a phone UI.menu opens an action sheet. */
.mb-menu{position:fixed;z-index:9100;min-width:190px;padding:5px;
  background:var(--surface-1,#0e141d);border:1px solid var(--border-strong,#2b3a4d);
  border-radius:var(--radius-md,10px);box-shadow:var(--e-3,0 10px 20px rgba(0,0,0,.3));
  font-family:var(--font-body,system-ui);font-size:var(--f-2,14px)}
.mb-menu button{display:flex;align-items:center;gap:var(--s-2,8px);width:100%;text-align:left;padding:8px 10px;border:0;background:none;
  cursor:pointer;color:var(--text-2,#7f93a8);border-radius:var(--radius-sm,6px);font:inherit}
.mb-menu button > span{flex:1;min-width:0}
.mb-menu button.on{color:var(--accent,#7ee8fa)}
.mb-menu button.bad{color:var(--danger,#ff6b81)}
.mb-menu hr{border:0;border-top:1px solid var(--border,#1e2a38);margin:4px 2px}

/* Hover is a mouse idea. On a touch screen it sticks after a tap and looks
   broken, so it only exists where there is a real pointer. */
@media (hover:hover) and (pointer:fine){
  .mb-opt:hover{background:var(--surface-3,#1a2430)}
  .mb-chip:hover{border-color:var(--accent,#7ee8fa);color:var(--text-1,#dbe7f0)}
  .mb-seg button:hover{color:var(--text-2,#7f93a8)}
  .mb-menu button:hover{background:var(--surface-2,#131b26);color:var(--text-1,#dbe7f0)}
  .mb-menu button.bad:hover{color:var(--danger,#ff6b81)}
  .mb-toast .act:hover{color:var(--accent-hover,#7ee8fa)}
}
@media (prefers-reduced-motion:reduce){.mb-toast,.mb-seg i.ind,.mb-sw,.mb-sw i{transition:none}}
`;
  document.head.appendChild(s);

  /* ── LEGACY ──
     Only reached by a page that loads ui.js without mobile.js. Everything in
     here used to live in this file and now lives in mobile.js; this is a copy
     so an app that has not been migrated keeps exactly the dialog it had. */
  if (!g.Mobile) {
    const l = el('style'); l.id = 'mb-ui-legacy';
    l.textContent = `
/* min-width so the same label is roughly the same button in every theme. A
   pixel face is genuinely wider than a condensed sans, so short labels used
   to measure 73px in one theme and 124px in another. This holds the floor;
   the clamp on letter spacing in skins.js holds the ceiling. */
.mb-btn{padding:7px 15px;min-width:88px;border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-sm,8px);
  background:none;cursor:pointer;font-family:var(--font-display,system-ui);font-size:11px;letter-spacing:.1em;
  color:var(--text-2,#7f93a8)}
.mb-btn:hover{color:var(--text-1,#dbe7f0);border-color:var(--text-muted,#5b6d80)}
.mb-btn.go{border-color:var(--accent,#7ee8fa);color:var(--accent,#7ee8fa);background:var(--surface-2,#131b26)}
.mb-btn.bad{border-color:var(--danger,#ff6b81);color:var(--danger,#ff6b81)}
.mb-btn:focus-visible{outline:2px solid var(--focus,#7ee8fa);outline-offset:2px}
.mb-veil{position:fixed;inset:0;z-index:8900;display:flex;align-items:center;justify-content:center;padding:20px;
  background:var(--overlay,rgba(4,7,11,.72));backdrop-filter:blur(3px)}
.mb-sheet{position:relative;width:min(var(--mb-w,520px),96vw);max-height:88vh;max-height:88svh;display:flex;flex-direction:column;
  background:var(--surface-1,#0e141d);color:var(--text-1,#dbe7f0);
  border:1px solid var(--border-strong,#2b3a4d);border-radius:var(--radius-md,14px);
  box-shadow:0 30px 80px -30px #000;font-family:var(--font-body,system-ui);font-size:13px;overflow:hidden}
.mb-grab{display:none}
.mb-sheet-head{display:flex;align-items:center;gap:8px;padding:16px 18px 12px;flex:0 0 auto}
.mb-sheet-head h3{margin:0;flex:1;font-family:var(--font-display,system-ui);font-size:13px;font-weight:600;
  letter-spacing:.18em;color:var(--accent,#7ee8fa)}
.mb-x{width:30px;height:30px;border:0;border-radius:50%;background:none;color:var(--text-muted,#5b6d80);cursor:pointer}
.mb-sheet-body{padding:0 18px 4px;overflow:auto;flex:1;min-height:0;line-height:1.65}
.mb-sheet-foot{display:flex;gap:8px;justify-content:flex-end;padding:14px 18px 16px;flex:0 0 auto;
  border-top:1px solid var(--border,#1e2a38);margin-top:12px}
.mb-act{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 12px;border:0;
  cursor:pointer;border-radius:var(--radius-md,10px);background:var(--surface-2,#131b26);color:inherit;font:inherit}
`;
    document.head.appendChild(l);
  }
}

let toastEl, toastT;
/* Every overlay in the suite goes through mobile.js when it is loaded, which
   is what makes the same call site a bottom sheet on a phone and a centred
   card on a laptop. Without mobile.js these fall back to the plain versions,
   so nothing that already calls UI breaks. */
const M = () => g.Mobile;
let menuAway = null;   /* the listener that closes an open desktop menu */
const buzz = (kind, opts) => { const m = M(); if (m) m.feedback(kind, opts); else if (g.Sfx) g.Sfx.play(kind === 'warn' ? 'error' : 'drop'); };

/* which UI.more folds are open, by key, so a tab that redraws keeps them open */
const MORE_OPEN = {};

const UI = {
  el: el, esc: esc,

  /* ══════════════ TYPING A TIME ══════════════
     Tom, 2026-09-05: "Time entry in block is still this super wonky thing
     where hours and minutes are separate, I should also be able to click on PM
     to turn it to AM."

     `<input type="time">` is one tag and the browser draws it. A phone gives a
     wheel, which is fine. A desktop gives three little spinners you tab
     between, which is not. So on a pointer device it becomes a box you type
     into, with a button beside it that says AM or PM and flips when clicked.

     THE TYPING RULE, said once: a bare hour means the NEXT time that hour
     comes round. At eight in the morning, 9 is this morning. At ten, the same
     9 is tonight. That is what you meant both times.

       9      the next 9 o'clock
       930    9:30, same rule          9:30  9.30  9 30   all the same
       9pm    said outright, no guessing
       21 2130 21:30   past twelve, so it can only mean one thing         */
  smartTime(raw, nowMin, prev) {
    let t = String(raw == null ? '' : raw).trim().toLowerCase();
    if (!t) return null;
    const ap = /am\b/.test(t) ? 'am' : /pm\b/.test(t) ? 'pm' : null;
    t = t.replace(/[ap]m\b/g, '').trim();

    let h = null, m = 0;
    const mt = t.match(/^(\d{1,2})\s*[:.\s]\s*(\d{1,2})$/);
    if (mt) { h = +mt[1]; m = +mt[2]; }
    else if (/^\d{3,4}$/.test(t)) { h = +t.slice(0, t.length - 2); m = +t.slice(-2); }
    else if (/^\d{1,2}$/.test(t)) { h = +t; m = 0; }
    else return null;
    if (!(h >= 0 && h <= 24) || !(m >= 0 && m <= 59)) return null;
    if (h === 24) h = 0;

    const two = n => String(n).padStart(2, '0');
    const out = hh => two(hh % 24) + ':' + two(m);
    if (ap === 'am') return out(h === 12 ? 0 : h);
    if (ap === 'pm') return out(h === 12 ? 12 : h + 12);
    if (h > 12 || h === 0) return out(h);

    /* ── which half of the day a bare hour means ──
       If the field ALREADY held a time, keep the half it was in. Changing a
       routine that starts at 07:00 to "930" means half past nine in the
       MORNING; reading it as the next nine-thirty from now would make it the
       evening every afternoon, which is wrong in BLOCK every single time.

       Only an empty field falls back to the next time that hour comes round,
       which is what you want when the question is "when will I do this".

       Either way the AM/PM button next to it settles it in one tap, so
       neither reading can be a trap. */
    const pm = /^\d{1,2}/.test(String(prev || '')) ? (+String(prev).split(':')[0] >= 12) : null;
    if (pm !== null) return out(pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h));

    const now = nowMin == null ? (new Date().getHours() * 60 + new Date().getMinutes()) : nowMin;
    const a = (h === 12 ? 0 : h) * 60 + m;
    const b = (h === 12 ? 12 : h + 12) * 60 + m;
    const fwd = x => (x - now + 1440) % 1440;
    const pick = fwd(a) <= fwd(b) ? a : b;
    return two(Math.floor(pick / 60)) + ':' + two(pick % 60);
  },

  /* ── putting the caret in a field as a panel opens ──
     Harder than it looks, and it has been got wrong twice here.

     iOS only raises the keyboard when focus() happens INSIDE the gesture that
     the person made. A focus() in a callback, an animation end, or a plain
     setTimeout is ignored: the caret appears and the keyboard does not, which
     looks like the app forgetting what you asked for.

     And a panel builder runs BEFORE the panel is in the document, so focusing
     from inside one lands on an element on no page at all and does nothing.

     So: call this straight after the panel is open, still inside the tap. It
     focuses immediately, which is the call iOS honours, and once more after
     the panel has finished rising, which is the one that survives a transform.
     Both are harmless twice over. */
  focusSoon(input, reopening) {
    if (!input) return input;
    const go = () => {
      try {
        input.focus({ preventScroll: true });
        if (input.setSelectionRange && typeof input.value === 'string') {
          /* A number already in the box is a thing you REPLACE, so it comes up
             selected; words are a thing you carry on writing, so the caret
             goes to the end. See `isNumberBox` below for why that line and not
             another one. */
          if (UI.isNumberBox(input)) input.select();
          else { const n = input.value.length; input.setSelectionRange(n, n); }
        }
      } catch (e) {}
    };
    go();
    setTimeout(go, reopening ? 40 : 130);
    return input;
  },

  /* ── a number is replaced, words are edited ──
     Tom, 2026-09-17: "text entry in spending not auto selected - I want a
     foundational fix where relevant", and `where relevant` is the whole
     question. The line that holds everywhere: a box holding an AMOUNT is one
     you retype, and a box holding WORDS is one you add to. Nobody edits
     "1,040" into "1,050" character by character, and nobody wants a note they
     were halfway through wiped by the next keypress.

     Read off the box rather than set per call site, so an app gets it without
     being edited and cannot forget. A box that genuinely wants the caret left
     alone says so with `data-keep-caret`. */
  /** Blur whatever is focused, so a field that commits on blur commits now.
      Called for you when the page is hidden or going; exposed for an app that
      needs to do it at another moment, such as before it writes. */
  commitFocused() { commitFocused(); },

  isNumberBox(n) {
    if (!n || n.tagName !== 'INPUT') return false;
    if (n.hasAttribute('data-keep-caret')) return false;
    if (n.type === 'number') return true;
    const im = n.inputMode || n.getAttribute('inputmode') || '';
    return /^(numeric|decimal)$/.test(im);
  },

  /** "09:30" -> "9:30am" */
  clockLabel(v) {
    const p = String(v || '').split(':');
    if (p.length !== 2) return '';
    const h = +p[0], m = +p[1];
    if (!isFinite(h) || !isFinite(m)) return '';
    const ampm = h < 12 ? 'am' : 'pm';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':' + String(m).padStart(2, '0') + ampm;
  },

  /** A time control. The wheel on a phone; a box you type into, plus an
      AM/PM button, on anything with a pointer. `onset` gets "HH:MM" or "". */
  timeField(value, onset) {
    /* It styles itself. It used to leave its box bare and never load the
       shared stylesheet, so in an app that had not loaded it some other way
       (BLOCK) the box was the browser's default white with pale theme text in
       it, and AM/PM was loose text. Tom, 2026-09-14: "why is the contrast bad
       in BLOCK". */
    css();
    let val = value || '';
    const fine = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
    const wrap = el('div', 'mb-timefield');

    if (!fine) {
      const i = document.createElement('input');
      i.className = 'mb-input';
      i.type = 'time'; i.value = val;
      i.onchange = () => { val = i.value; onset(val); };
      wrap.appendChild(i);
      return wrap;
    }

    const i = document.createElement('input');
    i.className = 'mb-input';
    i.type = 'text'; i.inputMode = 'numeric'; i.autocomplete = 'off';
    i.placeholder = '930';

    /* ── the colon types itself ──
       Tom, 2026-09-05: "I dont want to have to manually type a colon."
       Right - punctuation is the one thing a numeric keypad makes awkward, and
       a time is the one field where everybody knows the shape already.

       Type 9, 3, 0 and it reads 9:30 as you go. Digits only, four at most, and
       the colon slides in as soon as there are three. Letters pass straight
       through untouched so "9pm" still works for anyone who types it, and
       everyone else never sees a colon key. */
    i.oninput = () => {
      const v = i.value;
      if (/[a-z]/i.test(v)) return;
      const d = v.replace(/[^0-9]/g, '').slice(0, 4);
      const shown = d.length >= 3 ? d.slice(0, d.length - 2) + ':' + d.slice(-2) : d;
      if (shown === i.value) return;
      i.value = shown;
      try { i.setSelectionRange(shown.length, shown.length); } catch (e) {}
    };
    const half = el('button', 'mb-ampm');
    half.type = 'button';

    const show = () => {
      i.value = val ? UI.clockLabel(val).replace(/[ap]m$/, '') : '';
      half.textContent = val ? (+val.split(':')[0] < 12 ? 'AM' : 'PM') : '--';
      half.disabled = !val;
    };
    const settle = () => {
      /* `val` is what the field held before this edit, so a bare hour keeps
         its half of the day. */
      const v = UI.smartTime(i.value, null, val);
      if (v) { val = v; onset(val); }
      else if (!i.value.trim()) { val = ''; onset(''); }
      show();
    };
    i.onblur = settle;
    i.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); settle(); i.blur(); } };

    /* Half a day either way, which is the only thing AM/PM can ever mean. */
    half.onclick = () => {
      if (!val) return;
      const p = val.split(':');
      val = String((+p[0] + 12) % 24).padStart(2, '0') + ':' + p[1];
      onset(val); show();
    };
    half.title = 'Switch morning and afternoon';

    show();
    wrap.appendChild(i); wrap.appendChild(half);
    return wrap;
  },


  /** The snackbar. `opts.action = {label, fn}` turns it into an undo. */
  toast(html, opts) {
    css(); opts = opts || {};
    if (!toastEl) { toastEl = el('div', 'mb-toast'); document.body.appendChild(toastEl); }
    toastEl.className = 'mb-toast' + (opts.bad ? ' bad' : '');
    toastEl.innerHTML = '';
    const msg = el('div', 'msg'); msg.innerHTML = html;
    toastEl.appendChild(msg);
    if (opts.action) {
      const a = el('button', 'act mb-tap', esc(opts.action.label));
      a.type = 'button';
      a.onclick = () => { clearTimeout(toastT); toastEl.classList.remove('on'); buzz('select'); opts.action.fn(); };
      toastEl.appendChild(a);
    }
    void toastEl.offsetHeight;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    /* Long enough to notice, and longer again when there is something to
       press — a message you might act on is not one you only read. */
    toastT = setTimeout(() => toastEl.classList.remove('on'), opts.ms || (opts.action ? 6000 : 2600));
    if (opts.bad) buzz('warn'); else if (opts.action) buzz('select');
  },

  /** Delete something and offer it straight back. Nothing in this suite
      should ever destroy work without a way out of it. */
  undo(message, fn, opts) {
    UI.toast(message, Object.assign({ action: { label: 'UNDO', fn: fn } }, opts || {}));
  },

  /** the one dialog. `body` is a function that fills the content element.
      A bottom sheet on a phone, a centred card on a desktop, same call. */
  dialog(o) {
    css();
    const m = M();
    if (m) return m.sheet(o);
    return legacyDialog(o);
  },

  /** a real confirm, in the app's own clothes. The destructive button is
      filled rather than outlined, because it is the one you must not mistap. */
  confirm(question, detail, opts) {
    opts = opts || {};
    return new Promise(res => {
      let done = false;
      UI.dialog({
        title: opts.title || 'CONFIRM',
        width: 420,
        body: b => {
          b.appendChild(el('p', null, '<b style="color:var(--text-1,#dbe7f0);font-size:var(--f-4,18px);' +
            'font-weight:var(--w-bold,700);line-height:1.4">' + esc(question) + '</b>'));
          if (detail) b.appendChild(el('p', null, esc(detail)));
        },
        actions: [
          { label: opts.no || 'CANCEL', fn: () => { done = true; res(false); } },
          { label: opts.yes || 'YES', kind: opts.danger ? 'bad' : 'go', fn: () => { done = true; res(true); } },
        ],
        onClose: () => { if (!done) res(false); },
      });
    });
  },

  /** items: [{label, note, icon, kind, on, fn}] or '-' for a divider.
      x and y are where a mouse was; a phone ignores them and comes up from
      the bottom, which is where a thumb already is. */
  menu(x, y, items, opts) {
    css(); UI.closeMenus();
    /* An item may carry `sub`, a list of its own, and `check`, which marks
       the one in force. Neither was drawn until 2026-09-15: WEIGHT's range
       and BESIDE's measures offered a Show and a Measures that did nothing
       when chosen, which is a bug reported as a missing feature (DOCTRINE,
       law 3). A sub opens as a menu of its own in the same place; on a
       phone that is a second sheet. */
    items = (items || []).map(it => (!it || it === '-' || typeof it !== 'object') ? it : Object.assign({}, it, {
      on: !!(it.on || it.check),
      fn: it.sub ? () => UI.menu(x, y, it.sub, Object.assign({}, opts, { title: it.label })) : it.fn,
    })).filter(Boolean);
    const m = M();
    if (m && m.sheetish()) return m.actions((opts && opts.title) || '', items, opts);

    const ico = role => (g.Icons && g.Icons.svg) ? g.Icons.svg(role, { size: 14 }) : '';
    const box = el('div', 'mb-menu');
    items.forEach(it => {
      if (it === '-') return box.appendChild(el('hr'));
      const b = el('button', (it.kind || '') + (it.on ? ' on' : ''),
        '<span>' + esc(it.label) + '</span>' + (it.on ? ico('done') : '') + (it.sub ? ico('next') : ''));
      b.onclick = () => { UI.closeMenus(); buzz('select'); it.fn && it.fn(); };
      box.appendChild(b);
    });
    box.style.left = '-9999px'; document.body.appendChild(box);
    const r = box.getBoundingClientRect();
    box.style.left = Math.min(x, innerWidth - r.width - 8) + 'px';
    box.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    /* The next press anywhere closes it — except a press on the menu itself.
       That one used to close it too, removing the item before its click could
       land, so on a wide window nothing in a menu could be chosen with a mouse
       (root brief, foundation item 11). */
    const away = e => {
      if (e.target && e.target.closest && e.target.closest('.mb-menu')) return;
      UI.closeMenus();
    };
    menuAway = away;
    setTimeout(() => { if (menuAway === away) document.addEventListener('pointerdown', away); }, 0);
    return box;
  },
  closeMenus() {
    if (menuAway) { document.removeEventListener('pointerdown', menuAway); menuAway = null; }
    document.querySelectorAll('.mb-menu').forEach(n => n.remove());
  },

  /* ── components ──
     Small, and deliberately so. An app that needs a control that is not here
     should say why before adding one. */

  /** the segmented control. items:[{id,name}] — returns the element. */
  segmented(items, value, onChange) {
    css();
    const box = el('div', 'mb-seg');
    const ind = el('i', 'ind');
    box.appendChild(ind);
    let cur = value;
    const slide = () => {
      const b = box.querySelector('button.on');
      if (!b) return;
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = 'translateX(' + (b.offsetLeft - 3) + 'px)';
      /* keep the live one on screen when the strip is wider than the phone */
      if (b.offsetLeft < box.scrollLeft || b.offsetLeft + b.offsetWidth > box.scrollLeft + box.clientWidth) {
        box.scrollTo({ left: Math.max(0, b.offsetLeft - 12), behavior: 'smooth' });
      }
    };
    items.forEach(it => {
      const b = el('button', it.id === cur ? 'on' : '', esc(it.name));
      b.type = 'button';
      b.onclick = () => {
        if (it.id === cur) return;
        cur = it.id;
        box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        slide(); buzz('select');
        onChange && onChange(it.id);
      };
      box.appendChild(b);
    });
    /* Place the indicator before it is ever painted, so it does not slide in
       from zero the first time. Synchronous for the same reason the sheet is:
       a frame callback is not guaranteed to run. */
    ind.style.transition = 'none';
    setTimeout(() => { slide(); ind.style.transition = ''; }, 0);
    box.select = id => { const b = [].find.call(box.querySelectorAll('button'), (x, i) => items[i].id === id); if (b) b.click(); };
    return box;
  },

  /** the switch. Returns the element; read `.on` for its state. */
  toggle(on, onChange) {
    css();
    const b = el('button', 'mb-sw' + (on ? ' on' : ''));
    b.type = 'button';
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.appendChild(el('i'));
    b.on = !!on;
    b.onclick = () => {
      b.on = !b.on;
      b.classList.toggle('on', b.on);
      b.setAttribute('aria-checked', b.on ? 'true' : 'false');
      buzz('toggle');
      onChange && onChange(b.on);
    };
    return b;
  },

  /** a settings row with a label, a description and a control on the right */
  row(title, note, control) {
    const r = el('div', 'mb-row');
    r.appendChild(el('div', 'lbl', '<b>' + esc(title) + '</b>' + (note ? '<span>' + note + '</span>' : '')));
    if (control) r.appendChild(control);
    return r;
  },

  /** A fold-away part of a settings tab, closed until opened, so a tab leads
      with what gets changed. Tom, 2026-09-15: settings are intuitive and never
      overwhelming. `fill(box)` draws what is inside, the first time it opens.
      `key` keeps it open while the tab redraws. */
  more(title, fill, key) {
    css();
    const wrap = el('div', 'mb-more');
    const head = el('button', 'mb-more-h mb-press', '<span>' + esc(title) + '</span><i aria-hidden="true"></i>');
    head.type = 'button';
    const body = el('div', 'mb-more-b');
    let drawn = false;
    const set = open => {
      wrap.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && !drawn) { drawn = true; fill(body); }
    };
    head.onclick = () => {
      const open = !wrap.classList.contains('open');
      if (key) MORE_OPEN[key] = open;
      set(open); buzz('select');
    };
    wrap.appendChild(head); wrap.appendChild(body);
    set(!!(key && MORE_OPEN[key]));
    return wrap;
  },

  /** an input that already knows which keyboard it wants */
  field(kind, opts) {
    css();
    opts = opts || {};
    const i = el(kind === 'note' ? 'textarea' : 'input', 'mb-input');
    if (kind === 'note') i.rows = opts.rows || 3;
    const m = M();
    if (m) m.field(i, kind, opts); else i.type = 'text';
    if (opts.placeholder) i.placeholder = opts.placeholder;
    if (opts.value != null) i.value = opts.value;
    return i;
  },

  /* ── settings ──
     Two tabs. Look, sound and feel are all "how this app comes across", which
     is one idea and does not need three places to live. */
  /** This page's own version, from <meta name="mb-version" content="1.0.4, 2026-09-14">.
      Tom, 2026-09-14: each app has a version of its own, because one app goes
      three weeks untouched while another changes three times in a day. The
      commit that changes an app bumps it (root CLAUDE.md, Commits). */
  version() {
    const m = document.querySelector('meta[name="mb-version"]');
    const hit = m && /^\s*(\d+(?:\.\d+)*)\s*(?:,\s*(\d{4}-\d{2}-\d{2}))?/.exec(m.content || '');
    if (!hit) return null;
    const date = hit[2] || '';
    /* spelled out here, not by the browser: Chrome's British short month is
       "Sept" and other browsers say "Sep", and the line should read the same
       on every device */
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const bits = date.split('-').map(Number);
    const dateText = date ? bits[2] + ' ' + MON[bits[1] - 1] + ' ' + bits[0] : '';
    return { v: hit[1], date: date, dateText: dateText };
  },

  /** opts.order names the tab ids in the order they should appear.
      opts.append bolts extra drawing onto a tab the foundation owns. */
  settings(appId, extraTabs, opts) {
    css();
    opts = opts || {};
    /* The app's own tabs first: they are what make this panel this app's,
       and APP and DATA are the same everywhere. `order` still wins. */
    const tabs = (extraTabs || []).slice();
    /* Theme and sound are chosen in STYLE and nowhere else. Tom, 2026-09-15:
       "remove theme picking from everything except from STYLE, simply the
       data screen". STYLE keeps this tab; opts.look puts it back anywhere. */
    if ((appId === 'style' || opts.look) && (g.Skins || g.Sfx || g.Mobile))
      tabs.push({ id: 'app', name: 'APP', draw: drawApp.bind(null, appId) });
    if (g.IO) tabs.push({ id: 'data', name: 'DATA', draw: el2 => g.IO.panel(el2, appId) });

    /* Every app with data gets the short sheet section under DATA: the link
       and a Sync now button. The home screen and STATUS set the sheet up, and
       STATUS passes sync:false because it draws the whole setup itself. */
    if (g.IO && g.IO.syncRow && opts.sync !== false && (g.IO.spec(appId).types || []).length) {
      const dt = tabs.filter(x => x.id === 'data')[0];
      if (dt) { const was = dt.draw; dt.draw = (pane, h) => { was(pane, h); g.IO.syncRow(pane, appId); }; }
    }

    if (opts.order) {
      const rank = id => { const i = opts.order.indexOf(id); return i < 0 ? 99 : i; };
      tabs.sort((a, b) => rank(a.id) - rank(b.id));
    }
    /* Backing up and mirroring to a sheet are the same errand, so an app can
       put its mirror at the bottom of DATA instead of in a tab of its own. */
    if (opts.append) Object.keys(opts.append).forEach(id => {
      const t = tabs.filter(x => x.id === id)[0];
      if (!t) return;
      const was = t.draw, more = opts.append[id];
      t.draw = (pane, h) => { was(pane, h); more(pane, h); };
    });

    const appName = (g.IO && g.IO.spec(appId).name !== appId) ? String(g.IO.spec(appId).name) : String(appId);
    let active = tabs[0] && tabs[0].id;
    return UI.dialog({
      /* the app's own name on it, so it is plain which app these settings change */
      title: opts.title || (g.IO && g.IO.spec(appId).name !== appId
        ? String(g.IO.spec(appId).name).toUpperCase() + ' SETTINGS' : 'SETTINGS'),
      width: 560,
      body: (body, h) => {
        const pane = el('div');
        const show = id => {
          active = id;
          pane.innerHTML = '';
          const t = tabs.filter(x => x.id === active)[0];
          if (t) t.draw(pane, h);
          body.scrollTop = 0;
        };
        if (tabs.length > 1) {
          const bar = UI.segmented(tabs, active, show);
          bar.style.margin = '0 var(--s-4,16px) var(--s-3,12px)';
          h.box.insertBefore(bar, body);
        }
        body.appendChild(pane);
        /* which version of this app is open, under every tab */
        const ver = UI.version();
        if (ver) {
          const p = el('p', null, esc(appName.toUpperCase() + ' ' + ver.v + (ver.dateText ? ', updated ' + ver.dateText : '')));
          p.style.cssText = 'color:var(--text-muted,#5b6d80);font-size:var(--f-1,12px);margin:var(--s-5,24px) 0 0';
          body.appendChild(p);
        }
        show(active);
      },
      actions: [{ label: 'DONE', kind: 'go' }],
    });
  },
};

/* ══════════════ nothing half-typed is lost ══════════════
   Tom, 2026-09-17: "I want my changes to persist even after I refresh right
   after making them."

   A field that commits on blur has not committed anything while the cursor is
   still in it, and reloading a page does not reliably blur what was focused
   first. So a time typed into BLOCK's routine start and then refreshed was
   never handed to the app at all: not a save that lost a race, a value the app
   had never been told about.

   Blurring the focused element here runs whatever that field does on blur, in
   the ordinary way, before anything goes. `pagehide` and a hidden document
   both count, because a phone gets the second and rarely the first.

   Apps that hold work in memory still have to write it; this only makes sure
   the last thing typed has reached them. BLOCK does the writing half itself. */
function commitFocused() {
  const n = document.activeElement;
  if (!n || n === document.body || typeof n.blur !== 'function') return;
  /* A browser does not always DISPATCH blur while the document itself is not
     focused, and a page being hidden or closed is exactly that moment. It will
     still take the focus away, so "is it still the active element" answers the
     wrong question: the field loses focus and its handler never runs, which is
     the case that loses the edit.

     So the event is watched for rather than guessed at, and fired by hand only
     when the real one did not arrive. Watched in the capture phase, because a
     blur does not bubble. */
  let fired = false;
  const mark = () => { fired = true; };
  n.addEventListener('blur', mark, true);
  try { n.blur(); } catch (e) {}
  n.removeEventListener('blur', mark, true);
  if (!fired) { try { n.dispatchEvent(new FocusEvent('blur')); } catch (e) {} }
}
addEventListener('pagehide', commitFocused);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') commitFocused();
});

/* ── and the same rule wherever focus lands, not only where focusSoon put it ──
   Tapping into an amount by hand is the common case and it never went through
   `focusSoon`. One listener on the document covers every box in every app,
   including ones written before this existed.

   The mouseup half is not optional: a click lands focus first and THEN puts
   the caret where the pointer was, so a selection taken on focus is thrown
   away a moment later by the very click that asked for it. Taking it again on
   the way up is what makes clicking behave like tabbing in. */
document.addEventListener('focusin', e => {
  const n = e.target;
  if (!UI.isNumberBox(n)) return;
  const sel = () => { try { n.select(); } catch (err) {} };
  sel();
  const up = () => { sel(); n.removeEventListener('mouseup', up); };
  n.addEventListener('mouseup', up);
  setTimeout(() => n.removeEventListener('mouseup', up), 400);
});

/* ── the plain dialog ──
   Reached only when mobile.js is not loaded. Same markup as the sheet so the
   LEGACY stylesheet can dress it, and the same handle shape so no caller can
   tell which one it got. */
function legacyDialog(o) {
  const veil = el('div', 'mb-veil'), box = el('div', 'mb-sheet');
  if (o.width) box.style.setProperty('--mb-w', o.width + 'px');
  box.appendChild(el('div', 'mb-grab'));
  const head = el('div', 'mb-sheet-head');
  head.appendChild(el('h3', null, esc(o.title || '')));
  box.appendChild(head);
  const body = el('div', 'mb-sheet-body');
  box.appendChild(body);
  const handle = {
    body: body, box: box, panel: box, wide: true,
    close(v) {
      veil.remove(); document.removeEventListener('keydown', onKey);
      if (g.Sfx) g.Sfx.play('close');
      if (o.onClose) o.onClose(v);
    },
  };
  if (typeof o.body === 'function') o.body(body, handle); else if (o.body) body.innerHTML = o.body;
  if (o.actions && o.actions.length) {
    const foot = el('div', 'mb-sheet-foot');
    o.actions.forEach(a => {
      const b = el('button', 'mb-btn' + (a.kind ? ' ' + a.kind : ''), esc(a.label));
      b.onclick = () => { const r = a.fn ? a.fn(handle) : undefined; if (r !== false) handle.close(a.value); };
      foot.appendChild(b);
    });
    box.appendChild(foot);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); handle.close(); }
    if (e.key === 'Enter' && o.enter && !/TEXTAREA/.test(e.target.tagName)) { e.preventDefault(); o.enter(handle); }
  }
  document.addEventListener('keydown', onKey);
  veil.onclick = e => { if (e.target === veil && o.dismissable !== false) handle.close(); };
  veil.appendChild(box); document.body.appendChild(veil);
  if (g.Sfx) g.Sfx.play('open');
  setTimeout(() => { const f = box.querySelector('input,select,button.go'); if (f) f.focus(); }, 40);
  return handle;
}

/* ── the APP tab ──
   Theme, colours, sound, buzz. Every app keeps its own; the colours belong to
   the theme and follow it into any app wearing it. That last sentence used to
   be printed on the screen. It is written here instead, where it belongs. */
function drawApp(appId, pane) {
  const S = g.Skins, X = g.Sfx, M = g.Mobile;

  if (S) {
    S.injectPickerCSS();
    const wrap = el('div');
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:var(--s-2,8px)';
    pane.appendChild(wrap);
    const colours = el('div');
    S.picker(wrap, { custom: false, onChange: () => { if (X) X.play('drop'); paint(); } });
    pane.appendChild(colours);
    paint();

    function paint() {
      const skin = S.current || S.get(S.list()[0].id), id = skin.id;
      const pal = S.paletteFor(id);
      colours.innerHTML = '';

      const head = el('div', 'mb-group');
      head.style.cssText = 'display:flex;align-items:center;gap:var(--s-2,8px)';
      head.appendChild(el('span', null, 'COLOURS'));
      const sp = el('span'); sp.style.flex = '1'; head.appendChild(sp);
      if (S.isCustomised(id)) {
        const b = el('button', 'mb-btn quiet mb-press mb-tap', 'RESET');
        b.style.minHeight = '32px';
        b.onclick = () => { S.clearPalette(id); S.apply(skin); paint(); };
        head.appendChild(b);
      }
      colours.appendChild(head);

      /* Six swatches in a row, named underneath. The row of labelled lines it
         replaced was six headings, six sentences and a lot of scrolling. */
      const strip = el('div');
      strip.style.cssText = 'display:flex;gap:var(--s-2,8px);flex-wrap:wrap';
      const live = () => S.apply(skin, pal);
      const commit = () => { S.savePalette(id, pal); paint(); };
      const swatch = (key, label, val, set) => {
        const cell = el('div');
        cell.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:4px;flex:1 0 46px';
        const c = el('input', 'mb-swatch mb-tap');
        c.type = 'color'; c.value = val; c.style.width = '100%';
        c.oninput = () => { set(c.value); live(); };
        c.onchange = commit;
        cell.appendChild(c);
        cell.appendChild(el('span', null, label)).style.cssText =
          'font-size:10px;color:var(--text-muted,#5b6d80);letter-spacing:.04em';
        return cell;
      };
      [['bg', 'Back'], ['panel', 'Card'], ['line', 'Line'],
       ['ink', 'Text'], ['mut', 'Muted'], ['acc', 'Accent']]
        .forEach(([k, l]) => strip.appendChild(swatch(k, l, pal[k], v => { pal[k] = v; })));
      colours.appendChild(strip);

      const chart = el('div');
      chart.style.cssText = 'display:flex;gap:var(--s-2,8px);flex-wrap:wrap;margin-top:var(--s-3,12px)';
      pal.colors.forEach((hex, i) =>
        chart.appendChild(swatch('c' + i, i === 0 ? 'Charts' : ' ', hex, v => { pal.colors[i] = v; })));
      colours.appendChild(chart);

      const warn = S.check({ bg: pal.bg, panel: pal.panel, accent: pal.acc, text: pal.ink });
      if (!warn.ok) {
        colours.appendChild(el('p', null,
          '<span style="color:var(--warn,#ffb347);font-size:var(--f-1,12px)">Hard to read: ' +
          (warn.accentOnBg < 3 ? 'accent too close to the background. ' : '') +
          (warn.textOnPanel < 4.5 ? 'text too close to the cards.' : '') + '</span>'));
      }

      const all = el('button', 'mb-btn mb-press mb-tap', 'USE THIS THEME EVERYWHERE');
      all.style.cssText = 'width:100%;margin-top:var(--s-4,16px)';
      all.onclick = () => {
        try {
          Object.keys(localStorage).filter(k => k.indexOf('suite_skin.') === 0)
            .forEach(k => localStorage.setItem(k, id));
          localStorage.setItem('suite_skin', id);
          UI.toast('every app is <b>' + esc(skin.name) + '</b>');
        } catch (e) { UI.toast('could not save that', { bad: true }); }
      };
      colours.appendChild(all);
    }
  }

  if (X) {
    pane.appendChild(el('div', 'mb-group', 'SOUND'));
    const chips = el('div', 'mb-chips');
    const redraw = () => { pane.innerHTML = ''; drawApp(appId, pane); };
    X.PACKS.forEach(p => {
      const c = el('button', 'mb-chip mb-press mb-tap' + (X.settings.pack === p.id ? ' on' : ''), esc(p.name));
      c.onclick = () => { X.pack(p.id); X.unlock(); X.preview(p.id); redraw(); };
      chips.appendChild(c);
    });
    pane.appendChild(chips);

    pane.appendChild(UI.row('Sound', null, UI.toggle(!X.mute(), on => { X.mute(!on); if (on) { X.unlock(); X.play('done'); } })));

    const r = el('input', 'mb-range'); r.type = 'range'; r.min = 0; r.max = 100;
    r.value = Math.round(X.volume() * 100); r.style.maxWidth = '180px';
    r.oninput = () => X.volume(r.value / 100);
    r.onchange = () => { X.unlock(); X.play('done'); };
    pane.appendChild(UI.row('Volume', null, r));
  }

  /* Only where it does something. A computer has no motor and an iPhone will
     not let a web page use one, so on either the row was a switch that did
     nothing. Tom, 2026-09-14: settings should affect what is relevant. */
  const canBuzz = !!navigator.vibrate && !!(g.matchMedia && g.matchMedia('(pointer: coarse)').matches);
  if (M && canBuzz) {
    pane.appendChild(UI.row('Vibrate', null,
      UI.toggle(M.haptics, on => { M.setHaptics(on); if (on) M.haptic('success'); })));
  }
}

/* The stylesheet goes in as soon as this file loads, not the first time a
   component draws. A page that used the shared classes before drawing one got
   bare browser controls: TRAIN's Add Setup was a white system button, and
   BLOCK's start time was a white box. */
css();

g.UI = UI;
})(window);
