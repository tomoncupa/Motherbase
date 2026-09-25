/* ══════════════════════════ NOTICE, SHARED ══════════════════════════
   The status window look, in one place: the four palettes and the cut-corner
   shape. NOTICE draws these on a canvas to make a picture. STATUS wears them
   on a real panel so the status check looks like one of his own windows.

   The look lives here, and since 2026-09-25 the engine too: NOTICE's parser
   and its canvas layout, because CHARACTER SHEET draws its feats as NOTICE
   windows and ships to clients, who have no system/ folder. NOTICE's made-up
   rewards and its maker stay in system/index.html.

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


  /* ══════════════ THE ENGINE ══════════════
     Moved here from system/index.html on 2026-09-25, when CHARACTER SHEET
     started showing feats as NOTICE windows: text in, a status window out.
     NOTICE's word tables, its made-up rewards and its maker stay in NOTICE,
     and are handed in through `o.rewards`, so nothing here reads a setting.

       Notice.parse(text, kind)        the typed text, read. kind 'auto' guesses
       Notice.draw(q, style, o)        the window alone, a canvas 1080 wide
         o.head     the heading when the text has no # line
         o.rewards  q => the lines under REWARDS or EFFECTS; typed ones if absent
       Notice.compose(canvas, win, style, o)   the window laid on a story or post

     Everything below this line until THE ENGINE ends was lifted as it was;
     change it here and NOTICE and SHEET both change. */
  const AUTO_HEAD = { notice: 'NOTIFICATION', quest: 'QUEST', item: 'ITEM ACQUIRED', status: 'STATUS EFFECT' };

  /* ══════════════ reading the text ══════════════ */
  const BUL = /^\s*(?:[-*•▪◦]|\d+[.)])\s+(.*)$/;
  const CHK = /^\[( |x|X|✓|✔)\]\s*(.*)$/;
  const HEAD = /^\s*(rewards?|loot|effects?|penalty|penalties|failure|fail|warning|rank|grade|type|duration)\s*:\s*(.*)$/i;
  /* A goal with a number in it is counted, not ticked (Tom, 2026-09-25). Three
     ways to write one: "Push-ups 40/100", "40/100 push-ups", or "100 push-ups",
     which starts at 0. A unit after the number rides along into the counter. */
  const NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
  const PROG = new RegExp('^(.*?)\\s*\\[?' + NUM + '\\s*\\/\\s*' + NUM + '\\s*([a-zA-Z%]{0,8})\\]?\\s*$');
  const LPROG = new RegExp('^\\[?' + NUM + '\\s*\\/\\s*' + NUM + '\\s*([a-zA-Z%]{1,8})?\\]?\\s+(.+)$');
  const LEAD = new RegExp('^' + NUM + '\\s*(km|mi|m|kg|g|ml|l|litres?|liters?|min|mins|minutes?|h|hrs?|hours?|secs?|seconds?|reps|sets|%)?\\s+(?:of\\s+)?(.+)$', 'i');
  const num = s => parseFloat(String(s).replace(/,/g, ''));
  const fmt = n => (+n).toLocaleString('en');
  const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
  const strip = s => s.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
  /* "Rewards: 1,200 EXP, STR +2" is two rewards, not three: a comma followed by
     exactly three digits is a thousands mark. */
  const LIST_SPLIT = /\s*,(?!\d{3}(?!\d))\s*/;

  function goalOf(body) {
    const c = CHK.exec(body);
    let done = !!(c && c[1] !== ' '), label = c ? c[2] : body, cur = null, max = null, unit = '', p;
    /* the count-first form is tried first, or "40/100 squats" reads squats as a unit */
    if ((p = LPROG.exec(label)) && num(p[2]) > 0) { cur = num(p[1]); max = num(p[2]); unit = p[3] || ''; label = cap1(p[4]); }
    else if ((p = PROG.exec(label)) && num(p[3]) > 0) { label = p[1] || label; cur = num(p[2]); max = num(p[3]); unit = p[4] || ''; }
    else if ((p = LEAD.exec(label)) && num(p[1]) > 0) { cur = 0; max = num(p[1]); unit = p[2] || ''; label = cap1(p[3]); }
    if (max != null) { if (done) cur = Math.max(cur, max); if (cur >= max) done = true; }
    return { label: label, done: done, cur: cur, max: max, unit: unit, raw: c ? c[2] : body };
  }

  function parse(text, kind) {
    const q = { head: '', title: '', rank: '', etype: '', dur: '', desc: [], goals: [], rewards: [], penalty: [], lines: [] };
    let section = 'goal', anyBullet = false, anyItem = false, anyStatus = false;
    String(text || '').split(/\r?\n/).forEach(raw => {
      const line = raw.trim();
      if (!line) return;
      if (/^#/.test(line)) { q.head = line.replace(/^#+\s*/, ''); return; }
      const h = HEAD.exec(line);
      if (h) {
        /* Rank: and Effect: are an item's two markers, Type: and Duration: a
           status effect's. Effects are kept in the same list as rewards,
           because they are drawn the same way and only the label differs. */
        if (/^(rank|grade)/i.test(h[1])) { q.rank = h[2]; anyItem = true; return; }
        if (/^type/i.test(h[1])) { q.etype = h[2]; anyStatus = true; return; }
        if (/^duration/i.test(h[1])) { q.dur = h[2]; anyStatus = true; return; }
        if (/^effect/i.test(h[1])) anyItem = true;
        section = /^(reward|loot|effect)/i.test(h[1]) ? 'reward' : 'penalty';
        if (h[2]) h[2].split(LIST_SPLIT).forEach(x => { if (x) q[section === 'reward' ? 'rewards' : 'penalty'].push(x); });
        return;
      }
      const b = BUL.exec(line);
      const body = b ? b[1] : line;
      if (b) anyBullet = true;
      q.lines.push(body);
      if (section === 'reward') { q.rewards.push(body); return; }
      if (section === 'penalty') { q.penalty.push(body); return; }
      if (b) q.goals.push(goalOf(body));
      else if (!q.title) q.title = body;
      else q.desc.push(body);
    });
    q.kind = kind === 'auto'
      ? (anyStatus ? 'status' : anyItem ? 'item' : (anyBullet || q.rewards.length) ? 'quest' : 'notice')
      : kind;
    /* QUEST chosen by hand with no bullets: the first line is the title and
       the rest are the goals. NOTICE chosen by hand: every line is a message. */
    if (q.kind === 'quest' && !q.goals.length && q.desc.length) { q.goals = q.desc.map(goalOf); q.desc = []; }
    /* ITEM and STATUS: the first line is the name, anything listed is an
       effect, and the rest is description. Nothing is ticked. */
    if ((q.kind === 'item' || q.kind === 'status') && q.goals.length) {
      q.goals.forEach(g => q.rewards.push(g.raw));
      q.goals = [];
    }
    q.debuff = q.kind === 'status' && /debuff|curse|negative|bad/i.test(q.etype);
    if (q.kind === 'notice') {
      q.msgs = q.lines.map(l => strip(l.replace(CHK, '$2')));
      q.rewards.forEach(r => q.msgs.push(r)); q.penalty.forEach(r => q.msgs.push(r));
    }
    q.typedRewards = q.rewards.length > 0;
    return q;
  }

  /* ══════════════ drawing the window ══════════════
     Everything is laid out in logical units on a 360-wide window and drawn at
     three times that, so the file is 1080 wide and the type is sharp. */
  const T = 360, M = 24, W = T - 2 * M, P = 22, SC = 3;

  function faceOf(st, px, w) { return (w || 700) + ' ' + px + 'px "' + st.face + '", "Chakra Petch", sans-serif'; }
  function bodyOf(st, px, w) { return (w || 500) + ' ' + px + 'px "' + st.body + '", system-ui, sans-serif'; }

  function wrapText(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = [];
    let cur = '';
    words.forEach(w => {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    });
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }

  /* spaced-out capitals, drawn a letter at a time so every browser agrees */
  function spaced(ctx, text, cx, y, gap, align) {
    const chars = String(text).toUpperCase().split('');
    const widths = chars.map(c => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (chars.length - 1);
    let x = align === 'left' ? cx : cx - total / 2;
    ctx.textAlign = 'left';
    chars.forEach((c, i) => { ctx.fillText(c, x, y); x += widths[i] + gap; });
    return total;
  }

  /* Two passes over the same list of steps: the first only measures, so the
     canvas can be sized to the content; the second draws. */
  function layout(q, st, ctx, draw, o) {
    const ink = st.ink, X = M + P, CW = W - 2 * P, CX = M + W / 2;
    let y = M + P;
    const glowOn = (c, b) => { if (!draw) return; ctx.shadowColor = c; ctx.shadowBlur = b * SC; };
    const glowOff = () => { if (!draw) return; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; };
    const text = (s, x, yy, font, color, align, glow) => {
      ctx.font = font;
      if (!draw) return;
      ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
      if (glow) { glowOn(st.glow, 8); ctx.fillText(s, x, yy); }
      ctx.fillText(s, x, yy);
      glowOff();
    };
    const para = (lines, font, color, align, lh, glow) => {
      lines.forEach(l => { text(l, align === 'center' ? CX : X, y, font, color, align, glow); y += lh; });
    };
    const label = (s, color) => {
      ctx.font = faceOf(st, 11, 700);
      if (draw) { ctx.fillStyle = color; ctx.textBaseline = 'top'; spaced(ctx, s, X, y, 2.6, 'left'); }
      y += 18;
    };

    /* header: the mark, the heading, the rule */
    if (draw) {
      ctx.strokeStyle = st.acc; ctx.fillStyle = st.acc; ctx.lineWidth = 1.8;
      glowOn(st.glow, 12);
      const cy = y + 15;
      ctx.beginPath();
      if (st.icon === 'circle') ctx.arc(CX, cy, 14, 0, Math.PI * 2);
      else if (st.icon === 'diamond') { ctx.moveTo(CX, cy - 15); ctx.lineTo(CX + 15, cy); ctx.lineTo(CX, cy + 15); ctx.lineTo(CX - 15, cy); ctx.closePath(); }
      else if (st.icon === 'square') frame(ctx, CX - 13, cy - 13, 26, 26, 5);
      else { ctx.moveTo(CX, cy - 14); ctx.lineTo(CX + 16, cy + 13); ctx.lineTo(CX - 16, cy + 13); ctx.closePath(); }
      ctx.stroke();
      ctx.font = faceOf(st, st.icon === 'triangle' ? 17 : 21, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', CX, cy + (st.icon === 'triangle' ? 2 : 0.5));
      glowOff();
    }
    y += 38;
    ctx.font = faceOf(st, 11, 700);
    if (draw) { ctx.fillStyle = st.mute; ctx.textBaseline = 'top'; spaced(ctx, q.head || o.head || AUTO_HEAD[q.kind] || 'NOTIFICATION', CX, y, 3, 'center'); }
    y += 20;
    if (draw) {
      glowOn(st.glow, 8); ctx.strokeStyle = st.line; ctx.globalAlpha = 0.7; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + CW, y); ctx.stroke();
      if (st.icon === 'diamond') { ctx.fillStyle = st.acc; ctx.beginPath(); ctx.moveTo(CX, y - 4); ctx.lineTo(CX + 4, y); ctx.lineTo(CX, y + 4); ctx.lineTo(CX - 4, y); ctx.fill(); }
      ctx.globalAlpha = 1; glowOff();
    }
    y += 18;

    if (q.kind === 'notice') {
      ctx.font = bodyOf(st, 15, 500);
      q.msgs.forEach(m => {
        const s = st.brackets ? '[' + m + ']' : m;
        para(wrapText(ctx, s, CW), bodyOf(st, 15, 500), ink, 'center', 22, false);
        y += 10;
      });
      y -= 10;
    } else {
      if (q.title) {
        ctx.font = faceOf(st, 20, 700);
        const s = st.brackets ? '[' + q.title + ']' : q.title;
        para(wrapText(ctx, s, CW), faceOf(st, 20, 700), q.debuff ? st.warn : st.acc, 'center', 26, true);
        y += 6;
      }
      /* the line under the name: an item's rank, or a status effect's kind and
         how long it lasts */
      const sub = q.kind === 'item' && q.rank ? 'RANK ' + q.rank
        : q.kind === 'status' ? [q.etype || 'BUFF', q.dur].filter(Boolean).join('  ·  ') : '';
      if (sub) {
        ctx.font = faceOf(st, 11, 700);
        if (draw) { ctx.fillStyle = q.debuff ? st.warn : st.mute; ctx.textBaseline = 'top'; spaced(ctx, sub, CX, y, 3, 'center'); }
        y += 22;
      }
      if (q.desc.length) {
        ctx.font = bodyOf(st, 13, 500);
        q.desc.forEach(d => para(wrapText(ctx, d, CW), bodyOf(st, 13, 500), st.mute, 'center', 19, false));
        y += 8;
      }
      if (q.goals.length) {
        y += 6; label('GOAL', st.mute);
        /* A goal with a number is counted: no tick box, the count on the right.
           No bar under it: Tom, 2026-09-25, "games dont show bars". A goal
           without a number keeps its box. */
        q.goals.forEach(g => {
          const hasP = g.max != null;
          const cnt = hasP ? '[' + fmt(g.cur) + '/' + fmt(g.max) + (g.unit ? ' ' + g.unit : '') + ']' : '';
          ctx.font = faceOf(st, 14, 700);
          const pw = hasP ? ctx.measureText(cnt).width + 10 : 0;
          const lx = hasP ? X : X + 24;
          ctx.font = bodyOf(st, 15, 500);
          const lines = wrapText(ctx, g.label, CW - (lx - X) - pw);
          if (draw) {
            if (hasP) text(cnt, X + CW, y, faceOf(st, 14, 700), g.done ? st.acc : st.mute, 'right', false);
            else {
              const bx = X, by = y + 3;
              ctx.lineWidth = 1.5; ctx.strokeStyle = st.acc; ctx.fillStyle = st.acc;
              if (g.done) {
                ctx.fillRect(bx, by, 13, 13);
                ctx.strokeStyle = st.panel; ctx.lineWidth = 2; ctx.beginPath();
                ctx.moveTo(bx + 3, by + 7); ctx.lineTo(bx + 5.5, by + 10); ctx.lineTo(bx + 10.5, by + 3.5); ctx.stroke();
              } else ctx.strokeRect(bx + 0.5, by + 0.5, 12, 12);
            }
          }
          lines.forEach(l => { text(l, lx, y, bodyOf(st, 15, 500), ink, 'left', false); y += 21; });
          y += 5;
        });
      }
      const fx = q.kind === 'item' || q.kind === 'status';
      const rewards = o.rewards ? o.rewards(q) : (q.typedRewards ? q.rewards : []);
      if (rewards.length) {
        const rc = q.debuff ? st.warn : st.acc;
        y += 10; label(fx ? 'EFFECTS' : 'REWARDS', st.mute);
        rewards.forEach(rw => {
          ctx.font = bodyOf(st, 14, 600);
          const lines = wrapText(ctx, rw, CW - 20);
          if (draw) { ctx.fillStyle = rc; ctx.beginPath(); ctx.moveTo(X + 6, y + 5); ctx.lineTo(X + 11, y + 10); ctx.lineTo(X + 6, y + 15); ctx.lineTo(X + 1, y + 10); ctx.fill(); }
          lines.forEach(l => { text(l, X + 20, y, bodyOf(st, 14, 600), rc, 'left', false); y += 21; });
          y += 3;
        });
      }
      if (q.penalty.length) {
        y += 10; label('WARNING', st.warn);
        ctx.font = bodyOf(st, 13, 500);
        q.penalty.forEach(p => para(wrapText(ctx, p, CW), bodyOf(st, 13, 500), st.warn, 'left', 19, false));
      }
    }
    y += P + 2;
    return y + M - M; // bottom of the box, in logical units
  }

  /* the window alone, on a clear canvas, 1080 wide */
  function drawWindow(q, st, o) {
    st = typeof st === 'string' || !st ? get(st) : st;
    o = o || {};
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.scale(SC, SC);
    const bottom = layout(q, st, ctx, false, o);
    const H = bottom - M;                     // box height
    c.width = T * SC; c.height = (H + 2 * M) * SC;
    ctx.setTransform(SC, 0, 0, SC, 0, 0);

    /* the plate */
    const g = ctx.createLinearGradient(0, M, 0, M + H);
    g.addColorStop(0, st.panel2); g.addColorStop(1, st.panel);
    frame(ctx, M, M, W, H, st.cut);
    ctx.fillStyle = g; ctx.fill();
    if (st.scan) {
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let yy = M + 2; yy < M + H; yy += 4) { ctx.beginPath(); ctx.moveTo(M, yy); ctx.lineTo(M + W, yy); ctx.stroke(); }
      ctx.restore();
    }
    /* the glowing edge: once with the light, once crisp on top of it */
    ctx.shadowColor = st.glow; ctx.shadowBlur = 14 * SC;
    ctx.strokeStyle = st.line; ctx.lineWidth = 2;
    frame(ctx, M, M, W, H, st.cut); ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    ctx.stroke();
    /* the inner hairline */
    ctx.globalAlpha = st.icon === 'diamond' ? 0.6 : 0.35; ctx.lineWidth = 1;
    frame(ctx, M + 5, M + 5, W - 10, H - 10, st.cut ? Math.max(0, st.cut - 4) : 0); ctx.stroke();
    ctx.globalAlpha = 1;
    if (st.icon === 'diamond') {
      ctx.fillStyle = st.acc;
      [[M, M], [M + W, M], [M, M + H], [M + W, M + H]].forEach(pt => {
        ctx.beginPath(); ctx.moveTo(pt[0], pt[1] - 5); ctx.lineTo(pt[0] + 5, pt[1]); ctx.lineTo(pt[0], pt[1] + 5); ctx.lineTo(pt[0] - 5, pt[1]); ctx.fill();
      });
    }
    layout(q, st, ctx, true, o);
    return c;
  }

  /* the whole picture: the window alone, or laid on a story or a post, drawn
     into `target`. o = { frame: 'window'|'story'|'post', back: 'clear'|'dark',
     fill: how much of the safe width the window takes, 0 to 1 }. */
  function frameBox(f) {
    if (f === 'post') return { w: 1080, h: 1350, safe: { x: 60, y: 90, w: 960, h: 1170 } };
    if (f !== 'story') return null;
    const S = g.IO && g.IO.STORY;
    return S ? { w: S.w, h: S.h, safe: S.safe } : { w: 1080, h: 1920, safe: { x: 90, y: 250, w: 900, h: 1330 } };
  }
  function compose(target, win, st, o) {
    st = typeof st === 'string' || !st ? get(st) : st;
    o = o || {};
    const fb = frameBox(o.frame);
    const ctx = target.getContext('2d');
    if (!fb) {
      target.width = win.width; target.height = win.height;
      ctx.drawImage(win, 0, 0);
      return target;
    }
    target.width = fb.w; target.height = fb.h;
    ctx.clearRect(0, 0, fb.w, fb.h);
    if (o.back === 'dark') {
      const gr = ctx.createLinearGradient(0, 0, 0, fb.h);
      gr.addColorStop(0, st.bgB); gr.addColorStop(1, st.bgA);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, fb.w, fb.h);
      const v = ctx.createRadialGradient(fb.w / 2, fb.h / 2, fb.h * 0.2, fb.w / 2, fb.h / 2, fb.h * 0.75);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, fb.w, fb.h);
    }
    const fill = o.fill || 1;
    const sc = Math.min(fb.safe.w * fill / win.width, fb.safe.h / win.height);
    const sw = win.width * sc, sh = win.height * sc;
    ctx.drawImage(win, fb.safe.x + (fb.safe.w - sw) / 2, fb.safe.y + (fb.safe.h - sh) / 2, sw, sh);
    return target;
  }
  /* ══════════════ THE ENGINE ends ══════════════ */

  g.Notice = { STYLES: STYLES, get: get, list: list, frame: frame, clipPath: clipPath, vars: vars, wear: wear, bracket: bracket,
    AUTO_HEAD: AUTO_HEAD, parse: parse, draw: drawWindow, compose: compose };
})(window);
