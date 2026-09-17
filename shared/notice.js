/* ══════════════════════════ NOTICE, SHARED ══════════════════════════
   The status window look, in one place: the four palettes and the cut-corner
   shape. NOTICE draws these on a canvas to make a picture. STATUS wears them
   on a real panel so the status check looks like one of his own windows.

   Only the look lives here. NOTICE's parser, its made-up rewards and its
   canvas layout stay in system/index.html, because they exist to turn typed
   text into a picture and nothing else in the suite wants that.

   ── about the hex codes ──
   Hard constraint 8 says no hex colours in app CSS, and this is the exception
   NOTICE already holds: these palettes are the ART, the way a photograph is.
   A Hunter window is blue in every theme. Nothing here reaches an app's own
   chrome, which stays on tokens. The rule exists so a theme can repaint an
   app; a status window is a thing being depicted, not part of the furniture.

   Loaded with a plain <script src>, like every other shared file.
*/
(function (g) {
  'use strict';

  /* Block is first, so it is the default: `Skins.restore` falls back to first
     for the same reason, and this keeps the two habits the same. It wears the
     Block theme's own colours, flat and gold, with no glow. */
  const STYLES = {
    block: {
      name: 'BLOCK', face: 'Chakra Petch', body: 'Inter Tight',
      panel: 'rgba(14,20,29,0.94)', panel2: 'rgba(27,38,52,0.9)',
      line: '#2B3A4D', glow: 'rgba(0,0,0,0)', ink: '#DBE7F0', mute: '#7F93A8',
      acc: '#F0B323', warn: '#FF6B81', bgA: '#05070A', bgB: '#131B26',
      cut: 6, icon: 'square', brackets: true,
    },
    hunter: {
      name: 'HUNTER', face: 'Rajdhani', body: 'Inter Tight',
      panel: 'rgba(3,14,32,0.88)', panel2: 'rgba(8,36,72,0.62)',
      line: '#5FD3FF', glow: 'rgba(95,211,255,0.85)', ink: '#EAF7FF', mute: '#8FC7E6',
      acc: '#5FD3FF', warn: '#FF6B6B', bgA: '#05070D', bgB: '#0A1830',
      cut: 10, icon: 'circle', brackets: true,
    },
    legend: {
      name: 'LEGEND', face: 'Cinzel', body: 'Inter Tight',
      panel: 'rgba(28,21,10,0.92)', panel2: 'rgba(52,40,16,0.72)',
      line: '#E1B94A', glow: 'rgba(225,185,74,0.6)', ink: '#FBF3DC', mute: '#C9B27A',
      acc: '#F2D27A', warn: '#FF8A65', bgA: '#0B0906', bgB: '#241A0A',
      cut: 0, icon: 'diamond', brackets: true,
    },
    void: {
      name: 'VOID', face: 'Chakra Petch', body: 'Inter Tight',
      panel: 'rgba(16,4,26,0.9)', panel2: 'rgba(40,8,60,0.66)',
      line: '#C77DFF', glow: 'rgba(199,125,255,0.85)', ink: '#F4E9FF', mute: '#B08AD1',
      acc: '#E0AAFF', warn: '#FF5C8A', bgA: '#06030A', bgB: '#1A0828',
      cut: 6, icon: 'triangle', brackets: true, scan: true,
    },
  };

  const FIRST = Object.keys(STYLES)[0];

  /** the palette for an id, falling back to the first rather than to nothing */
  function get(id) { return STYLES[id] || STYLES[FIRST]; }

  /** [{id, name}] for a picker */
  function list() { return Object.keys(STYLES).map(id => ({ id: id, name: STYLES[id].name })); }

  /* ── the cut corner, twice ──
     A status window is an octagon with its four corners taken off, and both
     halves of the suite need that same shape: NOTICE strokes it on a canvas,
     STATUS clips a real panel to it. One description, two readers, so a change
     to the shape cannot land in only one of them. */

  /** the canvas path. Leaves the path open for the caller to fill or stroke. */
  function frame(ctx, x, y, w, h, cut) {
    ctx.beginPath();
    if (!cut) { ctx.rect(x, y, w, h); return; }
    ctx.moveTo(x + cut, y); ctx.lineTo(x + w - cut, y); ctx.lineTo(x + w, y + cut);
    ctx.lineTo(x + w, y + h - cut); ctx.lineTo(x + w - cut, y + h); ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut); ctx.lineTo(x, y + cut); ctx.closePath();
  }

  /** the same shape as a CSS clip-path, for a panel that is really on the page */
  function clipPath(cut) {
    if (!cut) return 'none';
    const c = cut + 'px';
    return 'polygon(' + c + ' 0, calc(100% - ' + c + ') 0, 100% ' + c + ', 100% calc(100% - ' + c + '), ' +
      'calc(100% - ' + c + ') 100%, ' + c + ' 100%, 0 calc(100% - ' + c + '), 0 ' + c + ')';
  }

  /* ── wearing a palette on real elements ──
     Set on a container once; everything inside reads the variables. Named
     `--nw-*` so they cannot collide with the theme's own tokens, which is the
     whole point: an app's chrome stays on tokens and only what is inside this
     box is the picture. */
  function vars(st) {
    return {
      '--nw-panel': st.panel, '--nw-panel2': st.panel2, '--nw-line': st.line,
      '--nw-glow': st.glow, '--nw-ink': st.ink, '--nw-mute': st.mute,
      '--nw-acc': st.acc, '--nw-warn': st.warn, '--nw-bg-a': st.bgA, '--nw-bg-b': st.bgB,
      '--nw-face': '"' + st.face + '", "Chakra Petch", sans-serif',
      '--nw-body': '"' + st.body + '", system-ui, sans-serif',
      '--nw-cut': st.cut + 'px',
      '--nw-clip': clipPath(st.cut),
    };
  }

  /** put a palette on an element, and take the previous one off with it */
  function wear(node, id) {
    if (!node) return null;
    const st = get(id);
    const v = vars(st);
    Object.keys(v).forEach(k => node.style.setProperty(k, v[k]));
    return st;
  }

  /* Square brackets round a line, the way a status window writes one. Every
     palette asks for them today; the flag is read rather than assumed so one
     that does not can still say so. */
  function bracket(st, s) {
    return st && st.brackets ? '[ ' + s + ' ]' : s;
  }

  g.Notice = { STYLES: STYLES, get: get, list: list, frame: frame, clipPath: clipPath, vars: vars, wear: wear, bracket: bracket };
})(window);
