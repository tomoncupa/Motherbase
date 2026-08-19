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

/* The 30 semantic tokens. Add to this list only if a component genuinely
   cannot be built from what is already here. */
function tokens(base,cut,ranks,skin){
  const{bg,panel,accent,text}=base;
  const t={
    '--bg':bg,'--surface-1':panel,'--surface-2':mix(panel,text,.07),'--surface-3':mix(panel,text,.15),
    '--overlay':mix(bg,'#000000',.25),
    '--text-1':text,'--text-2':mix(text,bg,.32),'--text-muted':mix(text,bg,.56),'--text-inverse':bg,
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

  /* `pal` paints without saving — that is what makes live preview possible */
  apply(idOrSkin,pal){
    const s=typeof idOrSkin==='string'?this.get(idOrSkin):idOrSkin;
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
        return `<button class="skin-chip${this.current&&this.current.id===s.id?' on':''}" data-skin-id="${s.id}"
          style="--sw-bg:${t['--bg']};--sw-panel:${t['--surface-1']};--sw-acc:${t['--accent']}">
          <span class="skin-dots"><i style="background:${t['--bg']}"></i><i style="background:${t['--surface-1']}"></i><i style="background:${t['--accent']}"></i></span>
          <span class="skin-name">${s.name}</span></button>`}).join('')
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
    st.textContent=`.skin-chip{flex:0 0 84px;padding:9px;border:1px solid var(--border);
      border-radius:var(--radius-sm);background:var(--surface-1);text-align:center;cursor:pointer}
      .skin-chip.on{border-color:var(--accent)}
      .skin-dots{display:flex;gap:3px;justify-content:center;margin-bottom:6px}
      .skin-dots i{width:11px;height:11px;border-radius:2px;display:block}
      .skin-name{font-size:10.5px;color:var(--text-2);display:block;line-height:1.2;
      font-family:var(--font-body)}`;
    document.head.appendChild(st);
  },
  util:{mix,contrast,readable,lum}
};
g.Skins=Skins;
})(typeof window!=='undefined'?window:globalThis);
