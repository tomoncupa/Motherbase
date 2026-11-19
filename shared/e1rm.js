/* E1RM 0.1.0, 2026-11-18. The one estimated one-rep max for the whole suite.

   Decision D4 (2026-11-18): one formula everywhere. Before this TRAIN used
   Brzycki and the home screen's recovery map and COACH used Epley
   (kg x (1 + reps / 30)), so the same set read a different 1RM on each.
   Brzycki won because it is what TRAIN, FitNotes and the goals already
   used:

       1RM = kg x 36 / (37 - reps)

   Reps counted are capped at 12, a common practice: every rep-max formula
   drifts past about 10 reps and Brzycki blows up as reps near 37, so a set
   of 20 counts as a set of 12. Reps in reserve, when the set carries them,
   are added first (5 reps with 2 in reserve is read as 5 + 2 = 7), then
   capped. Unit-free: kilograms in, kilograms out; pounds in, pounds out.

   Computed on the fly, never stored, and it is not the record rule: a
   record is still the heaviest weight at that many reps or more
   (train/CLAUDE.md, Personal records). Pure: no store, no page. */
(function (g) {
  'use strict';
  if (g.E1RM) return;

  var CAP = 12;

  /* the reps a set is read as: reps plus reps in reserve, at most CAP */
  function reps(r, rir) {
    r = +r;
    if (!(r > 0)) return 0;
    var x = +rir;
    if (rir != null && rir !== '' && x > 0) r += x;
    return Math.min(r, CAP);
  }

  /* estimated 1RM of one set; 0 when there is no weight or no reps */
  function calc(kg, r, rir) {
    kg = +kg;
    var n = reps(r, rir);
    if (!(kg > 0) || !n) return 0;
    return kg * 36 / (37 - n);
  }

  /* the other way: the weight a 1RM predicts for n reps (a rep-max table) */
  function weightFor(one, n) {
    n = Math.min(+n || 0, 36);
    return one > 0 && n > 0 ? one * (37 - n) / 36 : 0;
  }

  g.E1RM = { version: '0.1.0', CAP: CAP, calc: calc, reps: reps, weightFor: weightFor };
})(typeof window !== 'undefined' ? window : this);
