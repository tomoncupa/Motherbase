/* ══════════════════════ MOTHERBASE · SOUND ══════════════════════
   One sound language, chosen per app the same way skins are.

   Everything is synthesised — no files to host, nothing to load, works with no
   connection, and a pack is a handful of numbers rather than a folder of wavs.

   How it is tuned, deliberately:

     • Small actions stay small. A tick is a short dry click you feel more than
       hear. If every action celebrates, nothing does.
     • The finish escalates. One block done is one note. A column done is that
       note plus the fifth above it. The whole day is the chord resolving. The
       reward scales with what you actually finished.
     • Streaks rise. The streak sound climbs the scale as the streak grows and
       caps at an octave, so a long run sounds different from a new one.
     • Nothing but the finisher runs past ~200ms.

     <script src="shared/sound.js"></script>
     Sfx.init('block');            // remembers this app's pack + volume
     Sfx.play('tick');
     Sfx.play('complete', {level:3});
     Sfx.play('streak', {n:12});
*/
(function (g) {
'use strict';

/* voices — the "instrument options". Each is a recipe, not a sample. */
const VOICES = {
  bell:    { type: 'sine',     partials: [[1, 1], [2.76, .34], [5.4, .12]], decay: .9,  click: 0 },
  pluck:   { type: 'triangle', partials: [[1, 1], [2, .22]],                decay: .32, click: .5 },
  marimba: { type: 'sine',     partials: [[1, 1], [4, .28], [9.2, .06]],    decay: .42, click: .35 },
  glass:   { type: 'sine',     partials: [[1, 1], [3.1, .5], [7.3, .18]],   decay: 1.1, click: .12 },
  square:  { type: 'square',   partials: [[1, .55], [2, .1]],               decay: .22, click: .2 },
  wood:    { type: 'triangle', partials: [[1, .8], [3.4, .3]],              decay: .18, click: .8 },
  soft:    { type: 'sine',     partials: [[1, 1]],                          decay: .6,  click: 0 },
};

/* packs — the "sound themes". root note, scale, default voice, character. */
const PACKS = [
  { id: 'status',  name: 'Status Window', voice: 'glass',   root: 523.25, scale: [0, 4, 7, 11, 14], air: .30, drive: 0 },
  { id: 'temple',  name: 'Temple',        voice: 'bell',    root: 392.00, scale: [0, 3, 7, 10, 12], air: .45, drive: 0 },
  { id: 'workshop',name: 'Workshop',      voice: 'wood',    root: 349.23, scale: [0, 2, 5, 7, 12],  air: .05, drive: .1 },
  { id: 'arcade',  name: 'Arcade',        voice: 'square',  root: 440.00, scale: [0, 4, 7, 12, 16], air: 0,   drive: .25 },
  { id: 'marimba', name: 'Marimba',       voice: 'marimba', root: 466.16, scale: [0, 2, 4, 7, 9],   air: .12, drive: 0 },
  { id: 'quiet',   name: 'Quiet',         voice: 'soft',    root: 329.63, scale: [0, 5, 7, 12, 14], air: .2,  drive: 0 },
];

let ctx = null, bus = null, verb = null;
let cfg = { app: 'app', pack: 'status', voice: '', vol: .5, mute: false };

const KEY = app => 'mb.sfx.' + app;
const pack = () => PACKS.filter(p => p.id === cfg.pack)[0] || PACKS[0];
const voice = () => VOICES[cfg.voice || pack().voice] || VOICES.bell;
const note = i => { const P = pack(); const s = P.scale, oct = Math.floor(i / s.length), st = s[((i % s.length) + s.length) % s.length]; return P.root * Math.pow(2, (st + 12 * oct) / 12); };

function boot() {
  if (ctx) return ctx;
  const AC = g.AudioContext || g.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  bus = ctx.createGain(); bus.gain.value = cfg.vol; bus.connect(ctx.destination);
  /* a very short synthetic tail — enough to stop notes sounding amputated */
  verb = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * .7), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
  }
  verb.buffer = buf;
  const wet = ctx.createGain(); wet.gain.value = 1; verb.connect(wet); wet.connect(bus);
  verb._wet = wet;
  return ctx;
}

/** one note: partials, an envelope, an optional transient click */
function hit(freq, when, gain, dur, opts) {
  opts = opts || {};
  const V = voice(), P = pack(), t = when;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(gain, t + .006);
  out.gain.exponentialRampToValueAtTime(.0001, t + dur);
  out.connect(bus);
  if (P.air > 0) { const s = ctx.createGain(); s.gain.value = P.air * (opts.air == null ? 1 : opts.air); out.connect(s); s.connect(verb); }

  V.partials.forEach(([mult, amp]) => {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = V.type; o.frequency.setValueAtTime(freq * mult, t);
    if (opts.bend) o.frequency.exponentialRampToValueAtTime(freq * mult * opts.bend, t + dur * .8);
    gn.gain.value = amp;
    o.connect(gn); gn.connect(out);
    o.start(t); o.stop(t + dur + .02);
  });

  if (V.click > 0 && opts.click !== false) {
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, 220, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
    n.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq * 2.2; f.Q.value = .8;
    const gn = ctx.createGain(); gn.gain.value = V.click * gain * .9;
    n.connect(f); f.connect(gn); gn.connect(bus);
    n.start(t);
  }
}

/* the vocabulary. Everything an app can ask for, in one place, so two apps
   cannot mean different things by "done". */
const CUES = {
  tick:     () => [[0, .34, .10, { air: .3 }]],
  untick:   () => [[0, .22, .09, { bend: .82, air: .1, click: false }]],
  done:     () => [[2, .42, .28]],
  start:    () => [[0, .26, .14, { bend: 1.18, air: .4 }]],
  open:     () => [[1, .18, .11, { air: .5, click: false }]],
  close:    () => [[0, .16, .10, { bend: .88, air: .3, click: false }]],
  drop:     () => [[1, .30, .12]],
  error:    () => [[0, .30, .16, { bend: .74 }], [-1, .24, .20, { bend: .8 }]],
  /** level 1–3: the bigger the thing you finished, the fuller the chord */
  complete: o => {
    const L = Math.max(1, Math.min(3, (o && o.level) || 1));
    const seq = [[2, .40, .34]];
    if (L >= 2) seq.push([4, .38, .40, {}, .085]);
    if (L >= 3) { seq.push([6, .36, .52, {}, .17]); seq.push([9, .34, .95, { air: 1.4 }, .27]); }
    return seq;
  },
  /** climbs with the streak, caps at an octave so it stays musical */
  streak: o => {
    const n = Math.max(1, (o && o.n) || 1), step = Math.min(7, Math.floor((n - 1) / 2));
    return [[2 + step, .34, .26], [4 + step, .30, .42, { air: 1.2 }, .075]];
  },
};

const Sfx = {
  PACKS: PACKS,
  VOICES: Object.keys(VOICES),

  /** call once, with the app's id — pack, voice and volume are remembered per app */
  init(appId) {
    cfg.app = appId || 'app';
    try { Object.assign(cfg, JSON.parse(localStorage.getItem(KEY(cfg.app)) || '{}')); } catch (e) {}
    /* browsers refuse to make noise before the user has touched the page */
    const unlock = () => { Sfx.unlock(); g.removeEventListener('pointerdown', unlock); g.removeEventListener('keydown', unlock); };
    g.addEventListener('pointerdown', unlock, { once: true });
    g.addEventListener('keydown', unlock, { once: true });
    return Sfx;
  },
  unlock() { const c = boot(); if (c && c.state === 'suspended') c.resume(); return !!c; },
  save() { try { localStorage.setItem(KEY(cfg.app), JSON.stringify({ pack: cfg.pack, voice: cfg.voice, vol: cfg.vol, mute: cfg.mute })); } catch (e) {} },

  get settings() { return Object.assign({}, cfg); },
  set(patch) {
    Object.assign(cfg, patch || {});
    cfg.vol = Math.max(0, Math.min(1, +cfg.vol || 0));
    if (bus) bus.gain.value = cfg.mute ? 0 : cfg.vol;
    Sfx.save();
    return Sfx;
  },
  pack(id) { if (id == null) return cfg.pack; Sfx.set({ pack: id }); return Sfx; },
  voice(id) { if (id == null) return cfg.voice || pack().voice; Sfx.set({ voice: id }); return Sfx; },
  volume(v) { if (v == null) return cfg.vol; Sfx.set({ vol: v }); return Sfx; },
  mute(on) { if (on == null) return cfg.mute; Sfx.set({ mute: !!on }); return Sfx; },

  play(cue, opts) {
    if (cfg.mute) return;
    const make = CUES[cue]; if (!make) return;
    if (!boot()) return;
    if (ctx.state === 'suspended') return;                 /* no gesture yet — stay silent, do not queue */
    bus.gain.value = cfg.vol;
    const t0 = ctx.currentTime + .001;
    make(opts).forEach(([step, gain, dur, o, delay]) => hit(note(step), t0 + (delay || 0), gain, dur, o || {}));
  },
  /** a short demo of a pack, for the settings tab */
  preview(packId, voiceId) {
    const p = cfg.pack, v = cfg.voice;
    cfg.pack = packId || p; cfg.voice = voiceId == null ? v : voiceId;
    Sfx.unlock();
    Sfx.play('tick');
    setTimeout(() => Sfx.play('done'), 190);
    setTimeout(() => Sfx.play('complete', { level: 3 }), 430);
    setTimeout(() => { cfg.pack = p; cfg.voice = v; }, 1500);
  },
};

g.Sfx = Sfx;
})(window);
