/* shared/creatures.js — 0.1.0 — the Pokémon a person is shown as.

   Moved out of CHECK IN on 2026-09-22 so COACH's box and CHECK IN draw the
   same creature for the same client from one table. Tom asked for Pokémon
   in place of CHECK IN's animals, and was told the art is Nintendo's and the
   suite is public: "it's fine". Drawn from circles and paths, so nothing is
   downloaded and it works offline.

   Like notice.js and range.js, this writes colours down: a creature is part
   of a picture that leaves the app, so it is the same creature in every
   theme. hsl() on a canvas, never in a stylesheet.

   A kind this file does not know (an old animal pick: bear, cat...) is drawn
   as the Pokémon LEGACY maps it to, and anything else as Pikachu, so an old
   row never draws nothing.                                                 */
(function (g) {
'use strict';
const INK = 'hsl(0 0% 12%)', WHITE = 'hsl(0 0% 98%)', PINK = 'hsl(350 70% 76%)';
const Y = 'hsl(50 95% 55%)', RED = 'hsl(0 75% 55%)';
const POKEMON = {
  pikachu: { name: 'Pikachu', ops: [
    ['p', 'M64 66 L20 2 L88 50 Z', Y], ['p', 'M20 2 L34 22 L42 16 Z', INK],
    ['p', 'M136 66 L180 2 L112 50 Z', Y], ['p', 'M180 2 L166 22 L158 16 Z', INK],
    ['c', 100, 112, 80, Y], ['c', 48, 138, 15, RED], ['c', 152, 138, 15, RED],
    ['eyes'], ['e', 100, 124, 5, 3, 0, INK], ['s', 'M86 136 Q93 144 100 136 Q107 144 114 136', INK, 4]] },
  bulbasaur: { name: 'Bulbasaur', ops: [
    ['e', 100, 40, 54, 36, 0, 'hsl(120 40% 38%)'], ['s', 'M100 8 L100 70', 'hsl(120 40% 26%)', 4],
    ['p', 'M34 70 L30 26 L66 56 Z', 'hsl(165 45% 55%)'], ['p', 'M166 70 L170 26 L134 56 Z', 'hsl(165 45% 55%)'],
    ['e', 100, 122, 92, 66, 0, 'hsl(165 45% 55%)'], ['c', 60, 86, 8, 'hsl(165 40% 40%)'], ['c', 138, 82, 6, 'hsl(165 40% 40%)'],
    ['e', 66, 116, 16, 13, 0, WHITE], ['e', 134, 116, 16, 13, 0, WHITE], ['c', 70, 117, 8, 'hsl(0 65% 45%)'], ['c', 130, 117, 8, 'hsl(0 65% 45%)'],
    ['s', 'M76 150 Q100 166 124 150', INK, 5]] },
  charmander: { name: 'Charmander', ops: [
    ['e', 100, 108, 84, 80, 0, 'hsl(25 90% 58%)'], ['e', 100, 150, 52, 32, 0, 'hsl(40 80% 78%)'],
    ['e', 70, 100, 13, 19, 0, INK], ['e', 130, 100, 13, 19, 0, INK], ['c', 73, 93, 5, WHITE], ['c', 133, 93, 5, WHITE],
    ['s', 'M70 140 Q100 162 130 140', INK, 5]] },
  squirtle: { name: 'Squirtle', ops: [
    ['c', 100, 108, 82, 'hsl(195 60% 64%)'], ['e', 100, 150, 50, 30, 0, 'hsl(45 70% 80%)'],
    ['e', 68, 102, 17, 20, 0, WHITE], ['e', 132, 102, 17, 20, 0, WHITE], ['c', 71, 104, 11, 'hsl(10 60% 40%)'], ['c', 129, 104, 11, 'hsl(10 60% 40%)'],
    ['c', 73, 101, 4, WHITE], ['c', 131, 101, 4, WHITE], ['s', 'M74 142 Q100 162 126 142', INK, 5]] },
  jigglypuff: { name: 'Jigglypuff', ops: [
    ['c', 100, 108, 84, 'hsl(340 80% 82%)'], ['s', 'M96 28 Q70 40 86 62 Q104 70 104 54', 'hsl(340 70% 70%)', 10],
    ['p', 'M30 60 L24 16 L62 40 Z', 'hsl(340 80% 82%)'], ['p', 'M170 60 L176 16 L138 40 Z', 'hsl(340 80% 82%)'],
    ['c', 68, 106, 24, WHITE], ['c', 132, 106, 24, WHITE], ['c', 68, 110, 15, 'hsl(195 70% 42%)'], ['c', 132, 110, 15, 'hsl(195 70% 42%)'],
    ['c', 68, 110, 7, INK], ['c', 132, 110, 7, INK], ['c', 62, 102, 5, WHITE], ['c', 126, 102, 5, WHITE],
    ['s', 'M90 150 Q100 158 110 150', INK, 4]] },
  snorlax: { name: 'Snorlax', ops: [
    ['p', 'M36 64 L40 18 L72 48 Z', 'hsl(190 35% 32%)'], ['p', 'M164 64 L160 18 L128 48 Z', 'hsl(190 35% 32%)'],
    ['c', 100, 108, 84, 'hsl(190 35% 32%)'], ['e', 100, 132, 72, 58, 0, 'hsl(40 45% 85%)'],
    ['s', 'M60 110 L86 110', INK, 5], ['s', 'M114 110 L140 110', INK, 5],
    ['s', 'M70 152 Q100 160 130 152', INK, 5], ['p', 'M82 152 L88 162 L94 153 Z', WHITE], ['p', 'M106 153 L112 162 L118 152 Z', WHITE]] },
  eevee: { name: 'Eevee', ops: [
    ['e', 40, 36, 20, 50, -0.5, 'hsl(30 50% 48%)'], ['e', 160, 36, 20, 50, 0.5, 'hsl(30 50% 48%)'],
    ['e', 42, 40, 9, 32, -0.5, 'hsl(25 40% 30%)'], ['e', 158, 40, 9, 32, 0.5, 'hsl(25 40% 30%)'],
    ['c', 100, 112, 76, 'hsl(30 50% 48%)'],
    ['p', 'M34 160 Q60 140 76 172 Q90 150 100 180 Q110 150 124 172 Q140 140 166 160 Q140 206 100 200 Q60 206 34 160 Z', 'hsl(40 55% 86%)'],
    ['eyes'], ['e', 100, 128, 5, 4, 0, INK], ['s', 'M90 140 Q100 148 110 140', INK, 4]] },
  psyduck: { name: 'Psyduck', ops: [
    ['c', 100, 108, 82, 'hsl(50 90% 62%)'], ['s', 'M92 30 L86 4', INK, 4], ['s', 'M100 28 L100 2', INK, 4], ['s', 'M108 30 L114 4', INK, 4],
    ['c', 68, 96, 18, WHITE], ['c', 132, 96, 18, WHITE], ['c', 68, 96, 4, INK], ['c', 132, 96, 4, INK],
    ['e', 100, 142, 42, 22, 0, 'hsl(40 70% 82%)'], ['s', 'M62 142 L138 142', 'hsl(35 40% 60%)', 3]] },
};
const LEGACY = { bear: 'snorlax', cat: 'pikachu', dog: 'charmander', panda: 'snorlax', rabbit: 'jigglypuff', fox: 'eevee', frog: 'bulbasaur', monkey: 'psyduck' };
const DEFAULT = 'pikachu';
const pick = k => POKEMON[k] ? k : POKEMON[LEGACY[k]] ? LEGACY[k] : DEFAULT;
const cache = {};
const path = d => cache[d] || (cache[d] = new Path2D(d));

/** draw kind's face centred on cx, cy, r across, turned by ang */
function draw(c, kind, cx, cy, r, ang) {
  const A = POKEMON[pick(kind)];
  c.save();
  c.translate(cx, cy);
  c.rotate(ang || 0);
  const s = r / 92;
  c.scale(s, s);
  c.translate(-100, -104);
  A.ops.forEach(op => {
    if (op[0] === 'eyes') {
      [[72, 102], [128, 102]].forEach(([x, y]) => {
        c.fillStyle = INK; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill();
        c.fillStyle = WHITE; c.beginPath(); c.arc(x + 3, y - 4, 3.2, 0, 7); c.fill();
      });
      return;
    }
    c.beginPath();
    if (op[0] === 'c') { c.fillStyle = op[4]; c.arc(op[1], op[2], op[3], 0, Math.PI * 2); c.fill(); }
    else if (op[0] === 'e') { c.fillStyle = op[6]; c.ellipse(op[1], op[2], op[3], op[4], op[5], 0, Math.PI * 2); c.fill(); }
    else if (op[0] === 'p') { c.fillStyle = op[2]; c.fill(path(op[1])); }
    else if (op[0] === 's') { c.strokeStyle = op[2]; c.lineWidth = op[3]; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(path(op[1])); }
  });
  c.restore();
}

/** a canvas of kind at css size px, sharp on any screen */
function canvas(kind, px) {
  const dpr = g.devicePixelRatio || 1, cv = document.createElement('canvas');
  cv.width = cv.height = Math.round(px * dpr);
  cv.style.width = cv.style.height = px + 'px';
  draw(cv.getContext('2d'), kind, px * dpr / 2, px * dpr / 2 + px * dpr * 0.02, px * dpr * 0.42, 0);
  cv.setAttribute('role', 'img');
  cv.setAttribute('aria-label', POKEMON[pick(kind)].name);
  return cv;
}

g.Creatures = { VERSION: '0.1.0', list: POKEMON, pick: pick, draw: draw, canvas: canvas,
  name: k => POKEMON[pick(k)].name, keys: () => Object.keys(POKEMON) };
})(window);
