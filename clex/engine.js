/* CLEX — rules engine.
 *
 * No DOM in this file. It is pure state -> state, so _smoke.html can test it
 * without a browser window and index.html can stay a view.
 *
 * The one idea worth understanding:
 *
 *   Putting counters on a permanent is an EVENT. Cards like Hardened Scales and
 *   Vorinclex are REPLACEMENT EFFECTS that modify that event before it happens.
 *   CR 616.1 says the affected object's controller picks the order they apply,
 *   and each applies only once. So the answer is not "base x 2 x 2 + 1" — it is
 *   "which of these actually apply to THIS event, and in which order".
 *
 *   Cards differ in what they apply to, and that is the whole game:
 *     Hardened Scales   +1   only +1/+1, only creatures you control
 *     Ozolith, Shattered +1   only +1/+1, artifact OR creature you control
 *     Kami of Whispered +1   only +1/+1, any permanent you control
 *     Benevolent Hydra  +1   only +1/+1, another creature (never itself)
 *     Branching Evolution x2  only +1/+1, creature you control
 *     The Earth Crystal x2    only +1/+1, creature you control
 *     Primal Vigor      x2    only +1/+1, ANY creature, including theirs
 *     Doubling Season   x2    ANY kind, permanent you control, never players
 *     Vorinclex         x2    ANY kind, permanent OR player, when YOU put them
 *     Innkeeper's L3    x2    ANY kind, permanent OR player, when YOU put them
 *
 *   Which is why Vorinclex also doubles -1/-1 counters you put on your own
 *   creatures. That is not a bug, it is the card, and it is a real trap.
 */
window.Clex = (function () {
  'use strict';

  var DATA = window.CLEX_DATA || { cards: [], decks: [] };

  var P1 = '+1/+1';
  var M1 = '-1/-1';

  /* ---------------------------------------------------------------- cards */

  var BY_NAME = {};
  DATA.cards.forEach(function (c) { BY_NAME[c.n.toLowerCase()] = c; });

  function card(name) {
    if (!name) return null;
    return BY_NAME[String(name).toLowerCase()] || null;
  }

  function isType(name, t) {
    var c = card(name);
    return !!c && c.t.toLowerCase().indexOf(t.toLowerCase()) > -1;
  }

  function basePT(name) {
    var c = card(name);
    if (!c || c.p == null) return null;
    // Hydras and Walking Ballista are printed 0/0 or */*; treat * as 0.
    var p = parseInt(c.p, 10); var t = parseInt(c.tf, 10);
    return { p: isNaN(p) ? 0 : p, t: isNaN(t) ? 0 : t };
  }

  /* --------------------------------------------------------------- search */

  /* Fast enough to run on every keystroke over 186 cards.
   * Ranking, best first:
   *   0  exact name
   *   1  name starts with the query          "vor" -> Vorinclex
   *   2  any word in the name starts with it "oz"  -> both Ozoliths, Great Henge no
   *   3  substring anywhere
   *   4  subsequence (typo tolerance)        "klnh" -> Kalonian Hydra
   * Ties break on shorter name, so "The Ozolith" beats a longer match.
   *
   * opts.boost jumps named cards to the front of their rank. The app passes
   * the commander, because "vor" is also a prefix of Voracious Hydra and at a
   * table you mean Vorinclex.                                                */
  function search(q, opts) {
    opts = opts || {};
    var pool = opts.pool || DATA.cards;
    var boost = {};
    (opts.boost || []).forEach(function (n) { boost[String(n).toLowerCase()] = 1; });
    var s = String(q || '').trim().toLowerCase();
    if (!s) return opts.emptyAll ? pool.slice(0, opts.limit || 40) : [];

    var out = [];
    for (var i = 0; i < pool.length; i++) {
      var c = pool[i];
      var n = c.n.toLowerCase();
      var rank = -1;

      if (n === s) rank = 0;
      else if (n.indexOf(s) === 0) rank = 1;
      else {
        var words = n.split(/[^a-z0-9']+/);
        for (var w = 0; w < words.length; w++) {
          if (words[w].indexOf(s) === 0) { rank = 2; break; }
        }
        if (rank < 0 && n.indexOf(s) > -1) rank = 3;
        else if (rank < 0 && subseq(s, n)) rank = 4;
      }
      if (rank > -1) out.push({ c: c, r: rank, b: boost[n] ? 0 : 1 });
    }
    out.sort(function (a, b) {
      return a.r - b.r || a.b - b.b ||
             a.c.n.length - b.c.n.length || a.c.n.localeCompare(b.c.n);
    });
    return out.slice(0, opts.limit || 12).map(function (x) { return x.c; });
  }

  function subseq(needle, hay) {
    var j = 0;
    for (var i = 0; i < hay.length && j < needle.length; i++) {
      if (hay[i] === needle[j]) j++;
    }
    return j === needle.length;
  }

  /* ---------------------------------------------------------------- decks */

  function deck(id) {
    return DATA.decks.filter(function (d) { return d.id === id; })[0] || DATA.decks[0];
  }

  /* Every card legally available in a deck, flattened, commander included. */
  function deckPool(id) {
    var d = deck(id);
    if (!d) return [];
    var seen = {}, out = [];
    ['commanders', 'main', 'side'].forEach(function (g) {
      (d[g] || []).forEach(function (pair) {
        var n = pair[1];
        if (seen[n]) return;
        seen[n] = 1;
        var c = card(n);
        if (c) out.push(c);
      });
    });
    return out;
  }

  function commanderOf(id) {
    var d = deck(id);
    return d && d.commanders.length ? d.commanders[0][1] : null;
  }

  /* ------------------------------------------------- replacement effects */

  /* Each entry describes ONE replacement effect, keyed by the card that makes
   * it. `op` is 'add' (that many plus N) or 'mul' (N times that many).
   * `kinds` null means every kind of counter. `scope` is checked against the
   * event target. `mine` means it only applies to permanents you control.
   * `needs` is an optional extra gate (Innkeeper's Talent only doubles at
   * level 3). `selfless` means it never applies to its own source.           */
  var REPLACE = {
    'Hardened Scales':
      { op: 'add', amt: 1, kinds: [P1], scope: ['creature'], mine: true },
    'Ozolith, the Shattered Spire':
      { op: 'add', amt: 1, kinds: [P1], scope: ['creature', 'artifact'], mine: true },
    'Kami of Whispered Hopes':
      { op: 'add', amt: 1, kinds: [P1], scope: ['permanent'], mine: true },
    'Benevolent Hydra':
      { op: 'add', amt: 1, kinds: [P1], scope: ['creature'], mine: true, selfless: true },
    'Branching Evolution':
      { op: 'mul', amt: 2, kinds: [P1], scope: ['creature'], mine: true },
    'The Earth Crystal':
      { op: 'mul', amt: 2, kinds: [P1], scope: ['creature'], mine: true },
    'Primal Vigor':
      { op: 'mul', amt: 2, kinds: [P1], scope: ['creature'], mine: false },
    'Doubling Season':
      { op: 'mul', amt: 2, kinds: null, scope: ['permanent'], mine: true },
    'Vorinclex, Monstrous Raider':
      { op: 'mul', amt: 2, kinds: null, scope: ['permanent', 'player'], mine: true, byYou: true },
    "Innkeeper's Talent":
      { op: 'mul', amt: 2, kinds: null, scope: ['permanent', 'player'], mine: true,
        byYou: true, needs: function (p) { return (p.level || 1) >= 3; } },
    /* Arwen only modifies creatures ENTERING, and never herself. Her amount is
     * her own toughness, so it moves as she grows — which is why she is an
     * effect in the ordering rather than a number added afterwards. */
    'Arwen, Weaver of Hope':
      { op: 'add', kinds: [P1], scope: ['creature'], mine: true, selfless: true,
        onEnter: true,
        amtFn: function (src, state) { return Math.max(0, toughnessOf(state, src)); } }
  };

  /* Token creation is its own replacement family (CR 614.x on token-making). */
  var TOKEN_REPLACE = {
    'Doubling Season': { op: 'mul', amt: 2, mine: true },
    'Parallel Lives': { op: 'mul', amt: 2, mine: true },
    'Primal Vigor': { op: 'mul', amt: 2, mine: false },
    'Peregrin Took': { op: 'food', amt: 1, mine: true }
  };

  /* Abilities that say "double the number of counters on X". These are NOT
   * replacement effects. They look at X, then PUT that many more on it — and
   * that put is itself modified by everything above. This is the single
   * biggest source of numbers people get wrong.                              */
  var DOUBLERS = {
    'Kalonian Hydra': { when: 'attacks', sel: 'each-yours' },
    'Bristly Bill, Spine Sower': { when: 'activate', cost: 5, sel: 'each-yours' },
    'Mossborn Hydra': { when: 'landfall', sel: 'self' },
    'Primordial Hydra': { when: 'upkeep', sel: 'self' },
    'Voracious Hydra': { when: 'etb', sel: 'self' },
    'Ornery Tumblewagg': { when: 'attacks-saddled', sel: 'target' },
    'Court of Garenbrig': { when: 'upkeep-monarch', sel: 'each-yours' }
  };

  var PROLIFERATORS = {
    'Karn\'s Bastion': { cost: 4, times: 1 },
    'Contagion Engine': { cost: 4, times: 2 },
    'Evolution Sage': { when: 'landfall', times: 1 },
    'Cankerbloom': { when: 'sacrifice', times: 1 },
    'Unnatural Restoration': { when: 'cast', times: 1 }
  };

  /* ----------------------------------------------------------- game state */

  var uidSeq = 1;

  function newState(deckId) {
    return {
      deck: deckId || 'clex',
      field: [],
      hand: [],
      mana: { total: 0 },
      tax: 0,
      cmdOnField: false,
      log: []
    };
  }

  function clone(s) { return JSON.parse(JSON.stringify(s)); }

  function addPermanent(state, name, opts) {
    opts = opts || {};
    var c = card(name);
    var p = {
      uid: 'p' + (uidSeq++),
      name: name,
      counters: opts.counters || {},
      tapped: !!opts.tapped,
      sick: opts.sick !== undefined ? !!opts.sick : isType(name, 'creature'),
      level: opts.level || 1,
      saddled: !!opts.saddled,
      controller: opts.controller || 'you'
    };
    state.field.push(p);
    return p;
  }

  function find(state, uid) {
    return state.field.filter(function (p) { return p.uid === uid; })[0] || null;
  }

  function remove(state, uid) {
    state.field = state.field.filter(function (p) { return p.uid !== uid; });
  }

  function countersOn(p, kind) { return (p.counters && p.counters[kind]) || 0; }

  function setCounters(p, kind, n) {
    if (!p.counters) p.counters = {};
    if (n <= 0) delete p.counters[kind]; else p.counters[kind] = n;
  }

  /* Power/toughness as actually seen on the battlefield. */
  function powerOf(state, p) {
    var b = basePT(p.name);
    if (!b) return 0;
    return b.p + countersOn(p, P1) - countersOn(p, M1);
  }

  function toughnessOf(state, p) {
    var b = basePT(p.name);
    if (!b) return 0;
    return b.t + countersOn(p, P1) - countersOn(p, M1);
  }

  /* ------------------------------------------------- the counter event */

  /* Does one replacement effect apply to this event? */
  function applies(rule, src, ev, state) {
    if (rule.kinds && rule.kinds.indexOf(ev.kind) < 0) return false;
    if (rule.needs && !rule.needs(src)) return false;
    if (rule.selfless && ev.target && ev.target.uid === src.uid) return false;
    if (rule.byYou && ev.by === 'opp') return false;
    if (rule.onEnter && !ev.entering) return false;

    if (ev.player) return rule.scope.indexOf('player') > -1;
    if (!ev.target) return false;

    // "mine" effects only touch permanents their controller controls.
    if (rule.mine && ev.target.controller !== src.controller) return false;

    if (rule.scope.indexOf('permanent') > -1) return true;
    for (var i = 0; i < rule.scope.length; i++) {
      if (isType(ev.target.name, rule.scope[i])) return true;
    }
    return false;
  }

  /* Every replacement effect on the battlefield that applies to this event. */
  function effectsFor(state, ev) {
    var out = [];
    state.field.forEach(function (p) {
      var rule = REPLACE[p.name];
      if (!rule) return;
      if (applies(rule, p, ev, state)) {
        var amt = rule.amtFn ? rule.amtFn(p, state) : rule.amt;
        if (amt > 0) out.push({ src: p, name: p.name, op: rule.op, amt: amt });
      }
    });
    // Vorinclex's downside half only matters for counters an opponent puts.
    if (ev.by === 'opp') {
      state.field.forEach(function (p) {
        if (p.name === 'Vorinclex, Monstrous Raider' && p.controller === 'you') {
          out.push({ src: p, name: p.name + ' (opponent half)', op: 'half', amt: 2 });
        }
      });
    }
    return out;
  }

  function step(n, e) {
    if (e.op === 'add') return n + e.amt;
    if (e.op === 'mul') return n * e.amt;
    if (e.op === 'half') return Math.floor(n / e.amt);
    return n;
  }

  /* Apply a set of replacement effects in the order that helps me most.
   *
   * With +k and xm effects the best order is provably "all adds, then all
   * multiplies" — (n+k)*m beats n*m+k for m>1. But rather than trust that, we
   * enumerate every legal order when there are few enough effects and take the
   * genuine maximum, so the step list we show is a real order and not a
   * rationalisation. Above the cap we fall back to adds-first and say so.     */
  var PERM_CAP = 8;

  function bestOrder(base, effects, want) {
    want = want || 'max';
    if (!effects.length) return { n: base, order: [], exhaustive: true };

    if (effects.length <= PERM_CAP) {
      var best = null;
      permute(effects, function (order) {
        var n = base;
        for (var i = 0; i < order.length; i++) n = step(n, order[i]);
        if (best === null ||
            (want === 'max' ? n > best.n : n < best.n)) {
          best = { n: n, order: order.slice() };
        }
      });
      best.exhaustive = true;
      return best;
    }

    var adds = effects.filter(function (e) { return e.op === 'add'; });
    var rest = effects.filter(function (e) { return e.op !== 'add'; });
    var ord = want === 'max' ? adds.concat(rest) : rest.concat(adds);
    var v = base;
    ord.forEach(function (e) { v = step(v, e); });
    return { n: v, order: ord, exhaustive: false };
  }

  function permute(arr, fn) {
    var n = arr.length, c = new Array(n).fill(0), a = arr.slice();
    fn(a);
    var i = 0;
    while (i < n) {
      if (c[i] < i) {
        var k = i % 2 ? c[i] : 0;
        var t = a[k]; a[k] = a[i]; a[i] = t;
        fn(a);
        c[i]++; i = 0;
      } else { c[i] = 0; i++; }
    }
  }

  /* THE core call. Put `n` counters of `kind` on permanent `target`.
   * Returns the number actually placed plus a human-readable derivation.     */
  function putCounters(state, target, kind, n, opts) {
    opts = opts || {};
    var ev = {
      target: target,
      player: opts.player || null,
      kind: kind,
      n: n,
      by: opts.by || 'you',
      entering: !!opts.entering
    };
    var eff = effectsFor(state, ev);

    // For -1/-1 counters on something of mine, fewer is better. There is
    // usually no choice (only doublers apply) but the intent should be right.
    var want = (kind === M1 && target && target.controller === 'you') ? 'min' : 'max';

    var res = bestOrder(n, eff, want);

    var steps = [];
    steps.push({ label: 'Base event', n: n, note: n + ' ' + kind + ' counter' + (n === 1 ? '' : 's') });
    var run = n;
    res.order.forEach(function (e) {
      var before = run;
      run = step(run, e);
      steps.push({
        label: e.name,
        n: run,
        note: e.op === 'add' ? ('+' + e.amt + '  (' + before + ' -> ' + run + ')')
            : e.op === 'mul' ? ('x' + e.amt + '  (' + before + ' -> ' + run + ')')
            : ('halved, rounded down  (' + before + ' -> ' + run + ')')
      });
    });

    var placed = res.n;
    if (target) {
      setCounters(target, kind, countersOn(target, kind) + placed);
      annihilate(target);
    }

    return {
      placed: placed,
      base: n,
      steps: steps,
      effects: eff.map(function (e) { return e.name; }),
      exhaustive: res.exhaustive,
      target: target
    };
  }

  /* CR 704.5q — +1/+1 and -1/-1 counters cancel as a state-based action. */
  function annihilate(p) {
    var a = countersOn(p, P1), b = countersOn(p, M1);
    if (a > 0 && b > 0) {
      var k = Math.min(a, b);
      setCounters(p, P1, a - k);
      setCounters(p, M1, b - k);
      return k;
    }
    return 0;
  }

  /* --------------------------------------------------- derived actions */

  /* "Double the number of +1/+1 counters on each creature you control."
   * Counts are read from a SNAPSHOT, because the ability sees the board as it
   * resolves — it does not compound creature by creature.                    */
  function doubleCounters(state, which, kind) {
    kind = kind || P1;
    var targets = which.filter(function (p) { return countersOn(p, kind) > 0; });
    var snapshot = targets.map(function (p) { return { p: p, had: countersOn(p, kind) }; });
    var results = [];
    snapshot.forEach(function (s) {
      var r = putCounters(state, s.p, kind, s.had);
      r.had = s.had;
      r.now = countersOn(s.p, kind);
      results.push(r);
    });
    return results;
  }

  /* Proliferate: choose any number of permanents/players with counters, give
   * each another counter of each kind already there. We choose every permanent
   * of ours — except one holding -1/-1 counters, which we would never pick.  */
  function proliferate(state, times) {
    times = Math.max(1, times || 1);
    var rounds = [];
    for (var t = 0; t < times; t++) {
      var round = [];
      state.field.slice().forEach(function (p) {
        if (p.controller !== 'you') return;
        var kinds = Object.keys(p.counters || {});
        kinds.forEach(function (k) {
          if (k === M1) return;               // never proliferate our own -1/-1
          if (countersOn(p, k) <= 0) return;
          round.push(putCounters(state, p, k, 1));
        });
      });
      rounds.push(round);
    }
    return rounds;
  }

  /* Moving counters is a remove and a PUT, so the put is replaced too.
   * Confirmed by the Nesting Grounds ruling: "the counter is removed from the
   * first permanent and put on the second. Any abilities that care about a
   * counter being ... put onto a permanent will apply."                       */
  function moveCounters(state, from, to, kind, n) {
    kind = kind || P1;
    var have = countersOn(from, kind);
    var take = Math.min(have, n == null ? have : n);
    if (take <= 0) return { moved: 0, placed: 0, steps: [] };
    setCounters(from, kind, have - take);
    var r = putCounters(state, to, kind, take);
    r.moved = take;
    r.from = from;
    return r;
  }

  /* A permanent entering with counters. Same replacement machinery — a
   * creature that "enters with four +1/+1 counters" is an event of four.     */
  function enterWithCounters(state, name, n, opts) {
    opts = opts || {};
    var p = addPermanent(state, name, { controller: opts.controller || 'you' });
    var printed = n != null ? n : printedEnterCounters(name);
    var r = { placed: 0, steps: [], base: printed, target: p, effects: [] };

    /* Arwen adds her toughness to anything else entering, so a creature with
     * no printed counters can still enter with some. Ask the board, not the
     * card, whether this is a zero event. */
    var hasEnterAdder = state.field.some(function (q) {
      return q.controller === 'you' && REPLACE[q.name] && REPLACE[q.name].onEnter &&
             q.uid !== p.uid && isType(name, 'creature');
    });

    if (printed > 0 || hasEnterAdder) {
      // Its own Ozolith-style ability does not apply to itself entering
      // (see the Shattered Spire ruling), which `selfless` handles.
      r = putCounters(state, p, P1, printed, { entering: true });
    }
    r.permanent = p;
    return r;
  }

  function printedEnterCounters(name) {
    var c = card(name);
    if (!c) return 0;
    var m = /enters with (\w+) \+1\/\+1 counters?/i.exec(c.o);
    if (!m) return 0;
    var words = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5,
                  six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    var w = m[1].toLowerCase();
    return words[w] != null ? words[w] : (parseInt(w, 10) || 0);
  }

  /* Token creation, with its own doublers. */
  function createTokens(state, n, opts) {
    opts = opts || {};
    var eff = [];
    state.field.forEach(function (p) {
      var rule = TOKEN_REPLACE[p.name];
      if (!rule) return;
      if (rule.mine && p.controller !== 'you') return;
      eff.push({ src: p, name: p.name, op: rule.op, amt: rule.amt });
    });
    var muls = eff.filter(function (e) { return e.op === 'mul'; });
    var food = eff.filter(function (e) { return e.op === 'food'; });
    var out = n;
    var steps = [{ label: 'Base', n: n, note: n + ' token' + (n === 1 ? '' : 's') }];
    muls.forEach(function (e) {
      var b = out; out = out * e.amt;
      steps.push({ label: e.name, n: out, note: 'x' + e.amt + '  (' + b + ' -> ' + out + ')' });
    });
    var extraFood = 0;
    food.forEach(function (e) {
      extraFood += e.amt;
      steps.push({ label: e.name, n: out, note: '+' + e.amt + ' Food token' });
    });
    return { tokens: out, food: extraFood, steps: steps,
             effects: eff.map(function (e) { return e.name; }) };
  }

  /* ------------------------------------------------------------- mana */

  /* How much mana a printed "{T}: Add ..." ability actually makes.
   *
   * Read from the card text rather than from a list of names, so a card nobody
   * thought about still gets the right number. It deliberately only matches a
   * TAP ability: "Sacrifice a Goblin: Add {R}" is not free mana, it costs a
   * creature, and counting it would have the optimizer spend mana that is not
   * there. Same for triggered mana like Mana Echoes.
   *
   * Returns null when the amount is not a fixed number, so the caller knows to
   * fall back to a rule of its own rather than guess.                        */
  function printedTapMana(name) {
    var c = card(name);
    if (!c || !c.o) return 0;

    var best = null;
    c.o.split('\n').forEach(function (line) {
      if (line.indexOf('{T}') < 0) return;

      /* The cost is everything before the colon. Reject a cost that also wants
       * mana or a sacrifice: those are not net production. */
      var colon = line.indexOf(':');
      if (colon < 0) return;
      var cost = line.slice(0, colon);
      var effect = line.slice(colon + 1);
      if (!/\bAdd\b/.test(effect)) return;
      if (/sacrifice|discard|pay|exile/i.test(cost)) return;
      if (/\{[0-9WUBRGCXS]\}/.test(cost)) return;      // {1},{T}: Add ... is not a gain

      /* Variable amounts are somebody else's problem. */
      if (/\bfor each\b|\bX mana\b|\bequal to\b/i.test(effect)) { best = null; return; }

      var add = effect.split('.')[0];
      var symbols = add.match(/\{[WUBRGC]\}/g);
      var amount = symbols ? symbols.length
                 : /\bone mana\b|\ban additional\b|\bmana of any\b/i.test(add) ? 1
                 : 0;
      if (amount > 0 && (best === null || amount > best)) best = amount;
    });
    return best;
  }

  /* What a permanent taps for right now, given the board.
   * The sources that scale with the board are modelled exactly; everything
   * else is read off the card. Where neither is possible the answer is 0,
   * because under-counting costs you a play and over-counting loses a game. */
  function manaFrom(state, p) {
    var n = p.name;
    if (p.tapped) return 0;

    /* --- scales with the board, so it cannot be read off the card --- */
    if (n === 'Incubation Druid') return countersOn(p, P1) > 0 ? 3 : 1;
    if (n === 'Gyre Sage') return countersOn(p, P1);
    if (n === 'Kami of Whispered Hopes') return Math.max(0, powerOf(state, p));
    if (n === 'Selvala, Heart of the Wilds') return greatestPower(state);
    if (n === 'Gaea\'s Cradle') return myCreatureCount(state);
    if (n === 'Howlsquad Heavy') {
      /* Max speed only. Until then it makes nothing, and claiming otherwise
       * would be inventing mana. */
      return p.maxSpeed ? countOf(state, 'goblin') : 0;
    }
    if (n === 'Fanatic of Rhonas') {
      return greatestPower(state) >= 4 ? 4 : 1;        // ferocious
    }
    if (n === 'Nykthos, Shrine to Nyx') return 1;      // its {T}: Add {C}; devotion needs an activation
    if (n === 'Castle Garenbrig') return 1;            // the 4 is creature-spells only

    /* --- everything else, read from the printed ability --- */
    var printed = printedTapMana(n);
    if (printed !== null) return printed;

    return 0;
  }

  function greatestPower(state) {
    var best = 0;
    state.field.forEach(function (q) {
      if (q.controller !== 'you' || !isType(q.name, 'creature')) return;
      best = Math.max(best, powerOf(state, q));
    });
    return best;
  }

  function myCreatureCount(state) {
    return state.field.filter(function (q) {
      return q.controller === 'you' && isType(q.name, 'creature');
    }).length;
  }

  function countOf(state, type) {
    return state.field.filter(function (q) {
      return q.controller === 'you' && isType(q.name, type);
    }).length;
  }

  function manaAvailable(state) {
    var sum = 0;
    var forests = 0;

    state.field.forEach(function (p) {
      if (p.controller !== 'you') return;
      if (p.tapped) return;
      /* A land that is also a creature, like Dryad Arbor, is still subject to
       * summoning sickness. A plain land never is. */
      if (isType(p.name, 'creature') && p.sick && !hasHaste(state, p)) return;
      sum += manaFrom(state, p);
      if (isType(p.name, 'forest')) forests++;
    });

    /* "Whenever you tap a Forest for mana, add an additional {G}." With this
     * deck's 26 Forests that is close to doubling the land base, so leaving it
     * out was quietly costing him a turn. */
    var nissa = state.field.some(function (p) {
      return p.controller === 'you' && p.name === 'Nissa, Who Shakes the World' &&
             !(p.sick && !hasHaste(state, p));
    });
    if (nissa) sum += forests;

    return sum;
  }

  function hasHaste(state, p) {
    var c = card(p.name);
    if (c && /\bhaste\b/i.test(c.o)) return true;
    return state.field.some(function (q) {
      return q.controller === 'you' &&
        (q.name === 'Lightning Greaves' || q.name === 'Swiftfoot Boots' ||
         q.name === 'Goblin Warchief' || q.name === 'Goblin Chieftain' ||
         q.name === 'Anger');
    });
  }

  /* Cost after the discounts this deck actually runs. */
  function costOf(state, name) {
    var c = card(name);
    if (!c) return 0;
    var v = c.v || 0;
    var disc = 0;
    var green = (c.ci || []).indexOf('G') > -1;
    var red = (c.ci || []).indexOf('R') > -1;
    state.field.forEach(function (p) {
      if (p.controller !== 'you') return;
      if (p.name === 'The Earth Crystal' && green) disc += 1;
      if (p.name === 'Emerald Medallion' && green) disc += 1;
      if (p.name === 'Ruby Medallion' && red) disc += 1;
      if (p.name === 'The Fire Crystal' && red) disc += 1;
    });
    return Math.max(0, v - disc);
  }

  /* ----------------------------------------------------------- exports */

  return {
    P1: P1, M1: M1,
    DATA: DATA,
    cards: DATA.cards,
    card: card,
    isType: isType,
    basePT: basePT,
    search: search,
    deck: deck,
    deckPool: deckPool,
    commanderOf: commanderOf,

    REPLACE: REPLACE,
    TOKEN_REPLACE: TOKEN_REPLACE,
    DOUBLERS: DOUBLERS,
    PROLIFERATORS: PROLIFERATORS,

    newState: newState,
    clone: clone,
    addPermanent: addPermanent,
    find: find,
    remove: remove,
    countersOn: countersOn,
    setCounters: setCounters,
    powerOf: powerOf,
    toughnessOf: toughnessOf,
    annihilate: annihilate,

    effectsFor: effectsFor,
    putCounters: putCounters,
    doubleCounters: doubleCounters,
    proliferate: proliferate,
    moveCounters: moveCounters,
    enterWithCounters: enterWithCounters,
    printedEnterCounters: printedEnterCounters,
    createTokens: createTokens,

    manaFrom: manaFrom,
    printedTapMana: printedTapMana,
    greatestPower: greatestPower,
    manaAvailable: manaAvailable,
    costOf: costOf,
    hasHaste: hasHaste
  };
})();
