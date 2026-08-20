# Motherbase — the actual parts

What `foundations.md`, `mobile.md` and `browser.md` describe in the abstract,
this repo has already built. Use these rather than reinventing them.

Authority order: repo-root `CLAUDE.md` (data and structure) → `shared/STANDARDS.md`
(how it should feel) → this file (what to type).

## Loading order

```
skins.js  →  day.js  →  records.js  →  mobile.js  →  sound.js  →  ui.js  →  io.js  →  health.js
```

`mobile.js` before `ui.js` matters: it owns the sheet, the button and the press
states, and `ui.js` checks whether it is there. Two definitions of one class is
how one of them silently wins.

## Tokens

Never write a hex code or a raw size in app CSS. Both come from `skins.js`.

**Colour** — derived from four base colours per theme, so a theme change or a
palette edit repaints everything:

```
--bg  --surface-1  --surface-2  --surface-3  --overlay
--text-1  --text-2  --text-muted  --text-inverse
--border  --border-strong  --focus
--accent  --accent-hover  --accent-fg
--success  --warn  --danger  --info
--data-1 … --data-6      chart and node colours
--rank-S … --rank-F      fixed across every theme
```

**Measurement** — identical in every theme, because a theme changes what an app
looks like, never how far apart things sit:

```
--s-1 … --s-10           4 8 12 16 24 32 48 64 96 128
--f-1 … --f-9            12 14 16 18 20 24 30 36 48
--lh-tight --lh-body --lh-loose
--w-body (500)  --w-bold (700)
--track-cap --track-tight
--e-1 … --e-5            two-part shadows; contact shadow fades as it rises
--rim                    the lit top edge
--radius-sm --radius-md --radius-lg --radius-full --radius-sheet
--tap                    44px
--safe-t --safe-r --safe-b --safe-l
--kb                     live keyboard height, set by mobile.js
--dur-tap --dur-fast --dur-med --dur-slow --dur-sheet
--ease-out --ease-in --ease-sheet
```

## Classes from `mobile.js`

| Class | Does |
|---|---|
| `mb-tap` | Expands the hit area to 44px without changing the visual size |
| `mb-press` | Scale-down on press, dropped if the finger moves |
| `mb-press flat` | Background change instead of scale — for rows |
| `mb-scroll` | Momentum, contained overscroll, hidden bar on touch |
| `mb-btn` `.go` `.bad` `.quiet` | The button |
| `mb-kbpad` | Bottom padding that clears the keyboard |

Put `mb-press mb-tap` on essentially every button you create.

## API

```js
Mobile.sheet({title, body, actions})   bottom sheet, drag to dismiss
Mobile.actions('TITLE', [...])         contextual menu from the bottom
Mobile.feedback('tick')                haptic + sound in one call
Mobile.field(input, 'decimal')         right keyboard, right return key
Mobile.form(container, onDone)         Next down the fields, Done on the last
Mobile.swipe(row, {right:{...}})       swipe to act — needs its own wrapper
Mobile.trap(closeFn)                   system back closes this, not the app

UI.dialog({...})    sheet on a phone, centred card on a desktop, one call
UI.menu(x, y, items, {title})          action sheet or popover, same call
UI.toast(html, {bad, action})          snackbar above the home indicator
UI.undo(message, restoreFn)            delete with a way back
UI.segmented(items, value, onChange)   the tab strip
UI.toggle(on, onChange)                the switch
UI.row(title, note, control)           a settings row
UI.field(kind, {placeholder, value})   an input that knows its keyboard
UI.settings(appId, extraTabs, {order, append})
```

`Mobile.feedback()` rather than `Sfx.play()` for anything the user did — it
buzzes where there is a motor and plays a cue everywhere, so an iPhone and a
Pixel both answer the tap.

`Mobile.swipe()` needs a plain wrapper element around the visual row, and the
gap between rows must live on the list (`flex` + `gap`), not as a margin on the
row — a margin inside the swipe wrapper measures wrong.

## Feedback vocabulary

`tick` `untick` `select` `toggle` `open` `close` `success` `complete` `warn`
`error` `heavy`. Small actions stay small; only a finish escalates.

## Traps this repo has already hit

- **`display:contents` is broken in Safari CSS grid.** Use inline
  `grid-template-columns` per row.
- **Flex inputs need `min-width:0`** or the stepper button is clipped off.
- **A literal closing script tag inside inline code ends the script element**,
  even inside a comment. It has silently truncated three apps. Split it.
- **A duplicate function in both an external and an inline script** resolves to
  the inline one, silently.
- **`let`/`const` at the top level of a classic script are not on `window`.**
  A test harness needs `frame.contentWindow.eval`.
- **Anything flagged `custom` passed to `Skins.apply` is persisted** — a live
  preview must not be, or it leaves a trail of half-made themes.
- **An animation started in `requestAnimationFrame` never starts in a tab that
  is not compositing.** A sheet opened that way parks off-screen with no way
  back. Force layout with `offsetHeight` and set the class in the same tick.
- **A row key built from the clock alone is not unique.** Two rows made in the
  same millisecond derive the same id and the second silently overwrites the
  first. Add a counter.
- **`<a download>` does nothing on iOS** and nothing at all in a home-screen
  app. Use the share sheet, and only record that a file was saved once it was.
- **Generic `cursive` on iOS is Snell Roundhand**, a formal script. Never fall
  back to a decorative generic; name a real font and fetch it.
- **Re-rendering a pane from inside a handler attached to that pane** locks the
  renderer. Repaint on next open instead.
- **GitHub Pages caches hard.** Bump `?v=N` on shared files when hosting
  returns.
- **`py -3`, not `python`** — plain `python` hits the Microsoft Store stub.
  `node` is not installed.

## Checking work

```bash
py -3 -m http.server 8777 -d "C:\Users\user\Downloads\Claude Code"
```

Open `shared/_smoke.html`. It must pass at its current count or higher, at
phone width **and** desktop width — several checks only mean something at one
of them. Add a check whenever you fix something that broke; the count only goes
up.

Then drive the real app. A green smoke test does not prove the app still works.
Clean up any test rows you wrote and stop the server.

## Who this is for

Tom is a fitness coach, not a developer, and does not read code. Anything he
has to act on is written in plain language: what a thing does before what it is
called, no jargon, acronyms spelled out once. If a setting needs a paragraph of
explanation on screen, the paragraph belongs in a code comment and the setting
needs a better name.

Say what was actually verified and what was only reasoned. He cannot check it
for you, so an unearned claim costs him real time.
