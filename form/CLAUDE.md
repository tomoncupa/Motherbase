# FORM — the lift review (CLAUDE.md)

Governs `form/` only. The root `CLAUDE.md` and `DOCTRINE.md` still apply, and
win if this disagrees with them.

**What it is for.** Watch two lifts side by side and say what is different.
Also presentations and social media content made from it. Desktop, Tom only,
kept out of the tester build.

**How it gets used, as of 2026-09-14.** Tom and his clients film on iPhones.
Clients send clips on Telegram as normal videos, which Telegram shrinks, and
Tom downloads them with Telegram Desktop. Tom is often on camera beside FORM,
so everything has a key and the chrome stays out of the way.

## Video never leaves the device

A client's body is not something to upload, and it is not something to put in
a backup either. No video, frame or thumbnail is ever written to the store.
The Picture button makes an image only when Tom presses it, and it never
carries the client's name, because it may end up in a post.

## Data

FORM owns one type.

| Type | Owner | Date | Key | Payload |
|---|---|---|---|---|
| `review` | **form** | the day the clip was filmed, or `null` | file size + `-` + filming time in ms (or the file name when the file has no time) | `{file, size, filmed, client, lift, trim, notes, marks, reps, mirrored, fps, strokes, path, scale, weight, unit, ex}` |

- **One row per clip.** The key comes from the file itself, so a renamed copy
  is the same clip and gets its review back.
- **Looking is not reviewing.** A clip that is only opened writes nothing.
- **Saved by a check once a second,** not from every place that edits. The
  store ignores an identical write, so this costs nothing when nothing changed.
- **Merged, never rebuilt.** A save reads the row and writes it back with FORM's
  fields laid over it, so a field a newer FORM adds survives an older one.
- **The rep table is not saved.** It is worked out from the pose scan, which is
  large and quick to redo. The reps themselves are saved.

FORM reads, and never writes:

- `client` from WEALTH, for who is in a clip. The same people COACH will use.
- `exercise` from TRAIN, to suggest lift names.

## The one thing outside the store

The video folder Tom picks is a browser folder permission. It is not data, it
cannot travel to another device, and it cannot go in a backup, so the row store
cannot hold it. It lives in FORM's own IndexedDB database, `motherbase-form`,
under the key `folder`, and nothing else is kept there. The open has a
three-second timeout, because an IndexedDB open can hang (root `CLAUDE.md`,
foundation item 1).

## Where the time of a set comes from

The file header's `mvhd` creation time, in seconds since 1904. Checked on
2026-09-14 against five real clips in Tom's Telegram folder, two of them shrunk
by Telegram: all five kept it, and the shrunk ones said 11 and 89 minutes before
they were sent, so it is the filming and not the shrinking. When a file has no
usable time, Telegram Desktop's file name (`video_YYYY-MM-DD_HH-MM-SS`) gives
the send time, labelled Sent. The file's modified date is never used; for a
download it is the download.

## Testing

- The browser test pane is usually **hidden**. It draws no animation frames,
  so FORM's playback loop does not run, and Chrome pauses silent video there.
  Nothing about two clips playing together can be judged in it. Drive the logic
  by hand instead, and say plainly that playback was not watched.
- The folder picker is a Windows dialog and cannot be pressed from a test. Hand
  FORM a stand-in folder object with `entries()`, `queryPermission` and
  `requestPermission`, set `folder` to it, and test everything after the pick.
- Real clips for testing are in `Downloads/Telegram Desktop` and
  `Downloads/CLIP/1_inbox`. Serve `Downloads` rather than the repo to reach them.
- Clean up `review` rows, and any `client` rows written for a test.
