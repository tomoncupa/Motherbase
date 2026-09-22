# LAYOUT, the long version (LAYOUT.md)

## The full layout, as it stood on 2026-09-22

The root brief now carries one line per folder. This is the long version.

```
CLAUDE.md          this file
DOCTRINE.md        what each app is FOR, and the laws every app obeys
REVIEW.md          the suite reviewed on 2026-09-15: what would make it better,
                   ranked. Proposals, nothing built. Tom picks.
HOWTO.md           how Tom adds an app or a theme, in plain language
CLOUD.md           LIVE SYNC: the Firebase sync that sits BESIDE the Google
                   sheet, added 2026-09-20. What Tom does once to set it up,
                   the database rules to paste, and what it deliberately does
                   not carry. The sheet is untouched and still does everything
                   it did; this answers the one thing the sheet is slow at,
                   which is two devices agreeing in a second rather than a
                   minute. Off until a config is pasted, so a client who never
                   sets it up never makes a request from it
RECEIPTS.md        THE RECEIPT PIPE, added 2026-09-21. A photo of a receipt on
                   the phone becomes a spending row and a record of what was
                   bought. Reading happens on the PC through the claude.exe
                   inside the desktop app, so it needs no key and costs
                   nothing; confirming happens in RECEIPTS, because only
                   Motherbase knows which FOODDEX food a shop's wording means.
                   What Tom sets up once, and what it asks him
ONBOARDING.md      how a client gets the suite, and what happens after
index.html         the home screen: widget grid, app dock, data authority
_review.html       the review: opens every app, folds in the foundation checks,
                   and looks over the rows. Read-only. Run it on a real device
sw.js              the offline cache, added 2026-09-16. Opened from a folder
                   the suite never needed a connection. Opened from an ADDRESS
                   it needed one every time, just to fetch the page, and with
                   no signal the browser drew a blank page and the app looked
                   broken. This keeps a copy of each page on the phone. Since
                   2026-09-18 it answers from that copy AT ONCE and fetches the
                   newer one in the background for the next open (Tom: "Always
                   open from the phone copy IMMEDIATELY... Fast input is our
                   pillar"). A pushed change lands on the second open after it;
                   data is never involved, only code. A stamped file is at an
                   address that changes when the file does. Registered by
                   `shared/mobile.js`, so no app had to be edited. Does nothing
                   from a folder and nothing inside a frame. `?nosw=1` on the
                   address takes it off again
shared/            the foundation, loaded by every app
block/index.html   routine builder
arc/index.html     mind canvas, skill trees and flashcards since 2026-09-16.
                   Tom only since 2026-09-14, dropped from the client build
arc/CLAUDE.md      ARC's own brief, governs arc/ only
form/index.html    lift review
status/index.html  sleep, weight, mood, energy, steps, food and money
desktop/           STATUS, the Windows app, since 2026-09-17. STATUS.exe
                   runs status/index.html inside Microsoft's WebView2, the
                   engine already in Windows, in a window the program owns.
                   Tom, 2026-09-17: "I think the chrome environment is too
                   limiting." The Chrome launcher before it could not stop
                   Chrome putting its title bar back, clipping the page under
                   it, or the window being closed out from under the app,
                   which silently stopped a whole day of check ins. None of
                   those are reachable from outside a window you do not own.
                   The page says what it wants to be over a real message
                   channel, so the window is exactly the page: a widget in a
                   corner, or the check in centred, in front and focused,
                   because Tom asked for that to be intrusive. Ctrl+B calls
                   the page's own function rather than typing a key at it.
                   Its store is its own and fills from the sync code the way
                   a second device would, which Tom accepted as a good thing.
                   Compiled by build.ps1 with the C# compiler inside Windows;
                   the three WebView2 files live in desktop/lib. The old
                   launcher, StatusDesktop.cs, is kept until the new one has
                   earned its place. Windows only, Tom only, left out of the
                   client build. See desktop/README.md.
portion/index.html FOODDÉX, called PORTION until 2026-09-14. A label in, the
                   amounts you eat out. A desktop app, and the second writer
                   of `food` alongside STATUS. The folder and the app id stay
                   `portion`: theme, sound, draft and settings are saved
                   under the id, and renaming it would drop them.
train/index.html   the training log, a reproduction of FitNotes
train/CLAUDE.md    TRAIN's own brief, governs train/ only
wealth/index.html  the money app. Clients, bills, pots, debts and what is
                   actually left. Desktop. Tom only, dropped from the client
                   build. Reads STATUS's spending rather than copying it.
wealth/CLAUDE.md   WEALTH's own brief, governs wealth/ only
log/index.html     the journal module: STATUS's entries en masse. One timeline
                   from the first record to today, in views from Day to Year,
                   with STATUS's bullets, the day's line, every STATUS measure
                   as a column, written summaries for weeks up to years, and a
                   mood, energy and caffeine graph per day.
                   Desktop. In the client build since 2026-09-14.
log/CLAUDE.md      LOG's own brief, governs log/ only
checkin/index.html CHECK IN, physique check-ins for Tom and his clients: a goal
                   photo, a front photo and any pose added, each measured on the
                   device into three neutral ratios, a camera that lines this
                   week's photo up with last week's, a timelapse, weight
                   (STATUS's row) and a few answers, and a file to send a coach
                   that the coach keeps. Everywhere.
checkin/CLAUDE.md  CHECK IN's own brief, governs checkin/ only
clex/              GONE from the repo, 2026-09-16. Tom's Commander deck aid
                   left the suite on 2026-09-15 and the repo the next day. It
                   lives in Downloads/clex, outside Motherbase, unpublished.
style/index.html   the theme workbench. Desktop only, deliberately.
_template/         a working starter app, copied to make a new one
tools/             not build steps. embed-skins.py re-embeds the factory themes;
                   make-icons.html and save-icons.py redraw the iPhone icons;
                   build-client.py generates the client copy of the suite into
                   ../Motherbase-Client. Its output is never edited by hand —
                   client-only files live in tools/client/. See ONBOARDING.md.
coach/index.html   COACH, built 2026-09-22. Tom's clients in a Pokémon PC
                   box: three boxes (1:1, ONLINE, PAST) of thirty slots, each
                   client drawn as the Pokémon CHECK IN gave them. A client's
                   training arrives as the file TRAIN's Send To Coach makes and
                   is kept under COACH's own types, so it never lands in Tom's
                   own TRAIN. Strength, recent sessions and the range per
                   client, and FIRST SETS: the weight and reps of each
                   exercise's first set, sent back as a program file the
                   client opens in TRAIN, where the rest of their sets fill
                   from their last session. A PROGRAMS library holds programs
                   to send to anyone or sell. One column on a phone, two on an
                   upright iPad, three from 1180px. Tom only, dropped from the
                   client build. LOG A 1:1 on a client writes their sets as `cset` and one
                   WEALTH `sesh` per day, and every COACH client is a WEALTH
                   client and the other way round (`cperson.wc`, `client.cp`)
quest/index.html   QUESTS, the todolist, copied from Todoist. The same todo rows
                   as STATUS's journal, with a due date, priority, project and
                   repeat added. Desktop and phone. In the client build since
                   2026-09-14.
quest/CLAUDE.md    QUESTS's own brief, governs quest/ only
speak/index.html   SPEAK, talking to a camera, measured: pace, fillers and
                   crutch phrases, flow, crispness, eyes on the lens. A path
                   of drills built like Duolingo, a daily warm-up, a streak.
                   Everywhere. Tom only, dropped from the client build.
speak/CLAUDE.md    SPEAK's own brief, governs speak/ only
speak/RESEARCH.md  where every number in SPEAK came from, with sources
mix/index.html     ELEMENT, called MIX until 2026-09-22; the folder and the app
                   id stay `mix`, the way FOODDÉX's stayed `portion`. The electrolyte bench. What to weigh out today, in
                   grams, on a 0.001g scale: salt, potassium citrate, zinc
                   glycinate, magnesium glycinate. It replaces `protocol.html`,
                   which lived in Downloads, asked for every food by hand and
                   measured him against fixed targets. The targets move here:
                   sodium against what he actually sweated, magnesium against
                   what he actually weighs, and the food comes from STATUS.
                   Desktop. Tom only, dropped from the client build. Owns
                   `dose`
quest/BRIEF.md     the Daily Quest OS brief. Its measurement half moved into
                   status/ on 2026-08-20; what is left of it is a todolist.
                   Its data model and design system still govern. Superseded
                   on repo layout and testing by this file.
system/index.html  NOTICE, called SYSTEM for a few hours on the day it was
                   built. Text in and a status window out: a PNG of a game
                   notice or quest window in the Solo Leveling and Overgeared
                   manner, for posts and stories. The folder and the app id
                   stay `system`, the way FOODDÉX's stayed `portion`: theme,
                   sound, draft and settings are saved under the id, and
                   renaming it would drop them. Everywhere. Tom only since
                   2026-09-15, dropped from the client build. Built 2026-09-15.
```
