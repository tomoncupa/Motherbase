# Motherbase — how to add things

Two recipes: a new app, and a new theme. Neither needs you to read code.

```
Motherbase/
  index.html        the home screen
  shared/           the foundation every app uses — don't edit these
  block/            one folder per app, each with an index.html
  arc/  habits/  form/
  _template/        the starter app you copy
```

---

## Make a new app

**1. Copy the `_template` folder** and rename it to whatever the app is — say
`nutrition`. One lowercase word, no spaces.

**2. Open `nutrition/index.html`** and change the five numbered spots at the
top. They are marked ① to ⑤ in the file. The only one that matters is ⑤:

```js
const APP = {
  id: 'nutrition',
  name: 'Nutrition',
  icon: '🍽',
  blurb: 'food and macros',
  types: ['meal', 'food'],     // the kinds of thing only this app writes
};
```

**3. Add it to the home screen** — one line in `index.html` at the root,
alongside the others:

```js
{ id: 'nutrition', nm: 'NUTRITION', ic: '🍽', file: 'nutrition/', ds: 'food and macros' },
```

That is the whole wiring. Themes, sounds, settings, backups, spreadsheet
export, the health check and cross-app ticks all work already, because the
template loads the shared files and declares itself.

**4. Then tell me what it should do.** "Build the nutrition app: log meals
against macro targets, show today's totals, warn when protein is short." I
work inside your new folder and nothing else moves.

### The three rules a new app must follow

1. **Only write your own types.** Yours are whatever you listed in `types`.
   Reading anything is always fine.
2. **`tick` is the one shared exception.** Any app may tick anything — that is
   what makes a tick in one app show up in all of them. Later save wins.
3. **Never write a colour into your CSS.** Use the tokens (`var(--accent)`,
   `var(--surface-1)`, `var(--text-1)` …). A hex code is a theme that only
   works in one skin.

---

## Make or edit a theme

### The easy way — in the app

**Settings → Look → Custom.** Pick four colours: background, panels, accent,
text. Everything else — borders, muted text, chart colours, hover states — is
worked out from those four. The page repaints as you drag, so you are choosing
by looking, not guessing.

It warns you if a pairing is unreadable before you save it. Take that
seriously; a low-contrast theme looks great for ten minutes and then you stop
using the app.

Saved themes appear in the list next to the built-in ones, on this device.

**Themes are per app.** ARC can be Monarch while BLOCK is Ice. If you want them
matched there is an *Apply to all* button under the picker.

### The permanent way — `shared/skins.json`

A theme that should exist in every app forever, including on other devices,
goes in the file. Open `shared/skins.json` and copy an existing block:

```json
{
  "id": "ember",
  "name": "Ember",
  "mode": "dark",
  "cut": "10px",
  "base": { "bg": "#140C0A", "panel": "#1F1512", "accent": "#FF8A3D", "text": "#F5E8E0" }
}
```

- `id` — one lowercase word, unique.
- `mode` — `dark` or `light`. Say which, so the interface knows.
- `cut` — how round the corners are. `10px` normal, `2px` sharp, `18px` soft.
- `base` — the same four colours as the editor.

Optional extras a skin may carry:

```json
"ramp": ["#FF8A3D","#FFC46B","#7ED9A6","#6EC6FF","#B694FF","#FF7A9A"],
"texture": { "display": "'Chakra Petch', sans-serif", "body": "'Inter Tight', sans-serif", "cut": "4px" }
```

`ramp` is the six chart colours (ARC uses these). `texture` swaps the fonts and
corner shape, which is what makes two skins feel like different products rather
than the same product repainted.

**Check your work:** open `shared/_smoke.html`, use the Look tab, and click
through your new skin. If the text is hard to read there, it will be hard to
read everywhere.

---

## Where things live

| I want to change… | It lives in |
|---|---|
| How a specific app works | `thatapp/index.html` |
| Colours and fonts for everything | `shared/skins.json` |
| The sounds | `shared/sound.js` |
| What "today" means | Settings → Day (or `shared/day.js` for the default) |
| How data is stored | `shared/records.js` — the one file to be careful with |
| Backups and exports | `shared/io.js` |
| Dialogs, toasts, menus, the settings panel | `shared/ui.js` |
| Which apps show on the home screen | `index.html` at the root |

**The one file to leave alone unless you mean it:** `shared/records.js`. Every
app's data goes through it. Everything else can be broken and fixed in a
minute; that one holds your history.

**Before changing anything shared:** open any app, Settings → Data → Back up.
Ten seconds, and it makes every experiment reversible.
