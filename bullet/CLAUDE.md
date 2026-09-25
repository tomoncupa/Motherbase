# BULLET (CLAUDE.md)

Governs `bullet/` only. The repo-root `CLAUDE.md` and `DOCTRINE.md` still apply
and win any disagreement.

## What it is

One screen that writes a bullet. Tom, 2026-09-25: "how can we add an icon to
homescreen thats just bullet entry?", then "Build it for them too BUT dont add
it to the icon card, it can just be a link".

- **An address, not an app on a list.** It is on no home screen roster, no
  dock and no APPS widget. People reach it from STATUS, Settings, BULLETS,
  OPEN BULLET (a new tab, so a phone lands in the browser where Add to Home
  Screen is), or by its address. It has its own `manifest.json` and icons so
  a saved icon looks like itself. Clients get it (`COPY_DIRS`).
- **For everywhere, built to the phone rules.** 44px targets, safe areas,
  the cursor in the box on open. An iPhone raises the keyboard only for a
  focus inside a tap, so from the home screen it waits for one tap.
- **It owns no type.** Every line goes through `Journal.add`, the one
  creator STATUS, LOG and QUESTS use, so a line written here is the same row
  STATUS would write: typed times, "paid 250 - lunch", the home screen's day
  log.
- **It asks what STATUS's Settings, BULLETS say.** `Journal.asks('times' |
  'mood', kind)`, `Journal.feelOn()`. There is no second copy of those
  switches here; its own BULLETS tab points at STATUS.
- **A mood is a Mood reading too**, through `Journal.moodToDay`, exactly as
  in STATUS.
- **Today's lines under the box, newest first**, so a save is something you
  see land. Read only: editing is STATUS's and LOG's job.
- **LIVE SYNC.** An iPhone keeps a home-screen icon's storage apart from
  Safari's and from other icons, so signed out, the page says its bullets
  stay on this device and where to sign in.

## Built and watched

1.0.0, 2026-09-25. Driven in the browser at 375 wide by pressing its own
buttons (the pane was hidden, so no real mouse clicks): Entry by default with
the cursor in the box, an event with "9-9:30am" typed and mood 3 saved as
9:00am to 9:30am with a Mood reading at 9:00, an entry with only an End
starting now with the length beside End, the boxes clearing after a save.
Review 135/135 at 375 and 1280. NOT watched on an iPhone, and the touch path
itself was not exercised.

1.0.1, 2026-09-25: the mood suggestions STATUS 1.0.54 got, off the same `Journal.moodMemo()`.
