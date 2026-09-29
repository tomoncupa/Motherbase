/* ══════════════════════════════════════════════════════════════════════════
   BARCODE · a food's barcode read by the phone's camera, and its label
   filled from Open Food Facts. Built 2026-09-30 for KITCHEN and FOODDÉX
   (Tom: "ok include").

   Plain script, one global: `Barcode`. KITCHEN loads it as `barcode.js`,
   FOODDÉX as `../kitchen/barcode.js`. It belongs in shared/ and is here only
   because this session could not edit shared/ (kitchen/CLAUDE.md, Needs from
   the foundation). Everything it loads is found from its own address, so it
   works from either page and moves as one folder.

   THE CAMERA
     getUserMedia on every phone, the iPhone included. The frames are read by
     the phone's own BarcodeDetector where one exists (Chrome on Android) and
     by zxing-wasm everywhere else, which is the iPhone. zxing is vendored in
     `zxing/` beside this file (MIT, built from zxing-cpp, Apache-2.0) and is
     fetched only when SCAN is pressed: 37 KB of script and a 950 KB wasm, never
     the CDN. Typing the number under the bars always works, camera or none.

   THE LOOKUP
     CALCOUNT's own call (calcount/index.html, fetchOpenFoodFacts): the v2
     product address, free, no key, only the number sent. Its mapping read a
     missing macro as 0; this one never does. A nutrient Open Food Facts does
     not carry is left off the food, because a blank is "not known", never
     zero (root brief, `food`). Figures are per 100 g, or per 100 ml for a
     product whose quantity is in ml, cl or L. At most 15 lookups in any
     minute from one page (Tom's number), counted here.

   Tokens only in the CSS below, like every app (root brief, constraint 8).
   ══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  const doc = g.document;
  const HERE = (() => {
    try { return new URL('.', doc.currentScript.src).href; } catch (e) { return ''; }
  })();
  const ZX_JS = HERE + 'zxing/zxing-reader.js', ZX_WASM = HERE + 'zxing/zxing_reader.wasm';
  const ZX_FORMATS = ['EAN13', 'EAN8', 'UPCA', 'UPCE'];
  const BD_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
  const OFF = 'https://world.openfoodfacts.org/api/v2/product/';
  const OFF_FIELDS = 'code,product_name,brands,quantity,serving_size,serving_quantity,nutriments';
  const LIMIT = 15, WINDOW = 60000;
  const hits = [];

  /* ── the number ── */
  const digits = s => String(s == null ? '' : s).replace(/\D/g, '');
  /** EAN-8, UPC-A, EAN-13 and GTIN-14 all end in the same mod-10 check digit;
      a UPC-E's is the check digit of the twelve it stands for. */
  function mod10(code) {
    if ([8, 12, 13, 14].indexOf(code.length) < 0) return false;
    let sum = 0;
    for (let i = code.length - 2, w = 3; i >= 0; i--, w = 4 - w) sum += (+code[i]) * w;
    return (10 - sum % 10) % 10 === +code[code.length - 1];
  }
  function valid(code) {
    code = digits(code);
    return mod10(code) || (code.length === 8 && upcE(code) !== code && mod10(upcE(code)));
  }
  /** One product under two lengths: a UPC-A is an EAN-13 with a 0 in front. */
  const same = (a, b) => !!a && !!b && digits(a).replace(/^0+/, '') === digits(b).replace(/^0+/, '');
  /** The code as the lookup and the library know it: a UPC-E read out to its twelve. */
  function norm(code) {
    code = digits(code);
    return code.length === 8 && !mod10(code) && mod10(upcE(code)) ? upcE(code) : code;
  }
  /** UPC-E is eight digits printed and twelve meant; the lookup wants the twelve. */
  function upcE(code) {
    if (code.length !== 8 || !/^[01]/.test(code)) return code;
    const m = code.slice(1, 7), last = m[5];
    let body;
    if (last <= '2') body = m.slice(0, 2) + last + '0000' + m.slice(2, 5);
    else if (last === '3') body = m.slice(0, 3) + '00000' + m.slice(3, 5);
    else if (last === '4') body = m.slice(0, 4) + '00000' + m[4];
    else body = m.slice(0, 5) + '0000' + last;
    return code[0] + body + code[7];
  }

  /* ── zxing, loaded once, on the first scan that needs it ── */
  let zxP = null;
  function zx() {
    if (zxP) return zxP;
    zxP = new Promise((res, rej) => {
      if (g.ZXingWASM) return res(g.ZXingWASM);
      const s = doc.createElement('script');
      s.src = ZX_JS;
      s.onload = () => g.ZXingWASM ? res(g.ZXingWASM) : rej(new Error('zxing did not define itself'));
      s.onerror = () => rej(new Error('zxing-reader.js did not load'));
      doc.head.appendChild(s);
    }).then(Z => {
      Z.prepareZXingModule({
        overrides: { locateFile: (path, prefix) => /\.wasm$/.test(path) ? ZX_WASM : prefix + path },
        fireImmediately: true,
      });
      return Z;
    });
    zxP.catch(() => { zxP = null; });
    return zxP;
  }
  /** One picture in, a checked code out, or null. `src` is a video, canvas or image. */
  async function readFrame(src, canvas) {
    const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
    if (!w || !h) return null;
    /* the middle band, where the aim box is, no wider than 960 */
    const sw = w, sh = Math.round(h * 0.6), sy = Math.round((h - sh) / 2);
    const k = Math.min(1, 960 / sw);
    canvas.width = Math.round(sw * k); canvas.height = Math.round(sh * k);
    const c = canvas.getContext('2d', { willReadFrequently: true });
    c.drawImage(src, 0, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const Z = await zx();
    const out = await Z.readBarcodes(c.getImageData(0, 0, canvas.width, canvas.height),
      { formats: ZX_FORMATS, tryHarder: true, maxNumberOfSymbols: 1 });
    const hit = (out || []).find(r => r && r.isValid && valid(r.text));
    return hit ? digits(hit.text) : null;
  }

  /* ── Open Food Facts ── */
  const num = v => { const x = typeof v === 'string' ? parseFloat(v) : v; return typeof x === 'number' && isFinite(x) && x >= 0 ? x : null; };
  const r1 = v => Math.round(v * 10) / 10;
  /* Three significant figures, the way nutrients.js keeps the USDA's. */
  const tidy = v => { if (v === 0) return 0; const d = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(v)))); return +v.toFixed(Math.min(d, 4)); };
  /* Open Food Facts keeps every `_100g` mass in grams. [our key, their key, times] */
  const MAP = [
    ['p', 'proteins', 1, r1], ['c', 'carbohydrates', 1, r1], ['f', 'fat', 1, r1],
    ['k', 'potassium', 1000], ['ca', 'calcium', 1000], ['caff', 'caffeine', 1000],
    ['fib', 'fiber', 1], ['sug', 'sugars', 1], ['sat', 'saturated-fat', 1],
    ['mono', 'monounsaturated-fat', 1], ['poly', 'polyunsaturated-fat', 1],
    ['epa', 'eicosapentaenoic-acid', 1], ['dha', 'docosahexaenoic-acid', 1],
    ['chol', 'cholesterol', 1000],
    ['fe', 'iron', 1000], ['mg', 'magnesium', 1000], ['ph', 'phosphorus', 1000], ['zn', 'zinc', 1000],
    ['cu', 'copper', 1000], ['mn', 'manganese', 1000], ['se', 'selenium', 1e6], ['io', 'iodine', 1e6],
    /* a pack's "Vitamin A" is the total, which is what `rae` holds; `va` is retinol alone */
    ['rae', 'vitamin-a', 1e6], ['bc', 'beta-carotene', 1e6],
    ['vc', 'vitamin-c', 1000], ['vd', 'vitamin-d', 1e6], ['ve', 'vitamin-e', 1000], ['vk', 'vitamin-k', 1e6],
    ['b1', 'vitamin-b1', 1000], ['b2', 'vitamin-b2', 1000], ['b3', 'vitamin-pp', 1000],
    ['b5', 'pantothenic-acid', 1000], ['b6', 'vitamin-b6', 1000], ['fol', 'vitamin-b9', 1e6],
    ['b12', 'vitamin-b12', 1e6], ['ch', 'choline', 1000],
  ];
  /** An Open Food Facts product in, the suite's food shape out: `{name, brand,
      unit, amt: 100, base}`, `base` holding only figures the product carries.
      Null when it carries no calories and no macro at all. */
  function fromOff(code, p) {
    p = p || {};
    const n = p.nutriments || {};
    const base = {};
    const kcal = num(n['energy-kcal_100g']) != null ? num(n['energy-kcal_100g'])
      : num(n.energy_100g) != null ? num(n.energy_100g) / 4.184 : null;
    if (kcal != null) base.kcal = Math.round(kcal);
    MAP.forEach(m => {
      const v = num(n[m[1] + '_100g']);
      if (v == null) return;
      const x = v * m[2];
      base[m[0]] = m[3] ? m[3](x) : tidy(x);
    });
    /* sodium as printed, else salt read back to sodium (2.5 g of salt holds 1 g) */
    const na = num(n.sodium_100g), salt = num(n.salt_100g);
    if (na != null) base.na = Math.round(na * 1000);
    else if (salt != null) base.na = Math.round(salt * 400);
    if (base.kcal == null && base.p == null && base.c == null && base.f == null) return null;
    const unit = /\d\s*(ml|cl|l)\b/i.test(String(p.quantity || '')) ? 'ml' : 'g';
    const out = { code: code, name: String(p.product_name || '').trim(), brand: String(p.brands || '').split(',')[0].trim(),
      amt: 100, unit: unit, base: base };
    const sq = num(p.serving_quantity);
    if (sq > 0) out.serve = { amt: sq, text: String(p.serving_size || '').trim() };
    return out;
  }
  /** `{status: 'found', food}`, `'none'`, `'offline'` or `'busy'`. */
  async function lookup(code) {
    code = norm(code);
    const now = Date.now();
    while (hits.length && now - hits[0] > WINDOW) hits.shift();
    if (hits.length >= LIMIT) return { status: 'busy', code: code };
    hits.push(now);
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); }, 9000);
    try {
      const res = await fetch(OFF + code + '.json?fields=' + OFF_FIELDS, ctl ? { signal: ctl.signal } : {});
      if (res.status === 429) return { status: 'busy', code: code };
      if (res.status === 404) return { status: 'none', code: code };
      if (!res.ok) return { status: 'offline', code: code };
      const d = await res.json();
      const food = d && d.status === 1 && d.product ? fromOff(code, d.product) : null;
      return food ? { status: 'found', code: code, food: food } : { status: 'none', code: code };
    } catch (e) {
      return { status: 'offline', code: code };
    } finally { clearTimeout(t); }
  }

  /* ── the sheet ── */
  function css() {
    if (doc.getElementById('bc-css')) return;
    const s = doc.createElement('style');
    s.id = 'bc-css';
    s.textContent =
      '.bc-cam{position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;border-radius:var(--radius-md);background:var(--surface-3)}' +
      '.bc-cam video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
      '.bc-aim{position:absolute;left:var(--s-5);right:var(--s-5);top:20%;bottom:20%;border:calc(var(--border-width) * 2) solid var(--accent);border-radius:var(--radius-sm);pointer-events:none}' +
      '.bc-say{color:var(--text-2);font-size:var(--f-2);line-height:var(--lh-body);min-height:calc(var(--f-2) * 2)}' +
      '.bc-lab{display:flex;flex-direction:column;gap:var(--s-1);font-size:var(--f-2);color:var(--text-2)}' +
      '.bc-row{display:flex;gap:var(--s-2);align-items:stretch}' +
      '.bc-row .mb-input{flex:1;min-width:0}' +
      '.bc-body{display:flex;flex-direction:column;gap:var(--s-3)}';
    doc.head.appendChild(s);
  }
  const camOk = () => !!(g.navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  /** The SCAN sheet. `o.known(code)` may return a function to run instead of
      a lookup (the food is already saved); `o.found(result)` gets the lookup's
      answer after the sheet has closed. */
  function open(o) {
    o = o || {};
    css();
    let stream = null, run = 0, busy = false, done = false, input, say, video;
    const stop = () => {
      run++;
      if (stream) { stream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }); stream = null; }
      if (video) { try { video.srcObject = null; } catch (e) {} }
    };
    const tell = t => { if (say) say.textContent = t; };
    const h = g.UI.dialog({
      title: o.title || 'SCAN A BARCODE', width: 520,
      onClose: () => { done = true; stop(); },
      body: (b, hh) => {
        const box = doc.createElement('div');
        box.className = 'bc-body';
        if (camOk()) {
          const cam = doc.createElement('div');
          cam.className = 'bc-cam';
          video = doc.createElement('video');
          /* all three before the stream, or an iPhone opens its own player */
          video.setAttribute('playsinline', ''); video.setAttribute('muted', ''); video.setAttribute('autoplay', '');
          video.muted = true; video.playsInline = true;
          cam.appendChild(video);
          const aim = doc.createElement('div');
          aim.className = 'bc-aim';
          cam.appendChild(aim);
          box.appendChild(cam);
        }
        say = doc.createElement('p');
        say.className = 'bc-say';
        say.setAttribute('role', 'status');
        box.appendChild(say);
        const lab = doc.createElement('label');
        lab.className = 'bc-lab';
        lab.appendChild(doc.createElement('span')).textContent = camOk() ? 'Or type the number under the bars' : 'The number under the bars';
        const row = doc.createElement('div');
        row.className = 'bc-row';
        input = g.UI.field('number', { placeholder: '4800016644573' });
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('aria-label', 'Barcode number');
        const go = doc.createElement('button');
        go.type = 'button';
        go.className = 'mb-btn mb-press mb-tap';
        go.textContent = 'LOOK UP';
        go.onclick = () => take(input.value, true);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); take(input.value, true); } });
        row.appendChild(input); row.appendChild(go);
        lab.appendChild(row);
        box.appendChild(lab);
        b.appendChild(box);
      },
      actions: [{ label: 'CANCEL' }],
    });

    async function take(raw, typed) {
      if (busy || done) return;
      const code = norm(raw);
      if (!valid(code)) {
        if (typed) { tell('Not a barcode number.'); if (g.Mobile) Mobile.feedback('warn'); }
        return;
      }
      busy = true;
      stop();
      if (g.Mobile) Mobile.feedback('success');
      const k = o.known ? o.known(code) : null;
      if (k) { h.close(); k(); return; }
      tell('Looking up ' + code + '.');
      const r = await lookup(code);
      if (done) return;
      if (r.status === 'busy') {
        busy = false;
        tell('Lookup limit reached. Try again in a minute.');
        if (g.Mobile) Mobile.feedback('warn');
        return;
      }
      h.close();
      if (o.found) o.found(r);
    }

    function startCamera() {
      if (!camOk()) { tell('Camera not available. Type the number.'); g.UI.focusSoon(input); return; }
      tell('Starting the camera.');
      const mine = ++run;
      navigator.mediaDevices.getUserMedia({ audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
        .then(s => {
          if (mine !== run || done) { s.getTracks().forEach(t => t.stop()); return; }
          stream = s;
          video.srcObject = s;
          const p = video.play();
          if (p && p.catch) p.catch(() => {});
          tell('Point the camera at the barcode.');
          loop(mine);
        })
        .catch(() => {
          if (mine !== run || done) return;
          const cam = h.body && h.body.querySelector('.bc-cam');
          if (cam) cam.remove();
          tell('Camera not available. Type the number.');
          g.UI.focusSoon(input);
        });
    }
    async function loop(mine) {
      let detector = null;
      if ('BarcodeDetector' in g) {
        try {
          const have = await g.BarcodeDetector.getSupportedFormats();
          if (BD_FORMATS.some(f => have.indexOf(f) >= 0)) detector = new g.BarcodeDetector({ formats: BD_FORMATS.filter(f => have.indexOf(f) >= 0) });
        } catch (e) { detector = null; }
      }
      if (!detector) {
        try { await zx(); } catch (e) {
          if (mine === run && !done) tell('The reader did not load. Type the number.');
          return;
        }
      }
      const canvas = doc.createElement('canvas');
      const tick = async () => {
        if (mine !== run || done || busy) return;
        let code = null;
        try {
          if (video.readyState >= 2) {
            if (detector) {
              const found = await detector.detect(video);
              const f = (found || []).find(x => valid(x.rawValue));
              code = f ? digits(f.rawValue) : null;
            } else code = await readFrame(video, canvas);
          }
        } catch (e) { code = null; }
        if (mine !== run || done) return;
        if (code) { take(code, false); return; }
        setTimeout(tick, 150);
      };
      tick();
    }
    if (h && h.body) startCamera();
    return h;
  }

  g.Barcode = { open: open, lookup: lookup, fromOff: fromOff, valid: valid, norm: norm, same: same, readFrame: readFrame, digits: digits, LIMIT: LIMIT };
})(typeof window !== 'undefined' ? window : this);
