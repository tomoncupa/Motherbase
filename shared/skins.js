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
/* ══════════ THE FACTORY THEMES, EMBEDDED ══════════
   This used to be one placeholder theme, and that was a real bug rather than a
   detail. skins.js FETCHES skins.json, and a page opened straight off the disk
   cannot fetch anything — the browser blocks it — so load() fell through to
   this list. Every app opened from a folder has offered exactly one theme
   called "Status Window" for as long as skins.json has existed, which is the
   whole library missing with no error to explain it.

   The themes live here now, so they are present before any network is
   involved. Over http skins.json still wins, so editing that file and
   reloading behaves exactly as before.

   GENERATED — do not hand-edit between the markers. Edit shared/skins.json and
   run `py -3 tools/embed-skins.py`. It is not a build step: nothing has to run
   for the suite to work, and _smoke.html fails if the two ever drift. */
/*SKINS-START*/const FALLBACK={"fields":[["bg","Canvas background"],["panel","Card fill"],["line","Card border"],["ink","Text"],["mut","Secondary text"],["acc","Accent — buttons, selection"]],"note":"Every app reads this file. A skin is the THEME layer: structure, fonts, corners, border weight, depth, motion, texture, its own CSS, and the default colours. The COLOUR layer sits on top and is edited in the app (Settings > Look > Colours), saved per skin in localStorage 'suite_palettes' - it never touches this file. Apps add no theme CSS of their own; a theme brings its own in `css` and the app never knows.","ranks":{"A":"#5FE39B","B":"#4FD8E8","C":"#6C8CFF","D":"#C79BF0","E":"#FF9F6B","F":"#FF6B6B","S":"#F2C14E"},"rev":12,"schema":1,"skins":[{"base":{"accent":"#6EE7FF","bg":"#0B0E14","panel":"#121826","text":"#FFFFFF"},"icon":{"cap":"round","join":"round","weight":1.75},"id":"ice","mode":"dark","name":"Ice","overrides":{"--border":"#22304A","--surface-2":"#0E1420","--text-2":"#E2E2E3","--text-muted":"#ACADAF"},"ramp":["#6EE7FF","#A78BFA","#FBBF24","#FB7185","#34D399","#94A3B8"],"texture":{"image":"radial-gradient(ellipse at 50% 40%,rgba(110,231,255,.05),transparent 60%)","size":"100% 100%"}},{"base":{"accent":"#4DD8FF","bg":"#05070D","panel":"#0B1220","text":"#FFFFFF"},"font":"Orbitron:wght@500;700","icon":{"cap":"square","join":"miter","weight":1.6},"id":"rpg","mode":"dark","name":"RPG","overrides":{"--border":"#1E3A5C","--surface-2":"#070D18","--text-2":"#E1E1E2","--text-muted":"#AAABAD"},"ramp":["#4DD8FF","#8F7BFF","#FFC24D","#FF6B8A","#3FE0A8","#8B97AF"],"texture":{"cut":"3px","display":"'Orbitron',system-ui,-apple-system,sans-serif","glow":true,"grid":"rgba(77,216,255,.035)","image":"radial-gradient(ellipse at 50% 40%,rgba(77,216,255,.06),transparent 60%),linear-gradient(rgba(77,216,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(77,216,255,.035) 1px,transparent 1px)","size":"100% 100%,44px 44px,44px 44px"}},{"base":{"accent":"#F7F3E8","bg":"#1B2B23","panel":"#22352C","text":"#F2EFE4"},"font":"Gloria+Hallelujah","icon":{"cap":"round","join":"round","weight":2.2,"wobble":true},"id":"chalkboard","mode":"dark","name":"Chalkboard","overrides":{"--border":"#3A5245","--surface-2":"#16261F","--text-2":"#D8D7CD","--text-muted":"#A9ACA2"},"ramp":["#F7F3E8","#FFD9A0","#A8D8F0","#F0A8B8","#B8E0A8","#D0C8F0"],"texture":{"body":"'Gloria Hallelujah',system-ui,-apple-system,sans-serif","cut":"0px","display":"'Gloria Hallelujah',system-ui,-apple-system,sans-serif","dots":"rgba(255,255,255,.02)","image":"radial-gradient(rgba(255,255,255,.02) 1px,transparent 1.5px)","size":"7px 7px"}},{"base":{"accent":"#7FD4FF","bg":"#0A2540","panel":"#10304F","text":"#DCEBFF"},"font":"IBM+Plex+Mono:wght@400;600","icon":{"cap":"butt","join":"miter","weight":1.25},"id":"blueprint","mode":"dark","name":"Blueprint","overrides":{"--border":"#2A5A8C","--surface-2":"#0C2A47","--text-2":"#C3D3E8","--text-muted":"#95A8BE"},"ramp":["#E8F4FF","#7FD4FF","#B3E5FF","#9FC5E8","#D0E8FF","#86A8C8"],"texture":{"body":"'IBM Plex Mono',system-ui,-apple-system,sans-serif","cut":"2px","display":"'IBM Plex Mono',system-ui,-apple-system,sans-serif","grid":"rgba(127,212,255,.09)","image":"linear-gradient(rgba(127,212,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(127,212,255,.09) 1px,transparent 1px),linear-gradient(rgba(127,212,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(127,212,255,.045) 1px,transparent 1px)","size":"120px 120px,120px 120px,24px 24px,24px 24px"}},{"base":{"accent":"#3A4A9F","bg":"#F5F1E8","panel":"#FFFFFF","text":"#2B2A26"},"font":"Architects+Daughter","icon":{"cap":"round","join":"round","weight":1.9,"wobble":true},"id":"sketch","mode":"light","name":"Sketch","overrides":{"--border":"#C9C0B0","--surface-2":"#EFEAE0","--text-2":"#43423D","--text-muted":"#706E68"},"ramp":["#3A4A9F","#8F3B3B","#3F7A4E","#8A6D2F","#5B4A8A","#66655F"],"texture":{"body":"'Architects Daughter',system-ui,-apple-system,sans-serif","cut":"0px","display":"'Architects Daughter',system-ui,-apple-system,sans-serif","image":"none","size":"auto"}},{"base":{"accent":"#F4F1EA","bg":"#12151B","panel":"#181C24","text":"#F4F1EA"},"font":"Patrick+Hand","icon":{"cap":"round","join":"round","weight":2.3,"wobble":true},"id":"doodle","mode":"dark","name":"Doodle","overrides":{"--border":"#39414F","--surface-2":"#12151B","--text-2":"#D9D7D1","--text-muted":"#A7A6A4"},"ramp":["#F4F1EA","#FFD9A0","#9FD8F2","#F5A8B8","#B4E4A6","#CBC2F0"],"texture":{"body":"'Patrick Hand',system-ui,-apple-system,sans-serif","cut":"14px","display":"'Patrick Hand',system-ui,-apple-system,sans-serif","image":"none","size":"auto"}},{"base":{"accent":"#2A5C99","bg":"#CFDDEB","panel":"#FFFFFF","text":"#1C2128"},"css":"/* RAGNAROK - the 2002 client.\n\n   WHITE ON WHITE. The window, the rows, the slots and the buttons are all\n   white, separated by thin blue-grey hairlines rather than by tinted bands.\n   That is what makes the client look like a spreadsheet someone made pretty\n   rather than a game menu.\n\n   THE BLUE GRADIENT IS ONLY AT THE TOP. One strip, across the title bar, and\n   nowhere else. Blue appears again only on numbers, on the marker beside the\n   live row, and on a selected button.\n\n   THE FONT is small bold Arial. Not a bitmap face: the client renders normal\n   type small and heavy, which is why it stays crisp and readable at eleven\n   pixels. Arimo matches Arial's metrics and falls back to Arial itself, so\n   this theme's type is right even with no network. */\n\nbody { letter-spacing: var(--track-body) }\n\n/* ---- the one piece of blue ---- */\nheader {\n  background: linear-gradient(180deg, #7FA6CE 0%, #4E7FB4 48%, #3C6DA4 100%);\n  color: #FFFFFF;\n  border-bottom: var(--border-width) solid #2A5C99;\n}\nheader .logo {\n  font-family: var(--font-display);\n  font-weight: var(--w-bold);\n  font-size: var(--f-3);\n  color: #FFFFFF;\n  letter-spacing: var(--track-cap);\n}\nheader .logo b { color: #CFE2F5 }\nheader .mb-btn {\n  background: #FFFFFF; color: var(--text-1);\n  border: var(--border-width) solid #2A5C99;\n}\n\n/* ---- everything below is white ---- */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: #FFFFFF;\n  border: var(--border-width) solid var(--border);\n  box-shadow: none;\n}\n.mb-sheet-head {\n  background: linear-gradient(180deg, #7FA6CE, #3C6DA4);\n  color: #FFFFFF;\n  font-family: var(--font-display); font-weight: var(--w-bold);\n  border-bottom: var(--border-width) solid #2A5C99;\n}\n.mb-sheet-head .mb-grab { background: rgba(255,255,255,.7) }\n\n/* A section heading is dark text on white over a hairline. No band, no fill. */\nh2 {\n  background: none;\n  border: 0;\n  border-bottom: var(--border-width) solid var(--border);\n  box-shadow: none;\n  font-family: var(--font-display);\n  font-weight: var(--w-bold);\n  color: var(--accent);\n  padding-bottom: var(--s-2);\n}\n\n/* A row is white with a hairline, and the only mark on it is the blue arrow. */\n.item {\n  background: #FFFFFF;\n  border: var(--border-width) solid var(--border);\n  box-shadow: none;\n}\n.item .nm { font-family: var(--font-body); color: var(--text-1) }\n.item.on .nm { color: var(--text-muted) }\n.item::before {\n  content: ''; width: 0; height: 0; flex: 0 0 auto; margin-right: -4px;\n  border-left: 6px solid transparent;\n  border-top: 4px solid transparent; border-bottom: 4px solid transparent;\n}\n.item.on::before { border-left-color: var(--accent) }\n\n.mb-input, .mb-sel, .mb-range {\n  background: #FFFFFF; color: var(--text-1);\n  border: var(--border-width) solid var(--border);\n  box-shadow: none; font-family: var(--font-body);\n}\n\n/* Buttons: white, hairline, and they invert to blue when they are on. */\nbutton.mb-btn, .mb-act, button.chk, .mb-chip, .mb-x, .mb-opt, #fab {\n  font-family: var(--font-display);\n  font-weight: var(--w-bold);\n  letter-spacing: var(--track-cap);\n  background: #FFFFFF;\n  color: var(--text-1);\n  border: var(--border-width) solid var(--border-strong);\n  border-radius: 0;\n  box-shadow: none;\n  transition: none;\n}\nbutton.mb-btn:active, .mb-act:active, button.chk:active,\n.mb-chip:active, .mb-x:active, #fab:active {\n  background: var(--accent); color: #FFFFFF;\n}\nbutton.chk.on { background: var(--accent); color: #FFFFFF; border-color: #2A5C99 }\n\n/* The numbers are bold and blue on white, exactly as the stat panel is. */\n.stat {\n  background: #FFFFFF;\n  border: var(--border-width) solid var(--border);\n  box-shadow: none;\n}\n.stat b { font-family: var(--font-display); font-weight: var(--w-bold);\n  color: var(--accent) }\n.stat span { font-family: var(--font-body); color: var(--text-muted) }\n\n#fab { color: var(--accent); font-size: var(--f-5); border-color: #2A5C99 }\n.mb-opt:hover, .mb-chip.on { background: var(--accent); color: #FFFFFF }","depth":"flat","font":"Arimo:wght@400;700","icon":{"cap":"butt","join":"miter","weight":1.6},"id":"ragnarok","mode":"light","motion":{"ease":"linear","fast":"60ms","med":"100ms","sheet":"180ms","slow":"160ms","tap":"0ms"},"name":"Ragnarok","overrides":{"--border":"#9FB6CC","--border-strong":"#5B7794","--surface-2":"#FFFFFF","--surface-3":"#FFFFFF","--text-2":"#28303A","--text-muted":"#5F6C7A"},"ramp":["#2A5C99","#A83B2B","#3B7A4C","#B08A26","#6A4E92","#5F6C7A"],"texture":{"body":"'Arimo',Arial,Helvetica,sans-serif","cut":"0px","display":"'Arimo',Arial,Helvetica,sans-serif","image":"none","size":"auto"},"track":{"body":"0","cap":".02em","tight":"0"},"weight":1},{"base":{"accent":"#7FE3FF","bg":"#050912","panel":"#0B1524","text":"#EAF6FF"},"css":"/* SYSTEM - a levelling-up status window. Light comes OFF the surfaces instead\n   of falling onto them, every frame is a hairline, and the corners are cut\n   with brackets rather than rounded. */\n\nbody { letter-spacing: var(--track-body) }\n\nheader {\n  background: transparent;\n  border-bottom: var(--border-width) solid var(--border);\n  box-shadow: 0 1px 0 rgba(127,227,255,.10);\n}\nheader .logo {\n  font-family: var(--font-display);\n  color: var(--text-1);\n  text-shadow: 0 0 14px var(--accent);\n}\nheader .logo b { color: var(--accent); text-shadow: 0 0 18px var(--accent) }\n\n/* A panel is a pane of lit glass, not a solid card. */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  position: relative;\n  background: linear-gradient(180deg, rgba(127,227,255,.05), rgba(127,227,255,.012));\n  border: var(--border-width) solid var(--border);\n  box-shadow: var(--e-1);\n}\n/* Bracket corners. Two pseudo-elements on opposite corners, no new markup. */\n.card::before, .card::after {\n  content: ''; position: absolute; width: 15px; height: 15px;\n  border: 2px solid var(--accent); pointer-events: none;\n}\n.card::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0 }\n.card::after { bottom: -1px; right: -1px; border-left: 0; border-top: 0 }\n\nh2 {\n  font-family: var(--font-display);\n  color: var(--accent);\n  text-shadow: 0 0 12px var(--accent);\n  border-bottom: var(--border-width) solid var(--border);\n  padding-bottom: var(--s-2);\n}\n\n/* A row is a ruled line in a readout, not a filled pill. */\n.item { background: transparent; border-bottom: var(--border-width) solid var(--border) }\n.item.on .nm { color: var(--text-muted) }\n\n.chk { border-radius: 2px; border-color: var(--border-strong) }\n.chk.on { box-shadow: var(--e-2); border-color: var(--accent) }\n\n/* The numbers are the whole point of a status window, so they glow. */\n.stat { background: transparent; border: var(--border-width) solid var(--border) }\n.stat b { color: var(--text-1); text-shadow: 0 0 16px var(--accent) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display);\n  letter-spacing: var(--track-cap);\n  background: transparent;\n  color: var(--accent);\n  border: var(--border-width) solid var(--border-strong);\n}\nbutton.mb-btn:active, .mb-act:active { background: var(--accent); color: var(--accent-fg) }\n.mb-btn.go { background: var(--accent); color: var(--accent-fg); box-shadow: var(--e-2) }\n\n.mb-input, .mb-sel { background: rgba(127,227,255,.05); border-color: var(--border) }\n#fab { box-shadow: var(--e-3); border: var(--border-width) solid var(--accent) }","depth":"glow","font":"Rajdhani:wght@500;600;700","icon":{"cap":"round","join":"round","weight":1.4},"id":"system","mode":"dark","motion":{"ease":"cubic-bezier(.2,0,0,1)","fast":"90ms","med":"150ms","sheet":"260ms","slow":"240ms","tap":"0ms"},"name":"System","overrides":{"--border":"#1F4C6E","--border-strong":"#3A7FA8","--surface-2":"#0E1B2E","--surface-3":"#16293F","--text-2":"#CFE7F5","--text-muted":"#7C9BB2"},"ramp":["#7FE3FF","#6C8CFF","#C79BF0","#F2C14E","#5FE39B","#8B97AF"],"texture":{"cut":"2px","display":"'Rajdhani',system-ui,-apple-system,sans-serif","image":"radial-gradient(ellipse at 50% 28%,rgba(127,227,255,.11),transparent 62%),linear-gradient(rgba(127,227,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(127,227,255,.025) 1px,transparent 1px)","size":"100% 100%,40px 40px,40px 40px"},"track":{"body":".01em","cap":".22em","tight":"0"},"weight":1},{"base":{"accent":"#E8B33C","bg":"#000000","panel":"#000000","text":"#F2CE6A"},"css":"/* MONARCH - black and gold. Nothing floats and almost nothing is filled: the\n   whole design is hairlines, capitals and empty space. */\n\nbody { letter-spacing: var(--track-body) }\n\nheader { background: var(--bg); border-bottom: var(--border-width) solid var(--accent) }\nheader .logo { font-family: var(--font-display); color: var(--accent) }\nheader .logo b { color: var(--text-2) }\n\n/* A card is a ruled box with a second line just inside it. */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: var(--bg);\n  border: var(--border-width) solid var(--accent);\n  box-shadow: inset 0 0 0 3px var(--bg), inset 0 0 0 4px var(--border);\n}\n\nh2 {\n  font-family: var(--font-display);\n  color: var(--accent);\n  border-bottom: var(--border-width) solid var(--border);\n  padding-bottom: var(--s-2);\n}\n\n.item { background: transparent; border-bottom: var(--border-width) solid var(--border) }\n.item.on .nm { color: var(--text-muted) }\n\n.chk { border-radius: 0; border-color: var(--accent) }\n.chk.on { background: var(--accent); color: var(--accent-fg) }\n\n.stat { background: transparent; border: var(--border-width) solid var(--border) }\n.stat b { font-family: var(--font-display); color: var(--accent) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display);\n  letter-spacing: var(--track-cap);\n  background: transparent;\n  color: var(--accent);\n  border: var(--border-width) solid var(--accent);\n  border-radius: 0;\n}\nbutton.mb-btn:active, .mb-act:active, .mb-chip:active,\n.mb-btn.go { background: var(--accent); color: var(--accent-fg) }\n\n.mb-input, .mb-sel { background: transparent; border-color: var(--border);\n  border-radius: 0; color: var(--text-1) }\n#fab { border-radius: 0; background: var(--accent); color: var(--accent-fg);\n  font-family: var(--font-display) }","depth":"flat","font":"Oswald:wght@400;600","icon":{"cap":"butt","join":"miter","weight":1.2},"id":"monarch","mode":"dark","motion":{"ease":"linear","fast":"80ms","med":"140ms","sheet":"240ms","slow":"220ms","tap":"0ms"},"name":"Monarch","overrides":{"--border":"#6E5416","--border-strong":"#E8B33C","--surface-2":"#0C0A05","--surface-3":"#161009","--text-2":"#DFB44E","--text-muted":"#907229"},"ramp":["#E8B33C","#F2CE6A","#C08A22","#8A6416","#F0DFA0","#6E5416"],"texture":{"cut":"0px","display":"'Oswald',system-ui,-apple-system,sans-serif","image":"none","size":"auto"},"track":{"body":".02em","cap":".18em","tight":"0"},"weight":1},{"base":{"accent":"#C9A227","bg":"#3F4447","panel":"#55595C","text":"#F4EFE2"},"css":"/* ORNATE - a grey plate in a gold frame, with a diamond on every rule. The\n   flourishes are pseudo-elements on things that already exist, so no app grows\n   a single new element. */\n\nbody { letter-spacing: var(--track-body) }\n\nheader { background: var(--surface-1); border-bottom: var(--border-width) solid var(--accent) }\nheader .logo { font-family: var(--font-display); color: var(--accent) }\nheader .logo b { color: var(--text-1) }\n\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  position: relative;\n  background: var(--surface-1);\n  border: var(--border-width) solid var(--accent);\n  box-shadow: inset 0 0 0 4px var(--surface-1), inset 0 0 0 5px var(--border);\n}\n/* Gold corner flourishes on opposite corners, drawn rather than fetched. */\n.card::before, .card::after {\n  content: ''; position: absolute; width: 16px; height: 16px;\n  border: 2px solid var(--accent); pointer-events: none;\n}\n.card::before { top: 5px; left: 5px; border-right: 0; border-bottom: 0 }\n.card::after { bottom: 5px; right: 5px; border-left: 0; border-top: 0 }\n\n/* A heading is centred and ruled, and the rule is broken by a diamond. */\nh2 {\n  position: relative;\n  font-family: var(--font-display);\n  text-align: center;\n  color: var(--accent);\n  border-bottom: var(--border-width) solid var(--border);\n  padding-bottom: var(--s-2);\n}\nh2::after {\n  content: '\\25C6';\n  position: absolute; left: 50%; bottom: -7px; transform: translateX(-50%);\n  background: var(--surface-1);\n  color: var(--accent); font-size: 10px; line-height: 1;\n}\n\n.item { background: transparent; border-bottom: var(--border-width) solid var(--border) }\n.item.on .nm { color: var(--text-muted) }\n\n.chk { border-radius: 0; border-color: var(--accent) }\n.chk.on { background: var(--accent); color: var(--accent-fg) }\n\n.stat { background: transparent; border: var(--border-width) solid var(--border) }\n.stat b { font-family: var(--font-display); color: var(--accent) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display);\n  letter-spacing: var(--track-cap);\n  background: transparent;\n  color: var(--accent);\n  border: var(--border-width) solid var(--accent);\n  border-radius: 0;\n}\nbutton.mb-btn:active, .mb-act:active, .mb-btn.go {\n  background: var(--accent); color: var(--accent-fg);\n}\n.mb-input, .mb-sel { background: var(--surface-2); border-color: var(--border); border-radius: 0 }\n#fab { border-radius: 0; background: var(--accent); color: var(--accent-fg);\n  border: 2px solid var(--border-strong); font-family: var(--font-display) }","depth":"flat","font":"Cinzel:wght@400;600;700","icon":{"cap":"butt","join":"miter","weight":1.2},"id":"ornate","mode":"dark","motion":{"ease":"cubic-bezier(.2,0,0,1)","fast":"120ms","med":"200ms","sheet":"320ms","slow":"300ms","tap":"0ms"},"name":"Ornate","overrides":{"--border":"#8A7B3F","--border-strong":"#C9A227","--surface-2":"#4B5053","--surface-3":"#63686B","--text-2":"#E7E0CE","--text-muted":"#B3AC9A"},"ramp":["#C9A227","#E0C56A","#A8842A","#F4EFE2","#8A7B3F","#B3AC9A"],"texture":{"cut":"0px","display":"'Cinzel',Georgia,serif","image":"radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.045),transparent 60%)","size":"100% 100%"},"track":{"body":".01em","cap":".16em","tight":"0"},"weight":1},{"base":{"accent":"#8FD0F5","bg":"#0A3D75","panel":"#0F4C8F","text":"#FFFFFF"},"css":"/* DECK - a presentation slide. A deep blue gradient, hairline rules, generous\n   capitals, and rows that band the way a table on a slide does. */\n\nbody { letter-spacing: var(--track-body) }\n\nheader { background: transparent; border-bottom: var(--border-width) solid var(--border) }\nheader .logo { font-family: var(--font-display); color: var(--text-1) }\nheader .logo b { color: var(--accent) }\n\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: rgba(255,255,255,.055);\n  border: var(--border-width) solid var(--border);\n}\n\nh2 {\n  font-family: var(--font-display);\n  color: var(--text-1);\n  border-bottom: var(--border-width) solid var(--border);\n  padding-bottom: var(--s-2);\n}\n\n/* Banded rows. It has to work whether or not the row is wrapped for the swipe\n   gesture, so both shapes are named. */\n.item, .list > *:nth-child(odd) .item { background: rgba(255,255,255,.05) }\n.list > *:nth-child(even) .item, .item:nth-child(even) { background: rgba(255,255,255,.10) }\n.item.on .nm { color: var(--text-muted) }\n\n.chk { border-color: var(--border-strong) }\n.chk.on { background: var(--accent); color: var(--accent-fg); border-color: var(--accent) }\n\n.stat { background: rgba(255,255,255,.07); border: var(--border-width) solid var(--border) }\n.stat b { font-family: var(--font-display); color: var(--text-1) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display);\n  letter-spacing: var(--track-cap);\n  background: transparent;\n  color: var(--text-1);\n  border: var(--border-width) solid var(--border-strong);\n}\nbutton.mb-btn:active, .mb-act:active { background: rgba(255,255,255,.16) }\n.mb-btn.go { background: var(--accent); color: var(--accent-fg); border-color: var(--accent) }\n\n.mb-input, .mb-sel { background: rgba(255,255,255,.09); border-color: var(--border);\n  color: var(--text-1) }\n#fab { background: var(--accent); color: var(--accent-fg) }","depth":"flat","font":"Archivo:wght@400;500;700","icon":{"cap":"round","join":"round","weight":1.6},"id":"deck","mode":"dark","motion":{"ease":"cubic-bezier(.2,0,0,1)","fast":"140ms","med":"240ms","sheet":"380ms","slow":"360ms","tap":"0ms"},"name":"Deck","overrides":{"--border":"#3D80BC","--border-strong":"#8FD0F5","--surface-2":"#0D4784","--surface-3":"#1660A8","--text-2":"#DDEBF9","--text-muted":"#A6C6E2"},"ramp":["#8FD0F5","#FFFFFF","#4FA3DC","#C9E4F7","#2C6FA8","#A6C6E2"],"texture":{"cut":"3px","display":"'Archivo',system-ui,-apple-system,sans-serif","image":"radial-gradient(ellipse at 50% 12%,rgba(143,208,245,.20),transparent 58%),linear-gradient(160deg,rgba(255,255,255,.07),rgba(0,0,0,.20))","size":"100% 100%,100% 100%"},"track":{"body":"0","cap":".14em","tight":"0"},"weight":1},{"base":{"accent":"#F25C05","bg":"#141414","panel":"#1F1F1F","text":"#F5F5F5"},"css":"/* BLOCKS - everything is a solid rectangle of colour. No rounding, no shadow,\n   no gradient: separation comes from the blocks butting up against each other,\n   the way a tiled interface does. */\nbody { letter-spacing: var(--track-body) }\n\nheader { background: var(--accent); color: var(--accent-fg) }\nheader .logo { font-family: var(--font-display); color: var(--accent-fg) }\nheader .logo b { color: var(--accent-fg); opacity: .6 }\nheader .mb-btn { background: rgba(0,0,0,.22); color: var(--accent-fg); border: 0 }\n\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: var(--surface-1); border: 0; border-left: 6px solid var(--accent);\n}\nh2 { font-family: var(--font-display); color: var(--text-1) }\n\n/* Rows are stacked blocks with a hairline of page showing between them. */\n.item { background: var(--surface-2); border: 0 }\n.item.on { background: var(--surface-3) }\n.chk { border-radius: 0; border-width: 3px }\n.chk.on { background: var(--accent); border-color: var(--accent); color: var(--accent-fg) }\n\n.stat { background: var(--surface-2); border: 0 }\n.stat b { font-family: var(--font-display) }\n.bars i { border-radius: 0 }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display); letter-spacing: var(--track-cap);\n  background: var(--surface-3); color: var(--text-1); border: 0; border-radius: 0;\n}\n.mb-btn.go { background: var(--accent); color: var(--accent-fg) }\n.mb-input, .mb-sel { background: var(--surface-2); border: 0; border-radius: 0;\n  border-bottom: 3px solid var(--accent) }\n#fab { border-radius: 0; background: var(--accent); color: var(--accent-fg) }","depth":"flat","font":"Bungee","icon":{"cap":"butt","join":"miter","weight":2.4},"id":"blocks","mode":"dark","motion":{"ease":"cubic-bezier(.2,0,0,1)","fast":"80ms","med":"130ms","sheet":"220ms","slow":"200ms","tap":"0ms"},"name":"Blocks","overrides":{"--border":"#3D3D3D","--border-strong":"#5A5A5A","--surface-2":"#2A2A2A","--surface-3":"#363636","--text-2":"#E0E0E0","--text-muted":"#9A9A9A"},"ramp":["#F25C05","#0582CA","#F2B705","#04A777","#D62246","#8C8C8C"],"texture":{"cut":"0px","display":"'Bungee',system-ui,-apple-system,sans-serif","image":"none","size":"auto"},"track":{"body":"0","cap":".12em","tight":"-.02em"},"weight":0},{"base":{"accent":"#F5A623","bg":"#C2C6C9","panel":"#D01012","text":"#FFFFFF"},"css":"/* LEGO - seen from the side, the way bricks look on a shelf rather than on a\n   baseplate. Each surface is a brick: a solid body with a lit top edge and a\n   dark seam underneath, and a row of studs poking UP off its top edge in its\n   own colour.\n\n   The studs sit on a pseudo-element placed above the element, so they occupy\n   the gap that already exists between rows rather than adding any. A theme\n   does not get to move things. */\n\nbody { letter-spacing: var(--track-body) }\n\n/* ---- the brick body ---- */\nheader, .card, .item, .stat, button.mb-btn, .mb-act, .mb-chip, #fab,\n.mb-sheet, .mb-menu, .mb-toast {\n  position: relative;\n  border: 0;\n  box-shadow:\n    inset 0 3px 0 rgba(255,255,255,.34),      /* light along the top face */\n    inset 0 -5px 0 rgba(0,0,0,.26),           /* the seam underneath */\n    inset 3px 0 0 rgba(255,255,255,.12),\n    inset -3px 0 0 rgba(0,0,0,.14);\n}\n\n/* ---- the studs, off the top edge ---- */\nheader::before, .card::before, .item::before, .stat::before,\nbutton.mb-btn::before, .mb-act::before, #fab::before {\n  content: ''; position: absolute; left: 6px; right: 6px; top: -7px; height: 8px;\n  background-repeat: repeat-x; background-position: 0 0;\n  pointer-events: none;\n}\nheader::before { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#D01012 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%); background-size: 24px 8px }\n.card::before  { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#D01012 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%); background-size: 24px 8px; opacity: 0 }\n.item::before  { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#0055BF 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%); background-size: 24px 8px }\n.stat::before  { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#F2C400 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%); background-size: 24px 8px }\nbutton.mb-btn::before, .mb-act::before { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#F2C400 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%);\n  background-size: 24px 8px }\n#fab::before { background-image: radial-gradient(ellipse 8px 7px at 12px 8px,rgba(0,0,0,.28) 0 99%,transparent 100%),radial-gradient(ellipse 7px 6px at 12px 7px,#F5A623 0 99%,transparent 100%),radial-gradient(ellipse 5px 3px at 11px 5px,rgba(255,255,255,.45) 0 99%,transparent 100%); background-size: 24px 8px }\n\n/* ---- which brick is which colour ---- */\n/* --panel is not a token: the four base colours become --bg, --surface-1,\n   --accent and --text-1. Naming the wrong one silently paints nothing. */\nheader { background: var(--surface-1); color: #FFFFFF }\nheader .logo { font-family: var(--font-display); color: #FFFFFF;\n  text-shadow: 0 2px 0 rgba(0,0,0,.3) }\nheader .logo b { color: #F2C400 }\n\n/* The card is the shelf the bricks stand on: light grey, no studs of its own,\n   or every brick would be sitting in a field of dots. */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: #E4E6E7; color: var(--text-1);\n  box-shadow: inset 0 3px 0 rgba(255,255,255,.7), inset 0 -5px 0 rgba(0,0,0,.14);\n}\nh2 { font-family: var(--font-display); color: #26292C }\n\n.item { background: var(--surface-2); color: #FFFFFF }\n.item .nm { color: #FFFFFF; text-shadow: 0 1px 0 rgba(0,0,0,.35) }\n.item.on { background: #237841 }\n.item.on .nm { opacity: .72 }\n\n.chk { border: 3px solid rgba(0,0,0,.3); background: #FFFFFF; color: transparent }\n.chk.on { background: #F2C400; border-color: rgba(0,0,0,.35); color: #1B1B1B }\n\n.stat { background: var(--surface-3); color: #1B1B1B }\n.stat b { font-family: var(--font-display); color: #1B1B1B }\n.stat span { color: #4A4A4A }\n.bars i { box-shadow: inset 0 3px 0 rgba(255,255,255,.3), inset 0 -4px 0 rgba(0,0,0,.22) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display); letter-spacing: var(--track-cap);\n  background: var(--surface-3); color: #1B1B1B;\n}\nbutton.mb-btn:active, .mb-act:active {\n  box-shadow: inset 0 4px 0 rgba(0,0,0,.24), inset 0 -2px 0 rgba(255,255,255,.2);\n  transform: translateY(2px);\n}\n.mb-btn.go { background: #237841; color: #FFFFFF }\n.mb-input, .mb-sel { background: #FFFFFF; color: #1B1B1B; border: 0;\n  box-shadow: inset 0 3px 0 rgba(0,0,0,.16) }\n#fab { background: var(--accent); color: #1B1B1B }","depth":"flat","font":"Fredoka:wght@500;600","icon":{"cap":"round","join":"round","weight":2.6},"id":"lego","mode":"light","motion":{"ease":"cubic-bezier(.34,1.56,.64,1)","fast":"90ms","med":"150ms","sheet":"250ms","slow":"230ms","tap":"0ms"},"name":"Lego","overrides":{"--border":"#8A8F93","--border-strong":"#3E4245","--surface-2":"#0055BF","--surface-3":"#F2C400","--text-2":"#FFFFFF","--text-muted":"#E4E4E4"},"ramp":["#D01012","#0055BF","#F2C400","#237841","#FF8C01","#8A8F93"],"texture":{"cut":"7px","display":"'Fredoka',system-ui,-apple-system,sans-serif","image":"linear-gradient(180deg,rgba(255,255,255,.16),rgba(0,0,0,.08))","size":"100% 100%"},"track":{"body":"0","cap":".08em","tight":"0"},"weight":0},{"base":{"accent":"#5D9C3E","bg":"#3E2F22","panel":"#6E6E6E","text":"#FFFFFF"},"css":"/* MINECRAFT - built out of blocks, and readable.\n\n   The blocks were right the first time and the reading was not: full-strength\n   texture noise sat directly behind the text, and cream on an orange plank is\n   not a contrast anybody wins. The textures are half as strong, the panels are\n   darker, and every piece of text is white with a hard one-pixel shadow, which\n   is what the game itself does and why its text stays readable over anything. */\n\nbody { image-rendering: pixelated; letter-spacing: var(--track-body) }\n\n/* Grass over dirt. */\nheader {\n  position: relative;\n  background-color: #5A4130;\n  background-image: repeating-linear-gradient(0deg,rgba(0,0,0,.09) 0 4px,rgba(255,255,255,.03) 4px 8px),repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 4px,rgba(255,255,255,.025) 4px 8px);\n  background-size: 8px 8px, 8px 8px;\n  border-bottom: 3px solid rgba(0,0,0,.5);\n  color: #FFFFFF;\n}\nheader::before {\n  content: ''; position: absolute; left: 0; right: 0; top: 0; height: 10px;\n  background-color: #5D9C3E;\n  background-image: repeating-linear-gradient(90deg,rgba(0,0,0,.14) 0 4px,rgba(255,255,255,.1) 4px 8px);\n  background-size: 8px 8px;\n  box-shadow: 0 3px 0 rgba(0,0,0,.22);\n  pointer-events: none;\n}\nheader .logo { font-family: var(--font-display); font-size: var(--f-2);\n  color: #FFFFFF; text-shadow: 2px 2px 0 #000000 }\nheader .logo b { color: #9BE85C }\n\n/* Stone, darkened so white text sits on it cleanly. */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background-color: #6E6E6E;\n  background-image: repeating-linear-gradient(0deg,rgba(0,0,0,.07) 0 4px,rgba(255,255,255,.035) 4px 8px),repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 4px,rgba(255,255,255,.03) 4px 8px);\n  background-size: 8px 8px, 8px 8px;\n  border: 3px solid #1F1F1F;\n  box-shadow: inset 2px 2px 0 rgba(255,255,255,.2), inset -2px -2px 0 rgba(0,0,0,.34);\n  color: #FFFFFF;\n}\nh2 { font-family: var(--font-display); font-size: var(--f-1); color: #FFFFFF;\n  text-shadow: 2px 2px 0 #000000 }\n\n/* Dirt slots. */\n.item, .mb-input, .mb-sel {\n  background-color: #4A3524;\n  background-image: repeating-linear-gradient(0deg,rgba(0,0,0,.09) 0 4px,rgba(255,255,255,.03) 4px 8px),repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 4px,rgba(255,255,255,.025) 4px 8px);\n  background-size: 8px 8px, 8px 8px;\n  border: 2px solid #241A11;\n  box-shadow: inset 2px 2px 0 rgba(0,0,0,.3), inset -2px -2px 0 rgba(255,255,255,.12);\n  color: #FFFFFF;\n}\n.item .nm { color: #FFFFFF; text-shadow: 1px 1px 0 #000000 }\n.item.on .nm { color: #BFBFBF }\n\n.chk { border-radius: 0; border-width: 3px; border-color: #1F1F1F;\n  background: rgba(0,0,0,.25) }\n.chk.on { background: #5D9C3E; border-color: #1F1F1F; color: #FFFFFF }\n\n/* Planks, darkened, with white text over them. */\n.stat, button.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt, #fab {\n  background-color: #6E4F27;\n  background-image: repeating-linear-gradient(0deg,rgba(0,0,0,.10) 0 6px,rgba(255,255,255,.04) 6px 12px);\n  background-size: 12px 12px;\n  border: 2px solid #241A11; border-radius: 0;\n  color: #FFFFFF;\n  box-shadow: inset 2px 2px 0 rgba(255,255,255,.16), inset -2px -2px 0 rgba(0,0,0,.34);\n  font-family: var(--font-display); font-size: var(--f-1); letter-spacing: 0;\n  text-shadow: 1px 1px 0 #000000;\n  transition: none;\n}\nbutton.mb-btn:active, .mb-act:active, #fab:active {\n  box-shadow: inset 2px 2px 0 rgba(0,0,0,.34), inset -2px -2px 0 rgba(255,255,255,.14);\n}\n.stat b { font-family: var(--font-display); font-size: var(--f-3); color: #FFFFFF;\n  text-shadow: 2px 2px 0 #000000 }\n.stat span { color: #E4E4E4; text-shadow: 1px 1px 0 #000000 }\n#fab { background-color: #5D9C3E; background-image: none; font-size: var(--f-4) }\n.bars i { border-radius: 0; box-shadow: inset -2px -2px 0 rgba(0,0,0,.32) }","depth":"flat","font":"Press+Start+2P","icon":{"cap":"butt","join":"miter","weight":2.8},"iconPack":"pixel","id":"minecraft","mode":"dark","motion":{"ease":"linear","fast":"0ms","med":"0ms","sheet":"100ms","slow":"0ms","tap":"0ms"},"name":"Minecraft","overrides":{"--border":"#2A1E14","--border-strong":"#1F1F1F","--surface-2":"#4A3524","--surface-3":"#6E4F27","--text-2":"#F2F2F2","--text-muted":"#C8C8C8"},"ramp":["#5D9C3E","#A0763F","#8A8A8A","#B02E26","#3AB3DA","#F9C22E"],"texture":{"cut":"0px","display":"'Press Start 2P',system-ui,-apple-system,sans-serif","image":"repeating-linear-gradient(0deg,rgba(0,0,0,.09) 0 4px,rgba(255,255,255,.03) 4px 8px),repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 4px,rgba(255,255,255,.025) 4px 8px)","size":"8px 8px,8px 8px"},"track":{"body":"0","cap":"0","tight":"0"},"weight":3},{"base":{"accent":"#4C7F2E","bg":"#3A3A3A","panel":"#C6C6C6","text":"#252525"},"css":"/* MINECRAFT 2 - the inventory chrome only. the inventory screen. Light grey stone plates with a hard dark\n   outline, lit on the top-left and shaded on the bottom-right, and absolutely\n   nothing rounded or smoothed anywhere. */\nbody { image-rendering: pixelated; letter-spacing: var(--track-body) }\n\nheader {\n  background: var(--surface-2);\n  border-bottom: 3px solid var(--border-strong);\n  box-shadow: inset 2px 2px 0 rgba(255,255,255,.55);\n}\nheader .logo { font-family: var(--font-display); font-size: var(--f-2);\n  color: var(--text-1); text-shadow: 2px 2px 0 rgba(0,0,0,.28) }\nheader .logo b { color: var(--accent) }\n\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: var(--surface-1);\n  border: 3px solid var(--border-strong);\n  box-shadow: inset 2px 2px 0 rgba(255,255,255,.6), inset -2px -2px 0 rgba(0,0,0,.28);\n}\nh2 { font-family: var(--font-display); font-size: var(--f-2); color: var(--text-1);\n  text-shadow: 1px 1px 0 rgba(255,255,255,.5) }\n\n/* An inventory slot: pressed in, always. */\n.item, .mb-input, .mb-sel {\n  background: var(--surface-2);\n  border: 2px solid var(--border);\n  box-shadow: inset 2px 2px 0 rgba(0,0,0,.3), inset -2px -2px 0 rgba(255,255,255,.55);\n}\n.chk { border-radius: 0; border-width: 3px; border-color: var(--border-strong) }\n.chk.on { background: var(--accent); border-color: var(--border-strong); color: var(--accent-fg) }\n\n.stat { background: var(--surface-2);\n  box-shadow: inset 2px 2px 0 rgba(0,0,0,.3), inset -2px -2px 0 rgba(255,255,255,.55) }\n.stat b { font-family: var(--font-display); font-size: var(--f-3); color: var(--accent) }\n.bars i { border-radius: 0 }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt, #fab {\n  font-family: var(--font-display); font-size: var(--f-2); letter-spacing: 0;\n  background: var(--surface-3); color: var(--text-1);\n  border: 2px solid var(--border-strong); border-radius: 0;\n  box-shadow: inset 2px 2px 0 rgba(255,255,255,.6), inset -2px -2px 0 rgba(0,0,0,.28);\n  transition: none;\n}\nbutton.mb-btn:active, .mb-act:active, #fab:active {\n  box-shadow: inset 2px 2px 0 rgba(0,0,0,.3), inset -2px -2px 0 rgba(255,255,255,.5);\n}\n#fab { background: var(--accent); color: var(--accent-fg); font-size: var(--f-4) }","depth":"flat","font":"VT323","icon":{"cap":"butt","join":"miter","weight":2.8},"id":"minecraft2","mode":"light","motion":{"ease":"linear","fast":"0ms","med":"0ms","sheet":"100ms","slow":"0ms","tap":"0ms"},"name":"Minecraft 2","overrides":{"--border":"#565656","--border-strong":"#373737","--surface-2":"#8B8B8B","--surface-3":"#D6D6D6","--text-2":"#2F2F2F","--text-muted":"#4F4F4F"},"ramp":["#4C7F2E","#7A5C3E","#8B8B8B","#B02E26","#3AB3DA","#F9C22E"],"texture":{"cut":"0px","display":"'VT323',ui-monospace,monospace","image":"repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 2px,transparent 2px 4px),repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 2px,transparent 2px 4px)","size":"4px 4px,4px 4px"},"track":{"body":"0","cap":"0","tight":"0"},"weight":3},{"base":{"accent":"#F8D858","bg":"#05060B","panel":"#0A1550","text":"#FFFFFF"},"css":"/* DRAGON QUEST - the command window. Solid navy, a thick white frame with a\n   second line inside it, white text, square corners, and nothing else at all.\n   The restraint is the look. */\nbody { letter-spacing: var(--track-body) }\n\nheader {\n  background: var(--surface-1);\n  border-bottom: 4px solid var(--text-1);\n  box-shadow: inset 0 0 0 2px var(--surface-1), inset 0 -8px 0 -6px var(--text-1);\n}\nheader .logo { font-family: var(--font-display); color: var(--text-1) }\nheader .logo b { color: var(--accent) }\n\n/* The signature: white frame, gap, white frame. */\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: var(--surface-1);\n  border: 4px solid var(--text-1);\n  box-shadow: inset 0 0 0 2px var(--surface-1), inset 0 0 0 4px var(--text-1);\n}\nh2 { font-family: var(--font-display); color: var(--accent);\n  border-bottom: 2px solid var(--border); padding-bottom: var(--s-2) }\n\n.item { background: transparent; border: 0 }\n/* Selection is the pointing arrow, the way a command list works. */\n.item.on .nm { color: var(--text-2) }\n.item::before { content: ''; width: 0; height: 0; flex: 0 0 auto; margin-right: -6px;\n  border-left: 7px solid transparent; border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent }\n.item.on::before { border-left-color: var(--accent) }\n\n.chk { border-radius: 0; border-width: 2px; border-color: var(--text-1) }\n.chk.on { background: var(--accent); border-color: var(--text-1); color: var(--accent-fg) }\n\n.stat { background: transparent; border: 2px solid var(--text-1) }\n.stat b { font-family: var(--font-display); color: var(--accent) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt, #fab {\n  font-family: var(--font-display); letter-spacing: var(--track-cap);\n  background: var(--surface-1); color: var(--text-1);\n  border: 2px solid var(--text-1); border-radius: 0;\n}\nbutton.mb-btn:active, .mb-act:active { background: var(--text-1); color: var(--surface-1) }\n.mb-btn.go { background: var(--accent); color: var(--accent-fg); border-color: var(--text-1) }\n.mb-input, .mb-sel { background: var(--surface-2); border: 2px solid var(--text-1);\n  border-radius: 0; color: var(--text-1) }\n#fab { background: var(--surface-1); color: var(--accent); border-radius: 0; border-width: 4px }","depth":"flat","font":"DotGothic16","icon":{"cap":"butt","join":"miter","weight":2.2},"id":"dragonquest","mode":"dark","motion":{"ease":"linear","fast":"0ms","med":"80ms","sheet":"140ms","slow":"120ms","tap":"0ms"},"name":"Dragon Quest","overrides":{"--border":"#3A4CA8","--border-strong":"#FFFFFF","--surface-2":"#0C1A63","--surface-3":"#142378","--text-2":"#E6E9FF","--text-muted":"#A9B2E0"},"ramp":["#F8D858","#FFFFFF","#5AC8F2","#F26D6D","#7BE38B","#A9B2E0"],"texture":{"cut":"0px","display":"'DotGothic16',system-ui,-apple-system,sans-serif","image":"none","size":"auto"},"track":{"body":".02em","cap":".12em","tight":"0"},"weight":4},{"base":{"accent":"#7FD4FF","bg":"#02040A","panel":"#071232","text":"#FFFFFF"},"css":"/* FFVII - the PlayStation menu. Every panel is a translucent blue box graded\n   from near-black at the bottom to a lit blue at the top, edged with a thin\n   pale line, with white text that carries a hard shadow. */\nbody { letter-spacing: var(--track-body) }\n\nheader {\n  background: linear-gradient(180deg, var(--surface-3), var(--surface-1));\n  border-bottom: var(--border-width) solid var(--border-strong);\n}\nheader .logo { font-family: var(--font-display); color: var(--text-1);\n  text-shadow: 2px 2px 0 rgba(0,0,0,.7) }\nheader .logo b { color: var(--accent) }\n\n.card, .mb-sheet, .mb-menu, .mb-toast {\n  background: linear-gradient(180deg, var(--surface-3), var(--surface-1));\n  border: var(--border-width) solid var(--border-strong);\n  box-shadow: inset 0 0 0 1px rgba(0,0,0,.5);\n}\nh2 { font-family: var(--font-display); color: var(--text-1);\n  text-shadow: 2px 2px 0 rgba(0,0,0,.6);\n  border-bottom: var(--border-width) solid var(--border); padding-bottom: var(--s-2) }\n\n.item { background: transparent; border: 0 }\n.item .nm { text-shadow: 1px 1px 0 rgba(0,0,0,.6) }\n.item.on .nm { color: var(--accent) }\n/* the hand cursor, as a triangle on the live row */\n.item::before { content: ''; width: 0; height: 0; flex: 0 0 auto; margin-right: -4px;\n  border-left: 8px solid transparent; border-top: 5px solid transparent;\n  border-bottom: 5px solid transparent }\n.item.on::before { border-left-color: var(--accent) }\n\n.chk { border-color: var(--border-strong) }\n.chk.on { background: var(--accent); border-color: var(--accent); color: var(--accent-fg) }\n\n.stat { background: linear-gradient(180deg, var(--surface-3), var(--surface-1));\n  border: var(--border-width) solid var(--border) }\n.stat b { font-family: var(--font-display); color: var(--text-1);\n  text-shadow: 2px 2px 0 rgba(0,0,0,.6) }\n\nbutton.mb-btn, .mb-act, .mb-chip, .mb-x, .mb-opt {\n  font-family: var(--font-display); letter-spacing: var(--track-cap);\n  background: linear-gradient(180deg, var(--surface-3), var(--surface-1));\n  color: var(--text-1); border: var(--border-width) solid var(--border-strong);\n  text-shadow: 1px 1px 0 rgba(0,0,0,.6);\n}\nbutton.mb-btn:active, .mb-act:active { color: var(--accent) }\n.mb-btn.go { border-color: var(--accent); color: var(--accent) }\n.mb-input, .mb-sel { background: rgba(0,0,0,.35);\n  border: var(--border-width) solid var(--border-strong); color: var(--text-1) }\n#fab { background: linear-gradient(180deg, var(--surface-3), var(--surface-1));\n  color: var(--accent); border: 2px solid var(--border-strong) }","depth":"flat","font":"Jost:wght@400;500;600","icon":{"cap":"round","join":"round","weight":1.5},"id":"ffvii","mode":"dark","motion":{"ease":"cubic-bezier(.2,0,0,1)","fast":"100ms","med":"170ms","sheet":"280ms","slow":"260ms","tap":"0ms"},"name":"FFVII","overrides":{"--border":"#2A5490","--border-strong":"#AFC9E8","--surface-2":"#0A1A46","--surface-3":"#12306E","--text-2":"#DCE8F7","--text-muted":"#93AAC6"},"ramp":["#7FD4FF","#FFFFFF","#FFD86B","#8BE39B","#F291B8","#93AAC6"],"texture":{"cut":"4px","display":"'Jost',system-ui,-apple-system,sans-serif","image":"radial-gradient(ellipse at 50% 0%,rgba(127,212,255,.12),transparent 60%)","size":"100% 100%"},"track":{"body":"0","cap":".1em","tight":"0"},"weight":1}],"source":"ARC mindmapper"};/*SKINS-END*/
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

  /* ══════════════ the feel layer ══════════════
     Everything above this point is identical in every theme. Everything below
     it a theme may change, and these are the levers that make one theme feel
     unlike another rather than merely look recoloured.

     Deliberately NOT here: the spacing scale and the 44px tap target. A theme
     may change how a box is drawn. It may never move a box or shrink a thumb
     target, because that is how a theme quietly becomes a layout bug you only
     find on a phone.                                                         */

  /* Corners. One number per theme and the whole family follows it.

     The ratios are picked so that cut:10 reproduces the old hardcoded values
     exactly — 4, 10, 16, 20 — which is the point: a theme that does not set
     `cut` renders precisely as it did before. Until now `--cut` was read by no
     file in the repo, so every theme's corner setting was dead. Chalkboard
     asked for square corners for months and got 16px cards.
     --radius-full stays a pill forever; a theme does not get to un-round an
     avatar or a toggle track.                                                */
  const cutPx = Math.max(0, parseFloat(t['--cut']) || 0);
  const rad = m => Math.round(cutPx * m) + 'px';
  t['--radius-sm'] = rad(.4);  t['--radius-md']    = rad(1);
  t['--radius-lg'] = rad(1.6); t['--radius-sheet'] = rad(2);
  t['--radius-full'] = '999px';

  /* Border weight. A 1px hairline and a 2px drawn line are different products.
     Also read by nothing until now, for the same reason.                     */
  /* `!= null`, not truthiness: weight 0 is a theme asking for NO border, and a
     falsy check silently handed it 1px instead. Blocks has been asking for
     zero and getting a hairline since the day it was written. */
  t['--border-width'] =
    (skin && skin.weight != null ? skin.weight : 1) + 'px';

  /* Depth — the strongest lever here. The same card in the same colours reads
     as glass, as paper, as a stamped metal plate or as a lit sign depending
     only on this. Every app already reads --e-1..5 and --rim, so a theme gets
     the whole suite repainted without any app changing a line.

     `plate` is measured from the PANEL, not the page. A bevel is drawn on the
     surface it sits on, and a theme can perfectly well hang light plates on a
     dark page — which is exactly what a game window does.                    */
  const darkPlate = lum(panel) < .5;
  const depth = (skin && skin.depth) || 'soft';
  if (depth === 'flat') {
    /* Nothing floats. Separation comes from fill and border alone, which is
       what a printed or a hand-drawn interface actually does.                */
    for (let i = 1; i <= 5; i++) t['--e-' + i] = 'none';
    t['--rim'] = 'none';
  } else if (depth === 'bevel') {
    /* A lit top-left edge and a shaded bottom-right one, drawn inside the box.
       This is the entire trick behind a 90s game panel: the surface is not
       hovering above the page, it is a plate with thickness.                 */
    const lit = darkPlate ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.90)';
    const shd = darkPlate ? 'rgba(0,0,0,.62)'       : 'rgba(0,0,0,.38)';
    const bev = w => 'inset ' + w + 'px ' + w + 'px 0 ' + lit +
                   ', inset -' + w + 'px -' + w + 'px 0 ' + shd;
    t['--e-1'] = bev(1); t['--e-2'] = bev(1); t['--e-3'] = bev(2);
    t['--e-4'] = bev(2); t['--e-5'] = bev(2) + ', 0 6px 18px ' + sh(.30);
    t['--rim'] = 'none';
    /* The inverse, for anything that should read as pressed in rather than
       standing out: a button under the finger, an input well, a track.       */
    t['--bevel-in'] = 'inset 1px 1px 0 ' + shd + ', inset -1px -1px 0 ' + lit;
  } else if (depth === 'glow') {
    /* Light comes off the element instead of falling onto it. */
    const rgb = hex2rgb(accent).join(',');
    const glow = (a, b) => '0 0 ' + b + 'px rgba(' + rgb + ',' + a + ')';
    t['--e-1'] = glow(.14, 6);  t['--e-2'] = glow(.20, 12);
    t['--e-3'] = glow(.28, 22); t['--e-4'] = glow(.34, 34);
    t['--e-5'] = glow(.40, 48);
    t['--rim'] = 'inset 0 1px 0 rgba(255,255,255,.10)';
  }
  if (!t['--bevel-in']) t['--bevel-in'] = 'none';

  /* Letter spacing. On a short leash on purpose. This is the one lever that
     can quietly wreck a line of text at a width nobody happened to test, so a
     theme gets the two tokens it already had plus body, and no more.         */
  const tr = (skin && skin.track) || {};
  /* Clamped, not just documented. Letter spacing was the biggest reason the
     same button measured 73px in one theme and 124px in another: at .22em a
     six-letter label is a third wider than at zero. A theme may still set the
     tone; it may not stretch a control out of shape. */
  const capEm = (v, max) => {
    const n = parseFloat(v);
    if (!isFinite(n)) return v;
    const unit = String(v).trim().replace(/^[-+0-9.]+/, '') || '';
    const held = Math.max(-max, Math.min(max, n));
    return held === n ? v : (held + (unit || 'em'));
  };
  if (tr.cap   != null) t['--track-cap']   = capEm(tr.cap, .14);
  if (tr.tight != null) t['--track-tight'] = capEm(tr.tight, .05);
  t['--track-body'] = tr.body != null ? capEm(tr.body, .04) : '0';

  /* Motion. A theme sets its own tempo and curve: a 90s panel snaps because it
     has no transition to speak of, a hand-drawn theme can afford to be soft. */
  const mo = (skin && skin.motion) || {};
  ['tap', 'fast', 'med', 'slow', 'sheet'].forEach(k => {
    if (mo[k] != null) t['--dur-' + k] = mo[k];
  });
  if (mo.ease) t['--ease-out'] = mo.ease;

  /* Explicit overrides win over everything, including the feel layer, so a
     theme always has a last word on any single token. */
  if (skin && skin.overrides) Object.assign(t, skin.overrides);
  Object.entries(ranks||FALLBACK.ranks).forEach(([k,v])=>{t['--rank-'+k]=v});
  return t;
}

const Skins={
  data:FALLBACK, current:null,
  /* The embedded copy, exposed so _smoke.html can prove it still matches
     skins.json. Two copies of the same data is a smell; a check that fails
     the moment they disagree is what makes it a safe one. */
  builtin:FALLBACK,
  async load(url){
    try{const r=await fetch(url||'../shared/skins.json',{cache:'no-cache'});
      if(r.ok){const j=await r.json();if(j&&Array.isArray(j.skins)&&j.skins.length)this.data=j}
    }catch(e){/* offline or file:// — built-ins carry it */}
    return this.data;
  },
  /* skins.json is the FACTORY set and is never written to. A saved theme is a
     row, and a row with the same id as a factory theme replaces it — which is
     how a built-in theme becomes editable without the file changing. Deleting
     the row is the reset. */
  list(){
    const out=this.data.skins.slice(), at={};
    out.forEach((s,i)=>{at[s.id]=i});
    this.customs().forEach(s=>{
      if(at[s.id]!=null)out[at[s.id]]=s; else out.push(s)});
    return out;
  },
  get(id){return this.list().find(s=>s.id===id)||this.data.skins[0]},
  /* The untouched factory version, for "reset this theme". */
  factory(id){return this.data.skins.filter(s=>s.id===id)[0]||null},
  isEdited(id){return this.customs().some(s=>s.id===id)},

  /* Saved themes are ROWS when the store is there — one row per theme, each
     with its own updated_at, so two devices that each made a different theme
     both keep theirs.

     The old shape was every custom theme in a single JSON array under one
     localStorage key. That is one blob with last-write-wins over the whole
     set, which is the precise failure this suite was built to avoid. Rows and
     the old key are merged with rows winning, so an existing custom theme
     keeps working and upgrades itself the first time it is saved. */
  customs(){
    let old=[];
    try{old=JSON.parse(localStorage.getItem('suite_skins_custom')||'[]')||[]}catch(e){}
    let rows=[];
    try{
      if(typeof Rec!=='undefined'&&typeof Rec.map==='function'){
        const m=Rec.map('skin')||{};
        rows=Object.keys(m).map(k=>Object.assign({},m[k],{id:k,custom:true}));
      }
    }catch(e){}
    if(!rows.length)return old;
    const seen={};rows.forEach(s=>{seen[s.id]=1});
    return rows.concat(old.filter(s=>!seen[s.id]));
  },
  saveCustom(skin){
    try{
      if(typeof Rec!=='undefined'&&typeof Rec.set==='function'){
        const p=Object.assign({},skin);delete p.id;delete p.custom;
        Rec.set('skin',null,skin.id,p);
        return skin;
      }
    }catch(e){}
    const all=this.customs().filter(s=>s.id!==skin.id);all.push(skin);
    try{localStorage.setItem('suite_skins_custom',JSON.stringify(all))}catch(e){}
    return skin;
  },
  forget(id){
    /* The row is the real one. */
    try{if(typeof Rec!=='undefined'&&typeof Rec.del==='function')Rec.del('skin',null,id)}catch(e){}
    /* Then prune the legacy blob, and ONLY prune it.
       This used to write customs() back into that key, which quietly copied
       every row-backed theme into the old store on every delete. Deleting one
       theme therefore made stale duplicates of all the others, and those
       duplicates are exactly the sort of thing that reappears later with no
       explanation. Read the key, remove this id, put it back. Nothing else. */
    try{
      const raw=JSON.parse(localStorage.getItem('suite_skins_custom')||'[]')||[];
      const left=raw.filter(s=>s&&s.id!==id);
      if(left.length)localStorage.setItem('suite_skins_custom',JSON.stringify(left));
      else localStorage.removeItem('suite_skins_custom');
    }catch(e){}
  },
  /* Every theme that is yours rather than the factory's. */
  minesOnly(){return this.list().filter(s=>!this.factory(s.id))},
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
    /* One face or two: a theme may set a display font and a body font, so
       `font` takes a string or a list of Google font specs. */
    const want=Array.isArray(skin.font)?skin.font:[skin.font];
    want.filter(Boolean).forEach(spec=>{
      const id='mb-font-'+String(spec).replace(/[^a-z0-9]/gi,'');
      if(document.getElementById(id))return;
      const l=document.createElement('link');
      l.id=id;l.rel='stylesheet';
      l.href='https://fonts.googleapis.com/css2?family='+spec+'&display=swap';
      document.head.appendChild(l);
    });
  },
  /* The same list, as plain <link> markup, for a preview rendered in a frame
     that has its own document and cannot borrow this one's head. */
  fontLinks(skin){
    if(!skin||!skin.font)return '';
    const want=Array.isArray(skin.font)?skin.font:[skin.font];
    return want.filter(Boolean).map(spec=>
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family='+
      String(spec).replace(/"/g,'')+'&display=swap">').join('');
  },

  /* A theme's own stylesheet. Tokens repaint a component; this restyles it —
     a bevelled plate, a gradient title bar, a pressed-in button — which is the
     difference between a recolour and looking like it was opened somewhere
     else entirely.

     One element, replaced wholesale on every apply, so exactly one theme's CSS
     is ever live and there is nothing to clean up. It styles SELECTORS only:
     tokens are set as inline properties on :root and would beat it anyway.

     This is shared CSS, not app CSS. "Apps add no theme CSS of their own"
     still holds — the theme brings its own and the app never knows.          */
  themeCSS(s){
    let el=document.getElementById('skin-theme-css');
    if(!el){el=document.createElement('style');el.id='skin-theme-css';
      document.head.appendChild(el)}
    el.textContent=(s&&s.css)||'';
  },

  /* `pal` paints without saving — that is what makes live preview possible */
  apply(idOrSkin,pal){
    const s=typeof idOrSkin==='string'?this.get(idOrSkin):idOrSkin;
    this.font(s);
    this.themeCSS(s);
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
