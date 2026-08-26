/* CLEX — turn optimizer.
 *
 * Searches orderings of the plays you can legally make right now and returns
 * the strongest one, with the reason it won.
 *
 * Two rules keep it honest, and they matter more than the search:
 *
 *   1. It only ever plays a card that is IN YOUR HAND, on the battlefield as an
 *      ability, or your commander from the command zone. It will not invent a
 *      card. If a tutor is available it may fetch, but it respects where the
 *      tutor actually puts the card — Worldly Tutor puts it on TOP of your
 *      library, so it is a next-turn play, not a this-turn play, and the
 *      optimizer says so instead of quietly casting it.
 *
 *   2. Order is the whole point. Hardened Scales before Kalonian Hydra is a
 *      different game from Kalonian Hydra before Hardened Scales, so the
 *      search is over sequences, not over sets.
 */
window.Optimizer = (function () {
  'use strict';

  var C = window.Clex;

  var BEAM = 14;     // states kept at each depth
  var DEPTH = 5;     // plays deep

  /* ---------------------------------------------------------- ETB triggers */

  /* The triggers that actually change the counter maths in these decks.
   * Anything not listed here simply enters and sits there, which is honest:
   * a number the app cannot justify is worse than no number.               */
  function resolveETB(state, perm, notes) {
    var name = perm.name;
    var isCreature = C.isType(name, 'creature');

    state.field.forEach(function (q) {
      if (q.controller !== 'you' || q.uid === perm.uid) return;

      if (q.name === 'The Great Henge' && isCreature) {
        var r = C.putCounters(state, perm, C.P1, 1);
        notes.push('The Great Henge: +' + r.placed + ' counter on ' + name + ', draw a card.');
      }
      if (q.name === 'Tribute to the World Tree' && isCreature) {
        if (C.powerOf(state, perm) >= 3) notes.push('Tribute to the World Tree: draw a card.');
        else {
          var t = C.putCounters(state, perm, C.P1, 2);
          notes.push('Tribute to the World Tree: +' + t.placed + ' counters on ' + name + '.');
        }
      }
      if (q.name === 'Champion of Lambholt' && isCreature) {
        var ch = C.putCounters(state, q, C.P1, 1);
        notes.push('Champion of Lambholt grows by ' + ch.placed + '.');
      }
      if (q.name === 'Ivy Lane Denizen' && isCreature &&
          (C.card(name).ci || []).indexOf('G') > -1) {
        var best = biggestCounterTarget(state);
        if (best) {
          var iv = C.putCounters(state, best, C.P1, 1);
          notes.push('Ivy Lane Denizen: +' + iv.placed + ' counter on ' + best.name + '.');
        }
      }
    });

    /* Its own entry trigger. */
    if (name === 'Rishkar, Peema Renegade') {
      var t1 = biggestCounterTarget(state) || perm;
      var rr = C.putCounters(state, t1, C.P1, 1);
      notes.push('Rishkar enters: +' + rr.placed + ' counter on ' + t1.name +
                 '. Your creatures with counters now tap for {G}.');
    }
    if (name === 'Voracious Hydra') {
      var d = C.doubleCounters(state, [perm]);
      if (d.length) notes.push('Voracious Hydra doubles its own counters to ' +
                               C.countersOn(perm, C.P1) + '.');
    }
    if (name === 'Krenko, Mob Boss') {
      notes.push('Krenko can tap to make a Goblin for each Goblin you control (needs haste or a turn).');
    }
  }

  function biggestCounterTarget(state) {
    var best = null, n = -1;
    state.field.forEach(function (p) {
      if (p.controller !== 'you' || !C.isType(p.name, 'creature')) return;
      var v = C.countersOn(p, C.P1);
      if (v > n) { n = v; best = p; }
    });
    return best;
  }

  function myCreatures(state) {
    return state.field.filter(function (p) {
      return p.controller === 'you' && C.isType(p.name, 'creature');
    });
  }

  /* ------------------------------------------------------------- actions */

  /* Everything legal from here, as {label, cost, apply(state, notes)}. */
  function actions(node) {
    var state = node.state;
    var out = [];
    var mana = node.mana;

    /* Cast from hand.
     *
     * Permanents only. An instant or sorcery does not become board state, and
     * pretending it does would put Worldly Tutor on the battlefield. Those are
     * surfaced through tutorTargets() instead, where the answer is "what does
     * it find", not "what does it become". */
    node.hand.forEach(function (name, idx) {
      var c = C.card(name);
      if (!c || !/(creature|artifact|enchantment|land|planeswalker|battle)/i.test(c.t)) return;
      var cost = C.costOf(state, name);
      if (cost > mana) return;
      out.push({
        kind: 'cast', card: name, cost: cost, handIndex: idx,
        label: 'Cast ' + name,
        apply: function (s, notes) {
          var r = C.enterWithCounters(s, name, null);
          if (r.placed > 0) {
            notes.push(name + ' enters with ' + r.placed + ' +1/+1 counters' +
              (r.base !== r.placed ? ' (printed ' + r.base + ', modified on the way in)' : '') + '.');
            r.steps.forEach(function (st) { });
          }
          resolveETB(s, r.permanent, notes);
          return r;
        }
      });
    });

    /* Commander from the command zone. */
    if (!node.cmdOnField && node.cmdAvailable) {
      var cmd = C.commanderOf(state.deck);
      var ccost = C.costOf(state, cmd) + (node.tax || 0);
      if (cmd && ccost <= mana) {
        out.push({
          kind: 'commander', card: cmd, cost: ccost,
          label: 'Cast ' + cmd + ' from the command zone' +
                 (node.tax ? ' (including {' + node.tax + '} tax)' : ''),
          apply: function (s, notes) {
            var r = C.enterWithCounters(s, cmd, null);
            notes.push(cmd + ' resolves. Every counter you place from now on is doubled.');
            resolveETB(s, r.permanent, notes);
            return r;
          }
        });
      }
    }

    /* Abilities on the battlefield. */
    state.field.forEach(function (p) {
      if (p.controller !== 'you') return;

      if (p.name === 'Bristly Bill, Spine Sower' && mana >= 5 && !node.used['bb' + p.uid]) {
        out.push({
          kind: 'ability', card: p.name, cost: 5, once: 'bb' + p.uid,
          label: 'Activate Bristly Bill: double the counters on each of your creatures',
          apply: function (s, notes) {
            var targets = myCreatures(s).filter(function (q) { return C.countersOn(q, C.P1) > 0; });
            if (!targets.length) { notes.push('Bristly Bill had nothing to double.'); return; }
            var res = C.doubleCounters(s, targets);
            res.forEach(function (r) {
              notes.push(r.target.name + ': ' + r.had + ' -> ' + r.now + ' counters.');
            });
          }
        });
      }

      if (p.name === 'Ozolith, the Shattered Spire' && mana >= 2 && !p.tapped &&
          !node.used['oz' + p.uid]) {
        out.push({
          kind: 'ability', card: p.name, cost: 2, once: 'oz' + p.uid,
          label: 'Activate Ozolith, the Shattered Spire: put a +1/+1 counter on your best creature',
          apply: function (s, notes) {
            var t = biggestCounterTarget(s) || myCreatures(s)[0];
            if (!t) return;
            var r = C.putCounters(s, t, C.P1, 1);
            notes.push('Ozolith puts ' + r.placed + ' counters on ' + t.name + '.');
          }
        });
      }

      if (p.name === 'Karn\'s Bastion' && mana >= 4 && !p.tapped && !node.used['kb' + p.uid]) {
        out.push({
          kind: 'ability', card: p.name, cost: 4, once: 'kb' + p.uid,
          label: 'Activate Karn\'s Bastion: proliferate',
          apply: function (s, notes) {
            C.proliferate(s, 1);
            notes.push('Proliferate: one more counter of each kind already there, doubled by anything that applies.');
          }
        });
      }

      if (p.name === 'Contagion Engine' && mana >= 4 && !node.used['ce' + p.uid]) {
        out.push({
          kind: 'ability', card: p.name, cost: 4, once: 'ce' + p.uid,
          label: 'Activate Contagion Engine: proliferate twice',
          apply: function (s, notes) { C.proliferate(s, 2); notes.push('Proliferated twice.'); }
        });
      }

      /* Attacking with Kalonian Hydra is free and is usually the biggest
       * single counter event in the deck. */
      if (p.name === 'Kalonian Hydra' && !p.tapped && (!p.sick || C.hasHaste(state, p)) &&
          !node.used['kh' + p.uid]) {
        out.push({
          kind: 'attack', card: p.name, cost: 0, once: 'kh' + p.uid,
          label: 'Attack with Kalonian Hydra: double the counters on each of your creatures',
          apply: function (s, notes) {
            var targets = myCreatures(s).filter(function (q) { return C.countersOn(q, C.P1) > 0; });
            var res = C.doubleCounters(s, targets);
            res.forEach(function (r) {
              notes.push(r.target.name + ': ' + r.had + ' -> ' + r.now + ' counters.');
            });
          }
        });
      }
    });

    return out;
  }

  /* --------------------------------------------------------------- score */

  function score(node) {
    var s = node.state;
    var counters = 0, power = 0, engines = 0, biggest = 0;

    s.field.forEach(function (p) {
      if (p.controller !== 'you') return;
      counters += C.countersOn(p, C.P1);
      if (C.isType(p.name, 'creature')) {
        var pw = C.powerOf(s, p);
        power += pw;
        biggest = Math.max(biggest, pw);
      }
      if (C.REPLACE[p.name]) engines += 1;
      if (C.DOUBLERS[p.name]) engines += 1;
      if (p.name === 'Selvala, Heart of the Wilds' || p.name === 'Gyre Sage' ||
          p.name === 'Incubation Druid' || p.name === 'The Great Henge') engines += 1;
    });

    var combos = window.Combos ? Combos.detect(s, node.hand) : [];
    var live = combos.filter(function (c) { return c.complete && c.infinite; });

    /* Lethal is a claim, so it is deliberately conservative: only creatures
     * that can actually attack this turn count. */
    var swing = 0;
    s.field.forEach(function (p) {
      if (p.controller !== 'you' || !C.isType(p.name, 'creature')) return;
      if (p.tapped) return;
      if (p.sick && !C.hasHaste(s, p)) return;
      swing += C.powerOf(s, p);
    });

    var lethal = swing >= 40;

    var total =
      (lethal ? 1e12 : 0) +
      (live.length ? 1e9 : 0) +
      engines * 40000 +
      counters * 900 +
      biggest * 400 +
      power * 60 +
      node.mana * 30;

    return {
      total: total, counters: counters, power: power, biggest: biggest,
      engines: engines, swing: swing, lethal: lethal,
      infinite: live.map(function (c) { return c.name; }), mana: node.mana
    };
  }

  /* -------------------------------------------------------------- search */

  function run(state, opts) {
    opts = opts || {};
    var root = {
      state: C.clone(state),
      hand: (state.hand || []).slice(),
      mana: (state.mana && state.mana.total) || 0,
      spent: 0,
      tax: state.tax || 0,
      cmdOnField: !!state.cmdOnField ||
        state.field.some(function (p) { return p.name === C.commanderOf(state.deck); }),
      cmdAvailable: state.cmdAvailable !== false,
      used: {},
      steps: [],
      notes: []
    };
    /* clone() loses the prototype links used by find(), so rebuild them. */
    reattach(root);

    var frontier = [root];
    var best = root;
    best.score = score(root);

    for (var d = 0; d < DEPTH; d++) {
      var next = [];
      frontier.forEach(function (node) {
        var acts = actions(node);
        acts.forEach(function (a) {
          var child = advance(node, a);
          if (!child) return;
          child.score = score(child);
          next.push(child);
          if (child.score.total > best.score.total) best = child;
        });
      });
      if (!next.length) break;
      next.sort(function (x, y) { return y.score.total - x.score.total; });
      frontier = next.slice(0, BEAM);
    }

    var combos = window.Combos ? Combos.detect(best.state, best.hand) : [];

    /* Say what was left out, rather than letting a silent omission read as
     * "this card is not worth playing". */
    var notSimulated = (state.hand || []).filter(function (n) {
      var c = C.card(n);
      return c && !/(creature|artifact|enchantment|land|planeswalker|battle)/i.test(c.t);
    });

    return {
      notSimulated: notSimulated,
      best: {
        steps: best.steps,
        notes: best.notes,
        spent: best.spent,
        remaining: best.mana,
        score: best.score,
        state: best.state
      },
      combos: combos,
      why: explain(best.score)
    };
  }

  function reattach(node) { return node; }

  function advance(node, a) {
    var child = {
      state: C.clone(node.state),
      hand: node.hand.slice(),
      mana: node.mana - a.cost,
      spent: node.spent + a.cost,
      tax: node.tax,
      cmdOnField: node.cmdOnField || a.kind === 'commander',
      cmdAvailable: node.cmdAvailable,
      used: JSON.parse(JSON.stringify(node.used)),
      steps: node.steps.slice(),
      notes: node.notes.slice()
    };
    if (child.mana < 0) return null;
    if (a.handIndex != null) child.hand.splice(a.handIndex, 1);
    if (a.once) child.used[a.once] = 1;

    /* The action was built against the parent's state; re-find the permanent
     * it refers to inside the child's fresh copy before applying. */
    var notes = [];
    try {
      a.apply(child.state, notes);
    } catch (e) {
      return null;
    }

    child.steps.push({
      label: a.label, card: a.card, cost: a.cost,
      remaining: child.mana, notes: notes
    });
    child.notes = child.notes.concat(notes);
    return child;
  }

  function explain(sc) {
    if (sc.lethal) return 'This swings for ' + sc.swing + '. That is lethal damage on one opponent.';
    if (sc.infinite.length) return 'This assembles ' + sc.infinite.join(' and ') + '.';
    if (sc.counters >= 60) return 'This is the biggest counter explosion available: ' +
      sc.counters + ' +1/+1 counters on board, biggest creature ' + sc.biggest + ' power.';
    if (sc.engines >= 2) return 'No explosive line is available, so this builds the engine: ' +
      sc.engines + ' counter or mana engines online.';
    if (sc.counters > 0) return 'This grows the board to ' + sc.counters +
      ' counters, biggest creature ' + sc.biggest + ' power.';
    return 'Nothing explosive is available. This is the best board it can build with the mana you have.';
  }

  /* Tutor advice, kept separate because a tutor is a decision, not a play. */
  function tutorTargets(state, hand) {
    var deckId = state.deck || 'clex';
    var held = (hand || []).slice();
    var have = {};
    state.field.forEach(function (p) { if (p.controller === 'you') have[p.name] = 1; });
    held.forEach(function (n) { have[n] = 1; });

    var out = [];
    (window.Combos ? Combos.TUTORS : []).forEach(function (t) {
      if (t.deck !== deckId) return;
      if (!have[t.name]) return;

      var combos = Combos.detect(state, held);
      var wants = [];
      combos.forEach(function (c) {
        c.missing.forEach(function (m) {
          var can = false;
          try { can = t.can(m); } catch (e) {}
          if (can && wants.indexOf(m) < 0 && Combos.zoneOf(deckId, m) === 'main') {
            wants.push({ card: m, why: c.name, infinite: c.infinite, missingCount: c.missing.length });
          }
        });
      });
      wants.sort(function (a, b) {
        return (b.infinite ? 1 : 0) - (a.infinite ? 1 : 0) || a.missingCount - b.missingCount;
      });
      out.push({ tutor: t.name, to: t.to, immediate: t.to === 'hand' || t.to === 'battlefield',
                 targets: wants.slice(0, 4) });
    });
    return out;
  }

  return { run: run, score: score, actions: actions, tutorTargets: tutorTargets,
           resolveETB: resolveETB };
})();
