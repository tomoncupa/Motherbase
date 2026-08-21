---
name: app-design
description: >
  Use for any work on how an interface looks or feels, not just whether it
  functions — building a screen or component, restyling one, or diagnosing a
  complaint about one. Triggers include "make this look better", "this feels
  off / cramped / cluttered / unfinished", "feels like a website not an app",
  "why does this look bad", reviewing a screenshot or mockup, fixing spacing,
  colour, type, contrast or tap targets, designing an empty state or a form,
  choosing between two layouts, or building a theme or design system. Vague
  visual complaints are the strongest trigger of all: turning "it feels
  cluttered" into a specific, fixable cause is the main thing this does. Covers
  touch and pointer interfaces and says which rules are shared. Do not skip it
  for small changes — one hard-coded colour or one 36px tap target is exactly
  what it exists to catch.
---

# App design

Two things make an interface read as "designed": its **hierarchy** is right,
and its **decisions come from systems** rather than from taste applied one
element at a time. Nearly everything else follows.

Most design problems presented as visual problems are **content problems**.
Before restyling anything, check whether something should be deleted. This is
the single highest-value move in this skill and the one most often skipped.

## Which files to read

| Read | When |
|---|---|
| `references/foundations.md` | Always. Hierarchy, spacing, type, colour, depth. Surface-independent. |
| `references/states.md` | Building or reviewing any component. Empty, loading, error, overflow — where designs actually break. |
| `references/mobile.md` | Runs on a phone or tablet, or anyone says "native" / "feels like a website". |
| `references/browser.md` | Runs on a desktop with a mouse and keyboard. |
| `references/motherbase.md` | Working in this repo. The tokens, classes and API that already exist. |

Typical load: `foundations.md` + one interaction file. Something that must serve
both reads both — **but build the touch version first.** Touch is the harder
constraint, and a pointer can always use a touch-sized target; the reverse is
not true.

## Calibrate the effort

Not every task deserves a full pass. Match the work to the ask:

- **A one-line fix** ("this colour is wrong") — fix it, check it came from a
  token, stop. Do not audit the screen.
- **A reported complaint** ("this feels cluttered") — run *Diagnosing* below.
  The answer is usually one or two changes, not a redesign.
- **A new screen or component** — run *Building* below in order.
- **"Review this"** — run *Reviewing* below and report; do not start editing
  unless asked.

Over-serving is a real failure. A request to change a label is not an
invitation to restructure the screen.

---

## Job 1: Diagnosing a complaint

Vague complaints — cramped, cluttered, busy, hard to read, unfinished, feels
like a website — are symptoms. Work causes to symptoms, in this order. Early
steps often dissolve later ones, which is why the order matters.

**1. What is redundant?** Two elements showing the same number. A label that
restates its value. A card that repeats the one above it. A heading over a
single item. Explanatory text that says what the control already says.
**Deleting beats restyling**, and it is the fix least often reached for.

**2. Is the hierarchy legible?** Squint at it, or describe it aloud: what is
primary, secondary, tertiary? If everything is the same weight and colour,
that is the problem — not the spacing.

**3. Is anything off-system?** A hard-coded colour, a size that is not a step
on the scale, a third font weight, a one-off radius. Off-system values are
what makes a screen feel subtly wrong when nothing is obviously wrong.

**4. Is the spacing ambiguous?** More space *around* a group than *within* it.
Where that is violated the interface is genuinely harder to parse, not just
less pretty.

**5. Only now, the interaction layer.** Tap targets, hover, scroll, keyboard —
from `mobile.md` or `browser.md`.

### The trap

**"It's cramped" and "still scrolling" do not mean "make things smaller."**
They usually mean something is on screen that should not be. Shrinking to fit
is the reflex to distrust: it preserves the redundancy and costs you legibility
as well.

Worked case from this repo. A phone screen still scrolled after the summary
tiles were made smaller. The tiles were never the problem — beneath them sat a
card listing every multi-entry measure with its running total, and that total
was the same number already shown on the tile directly above. Deleting the card
removed the scroll *and* restored the tiles to full size. Two symptoms, one
cause, and the first attempt had made the screen worse.

---

## Job 2: Building something new

**1. Start with a feature, not a shell.** Design "logging a set" before the
navigation. Until a few real features exist there is nothing to base a shell
decision on. Starting with the nav bar is how design work stalls.

**2. Establish content and hierarchy in greyscale.** Assign every element
primary / secondary / tertiary and make that legible using size, weight and
contrast alone. Colour applied early hides a weak hierarchy instead of fixing
it.

**3. Handle every state before adding polish.** Empty, one item, many items,
long text, loading, error. See `states.md`. A component that only works with
three items of medium-length text is not finished, and finding that out later
usually forces a redesign.

**4. Then colour, depth and finish.** Accent, elevation, the finishing pass.

**5. Then check the interaction layer** for the surface it runs on.

---

## Job 3: Reviewing

Report findings, do not silently fix them. Order by severity — things that make
the interface unusable, then wrong, then unpolished. For each: what is wrong,
why it matters, and the specific fix. "Improve the spacing" is not a finding;
"the 12px gap between label and input equals the gap between fields, so it is
ambiguous which label belongs to which — use 8px within and 24px between" is.

Say what you **measured** versus what you **reasoned**. See *Honesty* below.

---

## What hierarchy actually means

- **Do not do it all with font size.** Oversized primary text next to
  unreadably small secondary text is the classic failure. Let **weight** and
  **colour** carry most of the difference and keep sizes moderate.
- **Two weights is enough** — normal (400–500) and bold (600–700). Nothing
  under 400. To de-emphasise, use a softer colour or a smaller size, never a
  thinner stroke.
- **Two or three text colours** — primary, secondary, tertiary.
- **Emphasise by de-emphasising.** When the important thing will not stand out,
  quieten what surrounds it rather than shouting louder. If a sidebar competes
  with the content, remove the sidebar's background rather than adding one to
  the content.
- **Balance weight against contrast.** Icons and bold text cover more surface
  area, so they read as emphasised whether or not you meant it. Give a heavy
  element a softer colour; give a too-faint 1px border more *width* rather than
  a darker colour.

## Systems, not judgement calls

Deciding between 13px and 14px is not a decision to make carefully — it is a
decision that should not exist. Every dimension comes from a short scale fixed
in advance: spacing, size, weight, line-height, colour shades, radii, border
widths, shadows, opacity.

The rule that makes a scale work: **no two adjacent steps within ~25%.** A
linear scale ("multiples of 4") does not help, because it still leaves you
choosing between 120 and 124. Steps far enough apart make one option obviously
right.

To pick: guess a step, then try the one either side. If both neighbours look
worse, you are done.

**When to break the system:** almost never, and never for taste. Legitimate
reasons are optical correction (a circular icon needs slightly more room than a
square one to look equally spaced), hitting a hard external constraint (44px
targets, 4.5:1 contrast), or aligning to something you do not control. If you
break it, say why in a comment — an unexplained off-scale value reads as a
mistake and gets "corrected" later.

---

## How this goes wrong

These are the characteristic failures of generated interface work. They are
listed because recognising them in your own output is faster than rediscovering
them from feedback.

**Adding where you should remove.** The instinct on "this needs work" is to add
— a heading, a hint, a divider, a badge, a card. Ask what could come off first.

**Explaining instead of clarifying.** Adding a sentence under a control to say
what it does. If a control needs explaining, it needs a better name. Put the
reasoning in a code comment, where it helps whoever maintains it, and keep it
off the screen.

**Decorating instead of prioritising.** Gradients, glows, blur, heavy shadows
and animation applied to make something "look designed". They make a weak
hierarchy louder, not stronger. If the greyscale version does not read, effects
will not save it.

**Uniform spacing.** The same gap everywhere destroys grouping. Spacing is how
you say what belongs together; making it consistent everywhere makes it say
nothing.

**Symmetrical emphasis.** Every element the same size, weight and colour,
neatly aligned — tidy and unreadable, because nothing tells you where to look.

**Too many accent colours.** One accent, used for one job. A second colour
needs a reason a reader could state.

**Centring everything.** Centred text is for short headings. Centred body copy
and centred left-aligned-in-spirit lists are harder to scan because every line
starts in a different place.

**Emoji as an icon set.** They render differently per platform, cannot take
your colour, and read as informal. Fine as a deliberate personality choice, not
as a default.

**Maximum radius on everything.** Corner radius is a personality decision: near
0 is formal, large is playful. Pick one and hold it. Mixing radii in one
interface almost always looks worse than either choice alone.

**Inventing a component that exists.** Check what the codebase already has
before building a new one. Two dialogs mean two behaviours to keep in step, and
they will drift.

**Claiming it works.** Saying a design "works on iOS" from a desktop browser,
or that contrast passes without computing it. See below.

---

## The voice

**Plain, one sentence, with a simple explanation.** That is the whole rule, and
each third of it is doing work.

**Plain** — say the thing. No jargon, no hedging, no cheerfulness. The reader
is an expert in his own life and a beginner in nothing that matters here.

**One sentence** — not two. This is the constraint that does the most, because
a second sentence is almost always the first one apologising for itself. If a
message genuinely needs two, the screen is the problem, not the message.

**With a simple explanation** — the fact alone is often useless. "2,150 vs
2,000" is data; "2,150, which is 150 over your target" is something you can act
on. The explanation is the clause that turns a number into a decision.

```
Too terse       2,150 kcal from macros · target 2,000
Too much        Your macros come to 2,150 kcal but your target is 2,000 — 150
                over. One of them needs changing.
Right           Your macros come to 2,150, which is 150 over your target.
```

Two more rules that follow from it:

- **Do not tell someone their own choice was wrong.** If nothing is set, the
  screen has nothing to correct; it has something to offer. "One of them needs
  changing" assumes a mistake. "You have 1,280 left to allocate" assumes a
  plan in progress. The second is almost always the truer reading.
- **No em dashes in anything on screen.** A comma or a full stop does the job,
  and it keeps app copy consistent with everything else he publishes.

## Words are part of the design

Language sets personality as strongly as typeface or colour, and it is the
cheapest thing to change.

- **Labels are a last resort.** `$19.99` and `jane@example.com` need none.
  Where one helps, fold it into the value — "12 left in stock", not
  "In stock: 12" — so the whole unit can be styled as one thing.
- Where a label is genuinely needed (scannable data, a dashboard), it is
  *supporting* content: smaller, softer, lighter than the value it labels. The
  exception is a spec table, where people scan for the label — there, lift the
  label and keep the value only slightly quieter.
- **Say each thing once.** "₱242 of food eaten" above a list of food eaten is
  the same sentence twice.
- Match the vocabulary to the reader. If the person using this does not read
  code, no jargon reaches the screen — say what a thing does before what it is
  called.

## The finishing pass

Cheap moves that make a correct-but-plain design look finished:

- **Supercharge the defaults** — icons instead of bullets, real styled
  checkboxes instead of browser ones, a considered link treatment.
- **Accent borders** — a coloured bar across the top of a card, beside an
  alert, under the active nav item. No illustration talent required.
- **Use fewer borders.** Before adding a line try a different background
  colour, a shadow, or more space. Borders accumulate into noise.
- **Never let colour be the only signal.** Red/green needs an icon, a sign or a
  word. For chart series, differing *contrast* separates better than differing
  *hue* for a colourblind reader.
- **Empty states matter most** — often the first thing anyone sees. Say what to
  do next, not "no data".

---

## Accessibility

Not a separate pass at the end — it is mostly the same work as good hierarchy,
which is why it is spread through the other files rather than quarantined here.
Where each part lives:

| Concern | Where |
|---|---|
| Contrast ratios, and how to compute them | `foundations.md` → Contrast |
| Never colour alone | `foundations.md` → Colour |
| Focus rings, tab order, focus trapping, arrow keys | `browser.md` → Keyboard |
| Target size | `mobile.md` → Touch targets |
| Text scaling to 200% without clipping | `mobile.md` → Text that scales |
| Disabled, selected and focus states | `states.md` → Interactive states |
| `prefers-reduced-motion` | `mobile.md`, and honour it anywhere you animate |

Three things worth stating once, because they are decisions rather than
details:

- **Semantics first.** A `<button>` that looks like a link still behaves like a
  button for a screen reader and a keyboard. Reaching for a `<div>` with a
  click handler creates work — role, tabindex, key handling — that the right
  element does for free. Choose the element for meaning, style it for
  hierarchy.
- **Do not remove what you do not replace.** `outline: none` without a
  replacement focus style, or `user-scalable=no`, each remove a capability
  someone depends on.
- **An icon-only control needs an accessible name.** `aria-label` costs one
  attribute and is invisible until it is the only thing there is.

## Verification: look at it

A design claim you have not looked at is a guess. The point of this skill is to
make the guesses good, not to make looking optional.

Render it and check the things that are actually checkable:

- Computed values — is that colour a token, is that size a scale step?
- Measured geometry — target sizes, whether a bar reaches the bottom of the
  viewport, whether a region actually scrolls.
- Contrast ratios — computed, not eyeballed.
- The extremes from `states.md` — empty, one, many, long, error.
- Both widths — a phone width and a desktop width, because several rules only
  mean something at one of them.

Prefer measuring over screenshotting where a number exists: "the tap target
computes to 44×44" is stronger evidence than a picture, and survives being
reported to someone who cannot see the screen.

---

## Honesty about what you checked

Design claims are easy to make and easy to get wrong. Label them:

- **Measured** — you read the computed value, rendered size, or contrast ratio.
- **Reasoned** — it follows from the code, but you did not watch it render.
- **Unverifiable here** — anything about how a real device actually feels:
  scroll momentum, haptics, share sheets, whether audio respects the silent
  switch, how a font renders on the hardware.

"The tap target is 44px" and "the tap target should be 44px" are different
claims and only one is a check. When someone cannot verify it themselves, an
unearned claim costs them real time — which is the whole reason the distinction
is worth the words.
