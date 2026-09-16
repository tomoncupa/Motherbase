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

Settings are not limited to what an app asks you to decide. Tom, 2026-09-14,
called that limit arbitrary: a setting earns its place by being useful. What
does hold is this. **In an app clients use, settings are intuitive and never
overwhelming**: plain names that say what a thing does, the choices most
people want first, and anything advanced out of the way until it is looked
for. Tom's own apps may be denser.

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

### 14. Right click and long press, everywhere

Set 2026-08-28. Tom: *"right click and long press functionality everywhere
where possible should go without saying."*

Anything that can be moved, resized, renamed, reordered or removed offers a
menu on right click with a mouse and on a hold with a thumb. Both land on the
same list. It is not a feature to be asked for each time; it is the baseline,
and a thing without one is the exception that needs a reason.

This does not weaken law 6. A menu is a **shortcut** to what buttons already
do, never the only route: the dock keeps its arrows, a card in REARRANGE mode
keeps its up, down and remove. Somebody who never discovers the gesture loses
nothing but time.

The pair is always both. A right click with no long press is a desktop-only
feature in a suite where two apps are used one-handed, and a long press with
no right click is a phone gesture stranded on a laptop.

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

### The suite at a glance

Set by Tom on 2026-09-14, in his words where possible. Where a section below
disagrees with this on device or on what an app is for, this wins. "Clients"
is what `tools/build-client.py` ships today: the people Tom gives the suite to,
called testers until 2026-09-14, and not the coaching clients in WEALTH.

| App | Folder | Device | Clients | What it is for |
|---|---|---|---|---|
| HOME | `index.html` | desktop | yes | The hub for everything. |
| BLOCK | `block/` | desktop only | yes | Routines, mostly daily. Since 2026-09-14, an Every tab for Blocks that repeat every few days, weeks or months, and an Anytime tab for habits done a number of times a week on any day. |
| STATUS | `status/` | everywhere | yes | The tracker, built for fast input. |
| LOG | `log/` | desktop | yes, since 2026-09-14 | The journal module. Brings every bullet type together. |
| QUESTS | `quest/` | everywhere | yes, since 2026-09-14 | Todo bullets, pulled from STATUS and BLOCK. Answers "what's next to be done". |
| WEALTH | `wealth/` | desktop | no, Tom only | Money. Reads spending, and the statements that matter. |
| ARC | `arc/` | desktop only | no, Tom only since 2026-09-14 | Mind mapping, and presentations. **Planned:** a teach mode that builds skill trees out of actionable steps. Those steps are todo bullets, so it works with QUESTS. |
| FORM | `form/` | desktop | no, Tom only | Form review, and presentations and social media content made from it. Takes a client's unclipped video: cut the start and end off. |
| TRAIN | `train/` | phone | yes | The training tracker. An evolved FitNotes. |
| STYLE | `style/` | desktop only | yes | The theme and look for every other app. |
| FOODDÉX | `portion/` | desktop | no, Tom only | Food database input and overview. Works with STATUS. **To be expanded.** |
| CHECK IN | `checkin/` | everywhere | yes | Physique check-ins, for Tom and for his clients: a goal, photos measured into neutral numbers, and a timelapse. Reads weight from STATUS rather than asking for it twice. A client's check-in reaches Tom as a file and is kept under their name, in rows a later COACH can read. |
| NOTICE | `system/` | everywhere | no, Tom only | Text in, a status window out. A game notice or quest window as a picture, for a post or a story. Built 2026-09-15. |
| SPEAK | `speak/` | everywhere | no, Tom only | Talking to a camera, measured. A path of drills for pace, fillers, flow, clarity and eyes, a daily warm-up, a streak. Numbers against his own targets, never a verdict. |
| COACH | not built | iPhone, iPad and PC | no, Tom only | Clients send their TRAIN logs here. For now, TRAIN with profiles: track each client's strength, and log the sessions of 1:1s. A separate app, with TRAIN as its core file. A profile is the same client as in WEALTH, so a 1:1 logged here is a session WEALTH counts. A log arrives as a file the client sends from TRAIN's share menu; sending again only adds what is new. **Planned, after Tom is happy with TRAIN.** |

ARC, BLOCK and STYLE are not meant to work on a phone. Tom, 2026-09-14.

HABITS is not on the list. Tom deleted it on 2026-09-14.

### MAIN MENU — `index.html`

**Function.** Choose an app, and see whether today needs anything.

**In hand:** at a desk, several times a day, for two seconds at a time.

**Good looks like:** the dock order is his, the widgets answer "is anything
outstanding" without a tap, and nothing here duplicates what an app does
better. It is a hallway. Nobody should want to stay in it.

**Never:** a dashboard that grows features. Anything worth doing here is worth
doing in the app that owns it.

### STATUS — `status/` · everywhere

**Function.** Record what happened to your body and your money today.

**In hand:** standing up, one-handed, several times a day, often mid-task. And
at a desk: Tom uses it everywhere, so the desk is not an afterthought.

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
reps are two taps. A repeated session says, set by set, how many more reps and
what percentage stronger each working set was than the same set last time, and
the session adds itself up at the end — because that is the entire reason for
repeating it.

**He trains; he does not work out.** Tom, 2026-09-14. A session is designed and
personal, so it can have a name and belong to a training block, records start
again with each block while the all-time ones stay, and a week counts the sets
each muscle got. The app says session and training, never workout.

**It takes your history from wherever it is.** FitNotes' own backup file, and a
spreadsheet from anything else — Strong, Hevy, JEFIT all export a row per set
and only disagree about column names. Whatever it cannot match it says so and
imports the rest, because a log 90% across beats a log 0% across with a tidy
error message.

**Never:** an app that tells him how to train. No set targets, no plateau
warnings, no praise: it states what was lifted and what changed, and he joins
it up (Tom, 2026-09-14). BLOCK has nothing to do with training beyond a training
block ticking when TRAIN has data.

### BLOCK — `block/` · desktop only

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

**Two rhythms beyond the week** (Tom, 2026-09-14). Each has its own tab.

- **Every.** A Block that repeats every so many days, weeks or months: a
  deload, a monthly review, a haircut. Missed, it stays **owed** and keeps
  showing until it is done. The next one is counted from the day it was done.
- **Anytime.** A habit done a number of times a week, on any day, at no set
  time: gym three times, read four. It shows how many of this week's are done
  and stops asking once the week's count is met. It counts ticks, so a tick
  from anywhere in the suite counts.

A habit being built belongs here. A chore that repeats, like rent, is a QUESTS
todo.

**Handing someone a start** (Tom, 2026-09-14). He helps people set up. Export,
For someone else, makes a file of the day on screen, which he names after the
person; importing it adds to their board and never overwrites what is already
there.

### ARC — `arc/` · desktop only

**Function.** Think on a canvas until the shape of the idea appears.

**In hand:** sitting down, at length, in one long session.

**Good looks like:** nothing between the thought and the node. Every structural
idea — parent, link, rank, collapse — is one gesture. It carries images because
thinking is not only words.

**Also:** presentations.

**Skill trees** (built 2026-09-16, Tom: "Give ARC everything it needs, don't
let doctrine get in the way"). A node can be a skill with a test. Its children
are what it needs; it opens when they pass, passes on hits on separate days,
and comes back for reviews. A skill in training is a daily QUESTS todo, and
ticking it is a hit. The rules come from the skill tree.exe skill, and the
tree is built with Claude through the clipboard. That makes ARC a tracker as
well as a canvas, which the Never line below did not foresee; Tom said so on
purpose.

**Cards** (the same day). Tom: "for learning flash cardable portions of the
skill knowledge." The facts inside what a tree teaches get their own tab and
their own schedule: asked, graded, and put back for the day they are nearly
forgotten. Separate from the skill schedule on purpose. A skill is something
you can do; a card is something you can say.

**Never:** a note-taking app. The value is the *shape*, not the text.

### FORM — `form/` · desktop · Tom only

**Function.** Watch two lifts side by side and say what is different. Also for
presentations and social media content.

**In hand:** at a desk, reviewing a client's video against a reference.

**Good looks like:** two clips in sync in seconds, frame-accurate stepping,
annotation that survives playback. Video never leaves the device — a client's
body is not something to upload.

**Never:** an editor. It is a comparison instrument.

### CHECK IN — `checkin/` · everywhere

**Function.** See how far a body is from its goal, and how it has changed, in
photos and numbers.

**In hand:** once a week or so, a phone propped up across a room, then a
minute to send it. The coach opens it at a desk.

**Good looks like:** a front photo and a weight in under a minute, with
any other pose added in one tap by someone who wants it. This week's photo is
the same photo as last week's, because the camera lines it up and says how.
The goal, the first and the latest sit together with three measured ratios,
because the change is the point. Weight is STATUS's number, never a second
copy. What it asks is editable: the defaults are vocabulary, and a coach's own
questions are data.

**Never:** a verdict. It shows the numbers and the change, and says nothing
about whether either is good (Tom, 2026-09-15: "just give neutral numbers").
Words about a body happen in Claude, when he pastes the bundle in, never on
screen here.

### SPEAK — `speak/` · everywhere · Tom only

**Function.** Practise talking to a camera and see, in numbers, whether it is
getting cleaner.

**In hand:** a few minutes a day, a phone propped up or a laptop at a desk,
before recording content.

**Good looks like:** the warm-up and three drills in under ten minutes, each
drill saying its goal as a number and why in one sentence, the take stopping
and the numbers appearing at once, and the same numbers a month later showing
which way they moved.

**Never:** a verdict, a score, a level, or praise. It counts, shows the target,
and says met or not met. The target is his.

### NOTICE — `system/` · everywhere · Tom only

**Function.** Turn a few lines of text into a picture of a game status window.

**In hand:** for a minute, before a post or a story. On a phone as often as a
desk.

**Good looks like:** type, see the window, press save. A plain line is a
notification; a bulleted list is a quest with goals and rewards; nothing needs
setting up first. The picture is 1080 wide and reads on a photo.

**The picture is not themed.** A Hunter window is blue in every theme, the way
a photo is not repainted by the theme. The app's own chrome obeys STYLE like
every other app.

**Tom only.** Set 2026-09-15. It makes the pictures he posts, so it is behind
the dock's line with his other own apps and `tools/build-client.py` leaves the
folder out.

**Never:** a real reward. The EXP, titles and items are flavour for a picture,
made up from the text. Nothing here reads or writes a tick, a streak or a
measure, and law 13's rules on the voice do not soften the copy in the window,
which is quoting a genre on purpose.

### STYLE — `style/` · desktop, deliberately

**Function.** Decide what the whole suite looks like.

**In hand:** rarely, sitting down, comparing several real screens at once.

**Good looks like:** it tells the truth about themes, including which ones fail
and where the engine cannot reach. STYLE decides, `shared/` implements, every
app obeys.

**Never:** a per-app settings screen. It sets the system.

### HABITS — deleted

Deleted on 2026-09-14 on Tom's instruction. STATUS replaced it. The `habit`
rows it wrote were not touched: they stay on the device and in every backup.

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
