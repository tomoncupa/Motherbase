# Mobile — making it feel like an app

Read this when the interface runs on a phone or tablet, or when anyone says it
"feels like a website".

Everything here is the *interaction* layer. Hierarchy, spacing, type and colour
come from `foundations.md` and do not change because the screen got smaller.

## The tells

"Feels like a website" is never one thing. It is an accumulation of small
signals, each individually fixable. When someone reports it, work this list —
the cause is almost always several of these at once.

| The tell | The fix |
|---|---|
| Grey box flashes on tap | `-webkit-tap-highlight-color: transparent`, plus a real pressed state |
| Noticeable delay before a tap registers | `touch-action: manipulation` on anything tappable |
| Page zooms when a field is focused | No input below 16px computed font-size |
| Page rubber-bands past its own top | `overscroll-behavior-y: none` on the body |
| Keyboard covers the field being typed in | Track `visualViewport`, lift the panel |
| Dialog appears floating in the middle | Bottom sheet, draggable |
| Back gesture exits the app | Overlays push a history entry |
| Content under the notch or home bar | `viewport-fit=cover` + `env(safe-area-inset-*)` |
| Nothing happens on press | Immediate state change + sound + haptic |
| Hover states that stick after a tap | Wrap every hover in `@media (hover:hover) and (pointer:fine)` |
| Scrollbars | Hide them under `@media (pointer:coarse)` |
| Two scrollbars fighting | One scrolling surface per screen |

## Touch targets

**44px minimum** — but of *hit area*, not of ink. A 24px checkbox can stay 24px
and still be reliably tappable if its responsive area is enlarged behind it:

```css
@media (pointer:coarse){
  .tap{position:relative}
  .tap::after{content:'';position:absolute;top:50%;left:50%;
    transform:translate(-50%,-50%);
    width:max(100%,44px);height:max(100%,44px)}
}
```

The pseudo-element does not affect layout, so visual density survives. Below
44px people miss, and a miss feels like the app is broken rather than like they
were imprecise.

Keep targets away from screen edges, and keep the primary action inside the
thumb arc — the lower half of the screen, on the side the user holds.

## Feedback must be immediate

**In the same frame**, before anything is saved or redrawn. Flip the visual
state optimistically, let the store catch up, and let the later redraw agree
with what is already on screen. Waiting for a write to confirm a tap is a
quarter-second of doubt every single time.

Pair a press with:
- **Visual** — a scale-down of ~0.96, or a background change on a row.
- **Sound** — short and dry, under ~200ms. Small actions stay small; if
  everything celebrates, nothing does.
- **Haptic** — where the platform has it.

**iPhone Safari has no vibration API.** There is no workaround. That is why
sound and haptic should be one call in your code: on Android you feel it, on
iOS you hear it, and on both the app answered.

Drop the pressed state if the finger moves more than ~10px — that gesture was
the start of a scroll, not a press. Native lists behave exactly this way and it
is very noticeable when an interface does not.

## Panels come from the bottom

A centred dialog is a desktop habit. On a phone, panels rise from the bottom,
carry a grab handle, and can be dragged or flicked away. They should also be
draggable from the content area when it is scrolled to the top, which is what
every native sheet does.

Build it as **one component with two shapes** — bottom sheet under ~640px,
centred card above — so the two cannot drift apart.

Animation: enter on `cubic-bezier(.32,.72,0,1)` at ~360ms (the iOS sheet
curve — leaves fast, lands soft). Honour `prefers-reduced-motion`.

Do not autofocus a text field in a sheet on a phone unless the sheet's entire
purpose is that one field. Otherwise the keyboard slams up over the panel the
instant it opens.

## Navigation and the back gesture

Android's back button and iOS's edge swipe both mean "one step back". One step
back should close the open overlay. Only when nothing is open should it leave
the screen.

Implement by having every overlay push a history entry and pop it on close.
Keep the stack balanced: if the overlay is closed by its own X button rather
than by the gesture, unwind the entry it pushed.

Primary navigation on a phone belongs in a **bottom bar**, not a row of small
buttons in the header. It is inside the thumb's reach and it is what people
expect.

## Forms and the keyboard

- Numbers go in a **text** input with `inputmode="numeric"` or `"decimal"`,
  never `type="number"`. A number input on a phone shows spinners nobody wants
  and discards half-typed values.
- Set `enterkeyhint` — `next` down a form, `done` on the last field, `search`
  on a search box. Wire Enter to actually do that.
- Set `autocapitalize`, `autocorrect` and `autocomplete` deliberately. A name
  field capitalises words; a search field does neither.
- Never let a focused input compute below 16px.
- Use the platform's own picker for dates, times and select lists. Restyle the
  closed state if you must; do not rebuild the picker.

## Scrolling

**One scrolling surface per screen.** A scrolling card inside a scrolling page
means two scrolls competing for one finger and the wrong one always wins. On a
phone let cards size to their content and let the page scroll.

Give the scrolling region `overscroll-behavior: contain` so its scroll does not
escape into whatever is behind it.

If a screen needs to scroll to show today's summary, the first question is not
"can this be smaller" but **"what on this screen is redundant"**. Shrinking to
fit is the reflex to distrust.

## Safe areas

`viewport-fit=cover` in the viewport meta is what makes `env(safe-area-inset-*)`
return anything other than zero. Without it, the insets are all 0 and you will
believe you have handled the notch when you have not.

Then: top padding on the header, bottom padding on the tab bar, and side
padding in landscape.

A trap worth knowing: if the app's column is `100vh` but the visible viewport
is shorter, a band of page background appears below the tab bar — a stripe of
the wrong colour above the home indicator that no native app has. Fix by giving
the root element the bar's colour and measuring in `dvh`.

## Gestures

Add these only where they carry weight; an interface full of hidden gestures is
worse than one without.

- **Swipe a row** to reveal delete or archive. Always keep a visible route to
  the same action — a menu, a mode — because a gesture is not discoverable.
- **Pull to refresh** only where there is remote data to refresh. On a local
  app it is decoration.
- **Long press** for a contextual menu, not for anything destructive.

## Never destroy without a way back

Deleting shows a snackbar naming what went, with **UNDO**, for about six
seconds. This is not politeness — it is what makes a one-tap delete safe enough
to be one tap.

## What you cannot check from a desktop

Be explicit about this. Driving a phone-sized browser window with emulated
touch catches layout, sizing, target size, gesture logic and behaviour. It does
not catch:

- how scroll momentum and rubber-banding actually feel
- whether the share sheet appears
- whether sound plays with the ring/silent switch flipped
- whether audio resumes after backgrounding
- real haptics
- how a font renders on the device

Say which claims are measured and which are reasoned. Never report that
something "works on iOS" from a desktop browser.
