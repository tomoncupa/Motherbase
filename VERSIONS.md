# Versions

One number for the whole suite. The apps share a foundation, so "which
version" is only a useful question if it has one answer.

It lives in `shared/io.js` as `VERSION`, goes into every backup file, and is
written on the `_Settings` tab of the sheet. A file found in a year says what
wrote it without anybody having to remember.

Bumped by hand, and only when something changed that you would notice or that
changes the shape of stored data. Tidying, comments and refactors do not get a
number.

**0.x means the shape of stored data can still change.** When it stops
changing, that is 1.0.

---

## 0.1.6 — 2026-08-26

**STATUS stopped keeping its own rulers.** Its colours came from the theme, so
it looked like it was on the system. Every measurement in it was still its
own: a private spacing scale, a private type scale and two hand-written
shadows, 144 references in total. All of them now point at the shared tokens.

What that was costing, measured rather than guessed:

- The type scale ran 11, 12, 13, 15, 17, 22, 28, 40. Three of those sit within
  two pixels of each other, which is the exact choice a scale exists to
  abolish, and 11px is below what anyone should have to read on a phone. It is
  now 12, 14, 16, 18, 24, 30, 36 — the shared steps. Everything is slightly
  larger and easier to read.
- `--s8` was used to size the receipt thumbnail and never defined anywhere, so
  those images were sized by whatever the browser fell back to.
- The two shadows were fixed black at a fixed opacity, so they missed the
  doubling `skins.js` applies on a dark theme, and a light theme got shadows
  built for a dark one.

**The close button on a sheet is reachable.** It measured 32px, twelve short
of the minimum, and it sits in the corner where a thumb is least accurate. The
circle stays 32px so it does not shout; the reach around it is now 44.

---

## 0.1.5 — 2026-08-21

**The + builds itself again, and then settles down.** 0.1.4 threw out the
self-building list and it should not have. Corrected here.

Two halves now. On top, whatever is still unlogged today, in the same order as
the tiles on Today — so you look at the island, see a dash, open the sheet,
and the button is in the position you just looked at. It shrinks by one each
time you use it and disappears when the day is in.

Underneath, the four that never move: Mood, Energy, Food, Spending. Those
happen more than once a day, so they can never be finished and can never
leave. Food and Spending are down there rather than in the list on purpose:
hiding lunch behind an unweighed morning would be absurd.

The amber dot on the + is back, and it tracks the top half exactly — dot means
there is a list, no dot means there is not.

---

## 0.1.4 — 2026-08-21

**The + button is four buttons now: Mood, Energy, Food, Spending.** It used to
list whatever was outstanding, then every field you log more than once, then
Food and Spending — so its contents moved through the day and the button you
wanted was somewhere different each time. A quick add you have to read is not
quick. These four are the things that happen more than once a day; weight,
sleep and steps are once, and their tiles are on Today already.

The amber dot came off the button with the list it pointed at. An empty tile
is the same reminder in a better place.

Mood and Energy are looked up rather than assumed, so turning one off takes
its button away instead of leaving one that opens nothing.

---

## 0.1.3 — 2026-08-21

Caffeine from food reached the tile in one route out of three. Two holes, both
silent, and silence is the problem: an empty tile looks the same whether
nothing was logged or the number was thrown away on the way in.

**A one-off had nowhere to put it.** Sodium, potassium and caffeine were
hard-coded to zero on that form, so a can logged there counted its calories
and dropped everything else. It has the boxes now.

**A field you named yourself never linked.** The pass that connects a tracked
field to the nutrient it is made of matched on the id, and a field added from
the library has the id `caffeine` while one you typed into Something else has
a timestamp. Same thing to whoever made it, so it matches on the name too. The
guard is a number rather than a tick, so the pass runs again when the library
learns a new link instead of being locked out by the previous version.

The library also stopped offering you a second Caffeine when you already had
one under a different id.

**A field says whether food feeds it.** The TRACK list now reads `+ caffeine
from food` under anything linked. A tile that ignores what you ate used to
look identical to one that counts it.

**Correction to 0.1.2's note:** the smoke run reported there as 102 of 102 was
against a browser-cached copy of the shared files, not the ones on disk. Run
against the real files it is **114 of 114**, all passing. The twelve checks
that were missing were skipped, not failed — but the number quoted was wrong
and the cache was not noticed.

---

## 0.1.2 — 2026-08-21

**Tabs are named after their data.** They used to carry the app that wrote
them, `STATUS · Food`, and that name was a claim STATUS was not entitled to
make. Food is food. A dedicated nutrition tracker later takes over the type,
the way the data model already says it should, and the sheet would have ended
up holding a live `FUEL · Food` beside a stale `STATUS · Food`, with nothing
in the sheet to say which one was still being written. So: `Food`, `Meals`,
`TDEE`. Ownership is recorded instead of spelled — `_Settings` carries a line
per type saying which app writes it.

The old prefixed tabs are dropped on the next sync, after the new ones are
written, never before. **The Apps Script has to be copied and deployed again
for that**; until it is, the sheet keeps both sets and the new ones are the
live ones.

**Tapping a written line puts the cursor in it.** The whole line used to tick,
and fixing a typo meant knowing to hold. Now the box ticks and the words open
for editing, with the cursor after the last character — which is what every
list app already does, so it needs no explaining. The same idea everywhere
else: tapping the label above any box now opens that box.

**Caffeine in your coffee counts as caffeine.** A tracked field can say which
number on a food label it is the same substance as, so a coffee logged in FOOD
shows up on the Caffeine tile and in the half-life. Nothing is copied — the
meal stays the only record and the figure is read out of it — so editing the
meal cannot leave a stale twin behind. Caffeine, sodium and potassium are
linked automatically, including on fields added before this existed.

**Eating out is money.** A meal can name the account it was paid from, and
then it becomes a real spend as well as food. Leave it blank and nothing
changes: most food was bought on some other day, which is why food has never
touched the money screen.

**How sure you are is part of what you logged.** A meal carries a margin —
sure, ±10%, ±20%, ±30% — and a one-off starts at ±20%, because a plate
somebody else cooked is a guess. Guesses are added rather than squared: people
under-guess restaurant food consistently, so the errors lean the same way
instead of cancelling.

**TDEE now says how sure it is.** A band from three real sources, added in
quadrature: how much the weight line could tilt and still fit, the guessed
food carried straight through, and the 3,500 kcal per pound figure being a
round number rather than a constant. It excludes model error, so read it as a
floor on the uncertainty. The trend part widens by the square root of the
smoothing window, because a 7-day rolling average makes neighbouring points
share six of their seven days — an approximation, and the band is indicative.

**Export, without the internet.** The spreadsheet export needs a library off a
CDN, which is the one thing in here that stops working on a plane. There is
now a plain CSV beside it, one tab at a time, built from the same rows.

**Fixed: "at most" never saved.** The ceiling typed into a field's Edges was
written and then deleted one line later, because `max` also means how far a
scale runs. Only a scale uses it that way now.

---

## 0.1.1 — 2026-08-21

The sheet actually receives things now.

**Fixed: no sync had ever written anything.** STATUS's calendar tab carried a
blank spacer row, and Google's `setValues` writes a rectangle and throws on
anything else. The calendar was the first tab, the script wrote tabs in a loop,
so the throw abandoned the whole write. Every sync since the mirror was built
did nothing, and said it had worked.

Three guards, because the first alone would let the next app repeat it:

- The spacer is a full-width blank rather than an empty row.
- No tab leaves the app ragged. Rows are padded to the widest and holes become
  empty strings, since `setValues` rejects `undefined` too.
- The script squares each tab off again and wraps each one in its own
  try/catch, so one bad tab can no longer take the rest with it. It reports
  which tabs it wrote and which it could not.

**A sync no longer claims success it has not seen.** A POST to an Apps Script
web app resolves even when the script threw, so "the request did not fail"
looked exactly like "the sheet took it". The script answers `want=stat` with
every tab and its row count, the app compares that against what it sent, and
there are three outcomes: confirmed, unconfirmed, failed. Only the first says
"Synced".

**The diagnostic is gone.** It reported passing while nothing worked, which is
worse than having none.

**A backup is everything.** The theme, the palette, the sound pack, the day,
the haptics and the sheet link are storage keys rather than rows, and none of
them were ever in a backup. Restoring after a reinstall gave back every
measurement and none of the app. They are collected now, and restoring
repaints, because a theme restored without repainting looks like one that was
not restored.

**The sheet is a save file.** Two machinery tabs, `_Data` and `_Settings`,
carry the rows and the keys. The `.json` backup, the spreadsheet download and
the mirror all build them from one function, so they cannot disagree.

**The sheet can be edited.** Tabs that are one line per real thing are typable
in bulk; sums are not, because a total has no row to write an edit into. Each
line carries an id and an edit stamp. Newest wins per row, and the loser is
kept rather than dropped.

**Earlier, unnumbered.** Everything before this — the touch layer, the design
skill, the journal, the weight prediction, the row store — was built without a
version. This is the first one worth naming, because it is the first where the
save file is trustworthy.
