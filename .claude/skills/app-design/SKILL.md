---
name: app-design
description: >
  Designing or reviewing any interface — screens, layouts, components, themes,
  settings panels, empty states, forms, dashboards. Use this whenever the work
  touches how something LOOKS or FEELS to use, not just whether it functions:
  building a new screen, adding a component, "make this look better", "this
  feels off", "this feels like a website", fixing spacing or colour or type,
  reviewing a design against a screenshot, or choosing between layout options.
  Also use it when someone reports a vague visual complaint ("too cramped",
  "hard to read", "looks unfinished", "doesn't feel native") — those are design
  diagnoses, and this skill is how to make them specific. Applies to touch and
  pointer interfaces alike; it says which rules are shared and which are not.
  Do not skip it because a change seems small: a single hard-coded colour or a
  36px tap target is exactly the kind of thing it exists to catch.
---

# App design

Interfaces get called "well designed" when their **hierarchy** is right and
their **decisions come from systems** rather than from taste applied one
element at a time. Almost everything else follows from those two.

This skill is the method. The detail lives in four reference files — read the
ones the task needs rather than all of them.

| Read this | When |
|---|---|
| `references/foundations.md` | Always. Hierarchy, spacing, type, colour, depth. Surface-independent. |
| `references/mobile.md` | The thing runs on a phone or tablet, or anyone says "native" / "feels like a website". |
| `references/browser.md` | The thing runs on a desktop with a mouse and keyboard. |
| `references/motherbase.md` | Working inside this repo. The actual tokens and components. |

Most work needs `foundations.md` plus **one** interaction file. A design that
must do both reads both — but build the touch version first, because touch is
the harder constraint and a pointer can always use a touch-sized target.

## The order of work

Doing these out of order is the single most common way design work stalls.

**1. Start with a feature, not a shell.** Design "logging a set" before you
design the navigation. Until a few real features exist, there is no
information on which to base a decision about the shell. Starting with the
nav bar is how people get stuck.

**2. Work in greyscale first.** Forcing yourself to establish hierarchy with
size, weight, spacing and contrast alone produces a clearer interface, and one
that is easy to enhance with colour afterwards. Reaching for colour early hides
a weak hierarchy instead of fixing it.

**3. Then colour, depth and finish.** Only once the greyscale version reads
correctly.

**4. Detail comes last.** Typeface, shadow and icon decisions matter, but not
before the layout is settled.

## What "hierarchy" actually means

Every element is primary, secondary or tertiary. Say which, out loud, before
styling anything. Then:

- **Don't do it all with font size.** Oversized primary text and unreadably
  small secondary text is the classic failure. Use **weight** and **colour**
  to carry most of the difference and keep sizes reasonable.
- **Two weights is enough** — a normal (400–500) and a bold (600–700). Nothing
  under 400; to de-emphasise, use a softer colour or a smaller size, never a
  thinner stroke.
- **Two or three text colours** — primary, secondary, tertiary.
- **Emphasise by de-emphasising.** When the important thing won't stand out,
  the fix is usually to quieten what surrounds it, not to shout louder.
- **Balance weight against contrast.** Icons and bold text cover more surface
  area, so they read as emphasised whether or not you meant it. Give a heavy
  element a softer colour to compensate; give a too-subtle 1px border more
  width rather than a darker colour.

## Systems, not judgement calls

If you are deciding between 13px and 14px, the problem is not the decision, it
is that you are making it at all. Every dimension in an interface should come
from a short scale defined in advance: spacing, type size, weight, line-height,
colour shades, radii, border widths, shadows, opacity.

The rule that makes a scale useful: **no two adjacent steps within about 25% of
each other.** A linear scale ("multiples of 4") does not help, because it still
leaves you choosing between 120 and 124. When steps are far enough apart, one
option is obviously right and the rest are obviously wrong.

To pick from a scale: guess, then try the step either side. If both neighbours
look worse, you are done.

`foundations.md` has the actual numbers.

## Reviewing an existing screen

When given a screenshot or a live screen and asked what's wrong, go in this
order — it moves from causes to symptoms, so early fixes often dissolve later
complaints:

1. **What is redundant?** Two elements saying the same number, a label that
   repeats its value, a card that restates the one above it. Deleting beats
   restyling, and it is the fix people least expect.
2. **Is the hierarchy legible?** Squint. Can you tell what matters?
3. **Is anything off-system?** Hard-coded colours, sizes that aren't scale
   steps, a third font weight.
4. **Is the spacing ambiguous?** More space *around* a group than *within* it,
   always. Where that is violated, the interface is genuinely harder to parse,
   not merely uglier.
5. **Then the interaction layer** — the mobile or browser reference file.

A complaint of "it's cramped" or "still scrolling" is a symptom. Look for what
should not be on the screen at all before making what's there smaller. Shrinking
things to fit is the reflex to distrust.

## Words are part of the design

Language sets personality as strongly as typeface or colour does, and it is
usually the cheapest thing to fix.

- **Labels are a last resort.** `$19.99` and `jane@example.com` need no label.
  Where a label helps, fold it into the value — "12 left in stock", not "In
  stock: 12" — so the unit can be styled as one thing.
- Where a label genuinely is needed (a dashboard, scannable data), it is
  *supporting* content: smaller, softer, lighter than the value it labels.
- **Say each thing once.** "₱242 of food eaten" above a list of food eaten is
  the same sentence twice.
- Cut explanation that only restates what the control obviously does. If a
  setting needs a paragraph, the paragraph belongs in a code comment and the
  setting needs a better name.

## The finishing pass

Cheap moves that make a plain-but-correct design look designed:

- **Supercharge the defaults** — icons instead of bullets, real styled
  checkboxes instead of browser ones, a considered link treatment.
- **Accent borders** — a coloured bar across the top of a card, beside an
  alert, under the live nav item. No illustration talent required.
- **Use fewer borders.** Before adding a line, try a different background
  colour, a shadow, or simply more space. Borders accumulate into noise.
- **Don't rely on colour alone.** Red/green needs an icon, a sign or a word
  next to it. For chart series, differing *contrast* separates better than
  differing *hue* for a colourblind reader.
- **Empty states matter most.** They are the first thing a new user sees. Say
  what to do next, not "no data".

## Honesty about what you have checked

Design claims are easy to make and easy to get wrong. Distinguish:

- **Measured** — you read the computed value, the rendered size, the contrast
  ratio.
- **Reasoned** — it follows from the code but you did not see it render.
- **Unverifiable here** — anything about how a real device actually feels.

Say which. "The tap target is 44px" and "the tap target should be 44px" are
different statements, and only one of them is a check.
