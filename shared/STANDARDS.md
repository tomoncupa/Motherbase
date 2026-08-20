# STANDARDS — what every app in the suite does the same way

This is the house style. It governs how the apps **feel**, the way `CLAUDE.md`
governs how they **store**. Both are binding.

Written for Tom, so it says what things do before it says what they are called.
If a sentence here needs code to make sense, that is a bug in the sentence.

---

## The one sentence

**It should feel like an app, not like a website on a phone.**

Everything below is that sentence, made specific enough to check.

---

## What you get for free

Every app loads eight small files out of `/shared`. One of them, `mobile.js`,
is new: it is the layer that removes the giveaways. Loading it is the whole
setup. There is nothing to configure.

Here is what it takes away, and what a phone does instead:

| The giveaway | What now happens |
|---|---|
| A grey box flashes when you tap something | The thing you pressed shrinks slightly, the way a real button does |
| A quarter-second pause before a tap registers | It registers immediately |
| The whole page zooms in when you tap a text box | It does not. Text boxes are never smaller than the size that triggers it |
| The page bounces past its own top and shows the background | It stops where it stops |
| The keyboard covers the box you are typing in | The panel lifts itself above the keyboard |
| A dialog appears in the middle of the screen | A panel slides up from the bottom, and you can throw it back down |
| Swiping back leaves the app entirely | Swiping back closes whatever is open, one step at a time |
| Content jammed under the notch or the home bar | Everything sits inside the safe area |
| Nothing happens when you press | A short buzz, a short sound, and the state changes at once |

---

## The rules

### 1. Anything you can press is at least 44 pixels

Not 44 pixels of ink — 44 pixels of *catchable area*. A small round tick box can
stay small and still catch a thumb, because the area that responds is invisibly
larger than the circle. Add `mb-tap` to a control and that happens.

44 is the smallest square a thumb hits reliably. Below it, people miss, and
missing feels like the app is broken rather than like they were imprecise.

### 2. Every press answers instantly

Immediately means *in the same frame*, before anything is saved and before
anything is redrawn. Tick a box and the box fills in at once; the store catches
up a moment later and agrees. Never make somebody wait for a disk write to see
that their tap landed.

### 3. Nothing important is hidden behind hover

Hovering does not exist on a phone. A remove button that only appears when the
mouse is over the card does not exist at all on a phone. Anything that only
shows on hover must have a real way in — a mode, a menu, a swipe.

Where hover *is* used, it is wrapped so it only applies to a real mouse.
Otherwise a hover state sticks after a tap and looks like a bug.

### 4. Panels come up from the bottom

A dialog in the middle of a phone screen is a desktop habit. Everything that
used to be a dialog is now a panel that rises from the bottom, has a grab bar
at the top, and can be dragged back down or flicked away.

On a laptop the identical panel is a centred card. It is one component, not
two — so they cannot drift apart.

### 5. The back gesture is real navigation

Android's back button and the iPhone's swipe-from-the-left both mean "one step
back". In this suite one step back closes the open panel. If nothing is open,
it leaves the app you are in and returns to the home screen. It never dumps you
out of the suite because you wanted to close a menu.

### 6. Deleting always offers a way back

Nothing is removed without a bar appearing at the bottom saying what went and
offering **UNDO**, for six seconds. This is not politeness — it is the same
rule as "never remove earned progress" in the main brief, applied to the
moment of deletion.

### 7. Every text box asks for the right keyboard

A weight field brings up a number pad, not a full alphabet keyboard with a tiny
number row. A name field capitalises words. A search field's return key says
Search. Pressing return moves to the next box, and Done on the last one puts
the keyboard away.

Numbers are typed into a **text** box that requests a number keypad, never a
`number` box. A `number` box on a phone throws away half-typed values and adds
little arrows nobody wants.

### 8. One thing scrolls at a time

A scrolling box inside a scrolling page means two scrolls arguing over one
finger, and the wrong one always wins. On a phone a card is as tall as what is
in it and the page scrolls. On a laptop, where a card has a fixed height and a
mouse wheel can be aimed, an inner scroll is fine.

### 9. Sizes come from the scale, not from taste

There is one spacing scale and one type scale, and no two steps in either are
closer than about 25%. That is deliberate: you should never be deciding between
13px and 14px, because 14 is not a step. Need more room? Take the next step. Not
enough? The one after.

The same goes for depth. There are five shadows, from "barely lifted" to
"floating well above the page", and a thing gets one by deciding where it sits,
not by picking a shadow that looks nice.

### 10. No colour is written down twice

Every colour in every app comes from a token — a name for a job, like "card
fill" or "accent". No app contains a hex code. That single rule is what lets
one app be Ice while another is Doodle, and what makes a colour edit in
Settings reach everywhere at once.

### 11. Buzzes and sounds are one thing

**iPhone Safari cannot vibrate.** There is no vibration available to a web page
on an iPhone, and there is no workaround. That is why every important moment
plays a short sound *and* asks for a buzz: on a Pixel you feel it, on an iPhone
you hear it, and on both the app answered you.

Buzzes follow the same rule as the sounds: small actions stay small. If
everything buzzes, nothing does.

### 12. Animation says what happened, or it does not happen

Panels rise because they came from the bottom. A selected tab slides because it
is one control, not five. Nothing animates for decoration, and nothing takes
longer than it needs to. If the phone is set to reduce motion, none of it runs.

---

## Where the parts live

| Thing | File |
|---|---|
| The touch layer, sheets, swipes, keyboard, back stack, haptics | `shared/mobile.js` |
| Snackbars, settings, switches, segmented controls, menus | `shared/ui.js` |
| Every colour, every size, every shadow, every duration | `shared/skins.js` |
| The checks that prove it still works | `shared/_smoke.html` |

A working example of all of it, with the reasoning written into the comments:
**`_template/index.html`**. Copy that to start a new app.

---

## How to check it

```
py -3 -m http.server 8777 -d "C:\Users\user\Downloads\Claude Code"
```

Open `http://127.0.0.1:8777/shared/_smoke.html`. It must say **64 of 64**, or
more once checks are added. Then open it again on your phone, on the same
Wi-Fi, using this machine's address instead of `127.0.0.1`. The buttons on that
page should feel like an app. If they feel like a web page, something in here
has come loose.

`node` is not installed on this machine. Do not reach for it.

---

## What has not been done

Being straight about the edges of this:

- **None of it has been tested on Tom's iPhone.** It has been driven in a
  desktop browser at phone size, with touch emulated. That catches layout,
  sizing, gestures and behaviour. It does not catch how iOS Safari actually
  feels, and it cannot.
- **Every app loads `mobile.js` now**, so every app has safe areas, real tap
  targets, no zoom-on-focus and contained overscroll. What the shared layer
  cannot do for them is fix their own CSS: each app still needs auditing for
  hover-only controls and controls smaller than 44px.
- **`arc/` still carries its own copy of the theme engine**, so it does not
  follow the shared colours at all. That was already on the debt list.
