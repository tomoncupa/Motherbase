# THEMING — how an app obeys STYLE

This is the contract between STYLE and every app in the suite. `CLAUDE.md`
governs how apps **store**, `STANDARDS.md` governs how the phone apps **feel**,
and this governs how all of them **look**. All three are binding.

Written for Tom as well as for whoever is coding, so it says what a thing does
before it says what it is called.

---

## The one rule

> **An app never decides what anything looks like. It asks.**

An app does not choose a colour, a corner, a shadow, a font, a border or a
speed. It names what it wants — "the card colour", "the medium corner" — and
the theme answers. That is the whole of it.

The practical test, and the only one that matters:

> **Change a theme in STYLE. If the app does not change, the app has a bug.**

Not the theme. The app.

### Why

Seventeen themes exist. If an app writes `#0E141D` in its own stylesheet, that
app is Block-coloured in all seventeen of them, and no amount of work in STYLE
will ever move it. Multiply that by every colour in every app and the theme
system is decoration rather than a system.

BLOCK is the worked example: 120 colours and 77 corners written into the app,
so changing the theme did almost nothing to it. Its design was good — that is
now a theme called Block — but it was locked inside one file where nothing else
could reach it.

---

## Wiring a new app up

Four lines. Put them in this order: `skins.js` first because it paints, and
`mobile.js` before `ui.js` because `ui.js` checks whether it is there.

```html
<script src="../shared/skins.js?v=15"></script>
<script src="../shared/day.js?v=15"></script>
<script src="../shared/records.js?v=15"></script>
<script src="../shared/mobile.js?v=15"></script>
<script src="../shared/sound.js?v=15"></script>
<script src="../shared/ui.js?v=15"></script>
<script src="../shared/io.js?v=15"></script>
<script src="../shared/icons.js?v=15"></script>
```

Then, in the app's own script:

```js
Skins.load('../shared/skins.json?v=13').then(() => Skins.restore(APP.id));
```

`restore(APP.id)` is what makes the theme **per app**: ARC can be Doodle while
BLOCK is Block. Pass the app id or every app shares one setting.

**Bump the `?v=` when a shared file changes.** The browser caches these hard
enough that a whole session was lost to it once: an app was rendering a theme
from eight commits earlier and there was no way to tell by looking, because an
old theme is still a theme.

---

## The tokens

Ninety-two of them. An app may use any. An app may define none of its own.

### Colour — 19

| Token | What it is for |
|---|---|
| `--bg` | the page behind everything |
| `--surface-1` | a card, a panel, a sheet |
| `--surface-2` | recessed: a row, an input, a well |
| `--surface-3` | raised: a button face |
| `--overlay` | the dim behind a sheet |
| `--text-1` | the main reading colour |
| `--text-2` | still readable, less loud |
| `--text-muted` | notes, captions, the date under a title |
| `--text-inverse` | text on top of the accent |
| `--border` | the ordinary hairline |
| `--border-strong` | the emphasised line |
| `--accent` | buttons, selection, the live thing |
| `--accent-hover` | the accent under a pointer |
| `--accent-fg` | text ON the accent. Never guess this; it is worked out |
| `--focus` | the keyboard focus ring |
| `--success` `--warn` `--danger` `--info` | the four meanings |

### Chart — 6

`--data-1` to `--data-6`. Six series colours, spread so no two read as the
same one, and pinned to be legible against **that theme's page**. The sixth is
a neutral, for "everything else".

A theme may hand-pick them. If it does not, they are worked out from its accent
— so changing the accent moves all six.

### Shape — 7

| Token | Ice | What it is for |
|---|---|---|
| `--radius-sm` | 4px | chips, small controls |
| `--radius-md` | 10px | buttons, rows, inputs |
| `--radius-lg` | 16px | cards |
| `--radius-sheet` | 20px | the top of a bottom sheet |
| `--radius-full` | 999px | pills and avatars. Never changes |
| `--border-width` | 1px | every border in the app |
| `--cut` | 10px | the number the family is derived from |

The whole family follows the theme's corner setting, so a square theme squares
everything and a soft one softens it. **Use these; never a number.**

### Depth — 7

`--e-1` through `--e-5` are the elevation ladder, `--rim` is the lit top edge,
`--bevel-in` is the pressed-in inverse.

A theme picks one of four families — **soft** (shadows), **flat** (none),
**bevel** (a plate with thickness), **glow** (light coming off it) — and every
one of these tokens changes accordingly. An app that writes its own
`box-shadow` opts out of all four.

### Spacing — 10, and a theme may NEVER change them

`--s-1` (4px) through `--s-10` (128px). No two steps are within about 25% of
each other, which is what stops the argument about 13px versus 14px.

`--gutter` is the standard edge margin of a screen.

**These are identical in every theme on purpose.** A theme changes how a box is
*drawn*, never where it sits. A card is the same size in all eighteen themes,
and that is checked.

### Type — 20

`--f-1` (12px) through `--f-9` (48px), hand-picked rather than a ratio.
`--font-display` for labels, headings and buttons. `--font-body` for reading.
`--font-mono` for code and numbers in a table.
`--lh-tight` `--lh-body` `--lh-loose` for line height.
`--w-body` (500) and `--w-bold` (700) — two weights is enough, and nothing
under 400: lighter text is a job for a softer colour, not a thinner stroke.
`--track-cap` `--track-body` `--track-tight` for letter spacing, which is
clamped so a theme cannot stretch a control out of shape.

### Motion — 8

`--dur-tap` `--dur-fast` `--dur-med` `--dur-slow` `--dur-sheet`, and
`--ease-out` `--ease-in` `--ease-sheet`.

A theme sets its own tempo: a 90s panel snaps because it has no transition at
all, a hand-drawn theme can afford to be soft.

### Layout — 6, and a theme may NEVER change them

`--tap` is 44px, the smallest square a thumb hits reliably. It is a hit area,
not a visual size, so a small control can still look small.

`--safe-t` `--safe-r` `--safe-b` `--safe-l` are the notch and the home
indicator, as plain values, so no app writes `env()` itself.

### Texture — 2

`--tex-image` and `--tex-size` are the theme's page background. Put them on
`body` and forget them:

```css
body { background-image: var(--tex-image); background-size: var(--tex-size) }
```

### Rank — 7

`--rank-S` down to `--rank-F`. Fixed in every theme, so a letter grade means
the same thing wherever it appears.

---

## Build from the kit, do not rebuild it

`shared/ui.js` already contains the screen furniture. Use it.

| Call | What you get |
|---|---|
| `UI.row(title, note, control)` | a labelled line with the control on the right |
| `UI.field(kind, opts)` | an input that already knows which keyboard it wants |
| `UI.segmented(items, value, fn)` | a tab strip |
| `UI.toggle(on, fn)` | a switch |
| `UI.dialog(o)` | the one dialog. A sheet on a phone, a panel on a desktop |
| `UI.confirm(question, detail, opts)` | returns a **promise** |
| `UI.menu(x, y, items)` | a context menu |
| `UI.toast(html)` / `UI.undo(msg, fn)` | a snackbar, with a way back |
| `UI.settings(appId)` | the whole standard settings panel |
| `Mobile.sheet` `Mobile.swipe` `Mobile.form` `Mobile.feedback` | the touch layer |

And the classes a theme knows how to style:

```
.mb-row .mb-group .mb-btn .mb-act .mb-input .mb-sel .mb-range .mb-sw
.mb-chip .mb-chips .mb-opt .mb-swatch .mb-seg .mb-sheet .mb-sheet-head
.mb-sheet-body .mb-sheet-foot .mb-toast .mb-menu .mb-x .mb-grab .mb-veil
.mb-press .mb-tap .mb-scroll .mb-swipe
```

**A private copy of a component inherits nothing.** Not the current theme, not
the next fix, not the next improvement. STYLE was built the wrong way round
once — 41 hand-rolled classes and zero shared components — and had to be
rebuilt on the kit. Do not repeat it.

---

## Icons

`shared/icons.js` is the master set: about 52 drawings carrying about 144
buttons.

```js
el.innerHTML = Icons.svg('add');          // a role, not a drawing name
el.appendChild(Icons.el('delete', {size: 20}));
```

A button asks for a **role** — what it is *for* — and many roles share one
drawing. `add`, `new` and `create` are all the plus.

**Look for an existing role before adding one, and an existing drawing before
adding one of those.** Every new drawing is another thing to keep in step.

A theme changes an icon's stroke — weight, cap, join, fill, and an optional
hand-drawn wobble — never its shape. That is what stops a new theme costing 52
new paths. Icons are drawn in `currentColor`, so an icon is the colour of the
text beside it for free.

**A character is not an icon.** `✕` and `▶` and emoji render differently on
every device, cannot take a colour, and vanish when a font does. Never put one
in a button.

---

## What an app may never do

1. **Write a colour.** No `#hex`, no `rgb()`, no colour name. Not one.
2. **Write a size.** No `border-radius: 8px`, no `padding: 12px`, no
   `font-size: 15px`. Tokens for all three.
3. **Write a shadow.** `--e-1` to `--e-5`, or nothing.
4. **Name a font.** `--font-display` or `--font-body`.
5. **Define its own variables.** BLOCK had fifteen with different names to the
   shared ones, which is why nothing could reach it.
6. **Ship theme CSS.** If a theme cannot reach something in your app, the app
   is wrong. Themes carry their own CSS; apps never do.
7. **Fight a theme.** No `!important` over a token.

The only exception worth stating: a colour that is genuinely the app's own
identity and that no token holds. Say so in a comment, and expect to justify it.

---

## Proving you obeyed

Three checks, in order of how much they are worth.

### 1. The measured highlight — this is the real test

Open `style/index.html`, put your app's theme on a slot, and hover the editor
controls.

**The highlight measures.** It changes the token inside the preview, reads
every element before and after, and outlines the ones that actually moved. It
cannot flatter you.

- Hover **Card fill**. If nothing lights up, your card is painting its own
  colour.
- Hover **Border weight**, **Depth**, **Corner roundness**, **Body text**. Same
  question each time.
- The line under the pane says how many things a control reaches, and says
  plainly when the answer is none.

This caught Ragnarok painting `#FFFFFF` fifty times over instead of
`var(--surface-1)`, which meant the colour editor could not reach its card at
all. Hovering "Card fill" lit up **one** element. After the fix, twenty-two.

### 2. Switch themes and look

Put the app on Ice, then Minecraft, then Ragnarok. Ice is dark and soft,
Minecraft is a wall of blocks, Ragnarok is white with a blue strip. If your
screen looks broadly the same in all three, it is not obeying.

### 3. The smoke suite

```
py -3 -m http.server 8777 -d "C:\Users\user\Downloads\Claude Code"
```

Open `shared/_smoke.html`. It must say **152 of 152** or better, and it must be
run in a window with a real height — several checks measure geometry and a
zero-height pane reports a false failure.

---

## Traps that have already cost time

- **The browser caches shared files hard.** Every test in one long session
  needed a brand new port before Chrome would fetch a changed file. Bump the
  `?v=` and check the build number on screen.
- **There is no `--panel` token.** The four base colours are *named* bg, panel,
  accent and text, but the tokens they become are `--bg`, `--surface-1`,
  `--accent`, `--text-1`. Naming a token that does not exist paints **nothing**
  and reports nothing. Lego's header was invisible for exactly this reason.
- **`Icons.svg()` takes a role, not a drawing name.** `gear` is a drawing; the
  button is `settings`. The wrong name returns an empty string silently.
- **`UI.confirm` is `(question, detail, opts)` and returns a promise.** Passing
  an options object renders `[object Object]` and never runs the action.
- **Weight `0` used to be falsy**, so a theme asking for no border got a
  hairline. Fixed, but the lesson stands: check `!= null`, not truthiness.
- **`py -3`, not `python`.** `node` is not installed.
- **A literal closing script tag inside inline code** ends the script element,
  even inside a comment.

---

## Where the debt is today

Measured 2026-08-22. Every number is a place a theme cannot reach.

| App | Loads the engine | Hardcoded corners | Hardcoded colours |
|---|---|---|---|
| `_template/` | yes | 0 | 1 |
| `train/` | yes | 0 | 1 |
| `style/` | yes | 1 | 11 |
| `status/` | yes | 8 | 1 |
| `index.html` | yes | 10 | 3 |
| `habits/` | **no** | 17 | 46 |
| `form/` | **no** | 23 | 86 |
| `arc/` | **no** | 49 | 167 |
| `block/` | **no** | 77 | 120 |

`_template/index.html` is the working example. Copy it.

**BLOCK is smaller than it looks:** it already has a token system, just with
different names. `--acc` → `--accent`, `--line` → `--border`, `--panel` →
`--surface-1`. Mostly a rename.

**ARC is the biggest:** it carries its own copy of the theme engine and defines
`THEMES` itself. It should load `shared/skins.js` instead.

---

## Before and after

**Before** — the app decided:

```css
.card {
  background: #0e141d;
  border: 1px solid #1e2a38;
  border-radius: 11px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.4);
  font-family: 'IBM Plex Sans', sans-serif;
  color: #dbe7f0;
}
```

Seven decisions, seven places a theme cannot reach.

**After** — the app asked:

```css
.card {
  background: var(--surface-1);
  border: var(--border-width) solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--s-3);
  box-shadow: var(--e-1), var(--rim);
  font-family: var(--font-body);
  color: var(--text-1);
}
```

Same card. Now it is Block in Block, white in Ragnarok, a stone block in
Minecraft, and a brick in Lego — and nobody has to touch it again.
