/* CLEX — combo detection.
 *
 * The rule this file exists to enforce: a loop is only called INFINITE if it
 * returns to the same board state with strictly more of something, forever,
 * with no outside input. Everything else is "big", and big is not infinite.
 * Saying "infinite" about a line that runs out is how you lose a game.
 *
 * Every entry below was checked against the printed Oracle text in data.js.
 * `zone` records whether the pieces are actually in the 99 — a combo whose
 * piece sits in the Moxfield sideboard cannot be drawn, and saying so is more
 * useful than pretending it is live.
 */
window.Combos = (function () {
  'use strict';

  var C = window.Clex;

  /* Which deck list a card is really in. */
  var ZONE = {};
  (C.DATA.decks || []).forEach(function (d) {
    ['commanders', 'main'].forEach(function (g) {
      (d[g] || []).forEach(function (p) { ZONE[d.id + '|' + p[1]] = 'main'; });
    });
    (d.side || []).forEach(function (p) {
      if (!ZONE[d.id + '|' + p[1]]) ZONE[d.id + '|' + p[1]] = 'side';
    });
  });

  function zoneOf(deckId, name) { return ZONE[deckId + '|' + name] || 'none'; }

  /* Tutors, and what each one can legally find. */
  var TUTORS = [
    { name: 'Worldly Tutor', deck: 'clex', to: 'top of library',
      can: function (n) { return C.isType(n, 'creature'); } },
    { name: 'Natural Order', deck: 'clex', to: 'battlefield',
      can: function (n) { return C.isType(n, 'creature') && (C.card(n).ci || []).indexOf('G') > -1; } },
    { name: 'Unnatural Restoration', deck: 'clex', to: 'hand (from your graveyard)',
      can: function (n) { return C.isType(n, 'permanent') || !C.isType(n, 'instant'); } },
    { name: 'Goblin Matron', deck: 'krenko', to: 'hand',
      can: function (n) { return C.isType(n, 'goblin'); } },
    { name: 'Goblin Recruiter', deck: 'krenko', to: 'top of library',
      can: function (n) { return C.isType(n, 'goblin'); } },
    { name: 'Imperial Recruiter', deck: 'krenko', to: 'hand',
      can: function (n) { var c = C.card(n); return c && parseInt(c.p, 10) <= 2; } },
    { name: 'Muxus, Goblin Grandee', deck: 'krenko', to: 'battlefield',
      can: function (n) { var c = C.card(n); return C.isType(n, 'goblin') && c && c.v <= 5; } }
  ];

  /* ------------------------------------------------------------- combos */

  var LIST = [
    /* ---------------------------------------------------- VORINCLEX --- */
    {
      deck: 'clex',
      name: 'Scurry Oak + Ivy Lane Denizen',
      pieces: ['Scurry Oak', 'Ivy Lane Denizen'],
      infinite: true,
      start: 'Needs one green creature to enter, or any +1/+1 counter put on Scurry Oak, to begin.',
      result: ['Infinite 1/1 green Squirrel tokens', 'Arbitrarily large Scurry Oak'],
      line: [
        'A green creature enters.',
        'Ivy Lane Denizen triggers: put a +1/+1 counter on Scurry Oak.',
        'Scurry Oak triggers on the counter: create a 1/1 green Squirrel.',
        'The Squirrel is green and entered, so Ivy Lane Denizen triggers again.',
        'Repeat as many times as you like.'
      ],
      note: 'With Vorinclex out each counter is doubled, so Scurry Oak grows twice as fast, but the loop is already infinite without him.'
    },
    {
      deck: 'clex',
      name: 'Herd Baloth + Ivy Lane Denizen',
      pieces: ['Herd Baloth', 'Ivy Lane Denizen'],
      infinite: true,
      start: 'Needs one green creature to enter, or a +1/+1 counter put on Herd Baloth, to begin.',
      result: ['Infinite 4/4 green Beast tokens'],
      line: [
        'A green creature enters; Ivy Lane Denizen puts a +1/+1 counter on Herd Baloth.',
        'Herd Baloth triggers: create a 4/4 green Beast.',
        'The Beast is green, so Ivy Lane Denizen triggers again.',
        'Repeat.'
      ]
    },
    {
      deck: 'clex',
      name: 'Bristly Bill + Agatha\'s Soul Cauldron + Incubation Druid',
      pieces: ['Bristly Bill, Spine Sower', 'Agatha\'s Soul Cauldron', 'Incubation Druid', 'Devoted Druid'],
      infinite: true,
      start: 'Devoted Druid must be in your GRAVEYARD and exiled with the Cauldron. ' +
             'Incubation Druid needs about 5 +1/+1 counters to start, or about 7 with Vorinclex out.',
      result: ['Arbitrarily large mana', 'Arbitrarily large +1/+1 counters on every creature'],
      line: [
        'Exile Devoted Druid from your graveyard with Agatha\'s Soul Cauldron.',
        'Incubation Druid has a +1/+1 counter, so it gains "put a -1/-1 counter on this creature: untap it".',
        'Tap Incubation Druid for 3 mana, then untap it by putting a -1/-1 counter on it.',
        'The -1/-1 cancels a +1/+1, so each untap costs one counter and yields 3 mana.',
        'Bank 5 mana, then activate Bristly Bill: double the +1/+1 counters on each creature.',
        'Doubling puts back more counters than you spent, so you come out ahead every cycle.'
      ],
      note: 'Vorinclex makes each untap cost TWO counters, because he doubles the -1/-1 counter as well. ' +
            'He also doubles what Bristly Bill puts back, so the loop still runs, just from a higher starting count.'
    },
    {
      deck: 'clex',
      name: 'Agatha\'s Soul Cauldron + Devoted Druid (mana burst)',
      pieces: ['Agatha\'s Soul Cauldron', 'Devoted Druid', 'Incubation Druid'],
      infinite: false,
      result: ['Large one-shot mana, about 3 per +1/+1 counter you are willing to spend'],
      line: [
        'Exile Devoted Druid from your graveyard with the Cauldron.',
        'Incubation Druid with a +1/+1 counter can now untap itself by taking a -1/-1 counter.',
        'Each untap spends one +1/+1 counter and gives 3 mana.'
      ],
      note: 'This is FINITE. It stops when the counters run out. Vorinclex halves your untaps by doubling the -1/-1 counters.'
    },
    {
      deck: 'clex',
      name: 'Kalonian Hydra attack (counter explosion)',
      pieces: ['Kalonian Hydra'],
      infinite: false,
      result: ['Doubles the +1/+1 counters on every creature you control, once per attack'],
      line: [
        'Attack with Kalonian Hydra.',
        'Its trigger doubles the counters on each creature you control.',
        'Doubling reads the current count and PUTS that many more, so Vorinclex, Hardened Scales ' +
        'and the rest all apply to the counters being put.'
      ],
      note: 'Big, not infinite. One doubling per combat.'
    },
    {
      deck: 'clex',
      name: 'Forgotten Ancient (counter engine)',
      pieces: ['Forgotten Ancient'],
      infinite: false,
      result: ['A counter per spell anyone casts, moved wherever you need it on your upkeep'],
      line: [
        'Every spell any player casts puts a counter on Forgotten Ancient.',
        'On your upkeep, move any number of those counters onto other creatures.',
        'Moving is a remove and a PUT, so the counters that arrive are doubled by Vorinclex.'
      ],
      note: 'Growth engine, not a loop.'
    },
    {
      deck: 'clex',
      name: 'Selvala, Heart of the Wilds (mana from power)',
      pieces: ['Selvala, Heart of the Wilds'],
      infinite: false,
      result: ['Mana equal to your biggest creature\'s power, once per untap'],
      line: [
        'Tap Selvala for mana equal to the greatest power among your creatures.',
        'Any counter growth on your biggest creature raises this immediately.'
      ]
    },

    /* ------------------------------------------------------- KRENKO --- */
    {
      deck: 'krenko',
      name: 'Kiki-Jiki + Zealous Conscripts',
      pieces: ['Kiki-Jiki, Mirror Breaker', 'Zealous Conscripts'],
      infinite: true,
      result: ['Infinite hasty 3/3 Zealous Conscripts tokens', 'Lethal damage on the spot'],
      line: [
        'Tap Kiki-Jiki to copy Zealous Conscripts.',
        'The copy enters and untaps Kiki-Jiki.',
        'Tap Kiki-Jiki again to make another copy.',
        'Repeat for as many hasty attackers as you want.'
      ],
      note: 'With Impact Tremors or Purphoros out this is infinite damage without attacking.'
    },
    {
      deck: 'krenko',
      name: 'Krenko + Staff of Domination + Skirk Prospector',
      pieces: ['Krenko, Mob Boss', 'Staff of Domination', 'Skirk Prospector'],
      infinite: true,
      start: 'Needs 5 or more Goblins on board so each Krenko activation pays for the untap.',
      result: ['Infinite Goblin tokens', 'Infinite red mana'],
      line: [
        'Tap Krenko: create X 1/1 Goblins, where X is the number of Goblins you control.',
        'Sacrifice 4 Goblins to Skirk Prospector for 4 mana.',
        'Pay {3} and tap Staff of Domination to untap Krenko, then {1} to untap the Staff.',
        'You are back where you started with more Goblins than before. Repeat.'
      ]
    },
    {
      deck: 'krenko',
      name: 'Krenko + Ashnod\'s Altar + Staff of Domination',
      pieces: ['Krenko, Mob Boss', 'Ashnod\'s Altar', 'Staff of Domination'],
      infinite: true,
      start: 'Needs 3 or more Goblins so the sacrifices cover the untap cost.',
      result: ['Infinite Goblin tokens', 'Infinite colourless mana'],
      line: [
        'Tap Krenko to make X Goblins.',
        'Sacrifice 2 Goblins to Ashnod\'s Altar for 4 colourless.',
        'Pay {3}, tap Staff to untap Krenko, then {1} to untap the Staff.',
        'Repeat, netting Goblins every cycle.'
      ]
    },
    {
      deck: 'krenko',
      name: 'Conspicuous Snoop + Kiki-Jiki on top of library',
      pieces: ['Conspicuous Snoop', 'Kiki-Jiki, Mirror Breaker'],
      infinite: true,
      start: 'Kiki-Jiki must be the TOP CARD of your library, not on the battlefield. ' +
             'Goblin Recruiter sets this up exactly.',
      result: ['Infinite Goblin tokens', 'Infinite damage with Pashalik Mons or Impact Tremors'],
      line: [
        'With Kiki-Jiki on top, Conspicuous Snoop has Kiki-Jiki\'s tap ability.',
        'Tap Snoop to copy Snoop. Snoop is nonlegendary, so the copy sticks.',
        'The copy also sees Kiki-Jiki on top, so it too can tap to copy.',
        'Repeat for arbitrarily many Snoops.'
      ],
      note: 'Needs a damage outlet to actually win: Pashalik Mons, Impact Tremors, Purphoros or Goblin Bombardment.'
    },
    {
      deck: 'krenko',
      name: 'Krenko, Tin Street Kingpin (attack engine)',
      pieces: ['Krenko, Tin Street Kingpin'],
      infinite: false,
      result: ['A +1/+1 counter and a Goblin per point of power, every attack'],
      line: [
        'Attack with Krenko, Tin Street Kingpin.',
        'It gets a +1/+1 counter, then makes Goblins equal to its power.',
        'The counter is placed first, so the Goblin count already includes it.'
      ],
      note: 'Big and repeatable, but once per combat. Not infinite.'
    },
    {
      deck: 'krenko',
      name: 'Mana Echoes + Krenko (explosive mana)',
      pieces: ['Mana Echoes', 'Krenko, Mob Boss'],
      infinite: false,
      result: ['A very large burst of colourless mana from one Krenko activation'],
      line: [
        'Tap Krenko to make X Goblins.',
        'Each Goblin entering triggers Mana Echoes for the number of Goblins sharing its type.',
        'The mana adds up fast, but it stops when Krenko is tapped out.'
      ],
      note: 'Add Staff of Domination and this becomes a genuine infinite.'
    }
  ];

  /* ---------------------------------------------------------- detection */

  function detect(state, hand) {
    hand = hand || state.hand || [];
    var deckId = state.deck || 'clex';

    var onField = {};
    state.field.forEach(function (p) {
      if (p.controller === 'you') onField[p.name] = p;
    });
    var inHand = {};
    hand.forEach(function (n) { inHand[n] = true; });

    var out = [];
    LIST.forEach(function (combo) {
      if (combo.deck !== deckId) return;

      var have = [], missing = [];
      combo.pieces.forEach(function (n) {
        if (onField[n] || inHand[n]) have.push(n); else missing.push(n);
      });
      if (!have.length) return;                 // nothing to say about it yet

      var route = null;
      if (missing.length) route = routeTo(state, hand, missing, deckId);

      out.push({
        name: combo.name,
        deck: combo.deck,
        pieces: combo.pieces,
        have: have,
        missing: missing,
        complete: missing.length === 0,
        infinite: !!combo.infinite,
        result: combo.result,
        line: combo.line,
        start: combo.start || null,
        note: combo.note || null,
        route: route,
        zones: combo.pieces.map(function (n) { return { name: n, zone: zoneOf(deckId, n) }; }),
        offDeck: combo.pieces.filter(function (n) { return zoneOf(deckId, n) !== 'main'; })
      });
    });

    /* Closest to done first, then infinite before merely large. */
    out.sort(function (a, b) {
      return a.missing.length - b.missing.length ||
             (b.infinite ? 1 : 0) - (a.infinite ? 1 : 0);
    });
    return out;
  }

  /* Can anything I have actually fetch the missing piece? */
  function routeTo(state, hand, missing, deckId) {
    var available = {};
    state.field.forEach(function (p) { if (p.controller === 'you') available[p.name] = 1; });
    hand.forEach(function (n) { available[n] = 1; });

    var lines = [];
    missing.forEach(function (want) {
      for (var i = 0; i < TUTORS.length; i++) {
        var t = TUTORS[i];
        if (t.deck !== deckId) continue;
        if (!available[t.name]) continue;
        var c = C.card(want);
        if (!c) continue;
        var can = false;
        try { can = t.can(want); } catch (e) { can = false; }
        if (can) { lines.push(t.name + ' -> ' + want + ' (to ' + t.to + ')'); break; }
      }
    });
    return lines.length ? lines.join('; ') : null;
  }

  return {
    LIST: LIST,
    TUTORS: TUTORS,
    detect: detect,
    zoneOf: zoneOf
  };
})();
