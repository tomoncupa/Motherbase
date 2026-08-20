# Foundations

The surface-independent half of interface design: hierarchy, spacing, type,
colour, depth. True on a phone, a laptop, a kiosk and a printed page.

Distilled from *Refactoring UI* (Adam Wathan & Steve Schoger) and adapted where
this repo has settled on something more specific.

## Contents

- [Spacing and sizing](#spacing-and-sizing)
- [Type](#type)
- [Colour](#colour)
- [Depth](#depth)
- [Layout](#layout)
- [Images](#images)

---

## Spacing and sizing

### The scale

```
4  8  12  16  24  32  48  64  96  128  192  256  384  512  640  768
```

Built from a 16px base, packed at the small end and spreading out at the large
end. At small sizes a few pixels is a third of the value and matters; at large
sizes it is invisible. **No two adjacent steps are within ~25%.**

### Start with too much white space

Then remove it until it looks right. Designs that begin cramped stay cramped,
because everything ends up fighting for room and nothing can be emphasised.

### Ambiguous spacing is a real bug

**More space around a group than within it.** Always. When the gap below a
label equals the gap below the input, the eye cannot tell which label belongs
to which field. This shows up in forms, in article headings, in bulleted lists,
and horizontally in toolbars — anywhere grouping is implied by proximity rather
than drawn with a border.

### You do not have to fill the screen

A wide screen is not an instruction to stretch everything across it. Give an
element the width its content wants and let the rest be empty. Shrinking a
control to fill a row it doesn't need is how interfaces end up looking like
spreadsheets.

### Relative sizing does not scale

Don't size everything as a percentage of everything else. A headline that is
"3× the body" is unreadable at large screen sizes and cramped at small ones.
As elements grow, their parts should grow at *different* rates — or not at all.
Padding, borders and icons usually stay put while text grows.

---

## Type

### The scale

```
12  14  16  18  20  24  30  36  48  60  72
```

Hand-picked rather than derived from a ratio, for two reasons: a modular scale
produces fractional sizes (31.25px) that browsers round inconsistently, and it
leaves gaps exactly where interface work wants a size — between 12 and 16, and
between 16 and 21.

Use `px` or `rem`, never `em`. `em` compounds through nesting, so a nested
element lands on a computed size that is not in your scale at all.

### Line length

45–75 characters. Roughly `20–35em`. Longer and the eye loses its place
returning to the left edge. If the surrounding container must be wider for
images or controls, constrain the *paragraph* anyway — mixed widths in one
column look more polished, not less.

### Line-height is proportional, and inversely so

Small text needs more; large text needs less. Body at 1.5–1.6; a large headline
is often fine at 1.0–1.2. Line-height should also rise with line *length* —
wide columns need up to 2.0, narrow ones are fine at 1.5.

### Letter-spacing

Leave it alone by default; the typeface designer already chose it. Two
exceptions worth making:

- **All-caps text** — every letter is the same height, so there is less to
  distinguish one from the next. Open it up (`0.05em`–`0.18em`).
- **Large headlines in a body typeface** — tighten slightly to imitate a
  purpose-built display face. Never the reverse: a display face does not
  become legible at 12px by adding tracking.

### Baseline, not centre

When text of different sizes sits on one line, align baselines rather than
centres.

### Semantics are separate from size

Pick `h1`/`h2`/`h3` for meaning and screen readers; style them for hierarchy.
A section title is usually *supporting* content and should often be small —
sometimes visually hidden entirely, because the content says what it is.

---

## Colour

### You need more colours than you think

A real palette is roughly:

- **8–10 greys** — the workhorses
- **5–10 shades each** of one or two primaries
- **5–10 shades each** of the accent colours: red, yellow, green, and any
  others the domain needs

### Define the shades up front

Never generate them on the fly with `lighten()` / `darken()` — that is how you
end up with thirty-five near-identical blues.

Build it like this: pick the **base** (the shade that works as a button
background), then the **darkest** (text) and the **lightest** (a tinted
background). Call them 500, 900 and 100. Fill in 300 and 700 as the honest
midpoints, then 200/400/600/800. Nine shades divides cleanly and is enough.

Trust your eyes over the arithmetic at the end. Just don't keep adding shades —
an unbounded palette is the same as no palette.

### Lightness kills saturation — compensate

In HSL, saturation has less visible effect as lightness approaches 0% or 100%.
So **raise saturation as lightness moves away from 50%**, or the light and dark
ends of a ramp look washed out.

### Change brightness by rotating hue

Every hue has an inherent perceived brightness. Yellow, cyan and magenta (60°,
180°, 300°) read bright; red, green and blue (0°, 120°, 240°) read dark. So you
can lighten a colour by rotating *toward* the nearest bright hue and darken it
by rotating toward the nearest dark one — which preserves intensity in a way
that changing lightness alone does not. This is what makes a yellow ramp go
warm and rich toward orange instead of dull brown.

Keep rotations under 20–30° or it stops reading as the same colour.

### Greys do not have to be grey

True grey is 0% saturation and it looks lifeless. Saturate toward blue for a
cool interface, toward yellow/orange for a warm one. Keep the temperature
consistent across the ramp, which again means raising saturation at both ends.

### Accessible does not mean ugly

Aim for 4.5:1 on body text, 3:1 on large text and meaningful non-text. When
light text on a coloured background fails, **darken the background** rather
than dulling the text — the design keeps its punch and passes.

### Don't use grey text on coloured backgrounds

Grey works on white because it blends toward the background. On a colour it
just looks muddy. Instead, tint the text *with the background colour* — pick a
lighter/darker shade of that same hue.

### Never let colour be the only signal

Red/green needs an icon, an arrow or a word. For multi-series charts, vary
contrast rather than hue — light-vs-dark survives colourblindness, red-vs-green
does not.

---

## Depth

### Emulate a single light source

Light comes from above. That means: a raised element casts a shadow *below*
it, and its top edge catches light (a subtle light 1px top border). An inset
element is the reverse — shadow at the top, highlight at the bottom.

### Shadows convey elevation, so build a ladder

Five steps is plenty. Small tight shadow = barely raised (a button). Medium =
sits above the page (a dropdown). Large soft = close to the viewer, demanding
attention (a modal).

Choose by asking *where on the z-axis does this sit*, not *which shadow looks
nice*.

### Shadows have two parts

```
0 1px 3px  rgba(0,0,0,.12), 0 1px 2px  rgba(0,0,0,.24)
0 3px 6px  rgba(0,0,0,.15), 0 2px 4px  rgba(0,0,0,.12)
0 10px 20px rgba(0,0,0,.15), 0 3px 6px  rgba(0,0,0,.10)
0 15px 25px rgba(0,0,0,.15), 0 5px 10px rgba(0,0,0,.05)
0 20px 40px rgba(0,0,0,.20)
```

The **large soft** part is the cast shadow from the light source. The **tight
dark** part is the ambient shadow trapped under the object's edge. As an object
rises, the contact shadow fades — which is why it is strong at step 1 and gone
entirely by step 5.

On a dark interface the same shadows need noticeably more alpha, because there
is less contrast available to see them against.

### Flat designs still have depth

Without shadows, use colour: a lighter surface advances, a darker one recedes.
Two background colours separate two regions perfectly well.

### Overlap elements to create layers

Letting a card cross a section boundary, or an avatar sit half over a header,
creates depth with no shadow at all and makes a layout feel considered.

---

## Layout

### Grids are overrated

Fixed 12-column thinking forces elements to widths they don't want. Give an
element the width its content needs; let some things be fixed-width and others
fluid. Not everything has to be a percentage of the container.

### Use fewer borders

Before adding a line, try: a **shadow** (outlines just as well, more quietly),
**two different background colours**, or **more space**. Every border you don't
draw is noise you don't have.

### Think outside the box

A dropdown does not have to be a list of links — it can have sections, columns,
supporting text. A table column can merge two related fields to create
hierarchy. Radio buttons can be selectable cards. Convention is a starting
point, not a constraint.

---

## Images

- **Text over an image needs consistent contrast** — a scrim, a gradient
  overlay, or a lower-contrast treatment of the image itself. It has to hold
  for *every* image, not the one you designed against.
- **Everything has an intended size.** Don't scale an icon up to be a hero
  graphic or shrink a photo into an icon slot; both look wrong.
- **Beware user-uploaded content.** Assume the wrong aspect ratio, a
  transparent background against your dark surface, and a much larger file
  than you expected. Constrain with `object-fit`, and give avatars a subtle
  inner border so a white-on-white upload still has an edge.
