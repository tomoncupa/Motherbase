/* ══════════════════════════════════════════════════════════════════════
   MOTHERBASE · CHAPTER
   One answer to "what does this app count from", for every app.

   Tom, 2026-11-16: "a much more comprehensive restart feature that lets
   people reset tracking with zero guilt", "separate different clusters of
   dates into blocks, similar to what we're already doing in Train", "pick
   different date points or reset points within a block for each module",
   "allow some overlap: train tracking can begin today, but status tracking
   can keep the past 8 weeks", and its name, "new chapter".

   A `chapter` row, undated, keyed by an id: {name, start, from, t}.
   A chapter runs from `start` until the next one starts, the way a TRAIN
   training block does. `from` maps an app id to the day that app counts from
   in this chapter: a date (it may be before `start`: the overlap Tom asked
   for), or 'all' to keep everything. An app not named counts from `start`.
   Nothing is ever deleted: a chapter only moves where counting begins, and
   every earlier chapter stays readable.

   from(app, day)   the day `app` counts from on `day` (default today), or
                    null when no chapter has started or the app keeps all.
   current(day)     the chapter running on `day`, or null.
   list()           every chapter, oldest first.
   begin(o)         starts one: {name, start, from}; hands back its key.
   APPS             the apps that read it so far. An app adds itself when it
                    honours `from`; a chapter offers only these.
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  const D = () => g.Day;
  const APPS = [{ id: 'quest', name: 'QUESTS', what: 'goal calls, weeks and last wins' }];

  function list() {
    return Object.entries(g.Rec.map('chapter') || {})
      .map(e => Object.assign({ key: e[0] }, e[1]))
      .filter(c => c.start)
      .sort((a, b) => a.start.localeCompare(b.start) || (a.t || 0) - (b.t || 0));
  }
  function current(day) {
    const d = day || D().today();
    const L = list().filter(c => c.start <= d);
    return L.length ? L[L.length - 1] : null;
  }
  function from(app, day) {
    const c = current(day);
    if (!c) return null;
    const f = c.from && c.from[app];
    if (f === 'all') return null;
    return f || c.start;
  }
  let n = 0;
  function begin(o) {
    const key = (g.Rec.USER || 'local') + '-ch-' + Date.now().toString(36) + (n++).toString(36);
    g.Rec.set('chapter', null, key, { name: String(o.name || '').trim(), start: o.start || D().today(), from: o.from || {}, t: Date.now() });
    return key;
  }
  /* The chapter's name, or its first day when it has none. */
  const label = c => c ? (c.name || 'Chapter from ' + D().short(c.start)) : '';

  g.Chapter = { APPS: APPS, list: list, current: current, from: from, begin: begin, label: label };
})(typeof window !== 'undefined' ? window : this);
