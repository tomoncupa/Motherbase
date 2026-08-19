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

## Themes and colours

Two layers, and they are separate on purpose — the same split you built in ARC.

**The theme** is the structure: fonts, corner shape, texture, and the colours it
ships with. Picked **per app**, so ARC can be Doodle while BLOCK is Ice.

**The colours** belong to the theme. Edit Ice's colours and every app set to Ice
gets them. Edit them again and nothing else in the suite moves.

### Editing colours — in the app

**Settings → Look.** Pick a theme along the top; its colours appear underneath:

| Field | What it paints |
|---|---|
| Canvas background | the page behind everything |
| Card fill | panels, headers, dialogs |
| Card border | the lines around them |
| Text | the main reading colour |
| Secondary text | labels, captions, anything quieter |
| Accent | buttons, ticks, the selected thing |

Plus the **six node and chart colours** — the ones ARC paints branches with.

It repaints as you drag and only saves when you let go, so you can push a colour
around and back without leaving a trail. The header shows **· EDITED** once a
theme has your colours on it, and **RESET COLOURS** puts it back to how it ships.
There is a contrast line underneath that tells you when a pairing is unreadable
— worth heeding, a low-contrast theme looks great for ten minutes.

Your edits live on this device, per theme, and never touch `skins.json`.

### Adding a theme — permanently, for every device

A theme that should always exist goes in `shared/skins.json`. Copy a block:

```json
{
  "id": "doodle",
  "name": "Doodle",
  "mode": "dark",
  "base": { "bg": "#12151B", "panel": "#181C24", "accent": "#F4F1EA", "text": "#F4F1EA" },
  "overrides": { "--surface-2": "#12151B", "--border": "#39414F",
                 "--text-2": "#A9AFBC", "--text-muted": "#727A8A" },
  "ramp": ["#F4F1EA", "#FFD9A0", "#9FD8F2", "#F5A8B8", "#B4E4A6", "#CBC2F0"],
  "texture": { "display": "'Caveat',cursive", "body": "'Caveat',cursive", "cut": "14px" }
}
```

- `id` — one lowercase word, unique. `name` — what you see on the chip.
- `mode` — `dark` or `light`, so the interface knows which way round it is.
- `base` — the four colours everything else is derived from.
- `overrides` — pin anything you do not want derived (borders, secondary text).
- `ramp` — the six node and chart colours.
- `texture` — fonts and corner shape. This is what makes two themes feel like
  different products rather than the same one repainted.

A theme with structural CSS of its own (like Doodle's hand-drawn node outlines)
also needs a `body.theme-<id>` block in the app that draws it — in ARC that is
what `SCHEME_CSS` lists.

**Check your work** in `shared/_smoke.html` → Settings → Look. If text is hard to
read there, it will be hard to read everywhere.

## Where things live

| I want to change… | It lives in |
|---|---|
| How a specific app works | `thatapp/index.html` |
| Themes — fonts, structure, defaults | `shared/skins.json` |
| Colours of a theme | Settings → Look (saved per theme, on this device) |
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
