/* The icon master set. One drawing serves many buttons.

   THE POINT OF THIS FILE
   Every app had its own idea of what a button looked like: a Unicode character
   in the dock, a text '+' on the add button, an emoji in a label. Those render
   differently on every device, cannot be recoloured, cannot be themed, and go
   missing when a font does.

   These are drawn instead. Inline SVG on a 24 grid, stroke only, in
   currentColor, so an icon is the colour of the text next to it for free and
   changes with the theme without anybody doing anything.

   REUSE IS THE WHOLE DESIGN
   There are far more buttons in the suite than there are drawings here, and
   that is deliberate. A button asks for a ROLE - 'add', 'delete', 'today' -
   and many roles point at the same drawing. Adding a screen should almost
   never mean adding an icon: look for a role that already fits first, and add
   a role pointing at an existing drawing second. A new drawing is the last
   resort, because every one of them is another thing to keep in step across
   fifteen themes.

   A THEME CHANGES THE STROKE, NOT THE SHAPE
   A hand-drawn theme and a pixel theme do not get their own set of drawings.
   They get their own stroke weight, cap, join and fill, and one optional
   wobble filter. That is what keeps a theme from costing forty new paths.
   If a theme genuinely needs its own drawing for one icon it may carry
   `icons: {plus: 'M...'}` and override just that one.

   Usage:
     <script src="../shared/icons.js"></script>
     el.innerHTML = Icons.svg('add');
     el.appendChild(Icons.el('delete', {size: 20}));
*/
(function (g) {
'use strict';

/* ── the drawings ──
   24x24, stroke-based, no fill. Keep them simple: at 20px on a phone,
   detail below about 2px is mud. */
const PATHS = {
  plus:        'M12 5v14M5 12h14',
  x:           'M6 6l12 12M18 6L6 18',
  check:       'M4 12.5l5 5L20 6',
  trash:       'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
  gear:        'M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7M12 2v3M12 19v3M2 12h3M19 12h3'
             + 'M4.9 4.9L7 7M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1',
  calendar:    'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  bowl:        'M4 11h16a8 8 0 01-16 0M3 20h18M9 7c0-1 1-1 1-2M13 7c0-1 1-1 1-2',
  note:        'M5 3h14v18H5zM8 8h8M8 12h8M8 16h5',
  cash:        'M2 7h20v10H2zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5M5 10h.01M19 14h.01',
  scale:       'M12 4v3M5 7h14l2 13H3zM9 13h6',
  moon:        'M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z',
  face:        'M12 3a9 9 0 100 18 9 9 0 000-18M9 10h.01M15 10h.01M8.5 14.5a5 5 0 007 0',
  bolt:        'M13 2L4 14h6l-1 8 9-12h-6z',
  foot:        'M9 3c2 0 3.2 2.2 3.2 5.2S11 13.5 9 13.5 5.8 11.2 5.8 8.2 7 3 9 3'
             + 'M9 16c1.6 0 2.7 1.1 2.7 2.5S10.6 21 9 21s-2.7-1.1-2.7-2.5S7.4 16 9 16'
             + 'M17 7c1.4 0 2.4 1.7 2.4 4s-1 4-2.4 4-2.4-1.7-2.4-4 1-4 2.4-4',
  dumbbell:    'M4 9v6M7 6.5v11M17 6.5v11M20 9v6M7 12h10',
  clock:       'M12 3a9 9 0 100 18 9 9 0 000-18M12 7v5.5l3.5 2',
  camera:      'M3 7h4l1.5-2h7L17 7h4v12H3zM12 16.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7',
  chart:       'M3 21h18M6.5 17v-5M11.5 17V6M16.5 17v-8',
  list:        'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  search:      'M10.5 4a6.5 6.5 0 100 13 6.5 6.5 0 000-13M15.5 15.5L21 21',
  pencil:      'M4 20l4.5-1L20 7.5 16.5 4 5 15.5z',
  left:        'M15 5l-7 7 7 7',
  right:       'M9 5l7 7-7 7',
  up:          'M5 15l7-7 7 7',
  down:        'M5 9l7 7 7-7',
  dots:        'M6 12h.01M12 12h.01M18 12h.01',
  home:        'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
  star:        'M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2 1.3-6.3L3 9.6l6.3-.7z',
  undo:        'M4 10h10a5 5 0 010 10h-3M4 10l4.5-4.5M4 10l4.5 4.5',
  refresh:     'M4 12a8 8 0 0113.7-5.7M20 12a8 8 0 01-13.7 5.7M18 2.5v4h-4M6 21.5v-4h4',
  download:    'M12 3v12M7 11l5 5 5-5M4 20h16',
  upload:      'M12 21V9M7 13l5-5 5 5M4 4h16',
  palette:     'M12 3a9 9 0 000 18c1 0 1.6-.8 1.6-1.6 0-1.4 1-2.1 2.1-2.1H18a3 3 0 003-3'
             + 'C21 8.5 16.9 3 12 3M7.5 10.5h.01M10 7.5h.01M14 7.5h.01M16.5 10.5h.01',
  speaker:     'M4 9h4l5-4v14l-5-4H4zM16.5 9.5a3.5 3.5 0 010 5',
  lock:        'M6 11h12v10H6zM9 11V8a3 3 0 016 0v3',
  warning:     'M12 3l9 17H3zM12 10v4.5M12 17.5h.01',
  info:        'M12 3a9 9 0 100 18 9 9 0 000-18M12 11v5.5M12 7.5h.01',
  flame:       'M12 3c0 3-3.5 4-3.5 8a3.5 3.5 0 007 0c0-1.5-1-2.5-1-2.5'
             + 'M12 21a6 6 0 006-6c0-5-6-8-6-12',
  target:      'M12 3a9 9 0 100 18 9 9 0 000-18M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9M12 12h.01',
  person:      'M12 4a4 4 0 100 8 4 4 0 000-8M4 21a8 8 0 0116 0',
  grip:        'M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01',
  filter:      'M3 5h18l-7 8v6l-4 2v-8z',
  copy:        'M9 9h11v11H9zM5 15H4V4h11v1',
  link:        'M10.5 13.5a4 4 0 015.7 0M8 12l-2.2 2.2a4 4 0 005.7 5.7L13.5 18'
             + 'M16 12l2.2-2.2a4 4 0 00-5.7-5.7L10.5 6',
  play:        'M8 5l11 7-11 7z',
  pause:       'M9 5v14M15 5v14',
  grid:        'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  nodes:       'M6 4.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5M18 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5'
             + 'M12 16a2.5 2.5 0 100 5 2.5 2.5 0 000-5M7.8 8.2l8.4-.7M7.2 9.6l3.6 6.2M16.6 10.4l-3.4 5.4',
  repeat:      'M4 9V7.5A3.5 3.5 0 017.5 4H17M20 15v1.5a3.5 3.5 0 01-3.5 3.5H7M17 1l3 3-3 3M7 23l-3-3 3-3',
  gauge:       'M3.5 18a8.5 8.5 0 1117 0M12 14l4.5-4.5',
  book:        'M4 4h7a2 2 0 012 2v14a2 2 0 00-2-2H4zM20 4h-7a2 2 0 00-2 2v14a2 2 0 012-2h7z',
  drop:        'M12 3c0 0 6 6.5 6 10.5a6 6 0 01-12 0C6 9.5 12 3 12 3z',
};

/* ── the roles ──
   What a button is FOR, mapped to what it is drawn as. Many to one on
   purpose: the number of roles should keep growing while the number of
   drawings barely moves.

   Before adding anything here, check whether a role already says what you
   mean. `add`, `new` and `plus` are one button with three names, and one of
   them is enough. */
const ROLES = {
  /* the universal verbs */
  add: 'plus', new: 'plus', create: 'plus',
  close: 'x', cancel: 'x', clear: 'x', dismiss: 'x',
  done: 'check', tick: 'check', save: 'check', confirm: 'check', complete: 'check',
  del: 'trash', 'delete': 'trash', remove: 'trash',
  edit: 'pencil', rename: 'pencil', write: 'pencil',
  settings: 'gear', options: 'gear', prefs: 'gear',
  menu: 'dots', more: 'dots', overflow: 'dots',
  search: 'search', find: 'search',
  filter: 'filter',
  copy: 'copy', duplicate: 'copy',
  share: 'link', link: 'link',
  undo: 'undo',
  drag: 'grip', reorder: 'grip', handle: 'grip',
  back: 'left', prev: 'left',
  next: 'right', forward: 'right',
  collapse: 'up',
  expand: 'down', open: 'down',
  favourite: 'star', pin: 'star', star: 'star',
  lock: 'lock', 'private': 'lock',
  warning: 'warning', alert: 'warning', stale: 'warning',
  info: 'info', help: 'info', about: 'info',

  /* data in and out */
  backup: 'download', download: 'download', 'export': 'download',
  restore: 'upload', upload: 'upload', 'import': 'upload',
  sync: 'refresh', mirror: 'refresh', refresh: 'refresh', reload: 'refresh',

  /* look and feel */
  theme: 'palette', style: 'palette', colour: 'palette', skin: 'palette',
  sound: 'speaker', audio: 'speaker', volume: 'speaker',

  /* time */
  today: 'calendar', date: 'calendar', calendar: 'calendar', schedule: 'calendar',
  timer: 'clock', rest: 'clock', duration: 'clock', history: 'clock',

  /* the measurements STATUS owns */
  sleep: 'moon', bed: 'moon',
  weight: 'scale',
  mood: 'face',
  energy: 'bolt',
  steps: 'foot', walk: 'foot',
  food: 'bowl', meal: 'bowl', eat: 'bowl',
  money: 'cash', spend: 'cash', cost: 'cash', account: 'cash',
  water: 'drop', hydration: 'drop',
  photo: 'camera', camera: 'camera', shot: 'camera', receipt: 'camera',
  note: 'note', comment: 'note', journal: 'note',

  /* training */
  train: 'dumbbell', lift: 'dumbbell', workout: 'dumbbell', exercise: 'dumbbell',
  set: 'list', log: 'list', rows: 'list',
  chart: 'chart', graph: 'chart', stats: 'chart', progress: 'chart', volume: 'chart',
  goal: 'target', target: 'target',
  streak: 'flame', fire: 'flame',
  body: 'person', profile: 'person', person: 'person',

  /* play */
  play: 'play', start: 'play', video: 'play',
  pause: 'pause', stop: 'pause',

  /* the apps themselves */
  'app.home': 'home',
  'app.arc': 'nodes',
  'app.block': 'grid',
  'app.habits': 'repeat',
  'app.form': 'play',
  'app.status': 'gauge',
  'app.train': 'dumbbell',
  'app.style': 'palette',

  /* structure */
  routine: 'repeat', repeat: 'repeat', cycle: 'repeat',
  lane: 'grid', board: 'grid', layout: 'grid',
  mind: 'nodes', map: 'nodes', canvas: 'nodes',
  brief: 'book', docs: 'book', read: 'book',
};

/* Plain words for the ones that are not obvious from the name. Shown in
   STYLE so the database explains itself. */
const NOTES = {
  gauge: 'a dial, for STATUS',
  nodes: 'joined dots, for ARC',
  grip: 'the dots you drag a row by',
  drop: 'a water drop',
  flame: 'a streak that is still alive',
  cash: 'a note, not a coin: a coin reads as a full stop at 20px',
};

/* ── how a theme draws them ──
   Stroke, never shape. Defaults chosen to sit correctly next to 16px text. */
const DEFAULT_STYLE = { weight: 1.75, cap: 'round', join: 'round', fill: false, wobble: false };

/* ── packs ──
   A pack swaps the whole set at once. Most of a pack is a STROKE RECIPE, not a
   new set of drawings, because that is what makes a pack cost nothing: the same
   fifty-two paths, drawn fine and engraved, or heavy and blunt, or wobbling.

   A pack may also carry `paths`, which override individual drawings. `pixel`
   does, for the handful where a blocky redraw actually reads differently at
   20px. The rest of that pack inherits the line drawings, and STYLE says so
   rather than pretending the whole set was redrawn.

   A genuinely complete alternative set is fifty-two new paths. That is a real
   piece of work and it should be a deliberate decision, not something that
   happens by accident because a pack looked easy to add. */
const PACKS = {
  line: {
    name: 'Line',
    note: 'the default. Even stroke, rounded ends.',
    style: { weight: 1.75, cap: 'round', join: 'round', fill: false, wobble: false },
  },
  bold: {
    name: 'Bold',
    note: 'heavier and rounder, for a chunky theme.',
    style: { weight: 2.6, cap: 'round', join: 'round', fill: false, wobble: false },
  },
  engraved: {
    name: 'Engraved',
    note: 'fine and mitred, for a formal theme.',
    style: { weight: 1.1, cap: 'butt', join: 'miter', fill: false, wobble: false },
  },
  hand: {
    name: 'Hand-drawn',
    note: 'wobbling, for a theme that is drawn rather than printed.',
    style: { weight: 2.2, cap: 'round', join: 'round', fill: false, wobble: true },
  },
  pixel: {
    name: 'Pixel',
    note: 'blunt and square. A few are redrawn on a coarse grid; the rest '
        + 'inherit the line drawings.',
    style: { weight: 2.5, cap: 'butt', join: 'miter', fill: false, wobble: false },
    /* Drawn on a 3px grid so every corner lands on it. Only the ones where a
       blocky redraw actually reads differently at 20px are here. */
    paths: {
      plus:   'M10.5 4.5h3v6h6v3h-6v6h-3v-6h-6v-3h6z',
      x:      'M6 4.5l3 3 3-3 3 3 3-3 1.5 1.5-3 3 3 3-1.5 1.5-3-3-3 3-3-3-3 3L4.5 16.5l3-3-3-3z',
      check:  'M4.5 12h3v3h3v-3h3V9h3V6h3v3h-3v3h-3v3h-3v3h-3v-3h-3z',
      dots:   'M4.5 10.5h3v3h-3zM10.5 10.5h3v3h-3zM16.5 10.5h3v3h-3z',
      grid:   'M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z',
      up:     'M12 6l7.5 7.5h-15z',
      down:   'M12 18L4.5 10.5h15z',
      left:   'M7.5 12L15 4.5v15z',
      right:  'M16.5 12L9 19.5v-15z',
      play:   'M7.5 4.5l12 7.5-12 7.5z',
      pause:  'M7.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z',
      star:   'M12 3l3 6h6l-4.5 4.5 1.5 6-6-3-6 3 1.5-6L3 9h6z',
    },
  },
};

/* ── packs you drop in ──
   A pack is one JSON file and nothing else, so it can be handed around, kept
   in a folder, pasted into a chat or dragged onto STYLE:

     {
       "kind": "motherbase.iconpack",   marks the file, so a stray json is not
       "id":   "chunky",                mistaken for one
       "name": "Chunky",
       "note": "one line about it",
       "style": { "weight": 3, "cap": "butt", "join": "miter", "wobble": false },
       "paths": { "plus": "M...", "x": "M..." }
     }

   `style` alone is a valid pack: a stroke recipe over the master drawings is
   the cheap way to make a set feel different. `paths` overrides individual
   drawings by their NAME, and anything it leaves out inherits.

   Installed packs are a setting, so they travel in the backup. */
const PACK_KIND = 'motherbase.iconpack';

function installed() {
  try {
    if (typeof Rec !== 'undefined' && Rec.setting) return Rec.setting('style', 'iconpacks') || {};
  } catch (e) {}
  return {};
}
function allPacks() { return Object.assign({}, PACKS, installed()); }

/* A theme may name a pack. Nothing else about a theme changes. */
function packFor(skin) {
  const s = skin || (typeof Skins !== 'undefined' && Skins.current) || null;
  const id = (s && s.iconPack) || 'line';
  return allPacks()[id] ? id : 'line';
}

let WOBBLE_READY = false;
function ensureWobble() {
  if (WOBBLE_READY || typeof document === 'undefined') return;
  WOBBLE_READY = true;
  /* A displacement map over the strokes. It is what lets a hand-drawn theme
     have hand-drawn icons without a second set of forty paths. */
  const d = document.createElement('div');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
    + '<filter id="mb-icon-wobble" x="-20%" y="-20%" width="140%" height="140%">'
    + '<feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="n"/>'
    + '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" '
    + 'xChannelSelector="R" yChannelSelector="G"/>'
    + '</filter></defs></svg>';
  document.body.appendChild(d);
}

const Icons = {
  PATHS: PATHS,
  ROLES: ROLES,
  NOTES: NOTES,

  /* Every drawing, and every role that points at it. */
  list() { return Object.keys(PATHS).sort(); },
  roles() { return Object.keys(ROLES).sort(); },
  usersOf(icon) { return Object.keys(ROLES).filter(r => ROLES[r] === icon).sort(); },

  /* How many buttons each drawing is carrying. The number this file exists to
     keep high. */
  reuse() {
    const n = Object.keys(ROLES).length, d = Object.keys(PATHS).length;
    return { roles: n, drawings: d, perDrawing: +(n / d).toFixed(2) };
  },

  /* A role may be pointed somewhere else without touching this file. STYLE
     writes the override; it is a setting, so it travels in the backup. */
  overrides() {
    try {
      if (typeof Rec !== 'undefined' && Rec.setting) return Rec.setting('style', 'icons') || {};
    } catch (e) {}
    return {};
  },
  iconFor(role) {
    const o = this.overrides();
    return o[role] || ROLES[role] || null;
  },
  /* Roles a build asks for that nothing draws. STYLE shows these so a missing
     icon is visible rather than a blank square nobody noticed. */
  missing(wanted) {
    return (wanted || []).filter(r => !this.iconFor(r));
  },

  PACKS: PACKS,
  PACK_KIND: PACK_KIND,
  packs() { return Object.keys(allPacks()); },
  pack(id) { return allPacks()[id] || PACKS.line; },
  isBuiltIn(id) { return !!PACKS[id]; },
  packOf(skin) { return packFor(skin); },
  /* Which drawings a pack actually redraws, so STYLE can be honest about how
     much of a pack is its own work and how much it inherits. */
  packRedraws(id) { return Object.keys((allPacks()[id] || {}).paths || {}); },

  /* Read a dropped or pasted file. Says what is wrong in words, because the
     person dropping it is not going to read a stack trace. */
  readPack(text) {
    let o;
    try { o = JSON.parse(String(text || '').trim()); }
    catch (e) { return { error: 'That is not valid JSON. ' + e.message }; }
    if (!o || typeof o !== 'object' || Array.isArray(o))
      return { error: 'An icon pack is one object, not a list.' };
    if (o.kind && o.kind !== PACK_KIND)
      return { error: 'That file says it is a "' + o.kind + '", not an icon pack.' };
    if (o.base || o.skins) return { error: 'That looks like a THEME. Themes go in the paste box on the themes screen.' };
    if (!o.style && !o.paths)
      return { error: 'A pack needs a "style" (weight, cap, join) or "paths", and this has neither.' };
    if (o.paths && typeof o.paths !== 'object')
      return { error: '"paths" should be a list of drawing names to path data.' };
    const unknown = Object.keys(o.paths || {}).filter(k => !PATHS[k]);
    if (unknown.length === Object.keys(o.paths || {}).length && unknown.length)
      return { error: 'None of those drawing names exist. They should be things like '
        + Object.keys(PATHS).slice(0, 4).join(', ') + '.' };
    o.id = String(o.id || o.name || 'pack').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '').slice(0, 24) || ('pack-' + Date.now().toString(36));
    if (!o.name) o.name = o.id;
    return { pack: o, unknown: unknown };
  },
  savePack(pack) {
    const all = Object.assign({}, installed());
    all[pack.id] = pack;
    try { Rec.setting('style', 'iconpacks', all); } catch (e) {}
    return pack;
  },
  forgetPack(id) {
    const all = Object.assign({}, installed());
    delete all[id];
    try { Rec.setting('style', 'iconpacks', all); } catch (e) {}
  },
  /* A pack as a file, for handing one out. */
  packFile(id) {
    const p = allPacks()[id] || PACKS.line;
    return JSON.stringify(Object.assign({ kind: PACK_KIND, id: id }, p), null, 2);
  },

  /* The pack sets the recipe; anything the theme states itself still wins, so
     a theme can pick Bold and then thin it slightly. */
  styleFor(skin) {
    const s = skin || (typeof Skins !== 'undefined' && Skins.current) || null;
    const pack = allPacks()[packFor(s)] || PACKS.line;
    return Object.assign({}, DEFAULT_STYLE, pack.style || {}, (s && s.icon) || {});
  },

  /* The drawing for a role, honouring a theme that overrides one shape. */
  pathFor(role, skin) {
    const id = this.iconFor(role);
    if (!id) return null;
    const s = skin || (typeof Skins !== 'undefined' && Skins.current) || null;
    /* A single drawing named by the theme beats everything. */
    if (s && s.icons && s.icons[id]) return s.icons[id];
    /* Then the pack, if it redrew this one. */
    const pack = allPacks()[packFor(s)] || PACKS.line;
    if (pack.paths && pack.paths[id]) return pack.paths[id];
    return PATHS[id] || null;
  },

  /* `svg` returns markup so it can go straight into an innerHTML string, which
     is how most of this suite builds a row. */
  svg(role, opts) {
    opts = opts || {};
    const d = this.pathFor(role, opts.skin);
    if (!d) return '';
    const st = this.styleFor(opts.skin);
    const size = opts.size || 20;
    if (st.wobble) ensureWobble();
    return '<svg class="mb-ico' + (opts.cls ? ' ' + opts.cls : '') + '"'
      + ' width="' + size + '" height="' + size + '" viewBox="0 0 24 24"'
      + ' fill="' + (st.fill ? 'currentColor' : 'none') + '" stroke="currentColor"'
      + ' stroke-width="' + (opts.weight || st.weight) + '"'
      + ' stroke-linecap="' + st.cap + '" stroke-linejoin="' + st.join + '"'
      + (st.wobble ? ' filter="url(#mb-icon-wobble)"' : '')
      + ' aria-hidden="true" focusable="false">'
      + '<path d="' + d + '"/></svg>';
  },

  el(role, opts) {
    const wrap = document.createElement('span');
    wrap.className = 'mb-ico-wrap';
    wrap.innerHTML = this.svg(role, opts);
    const svg = wrap.firstChild;
    return svg || wrap;
  },

  /* Minimal styling, injected once. An icon sits on the text baseline and
     takes the colour of whatever it is inside, which is the whole reason
     these are drawn rather than fetched. */
  css() {
    if (typeof document === 'undefined' || document.getElementById('mb-icon-css')) return;
    const st = document.createElement('style');
    st.id = 'mb-icon-css';
    st.textContent = '.mb-ico{display:inline-block;vertical-align:-0.15em;flex:0 0 auto}'
      + '.mb-ico-wrap{display:inline-flex;align-items:center}';
    document.head.appendChild(st);
  },
};

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Icons.css());
  else Icons.css();
}

g.Icons = Icons;
})(typeof window !== 'undefined' ? window : globalThis);
