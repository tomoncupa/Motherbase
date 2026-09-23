# Effects: the showpiece layer

Motion and canvas effects are the last layer, never the first. This skill's
rules are Refactoring UI's: hierarchy, systems, restraint. Effect libraries
sit outside that book, and this file says where they are allowed in.

Reference library: **ObsidianUI** (obsidianui.dev), read 2026-09-23. About 30
copy-paste effects in React, TypeScript, Tailwind and Motion. It has no
buttons, forms, tables or dialogs. Its effects fall into four families:

| Family | Examples |
|---|---|
| Cursor | butterfly trail, rope cursor, colour aura, magnetic image trail |
| Scroll | scroll stack, parallax gallery, marquee on an SVG path |
| Text | text fill, rectangular reveal, text stream, flip text, blur reveal |
| Canvas | dither canvas, fractal glass, SVG pixel reveal, book flip |

## Where effects are allowed

- **Motherbase apps: none of these.** Hard constraint 1 (no framework, no
  build) rules the library out, and an app's job is logging, not showing off.
  Motion inside an app follows `mobile.md`: transform and opacity only, about
  360ms, and nothing but a finisher past about 200ms, the same as sound.
- **Public pages (the Automagic Calculator, a landing page, a portfolio):
  one effect per page, at most.** It goes on the moment that sells: the hero
  or the result reveal. Rewrite it in plain JavaScript, dress it in Block
  tokens, and never install the library.

## Rules for the one effect

1. **The greyscale page must already work.** An effect on a weak hierarchy
   makes it louder, not stronger (see "Decorating instead of prioritising").
2. **Phone first.** Tom's audience arrives from Reels on phones. Cursor effects
   do nothing there, so a cursor effect can only be a desktop extra and never
   the page's one effect. Prefer scroll, text and on-load effects.
3. **Play once, then get out of the way.** A reveal that runs on load or on
   first scroll into view. Nothing that keeps moving behind text the reader is
   trying to read.
4. **Honour `prefers-reduced-motion`.** With it on, the page appears in its end
   state with no motion.
5. **Content never waits on it.** If the script fails, the text and the button
   are already there.
6. **Canvas effects cost battery and frames.** Measure on a phone-width run
   before keeping one, and pause it when it is off screen.

## Picking one

Match the effect to the brand register: serious and rare. A single text reveal
on the hook line, or a scroll stack for before-and-after client results, suits
it. A trail of butterflies behind the cursor does not.
