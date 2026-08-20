# States — where designs actually break

A component designed against three items of medium-length text is not a
component, it is a screenshot. Most redesigns are forced later by a state
nobody thought about: the list was empty, the name was 60 characters, the
request failed.

Work this list while building, not after. It is cheap now and expensive later.

## The checklist

For every component that shows data:

| State | The question |
|---|---|
| **Empty** | Nothing yet. What does a new user see? |
| **One** | A single item. Does the layout still make sense? |
| **Many** | 500 items. Does it stay usable and fast? |
| **Too long** | A 60-character name. Wrap, truncate, or scroll? |
| **Too short** | A 1-character name, a 0 value, a blank field. |
| **Loading** | It has been asked for but has not arrived. |
| **Error** | It failed. Can they recover from inside the interface? |
| **Partial** | Some fields missing — no photo, no price, no date. |
| **Stale** | Shown from cache while something newer is fetching. |
| **Interactive** | Default, hover, focus, active, disabled, selected. |

---

## Empty

The most important state and the least designed. It is the first thing every
new user sees, and it is the *only* thing they see until they act.

An empty state should say what goes here and how to put something there. Not
"No data." Not an illustration with no instruction.

```
Bad:   No entries.
Bad:   Nothing to see here 🤷
Good:  Nothing logged today. Press + and it appears here —
       and anything you tick shows up in every other app too.
```

Distinguish two different empties, because they need opposite responses:

- **First run** — nothing exists yet. Teach and invite: what this is for, one
  clear action.
- **Filtered to nothing** — things exist but the current filter excludes them
  all. Say so, and offer to clear the filter. Showing the first-run message
  here is confusing and slightly insulting.

## One item

A grid built for a full row often looks broken with a single item stretched
across it, or marooned in the corner. Decide which, deliberately. A list of one
usually should not show a count, a sort control, or a filter.

## Many items

- Does the page stay responsive? Rendering 5,000 rows will not.
- Is there a way to find one — search, filter, sort, jump-to-letter?
- Do sticky headers still make sense after long scrolling?
- Virtualising breaks find-in-page and in-page anchors. Worth it only when the
  list is genuinely large; say so if you do it.

## Text that is too long

Decide per element rather than globally:

- **Truncate** with an ellipsis where the beginning identifies the item and the
  full value is available on tap or hover. Give the element `min-width: 0`
  inside a flex row or it will refuse to shrink and push its siblings off.
- **Wrap** where the whole value matters. Then check the container grows
  gracefully and neighbouring items in a grid stay aligned.
- **Clamp** to a fixed number of lines for descriptions.

Test with a long unbroken string (a URL, a German compound) as well as long
normal text — they break differently. `overflow-wrap: anywhere` is the fix for
the unbroken case.

Numbers need their own thought: 7 digits where you designed for 3 will blow a
tile apart. Decide whether to abbreviate (12.4k), shrink, or let it wrap.

## Loading

Match the treatment to the wait:

- **Under ~300ms** — show nothing. A spinner that flashes is worse than no
  spinner; it reads as a glitch.
- **300ms to a few seconds** — a skeleton in the shape of the eventual content,
  so the layout does not jump when it arrives. Skeletons beat spinners because
  they preserve position.
- **Longer, or unknown** — progress, and something that says what is happening.
- **Instant local writes** — no loading state at all. Update optimistically and
  reconcile. On a local-first app almost nothing should have a spinner; if it
  does, ask why the work is not happening immediately.

Never let a loading state shift the layout when it resolves. Reserve the space.

## Error

An error state has three jobs: say what went wrong in the reader's language,
say whether their data is safe, and give them a way forward.

```
Bad:   Error: request failed (500)
Bad:   Something went wrong.
Good:  Could not reach the sheet. Nothing was lost — it will try again
       next time. [Try now]
```

Put the message where the failure happened — inline, next to the field or the
panel — not in a global banner that makes them hunt for it. Reserve a dialog
for something they must act on before continuing.

Distinguish *this failed* from *this is empty*. They look similar and mean
opposite things.

## Interactive states

Every control needs all of these, and missing one is immediately felt:

- **Default** — at rest.
- **Hover** (pointer only, guarded behind `@media (hover:hover)`) — "this
  responds".
- **Focus** — visible, via `:focus-visible` so it appears for keyboard users
  and not on mouse click. Never remove the ring without replacing it.
- **Active/pressed** — "this is happening now". On touch this is the main
  feedback channel and must not be skipped.
- **Disabled** — obviously inert, and ideally accompanied by why. A disabled
  button with no explanation is a dead end.
- **Selected/current** — for tabs, nav items, list selection. Must not rely on
  colour alone.

## A quick way to test all of this

Before calling a component done, run its data through the extremes in the
browser: empty array, one item, 500 items, a 60-character string, a 9-digit
number, a null in each optional field. It takes a minute and catches most of
what would otherwise come back as a bug report.

If the framework has no way to do that, that is itself worth fixing — being
unable to see your own edge cases is why they ship.
