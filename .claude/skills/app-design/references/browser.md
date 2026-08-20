# Browser — designing for a pointer and a keyboard

Read this when the interface runs on a desktop. Hierarchy, spacing, type and
colour come from `foundations.md`; this file is only what changes when the
input device is a mouse and a keyboard rather than a thumb.

## Contents

- [What a pointer buys you](#what-a-pointer-buys-you)
- [Keyboard](#keyboard)
- [Density and information](#density-and-information)
- [Tables](#tables)
- [Forms](#forms)
- [Layout and width](#layout-and-width)
- [Pointer feedback](#pointer-feedback)
- [Windows change size](#windows-change-size)
- [What belongs to the browser](#what-belongs-to-the-browser)
- [Serving both surfaces](#serving-both-surfaces)

---

## What a pointer buys you

A mouse is precise, hovers, and has a wheel that can be aimed. That unlocks
four things touch cannot have — and they are the *only* things worth designing
differently for. Everything else should be shared.

**1. Hover as a real channel.** Row highlights, revealed actions, tooltips,
previews. Guard every one:

```css
@media (hover:hover) and (pointer:fine){ .row:hover{ … } }
```

Unguarded, a hover state latches after a tap on a touch screen and reads as a
bug. This guard is what lets one stylesheet serve both surfaces honestly.

Hover may **reveal** an action but must never be the only way to discover it.
Anything hover-only is invisible to a keyboard user and to anyone who has not
happened to move the mouse there.

**2. Smaller targets.** 24–32px is comfortable with a mouse. Density is a
*feature* on a desktop — a table showing forty rows beats one showing eight.
Do not ship phone-sized controls to a laptop out of tidiness.

**3. Aimed scrolling.** A scroll region inside a page works here, because the
cursor selects which one. Fixed-height cards with inner scroll are a legitimate
desktop pattern and a bad phone pattern.

**4. Right-click and drag.** Context menus and drag-to-reorder are natural.
Both are mouse affordances — give touch an explicit alternative (an edit mode,
a menu) rather than trying to make the drag work with a finger.

---

## Keyboard

A desktop interface that cannot be driven from the keyboard is unfinished. This
is the half of desktop design most often skipped.

- **Visible focus.** Use `:focus-visible` so the ring shows for keyboard users
  and not on mouse click. Never `outline: none` without a replacement. The ring
  needs 3:1 contrast against both the control and the background.
- **Logical tab order** following visual order. If they disagree, the DOM order
  is wrong — fix that rather than reaching for `tabindex`. Positive `tabindex`
  values are almost always a mistake.
- **Escape closes** the top-most overlay only. **Enter** submits the focused
  form. **Space** activates a focused button.
- **Trap focus inside a modal** while open, and **return focus** to whatever
  opened it on close. Losing focus to the top of the document is disorienting
  and a very common bug.
- **Shortcuts** for anything done repeatedly, plus somewhere that lists them.
  A `kbd` hint beside a menu item teaches the shortcut at the moment of use,
  which is the only time anyone reads it.
- **Arrow keys** within a composite widget — a list, a grid, a segmented
  control, a menu. Tab moves *between* widgets; arrows move *inside* one.
- **Never trap the user.** If a component takes over arrow keys or Tab, Escape
  must get them out.

---

## Density and information

The defining difference from a phone is that you can show more at once, and
usually should. The failure mode on desktop is not clutter — it is a phone
layout stretched across 1400px, with three items floating in a sea of grey.

Use the width for **more information**, not for bigger information:
a sidebar, a detail pane beside the list, more columns, an inline preview.

Master–detail beats drilling in and back out when the user is comparing things
— which on a desktop they usually are.

Consider offering comfortable/compact density if the app is data-heavy and
used all day. People who live in an app want it dense.

---

## Tables

Desktop is where tables earn their place. They are also where design effort
most reliably pays off.

- **Right-align numbers**, left-align text, and use tabular figures
  (`font-variant-numeric: tabular-nums`) so digits form columns.
- **Header row sticky** on scroll. If rows are grouped, group headers too.
- **Do not put every field in its own column.** Two related fields can be one
  cell with hierarchy inside it — name above, email below in a softer colour.
  This is usually more scannable than eight thin columns.
- **Row actions** may appear on hover, but must also be reachable from a
  keyboard and from a per-row menu.
- **Zebra striping is usually unnecessary** — adequate row height and a light
  divider read cleaner. Stripe only when rows are dense and wide.
- **Sort and filter state must be visible.** A table silently showing a subset
  is a source of real mistakes.
- Column widths: let content decide, but stop them jumping between renders.

---

## Forms

- **Labels above fields**, not beside them: it scans faster, survives
  translation, and does not break at narrow widths.
- **One column.** Multi-column forms cause skipped fields. Exceptions are
  genuinely paired values — city/postcode, first/last, expiry/CVC.
- **Group related fields** with more space between groups than within them.
  This is the ambiguous-spacing rule doing real work.
- **Validate on blur, not on keystroke.** Telling someone their email is
  invalid while they are typing the third character is hostile. Re-validate on
  keystroke *after* it has already failed once, so they see it clear.
- **Errors go next to the field**, and say what to do, not what happened.
- **Never disable the submit button** because the form is incomplete. It gives
  no feedback about what is missing. Let them submit and show them.
- **Field width should signal expected length.** A postcode field the width of
  the page is a small lie about what goes in it.

---

## Layout and width

**Line length still rules.** A 27-inch monitor is not permission to run
paragraphs 200 characters wide. Constrain reading columns to 45–75 characters
even when the container is far wider.

**Breakpoints follow content, not devices.** Add one where the layout starts to
look wrong. Design the narrow case first: it is the harder constraint and it
forces the priority order to be settled.

**Prefer intrinsic layout to breakpoints** where you can. `flex-wrap`,
`grid-template-columns: repeat(auto-fit, minmax(…, 1fr))` and `clamp()` handle
most responsiveness with no breakpoint at all, and behave correctly at widths
you never tested.

**Container queries** where a component is reused at different widths — a card
in a sidebar and the same card in a main column should respond to *their*
width, not the viewport's.

---

## Pointer feedback

The desktop equivalent of a press state:

- `cursor: pointer` on anything clickable, and the honest cursor elsewhere —
  `text`, `grab`/`grabbing`, `col-resize`, `not-allowed`.
- A **hover** state meaning "this responds" *and* an **active** state meaning
  "this is being pressed". Both, not one.
- Shadows can carry interaction: raise an item on grab, flatten a button on
  press. That is the elevation ladder in `foundations.md` doing work.
- Transitions of 100–200ms. Long enough to perceive, short enough not to wait.
- **Tooltips** after ~500ms, never on something whose label is already visible,
  and never containing information required to complete the task.

---

## Windows change size

Unlike a phone, a desktop window resizes continuously and unpredictably.

- Test the awkward middle widths, not only the breakpoints.
- Survive a short, wide window — a laptop with dev tools open is roughly
  1280×400. Sticky header plus sticky footer leaves nothing there.
- Zoom to 200%. Layout should reflow, not clip. This is an accessibility
  requirement, not a nicety.
- Two windows side by side is a normal desktop behaviour; half a screen is a
  real width your layout will meet.

---

## What belongs to the browser

Fighting these is what makes a web app feel wrong on a desktop:

- **Back and forward.** Real navigation changes the URL. Anything else and the
  back button lies — which is worse than it not working.
- **Deep links.** A screen worth returning to deserves an address.
- **Text selection.** Never disable it on content. Disable it only on chrome
  the user might drag — buttons, tab bars.
- **Find-in-page.** Virtualised lists break Ctrl+F. Worth it only when the list
  is genuinely huge, and worth saying so.
- **Open in new tab.** Navigation should be a real `<a href>` wherever it can
  be, so middle-click and Cmd-click work.
- **Zoom, reader mode, autofill, password managers, translation.** Do not
  suppress them. Custom inputs that break autofill cost more than they add.
- **The scrollbar.** Keep it on desktop; it is a position indicator. Hide it
  only under `@media (pointer:coarse)`.

---

## Serving both surfaces

Most real screens do. The approach that works:

1. **Build the touch version first.** It is the harder constraint, and a
   pointer can always use a touch-sized target — the reverse is not true.
2. **Add pointer affordances behind media queries**, never as the base layer.
   Hover, tighter density, inner scroll regions, resize handles.
3. **Make one component take two shapes** rather than shipping two components.
   A bottom sheet under 640px and a centred card above is one dialog with one
   behaviour — which is precisely why the two cannot drift apart. Two
   components with the same job will always diverge, and the divergence is
   never noticed until a user reports it.
4. **Gate mouse-only gestures on `matchMedia('(pointer:fine)')` in JS** as well
   as CSS, and give touch an explicit alternative that does the same job.
5. **Do not detect devices.** Detect *capabilities* — `hover`, `pointer`,
   `prefers-reduced-motion`. A touchscreen laptop and an iPad with a trackpad
   both exist, and both break user-agent sniffing.
