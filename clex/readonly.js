/* CLEX — the read-only latch.
 *
 * CLEX is allowed to READ everything Motherbase knows: the row store, so the
 * themes Tom made in STYLE show up here, and the icon packs with them. It is
 * never allowed to WRITE any of it. A play aid for a card game has no business
 * changing a training log.
 *
 * This file is the enforcement. It runs immediately after the shared scripts
 * load and replaces every mutating entry point with a refusal. Readers are
 * untouched.
 *
 * It is a separate file, rather than a few lines in index.html, so that
 * _smoke.html can load it and actually prove the writes are blocked. A
 * guarantee nobody tested is just a comment.
 *
 * If you are adding a feature to CLEX and something here refuses you, the
 * answer is not to loosen the latch. CLEX keeps its own state under its own
 * localStorage key. Put it there.
 */
window.ClexReadOnly = (function (g) {
  'use strict';

  var blocked = [];      // every refusal, so a test can assert on them

  function refuse(owner, name) {
    blocked.push(owner + '.' + name);
    if (g.console && console.warn) {
      console.warn('CLEX is read-only: ' + owner + '.' + name +
                   ' was blocked. CLEX must not write Motherbase data.');
    }
    return null;
  }

  /* Swap a method for a refusal, keeping the original reachable for tests. */
  function latch(obj, owner, names) {
    if (!obj) return;
    names.forEach(function (name) {
      if (typeof obj[name] !== 'function') return;
      var original = obj[name];
      obj[name] = function () { return refuse(owner, name); };
      obj[name].blockedOriginal = original;
      obj[name].isClexLatch = true;
    });
  }

  /* The row store. Everything that creates, changes or removes a row.
     Readers — get, has, row, all, map, keys, count, stats, types, export,
     on, ready — are deliberately left alone. */
  latch(g.Rec, 'Rec', [
    'set', 'del', 'recSet', 'recDel', 'merge', 'clear',
    'purge', 'vacuum', 'repairDates', 'declare'
  ]);

  /* Rec.setting reads with two arguments and writes with three, so it cannot
     simply be replaced. Let the read through and refuse the write. */
  if (g.Rec && typeof g.Rec.setting === 'function') {
    var setting = g.Rec.setting;
    g.Rec.setting = function (app, key, val) {
      if (val === undefined) return setting.call(g.Rec, app, key);
      return refuse('Rec', 'setting');
    };
    g.Rec.setting.isClexLatch = true;
  }

  /* Themes and icon packs live suite-wide. CLEX may wear them, not edit them.
     suite_skin.clex, the record of which theme CLEX itself is wearing, is
     CLEX's own key and is not touched here. */
  latch(g.Skins, 'Skins', ['saveCustom', 'forget', 'savePalette', 'clearPalette']);
  latch(g.Icons, 'Icons', ['savePack', 'forgetPack']);

  /* IO is the backup and export registry. CLEX is not registered with it, so a
     restore can never aim at CLEX, and CLEX never appears in a Motherbase
     backup. Latched anyway in case a later edit loads it. */
  latch(g.IO, 'IO', ['register', 'restore', 'merge', 'import']);

  return {
    /* Everything refused so far, newest last. Empty is the healthy state. */
    blocked: blocked,
    /* True when the row store is present and its writers are all latched. */
    verify: function () {
      if (!g.Rec) return { reading: false, latched: true, note: 'row store not loaded' };
      var writers = ['set', 'del', 'merge', 'clear', 'declare'];
      var open = writers.filter(function (n) {
        return typeof g.Rec[n] === 'function' && !g.Rec[n].isClexLatch;
      });
      return {
        reading: typeof g.Rec.all === 'function',
        latched: open.length === 0,
        open: open
      };
    }
  };
})(window);
