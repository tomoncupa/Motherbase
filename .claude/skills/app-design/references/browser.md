# Browser — designing for a pointer and a keyboard

Read this when the interface runs on a desktop. Hierarchy, spacing, type and
colour come from `foundations.md`; this file is only what changes when the
input device is a mouse and a keyboard rather than a thumb.

## What a pointer buys you

A mouse is precise, hovers, and has a scroll wheel that can be aimed. That
unlocks four things touch cannot have — and they are the *only* things worth
designing differently for.

**1. Hover as a real channel.** Row highlights, revealed actions, tooltips,
previews. Guard every one of them:

```css
@media (hover:hover) and (pointer:fine){ .row:hover{ … } }
```

Unguarded, a hover state latches after a tap on a touch screen and reads as a
bug. This guard is what lets one stylesheet serve both surfaces honestly.

**2. Smaller targets.** 24–32px is comfortable with a mouse. Density is a
feature on a desktop — a dense table that shows forty rows beats a spacious one
that shows eight. Don't ship phone-sized controls to a laptop out of tidiness.

**3. Aimed scrolling.** A scroll region inside a page is fine here, because the
user can put the cursor in the one they mean. Fixed-height cards with inner
scroll are a legitimate desktop pattern and a bad phone pattern.

**4. Right-click and drag.** Context menus and drag-to-reorder are natural.
Both are mouse affordances — provide an explicit alternative for touch rather
than trying to make the drag work with a finger.

## Keyboard

A desktop interface that cannot be driven from the keyboard is unfinished.

- **Visible focus.** Use `:focus-visible` so the ring appears for keyboard
  users and not on mouse click. Never `outline: none` without a replacement.
- **Logical tab order**, following the visual order. If they disagree, the DOM
  order is wrong, not the tab order.
- **Escape closes** the top-most overlay. **Enter** submits.
- **Shortcuts** for anything done repeatedly, and somewhere that lists them.
  A `kbd` hint next to a menu item teaches the shortcut at the moment of use.
- **Trap focus inside a modal** while it is open, and return focus to whatever
  opened it on close.

## Layout

**Line length still rules.** A 27-inch monitor is not permission to run
paragraphs 200 characters wide. Constrain reading columns to 45–75 characters
even when the container is far wider.

**Don't fill the screen just because it is there.** Wide layouts work when the
extra width carries *more information* — more columns, a sidebar, a detail
pane. Stretching the same content wider only makes it harder to read.

**Breakpoints follow content.** Add one where the layout starts to look wrong,
not at a device width from a list. Design the narrow case first: it is the
harder constraint and it forces the priority order to be settled.

**Density is a real axis.** Consider offering comfortable/compact if the app is
data-heavy and used all day.

## Pointer feedback

The desktop equivalent of a press state:

- `cursor: pointer` on anything clickable, and the right cursor elsewhere —
  `text`, `grab`/`grabbing`, `nwse-resize`, `not-allowed`.
- A hover state that reads as *"this responds"*, and an active state that reads
  as *"this is being pressed"*. Both, not one.
- Shadows can carry interaction: raise an item on grab, flatten a button on
  press. That is the elevation ladder in `foundations.md` doing work.
- Transitions of 100–200ms. Long enough to perceive, short enough not to wait.

## Windows change size

Unlike a phone, a desktop window resizes continuously and unpredictably.

- Test at the awkward middle widths, not just the breakpoints.
- Content must survive a very short, wide window — a laptop with dev tools open
  is roughly 1280×400.
- Anything sticky must not eat a short viewport. A sticky header plus a sticky
  footer on a 400px-tall window leaves nothing.
- Zoom to 200%. Layout should reflow rather than clip.

## Things that belong to the browser, not to you

Fighting these is what makes a web app feel wrong on a desktop:

- **Back and forward.** Real navigation changes the URL. Anything else and the
  back button lies.
- **Deep links.** A screen worth returning to deserves an address.
- **Text selection.** Do not disable it on content. Disable it only on chrome
  the user might drag — buttons, tab bars.
- **Find-in-page.** Virtualised lists break Ctrl+F. Worth the trade only when
  the list is genuinely huge.
- **Open in new tab.** Navigation should be real `<a href>` where it can be, so
  middle-click and Cmd-click work.
- **Zoom and reader mode.** Don't suppress them.
- **The scrollbar.** Keep it on a desktop; it is a position indicator, not
  clutter. Hide it only under `@media (pointer:coarse)`.

## When one design serves both

Most of this repo's screens do. The approach that works:

1. **Build the touch version first.** It is the harder constraint, and a
   pointer can always use a touch-sized target — the reverse is not true.
2. **Add pointer affordances behind media queries**, never as the base layer.
   Hover, tighter density, inner scroll regions, resize handles.
3. **Make the same component take two shapes** rather than shipping two
   components. A bottom sheet under 640px and a centred card above it is one
   dialog with one behaviour, which is why they cannot drift.
4. **Gate mouse-only gestures on `matchMedia('(pointer:fine)')`** in JS as well
   as CSS, and give touch an explicit alternative — an edit mode, a menu — that
   does the same job.
