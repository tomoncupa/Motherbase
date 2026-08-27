# DOCTRINE

`CLAUDE.md` says what the suite **is**: the data model, the constraints, the
things that must never break. This says what each app is **for**, and what
"good" means inside it.

The difference matters. A change can obey every rule in `CLAUDE.md` and still be
the wrong change, because it made an app worse at the one job it exists to do.
This is the document that catches that.

Read this before building a feature. Read `CLAUDE.md` before touching data.

---

## The four lenses

Every decision in every app gets held up to these four, in this order. The
order is the point: a convenient app that does the wrong job is worthless, and
a correct app nobody can face opening is also worthless, but you cannot fix the
second problem by making the first one worse.

**1. FUNCTION — what is this actually for?**
One sentence, no conjunctions. If it takes two sentences the app is two apps.
A feature that does not serve that sentence belongs somewhere else, or nowhere.

**2. UTILITY — does it earn its place?**
Every screen, control and field is a cost: something to look at, learn, and
scroll past forever. A thing earns its place by being used, not by being
reasonable. "Someone might want this" is not a reason. Ask what gets *deleted*
before asking what gets added.

**3. EXPERIENCE — can he tell what to do, and does it tell him the truth?**
Can a person work out what to do without being told? Does the screen say what
actually happened? Is the hierarchy legible at a glance — one primary thing per
screen, everything else quieter?

**4. CONVENIENCE — how few taps, without lying?**
Speed is the last lens, not the first, because the fast way is often the way
that guesses. A guess that is right nine times out of ten is a lie one time in
ten, and the tenth is in the log forever.

---

## The laws

These are cross-app. They were each written after something broke.

### 1. Ship vocabulary. Never ship prescription.

The most important line in this document, and the easiest one to get wrong,
because both halves look like "sensible defaults".

**Vocabulary** is a list of things that exist whoever you are. A bench press is
a bench press. Shipping it saves typing and assumes nothing, so ship all of it.
TRAIN opens with 111 movements.

**Prescription** is a claim about how a person should live. A morning routine
is not a fact about the world, it is an opinion about them — and shipping one
tells someone they are already behind before they have done anything. Tom,
2026-08-27: *"there should be no default blocks, not everyone will want a
morning routine — being forced feels grossly unpleasant."*

Between them sits a third thing, and BLOCK is where it lives.

**A skeleton** is a demonstration of the *shape*, not of the content. BLOCK
opens with one routine — Morning Routine: Brush Teeth, Weigh In, Track Data —
and about ten loose blocks in the bin. That is not telling anyone how to live.
It is showing them, in one glance, that blocks go inside routines and routines
go inside days, which no amount of empty-state prose teaches as fast.

The line is size and obviousness. Three blocks called Brush Teeth, Weigh In and
Track Data demonstrate a structure and take ten seconds to delete. Twenty
blocks across five routines is a life plan you did not ask for. If you cannot
clear it in under a minute, it has stopped being a skeleton.

**Where you ship nothing, the empty state does the work.** It says what the
thing is, why it is empty, and offers the one action that fills it. It is never
a dead end — if the only route out is "add an existing X" and no X exists, the
button makes one.

**Test:** wipe storage, open the app, and do the main thing. If you cannot, it
does not ship. TRAIN failed this for months: the create button sat below an
early return, and the form behind it refused because no categories existed and
nothing in the app could make one. BLOCK failed it within an hour of shipping
empty, for the same reason in a different place.

### 2. Defaults are generic, specifics are data

Set 2026-08-27. These apps are Tom's now and the community's later, so nothing
in a default may assume Tom. His lifts, routines and habits are things he
*enters*. A default is what a stranger would also want.

This is not a limitation. A default nobody has to delete is a better default.

### 3. Nothing that matters fails silently

`if (!thing) return;` on a lookup that was supposed to find something turns a
bug into a missing feature, and a missing feature gets reported as "I don't see
the option" rather than "this is broken" — which is a much longer road.

Three in one session: the note box was never focused (`#sheet` matched
nothing), tapping a field name did nothing (`.lbl` matched nothing), and Copy
Previous Workout answered "not built yet" for months because a placeholder
further down the file replaced the real one at load.

**Test:** a lookup that must succeed either throws or warns. It never shrugs.

### 4. Blank means blank

Never pre-fill a value that will be saved as though it was entered. Steps used
to open showing last week's number in the box you were about to type into;
pressing Save without noticing filed stale steps as today's.

Offering the last value is fine. It goes on a button that says what it is.

### 5. Only offer what applies

A control the thing cannot use is not shown. A weight has no half-life — it
does not wear off, and the box only invites a number that would make the tile
lie.

Hiding a control does not clear what is behind it. Hiding is a view; clearing
is a decision.

### 6. Reachable without being told

If the only way to find a control is to be told it exists, it does not exist.
A hidden gesture may be a *shortcut* to something visible, never the only route.

### 7. Order follows how you live

Lists sort the way the day runs, not the way the file was written. Where that
cannot be inferred, it is set once and remembered — and anything unset keeps
its manual place rather than being reshuffled.

### 8. Say it once

Two controls showing the same fact is the most common cause of "this feels
cluttered". BLOCK's header carried the date twice in two formats, the day's
name twice, and a button the menu already had. Deleting four things fixed it.

### 9. Share the shell, not the shape

Every app uses the shared foundation — the store, the themes, the sheet, the
backup. That is what stops six apps having six ideas about what a dialog is.

It does not follow that every settings screen should look the same. Tom,
2026-08-27: *"it feels a bit too forced if all their setting screens look the
same — ARC has node colours and STATUS has tracked stat colours, so don't force
unity for the sake of it at the cost of more important things."*

An app's own settings are its own. What is shared is shared because sharing it
is genuinely better, never because symmetry is tidy.

### 10. Setup, not a walkthrough

An app may ask what it genuinely cannot infer — TRAIN cannot guess kilograms or
pounds. One question, at the start, and **reachable again from settings
afterwards**, because a decision made in the first ten seconds is the one most
likely to be wrong.

No tours. No coach marks. No "tap here to continue". If a screen needs
explaining, it needs a better screen, and that is law 6.

### 11. Two entries beat a wrong guess

Where two apps could be describing the same thing, show both rather than
guessing they are one.

Writing "Train 2:45" in STATUS puts it on the home screen's day log. If BLOCK
also has a Training block today, both appear. That is accepted, not overlooked
— Tom called it an acceptable rare exception. The alternative is matching on a
name and silently hiding one of them, and a line you wrote that does not appear
is a much worse failure than a line that appears twice.

The same reasoning is why `tick` is the one shared row: one cell, one activity,
one day, and later save wins. Deduplication is only safe where the identity is
exact.

### 12. One fact, one row, one writer

From `CLAUDE.md`, repeated because it is the one that has already cost data.
Rows, never a blob. `tick` is the single deliberate exception.

### 13. The System is talking, not a person

Set 2026-08-28, after Tom rewrote fifteen strings and every single edit did
the same thing: **kept the fact, deleted the reason.**

The voice is his: *"like The System. Neutral and mildly helpful but not really
conversational. Dry but not necessarily human."* A status window in a game,
not a coach and not a friend. It tells you the state. It does not encourage
you, explain itself, or make observations.

Mine wrote the fact and then justified it, every time. That is the tell.

**The rules, and each one came out of a line he cut:**

**Say it and stop.** No clause beginning *because*, *so*, *which*, or any
other that explains a consequence.
> "Correcting protein does not touch them, because a corrected protein is
> usually a better label reading rather than a different quantity."
> → *Fixes the protein only.*

**No encouragement.** Not the app's job.
> "No streak running yet. One tick starts one." → *No streak data*

**No aphorisms.** A line that sounds quotable is a line being clever at the
reader.
> "The future is not a record." → *Tomorrow isn't here yet*

**Plain, common words.** The word the person already uses.
> "Buzz when the rest is up. Android only." → *Beep when timer is done.
> (Android only)* — and caveats go in brackets.

**One sentence where you wrote three.**
> "Everything lives in this browser, on this machine. No account, no server,
> nothing uploaded." → *Data is stored locally.*

**Sentence case.** Full stop only when it is a whole sentence. `Day complete`
has none; `No backups have been made.` has one.

**Failure: prefer silence, then bare fact.** Design so it cannot happen. Where
it can, say what happened and nothing else — no instructions, no apology.
*Sheet did not answer.* The exception is data at risk, where law 3 wins and it
must speak.

**A setting gets one help line, always, and always short.** One line under
every setting, so its absence never reads as an oversight. If the line needs
two sentences, the setting is named wrong.
> "How fast old data stops counting, so at 21 a reading from three weeks ago
> counts half." → *How fast old data stops counting*

**Test:** read it aloud. If any part of it is you explaining your reasoning to
the person, cut that part. What is left is the copy.

---

## The apps

Each is: what it is for, who is holding it and when, what good looks like, and
what it must never become.

### MAIN MENU — `index.html`

**Function.** Choose an app, and see whether today needs anything.

**In hand:** at a desk, several times a day, for two seconds at a time.

**Good looks like:** the dock order is his, the widgets answer "is anything
outstanding" without a tap, and nothing here duplicates what an app does
better. It is a hallway. Nobody should want to stay in it.

**Never:** a dashboard that grows features. Anything worth doing here is worth
doing in the app that owns it.

### STATUS — `status/` · phone

**Function.** Record what happened to your body and your money today.

**In hand:** standing up, one-handed, several times a day, often mid-task.

**Good looks like:** a measurement takes one tap to reach and one to enter. The
box is focused when it opens. What is offered comes from what he actually logs,
not from a list someone wrote once — the doses on a chip row are the last three
he took. Backfilling a past day is normal, never an exception.

**Typed, not picked.** A journal line is one field you type into, so a time
goes in the line: "Train 2:45" is a line that says Train and knows it is at
2:45. Only at the end of the line, so "Call Dan about the 2:45 train" is left
alone — a parser that eats part of what you wrote is worse than no parser.
Anything with a time on it reaches the home screen's day log.

**No links here.** Tom's call: BLOCK's notes take them, STATUS's do not. A
journal line is something you wrote, not somewhere you go.

**Never:** a form. The moment logging a number feels like filling something in,
the capture rate falls and every downstream estimate degrades with it.

### TRAIN — `train/` · phone

**Function.** Log sets at the gym, and know whether you are getting stronger.

**In hand:** between sets, sweaty, one hand, sometimes with a bar still racked.

**Good looks like:** a full movement list on first open, editable and
extendable, and no dependence on having come from anywhere else. Weight and
reps are two taps. A repeated session says how it went against the one it was
copied from, per exercise and overall — because that is the entire reason for
repeating it.

**It takes your history from wherever it is.** FitNotes' own backup file, and a
spreadsheet from anything else — Strong, Hevy, JEFIT all export a row per set
and only disagree about column names. Whatever it cannot match it says so and
imports the rest, because a log 90% across beats a log 0% across with a tidy
error message.

**Never:** a programming tool. Building the plan is BLOCK's job and the coach's
job. This records what was lifted.

### BLOCK — `block/` · desktop

**Function.** Build a day out of blocks, and see whether it held.

**In hand:** sitting down, planning a day or a week, with a mouse.

**Good looks like:** blocks group into routines, routines group into days —
that hierarchy is visible in the furniture, not just the data. A day can be a
repeating template or a one-off pinned to a date. A block can be marked not
needed, which is neither done nor owed.

**It ships a skeleton, not a plan.** See law 1. One routine and a handful of
plain blocks, enough to show that blocks go in routines and routines go in
days, small enough to clear in a minute. Notes take links, because a block is
often a thing you do *to* a document.

**Never** a prescribed day. The difference between demonstrating a structure
and telling someone how to live is a real line, and it is drawn at about three
blocks.

**Never:** a calendar. It does not own time, it owns intent.

### ARC — `arc/` · desktop

**Function.** Think on a canvas until the shape of the idea appears.

**In hand:** sitting down, at length, in one long session.

**Good looks like:** nothing between the thought and the node. Every structural
idea — parent, link, rank, collapse — is one gesture. It carries images because
thinking is not only words.

**Never:** a note-taking app. The value is the *shape*, not the text.

### FORM — `form/` · desktop

**Function.** Watch two lifts side by side and say what is different.

**In hand:** at a desk, reviewing a client's video against a reference.

**Good looks like:** two clips in sync in seconds, frame-accurate stepping,
annotation that survives playback. Video never leaves the device — a client's
body is not something to upload.

**Never:** an editor. It is a comparison instrument.

### STYLE — `style/` · desktop, deliberately

**Function.** Decide what the whole suite looks like.

**In hand:** rarely, sitting down, comparing several real screens at once.

**Good looks like:** it tells the truth about themes, including which ones fail
and where the engine cannot reach. STYLE decides, `shared/` implements, every
app obeys.

**Never:** a per-app settings screen. It sets the system.

### HABITS — `habits/`

Excluded. Tom's call on 2026-08-27: leave it exactly as it is. It remains the
placeholder `CLAUDE.md` describes, superseded by STATUS. Do not build to this
doctrine here, and do not add to it.

---

## Using this

When a change is proposed, in order:

1. **Which app owns it?** If two could, the one whose FUNCTION sentence it
   serves wins. If neither, it does not get built.
2. **What comes off?** Utility is a budget, not a wish list.
3. **Which law does it touch?** Most arguments about a feature are actually
   arguments about law 1, 4 or 5.
4. **Wipe storage and try it.** Most of the failures above survived review and
   died on first contact with an empty install.
