/* ══════════════════════ MOTHERBASE · DAY ══════════════════════
   One definition of "today" for the whole suite, because two apps that
   disagree about what day it is will quietly disagree about everything else.

   ONE setting: what time your day starts. Default 4am.

   A tick before 4am belongs to yesterday, because that is the day you were
   still in. This is the only rule that decides dates and nothing else may.

   The day is *wrapped up* three hours before it turns over — 1am on a 4am
   start — so there is a grace window where the day reads as finished but you
   can still log into it. That follows the one setting; it is not a second
   thing to configure.

   Backfilling any past date is always allowed and always has been — see
   Day.editable(). The boundary decides where new ticks land, never what you
   are permitted to correct.

     <script src="shared/day.js"></script>
*/
(function (g) {
'use strict';

/* The day is the calendar day. It used to start at 4am, so anything logged
   before then counted as the day before — which is defensible and was, in
   practice, just confusing. Removed 2026-08-20 along with the setting for it.

   The machinery is still here rather than ripped out, because every date in
   the suite goes through this file and a rewrite would touch everything. With
   startsAt at 0 it simply does nothing: Day.of() returns the calendar date,
   isClosed() is never true, and there is no grace window. If a reason to
   bring it back ever turns up, it is one number. */
const DEF = { startsAt: 0 };
const GRACE = 3;                          /* hours between the wrap-up and the rollover */
const KEY = 'mb.day';                     /* read directly: Records depends on Day, not the reverse */
let cfg = Object.assign({}, DEF);
/* Any stored 4am from before that change is dropped rather than honoured —
   there is no longer a screen that could tell you it was set, or turn it off. */
try { localStorage.removeItem(KEY); } catch (e) {}

const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const noon = date => new Date(date + 'T12:00:00');   /* noon dodges every DST edge case */

const Day = {
  DEF: DEF,
  get startsAt() { return cfg.startsAt; },
  /** derived, never stored: the hour the day stops counting as live */
  get closesAt() { return cfg.startsAt >= GRACE ? cfg.startsAt - GRACE : cfg.startsAt; },

  /** the tracking date a moment belongs to */
  of(when) {
    const d = new Date(when == null ? Date.now() : when);
    if (d.getHours() < cfg.startsAt) d.setDate(d.getDate() - 1);
    return iso(d);
  },
  today() { return Day.of(); },
  /** plain calendar date, ignoring the boundary — for anything genuinely clock-based */
  calendar(when) { return iso(new Date(when == null ? Date.now() : when)); },

  shift(date, n) { const d = noon(date); d.setDate(d.getDate() + n); return iso(d); },
  dow(date) { return noon(date).getDay(); },
  diff(a, b) { return Math.round((noon(a) - noon(b)) / 86400000); },
  /** every date from `from` to `to` inclusive */
  range(from, to) { const out = []; for (let d = from; d <= to; d = Day.shift(d, 1)) out.push(d); return out; },
  /** the last n dates ending today, oldest first */
  last(n, end) { const e = end || Day.today(); return Day.range(Day.shift(e, -(n - 1)), e); },

  /** has this date been wrapped up? true for anything before today, and for
      today once the close hour has passed */
  isClosed(date) {
    const t = Day.today();
    if (date < t) return true;
    if (date > t) return false;
    const h = new Date().getHours();
    /* closesAt is an early-morning hour, so "past the close" means we are in
       the window between it and the rollover */
    return h >= Day.closesAt && h < cfg.startsAt;
  },
  /** minutes until this date rolls over — for a countdown, or a nudge */
  untilRollover() {
    const now = new Date(), r = new Date(now);
    r.setHours(cfg.startsAt, 0, 0, 0);
    if (r <= now) r.setDate(r.getDate() + 1);
    return Math.round((r - now) / 60000);
  },

  /** past and present are editable; the future is not a record, it is a plan */
  editable(date) { return date <= Day.today(); },

  set(patch) {
    Object.assign(cfg, patch);
    delete cfg.closesAt;                    /* derived — an old saved value must not linger */
    cfg.startsAt = Math.max(0, Math.min(11, +cfg.startsAt || 0));
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) {}
    (Day._subs || []).forEach(f => { try { f(cfg); } catch (e) {} });
    return cfg;
  },
  on(f) { (Day._subs = Day._subs || []).push(f); return () => { const i = Day._subs.indexOf(f); if (i > -1) Day._subs.splice(i, 1); }; },

  /** "Mon 19 Aug" — one date format for the whole suite */
  label(date, opts) {
    return noon(date).toLocaleDateString(undefined, opts || { weekday: 'short', day: 'numeric', month: 'short' });
  },
  short(date) { return noon(date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); },
  isToday(date) { return date === Day.today(); },
};

g.Day = Day;
})(window);
