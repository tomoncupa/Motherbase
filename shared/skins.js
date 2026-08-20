/* Universal skin engine. Shared by every app in the suite.
   Four colours in, ~30 semantic tokens out. Components read the tokens,
   never the raw colours, which is the single rule that keeps skins working.

   Usage:
     <script src="../shared/skins.js"></script>
     await Skins.load();          // fetches skins.json, falls back to built-ins
     Skins.apply('monarch');      // or Skins.apply(Skins.custom({bg,panel,accent,text}))
*/
(function(g){
'use strict';
const FALLBACK={schema:1,skins:[
 {id:'status-window',name:'Status Window',mode:'dark',cut:'10px',base:{bg:'#070A11',panel:'#0E131D',accent:'#4FD8E8',text:'#E6EDF7'}}],
 ranks:{S:'#F2C14E',A:'#5FE39B',B:'#4FD8E8',C:'#6C8CFF',D:'#C79BF0',E:'#FF9F6B',F:'#FF6B6B'}};
/* The skin is chosen PER APP on purpose — ARC can be Monarch while BLOCK is
   Ice. `Skins.for('block')` before restore()/apply() scopes it; without it
   everything shares the old single key, exactly as before. */
let APP='';
const KEY='suite_skin';
const PAL_KEY='suite_palettes';
const skinKey=()=>APP?KEY+'.'+APP:KEY;

const hex2rgb=h=>{h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const rgb2hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>{const x=hex2rgb(a),y=hex2rgb(b);return rgb2hex([0,1,2].map(i=>x[i]+(y[i]-x[i])*t))};
const lum=h=>{const c=hex2rgb(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});
  return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const contrast=(a,b)=>{const l1=lum(a),l2=lum(b);return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05)};
const readable=bg=>contrast(bg,'#000000')>contrast(bg,'#ffffff')?'#000000':'#ffffff';

/* The semantic tokens. Two halves, and the split matters:

   COLOUR — derived from the four base colours, so a theme or a palette edit
   repaints them. Components read these, never a hex code.

   MEASUREMENT — spacing, type, depth, corners, touch, motion. Identical in
   every theme, because a theme changes what an app looks like, never how far
   apart things sit or how big a thumb target is.

   Add to either list only if a component genuinely cannot be built from what
   is already here. */
function tokens(base,cut,ranks,skin){
  const{bg,panel,accent,text}=base;
  const t={
    '--bg':bg,'--surface-1':panel,'--surface-2':mix(panel,text,.07),'--surface-3':mix(panel,text,.15),
    '--overlay':mix(bg,'#000000',.25),
    /* Secondary text used to sit 32% and 56% of the way toward the
        background, which is the textbook way to build hierarchy with colour.
        It also meant a label never looked white on a screen that is meant to
        look white. Pulled most of the way back: hierarchy now comes from size
        and weight, which it should have been doing more of anyway. */
    '--text-1':text,'--text-2':mix(text,bg,.12),'--text-muted':mix(text,bg,.34),'--text-inverse':bg,
    '--border':mix(panel,text,.13),'--border-strong':mix(panel,text,.28),'--focus':accent,
    '--accent':accent,'--accent-hover':mix(accent,text,.22),'--accent-fg':readable(accent),
    '--success':'#5FE39B','--warn':'#F2C14E','--danger':'#FF6B6B','--info':'#6C8CFF',
    '--data-1':accent,'--data-2':mix(accent,'#6C8CFF',.6),'--data-3':'#C79BF0',
    '--data-4':'#5FE39B','--data-5':'#F2C14E','--data-6':'#FF9F6B',
    '--radius-sm':'4px','--radius-md':'10px','--border-width':'1px','--cut':cut||'10px',
    '--font-display':"'Chakra Petch','Rajdhani',system-ui,sans-serif",
    '--font-body':"'Inter Tight','Inter',system-ui,-apple-system,sans-serif",
    '--font-mono':"'JetBrains Mono','SF Mono',ui-monospace,monospace",
    '--dur-fast':'140ms','--dur-slow':'420ms'
  };

  /* ══════════════ the measurement layer ══════════════
     Refactoring UI, chapters "Establish a spacing and sizing system" and
     "Establish a type scale". These are the same in every theme on purpose —
     a theme changes what an app looks like, never how far apart things sit.
     Nothing here reads a colour, so a palette edit cannot disturb it.        */

  /* No two steps are closer than about 25%, which is the whole point: at the
     small end four pixels is a third of the value, at the large end it is
     invisible. A linear scale gives you nothing to choose between.           */
  const SPACE=['4px','8px','12px','16px','24px','32px','48px','64px','96px','128px'];
  SPACE.forEach((v,i)=>{t['--s-'+(i+1)]=v});
  t['--gutter']='var(--s-4)';           /* the standard edge margin of a screen */

  /* Hand-picked, not modular: a ratio gives you 31.25px and no size between
     12 and 16, which is exactly the size you always end up wanting.          */
  const TYPE=['12px','14px','16px','18px','20px','24px','30px','36px','48px'];
  TYPE.forEach((v,i)=>{t['--f-'+(i+1)]=v});
  t['--lh-tight']='1.25';t['--lh-body']='1.6';t['--lh-loose']='1.75';
  /* Two weights is enough for interface work, and nothing under 400 —
     lighter text is a job for a softer colour, not a thinner stroke.         */
  t['--w-body']='500';t['--w-bold']='700';
  t['--track-cap']='.18em';t['--track-tight']='-.01em';

  /* Depth. Two parts each: a large soft cast from the light source, and a
     tight dark one for the ambient shadow trapped under the edge. The tight
     part fades as the element rises and is gone by the top of the ladder,
     because a thing far from the surface has no contact shadow left.         */
  const dark=lum(bg)<.5;
  const sh=a=>'rgba(0,0,0,'+Math.min(.92,+(a*(dark?2:1)).toFixed(3))+')';
  t['--e-1']='0 1px 3px '+sh(.12)+', 0 1px 2px '+sh(.24);
  t['--e-2']='0 3px 6px '+sh(.15)+', 0 2px 4px '+sh(.12);
  t['--e-3']='0 10px 20px '+sh(.15)+', 0 3px 6px '+sh(.10);
  t['--e-4']='0 15px 25px '+sh(.15)+', 0 5px 10px '+sh(.05);
  t['--e-5']='0 20px 40px '+sh(.20);
  /* A one-pixel lit edge along the top. Cheap, and it is what stops a card on
     a dark theme from reading as a flat rectangle. */
  t['--rim']=dark?'inset 0 1px 0 rgba(255,255,255,.055)':'inset 0 1px 0 rgba(255,255,255,.75)';

  /* Corners and the two sizes a phone needs that a desktop does not. */
  t['--radius-lg']='16px';t['--radius-full']='999px';t['--radius-sheet']='20px';

  /* Touch. 44 is the smallest square a thumb hits reliably; it is a hit area,
     not a visual size, so a small control can still look small.              */
  t['--tap']='44px';

  /* Safe areas as plain values, so no app writes env() itself and every app
     gets the notch, the Dynamic Island and the home indicator for free.      */
  t['--safe-t']='env(safe-area-inset-top,0px)';
  t['--safe-r']='env(safe-area-inset-right,0px)';
  t['--safe-b']='env(safe-area-inset-bottom,0px)';
  t['--safe-l']='env(safe-area-inset-left,0px)';

  /* Motion. Fast enough to feel like a response, never like a performance.
     The sheet curve is the one iOS uses: leaves quickly, lands softly.       */
  t['--dur-tap']='90ms';t['--dur-med']='240ms';t['--dur-sheet']='360ms';
  t['--ease-out']='cubic-bezier(.2,0,0,1)';
  t['--ease-in']='cubic-bezier(.4,0,1,1)';
  t['--ease-sheet']='cubic-bezier(.32,.72,0,1)';
  // Rank colours are deliberately fixed across every skin, so a letter grade
  // means the same thing wherever it appears.
  // ARC hand-picks a six-colour chart ramp per theme. If a skin supplies one, use it;
  // otherwise fall back to deriving from the accent.
  if(skin&&Array.isArray(skin.ramp))skin.ramp.slice(0,6).forEach((c,i)=>{t['--data-'+(i+1)]=c});
  // Explicit overrides win over anything derived.
  if(skin&&skin.overrides)Object.assign(t,skin.overrides);
  // Texture layer: fonts and corner shape per skin.
  if(skin&&skin.texture){const x=skin.texture;
    if(x.display)t['--font-display']=x.display;
    if(x.body)t['--font-body']=x.body;
    if(x.cut)t['--cut']=x.cut;
    // Texture as plain values, so no app writes theme-specific CSS.
    t['--tex-image']=x.image||'none';
    t['--tex-size']=x.size||'auto';}
  if(!t['--tex-image']){t['--tex-image']='none';t['--tex-size']='auto'}
  Object.entries(ranks||FALLBACK.ranks).forEach(([k,v])=>{t['--rank-'+k]=v});
  return t;
}

const Skins={
  data:FALLBACK, current:null,
  async load(url){
    try{const r=await fetch(url||'../shared/skins.json',{cache:'no-cache'});
      if(r.ok){const j=await r.json();if(j&&Array.isArray(j.skins)&&j.skins.length)this.data=j}
    }catch(e){/* offline or file:// — built-ins carry it */}
    return this.data;
  },
  list(){return this.data.skins.concat(this.customs())},
  get(id){return this.list().find(s=>s.id===id)||this.data.skins[0]},
  customs(){try{return JSON.parse(localStorage.getItem('suite_skins_custom')||'[]')}catch(e){return[]}},
  saveCustom(skin){const all=this.customs().filter(s=>s.id!==skin.id);all.push(skin);
    try{localStorage.setItem('suite_skins_custom',JSON.stringify(all))}catch(e){}return skin},
  custom(base,name,cut){return{id:'custom-'+Date.now().toString(36),name:name||'Custom',
    mode:lum(base.bg)>.5?'light':'dark',cut:cut||'10px',base:base,custom:true}},
  tokensFor(skin){return tokens(skin.base,skin.cut,this.data.ranks,skin)},

  /* ---- the colour layer ----------------------------------------------
     A skin is the THEME: structure, fonts, corners, texture, default colours.
     A palette sits on top of one skin and is the six named fields plus the six
     node colours, saved per skin in 'suite_palettes'. Same split ARC uses and
     the same field names, so a palette means the same thing in either place.
     A skin nobody has edited paints exactly as this file describes. */
  FIELDS:[['bg','Canvas background'],['panel','Card fill'],['line','Card border'],
          ['ink','Text'],['mut','Secondary text'],['acc','Accent — buttons, selection']],
  defaultsFor(idOrSkin){
    const s=typeof idOrSkin==='string'?this.get(idOrSkin):idOrSkin,t=this.tokensFor(s);
    return {bg:t['--bg'],panel:t['--surface-1'],line:t['--border'],ink:t['--text-1'],
      mut:t['--text-2'],acc:t['--accent'],colors:[1,2,3,4,5,6].map(i=>t['--data-'+i])};
  },
  palettes(){try{return JSON.parse(localStorage.getItem(PAL_KEY))||{}}catch(e){return{}}},
  paletteFor(id){
    const d=this.defaultsFor(id),o=this.palettes()[id]||{};
    return Object.assign({},d,o,{colors:(o.colors&&o.colors.length===6)?o.colors.slice():d.colors});
  },
  isCustomised(id){return !!this.palettes()[id]},
  savePalette(id,pal){const a=this.palettes();a[id]=pal;
    try{localStorage.setItem(PAL_KEY,JSON.stringify(a))}catch(e){}return pal},
  clearPalette(id){const a=this.palettes();delete a[id];
    try{localStorage.setItem(PAL_KEY,JSON.stringify(a))}catch(e){}},
  /* six fields back out into the full token set */
  palTokens(p){
    const t={'--bg':p.bg,'--surface-1':p.panel,'--surface-2':mix(p.panel,p.bg,.5),
      '--surface-3':mix(p.panel,p.ink,.15),'--overlay':mix(p.bg,'#000000',.25),
      '--border':p.line,'--border-strong':mix(p.line,p.ink,.3),
      '--text-1':p.ink,'--text-2':p.mut,'--text-muted':mix(p.mut,p.bg,.45),'--text-inverse':p.bg,
      '--accent':p.acc,'--accent-hover':mix(p.acc,p.ink,.22),'--accent-fg':readable(p.acc),'--focus':p.acc};
    (p.colors||[]).slice(0,6).forEach((c,i)=>{t['--data-'+(i+1)]=c});
    return t;
  },

  /* A theme that names a font has to fetch it, or the browser falls back to
     the generic family — and on iOS generic `cursive` is Snell Roundhand, a
     formal copperplate script. That is why Doodle read as a wedding
     invitation and Chalkboard read as the same thing: neither font was ever
     loaded. Injected once per family, and if it never arrives the stack falls
     back to the system sans rather than to anything decorative. */
  font(skin){
    if(!skin||!skin.font)return;
    const id='mb-font-'+skin.font.replace(/[^a-z0-9]/gi,'');
    if(document.getElementById(id))return;
    const l=document.createElement('link');
    l.id=id;l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family='+skin.font+'&display=swap';
    document.head.appendChild(l);
  },

  /* `pal` paints without saving — that is what makes live preview possible */
  apply(idOrSkin,pal){
    const s=typeof idOrSkin==='string'?this.get(idOrSkin):idOrSkin;
    this.font(s);
    const use=pal||(this.isCustomised(s.id)?this.paletteFor(s.id):null);
    const t=use?Object.assign(this.tokensFor(s),this.palTokens(use)):this.tokensFor(s),
      r=document.documentElement;
    Object.entries(t).forEach(([k,v])=>r.style.setProperty(k,v));
    r.dataset.skin=s.id;r.dataset.mode=s.mode;
    const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t['--bg'];
    this.current=s;
    try{localStorage.setItem(skinKey(),s.id);if(s.custom)this.saveCustom(s)}catch(e){}
    return s;
  },
  /* Name the app before restoring and the choice becomes that app's own.
     Falls back to the suite-wide key, so an existing choice carries over once. */
  for(appId){APP=appId||'';return this},
  restore(appId){
    if(appId)APP=appId;
    try{return this.apply(localStorage.getItem(skinKey())||localStorage.getItem(KEY)||this.data.skins[0].id)}
    catch(e){return this.apply(this.data.skins[0].id)}},
  check(base){return{accentOnBg:contrast(base.accent,base.bg),textOnPanel:contrast(base.text,base.panel),
    ok:contrast(base.accent,base.bg)>=3&&contrast(base.text,base.panel)>=4.5}},
  /* palettes for things CSS cannot reach: canvas share cards, spreadsheet fills */
  exportFor(skin){const t=this.tokensFor(skin);
    return{social:{bg:t['--bg'],panel:t['--surface-1'],accent:t['--accent'],text:t['--text-1']},
      sheets:[t['--bg'],t['--surface-2'],t['--accent'],t['--text-1']],
      ranks:Object.fromEntries(Object.entries(this.data.ranks||FALLBACK.ranks))}},
  /* Drop-in theme picker. Any app gets the full selector with one line:
       Skins.picker(document.getElementById('themes'));
     Renders every skin plus a custom option, handles the click, persists the
     choice, and repaints. No app writes its own picker. */
  picker(el,opts){
    if(!el)return;
    const o=opts||{},self=this;
    const draw=()=>{
      el.innerHTML=this.list().map(s=>{
        const t=this.tokensFor(s);
        this.font(s);                       /* so the chip is set in its own face */
        return `<button class="skin-chip${this.current&&this.current.id===s.id?' on':''}" data-skin-id="${s.id}"
          style="--sw-bg:${t['--bg']};--sw-panel:${t['--surface-1']};--sw-acc:${t['--accent']}">
          <span class="skin-dots"><i style="background:${t['--bg']}"></i><i style="background:${t['--surface-1']}"></i><i style="background:${t['--accent']}"></i></span>
          <span class="skin-name" style="font-family:${t['--font-display']}">${s.name}</span></button>`}).join('')
        +(o.custom===false?'':`<button class="skin-chip" data-skin-id="__custom"><span class="skin-dots">
          <i style="background:var(--surface-2)"></i><i style="background:var(--surface-3)"></i><i style="background:var(--accent)"></i></span>
          <span class="skin-name">Custom</span></button>`);
    };
    el.addEventListener('click',e=>{
      const b=e.target.closest('[data-skin-id]');if(!b)return;
      const id=b.dataset.skinId;
      if(id==='__custom'){if(o.onCustom)o.onCustom();return}
      self.apply(id);draw();if(o.onChange)o.onChange(self.current);
    });
    draw();return el;
  },
  /* Minimal styling for the picker, injected once, written only in tokens. */
  injectPickerCSS(){
    if(document.getElementById('skin-picker-css'))return;
    const st=document.createElement('style');st.id='skin-picker-css';
    /* A theme chip is a picture of a theme, so it shows the theme rather than
       describing it. Sized for a thumb, and pressable like everything else. */
    st.textContent=`.skin-chip{flex:0 0 86px;min-height:var(--tap,44px);padding:var(--s-2,8px);
      border:1px solid var(--border);border-radius:var(--radius-md,10px);
      background:var(--surface-1);text-align:center;cursor:pointer;
      transition:transform var(--dur-tap,90ms) var(--ease-out,ease),border-color var(--dur-fast,140ms)}
      .skin-chip:active{transform:scale(.96)}
      .skin-chip.on{border-color:var(--accent);box-shadow:var(--e-1)}
      .skin-dots{display:flex;gap:3px;justify-content:center;margin-bottom:var(--s-2,8px)}
      .skin-dots i{width:13px;height:13px;border-radius:3px;display:block}
      .skin-name{font-size:var(--f-1,12px);color:var(--text-2);display:block;line-height:1.2;
      font-family:var(--font-body)}
      @media (hover:hover) and (pointer:fine){.skin-chip:hover{border-color:var(--border-strong)}}`;
    document.head.appendChild(st);
  },
  util:{mix,contrast,readable,lum}
};
g.Skins=Skins;
})(typeof window!=='undefined'?window:globalThis);
