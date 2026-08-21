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
