# STATUS

STATUS as a real Windows program: its own window with no browser anything, a
small widget that sits above your work, and a check in that interrupts you on
purpose.

## How to open it

Double click **STATUS** on your desktop.

To keep it handy, open it once, right click its taskbar icon and choose **Pin
to taskbar**. To have it start with Windows: hold the Windows key and press R,
type `shell:startup`, press Enter, and drop a copy of the desktop shortcut in
the folder that opens.

Opening it twice does nothing. There is only ever one.

## What it does

- **The widget** is the resting state: about 320 wide, no title bar, rounded
  corners, above your other windows. It shows the last bullet you wrote with
  its time, today's mood and energy once there are any, and three controls.
  **Drag it anywhere** by its background and it stays there.
- **The status check** is meant to be in the way, and since 17 September it
  takes the **whole screen**, unless STATUS Settings, DESKTOP, How it comes,
  is Red dot or Pop up (the dot plus a Windows notification, from a tray icon that is there only while the notification shows): then a red dot sits on the widget's button and the taskbar
  icon until you press it, and it opens as a box (`due|1`, `checkin`). It comes up in front of whatever you are doing,
  takes the focus and makes a sound. There is no close button and no skip:
  SAVE is the only way out, and until every scale is pressed it names the one
  still missing. It wears a status window, and which one is in Settings,
  DESKTOP. If one comes due while you are away from the desk, it
  waits, and goes up the moment you touch the mouse or keyboard. Settings,
  DESKTOP, Wait until I am at the desk, turns that off. Answering it pushes the next one back, so the one you answered
  yourself is not followed by another ten minutes later. Walking away from one
  at night ends the night: you get one, and it closes when you answer it.
- **Ctrl+B** writes a bullet from anywhere, even from inside another program.
  Change it in STATUS Settings, DESKTOP, **Bullet shortcut**, **My own**, then press
  the keys you want. It needs Ctrl, Alt or Shift in it, because Windows will
  not give a plain letter to a program that is not in front.
- **The pencil** writes a bullet without leaving the widget. It opens on
  Entry. Enter saves, Shift and Enter makes a new line.
- **The chevron** opens the whole of STATUS. The chevron in its top bar takes
  you back to the widget.

- **The S-rank overlay** (STATUS 1.0.101): what is left for an S today, in
  a corner of the main screen (top right by default), over your windows.
  Clicks go through it and it never takes the focus. STATUS draws the picture
  and STATUS.exe places it (`ov|...`, `ovimg|...`, class `Overlay`). Every
  choice is in Settings, DESKTOP, S-RANK OVERLAY.

**No tray icon** since STATUS 1.0.102 (Tom, 2026-11-16: the tray holds SPEAK
alone). Always on top, Start with Windows, the shortcut and Quit are in
STATUS Settings, DESKTOP, THE PROGRAM. Right clicking the widget or the app
opens a menu with Open STATUS, Check in now, always on top, the shortcut and
Quit where the page has no menu of its own (2026-10-18). Coming back from the whole app after moving
it, the widget shrinks into the app's top right corner and stays there.

## Its data

STATUS.exe and the Main Menu share one store, in `desktop\data`. Since
23 September both open the hosted copy, tomoncupa.github.io/Motherbase, so
they sign in to LIVE SYNC like a phone does and hold the same rows. The first
time, they open empty and fill up once you sign in (or paste the sheet link).

To go back to the folder copy, make an empty file called
`use-folder-copy.txt` in this folder. Both programs switch together, and the
rows the folder copy had are still there. Delete the file to come back.

## How it works

It is the same STATUS. `status/index.html` is unchanged and still opens in a
browser on its own. This program is only the frame around it: it runs the page
inside Microsoft's WebView2, the engine that already ships with Windows, and
the page tells it what to be through a proper message channel.

Closing the window quits the program, so it can never sit hidden and switched
off.

## The Main Menu's title bar

The Main Menu keeps Windows' own title bar, because that is what drags, snaps,
resizes and holds minimise, maximise and close. Since 18 October it wears the
colour at the top of whatever page is open (Block's dark header on the home
screen), so it reads as part of the app rather than a white strip over it.
The page reports its colour once a second; `MenuApp.cs`, `Caption`.

## Claude, inside the Main Menu

A gold **CLAUDE** tab on the right edge of every page in the Main Menu opens a
chat panel (added 4 October 2026). Ask about your own data ("how's my bench
trending?") or tell it something to log ("3 sets bench 80kg for 8", "paid 450
for lunch"). Each thing it logs shows under its answer with an UNDO.

It runs the Claude program that comes with the Claude desktop app, on your
subscription, so it costs nothing extra. It reads a copy of your rows kept in
`%LOCALAPPDATA%\Motherbase\claude`, never in this repo, and it can only read
that folder. Only the Main Menu has it: STATUS.exe, the phone and browsers do not.

If it says Claude is signed out, press SIGN IN and sign in on the Claude website.

The panel is `shared/claude.js`; the window side is `ClaudeBridge.cs`.

## SPEAK.exe, the practice widget

Tom, 2026-11-10: "an always on overlay widget, so I can start a mini practice
whenever." He chose a PC widget of its own over a button on STATUS.

- A small window, 300 by 116 inside, on top of every other window, with
  Windows' own title bar coloured like the page so it drags and snaps.
- One button, **TABLE TOPIC**. It starts a take at once. The window grows to
  440 by 760 for the take and its numbers, keeping its top left corner where
  that fits, and goes back to where it was a second after the numbers close.
  The page asks for each size (`speak/index.html`, the widget).
- It opens `speak/index.html?widget=1` at the hosted address and shares
  `data` with STATUS and the Main Menu, so a take made here is in SPEAK
  everywhere.
- The microphone and camera are allowed without a prompt in this window only.
- **Start with Windows** is on from its first open: `SPEAK.lnk` in the
  user's Startup folder (the Run key until 2026-11-23, which Windows skipped
  at sign-in with no error). Right click the title bar to turn it off.
- Where it sits is kept in `speak-app.txt`.
- Tom only, like SPEAK, so Setup.exe does not carry it and a change to
  `SpeakApp.cs` needs no client Setup.

## The nightly backup

Every night at 4am, and ten minutes after you sign in on a day the PC was
off at 4am, Windows starts **Backup.exe**. You never see it. It opens the
desktop programs' store, waits for live sync to catch up, and saves the whole
store to **Documents\Backups\Motherbase nightly** as
`motherbase-all-<date>.json`. The last 30 are kept; `backup.log` beside them
says what each night did. Under 2 GB free on the disk, it skips the night and
says so.

To put one back: open any app, Settings, **DATA**, **Restore**, and pick the
file. It merges: anything newer on the device is kept.

Set up once with:

```
powershell -ExecutionPolicy Bypass -File "C:\Users\user\Downloads\Motherbase\desktop\install-backup-task.ps1"
```

## Giving it to someone else

Send them **Motherbase Setup <date>.exe** (built beside this file, named for the day it was built). One file: both
programs and Microsoft's WebView2 files are inside it. Added 27 October 2026.

1. They double click it. Windows may say "Windows protected your PC" because
   the file is not signed: **More info**, then **Run anyway**.
2. It asks **Have you used Motherbase before?** and installs into their own
   AppData (no admin prompt), with Motherbase and STATUS on the desktop and in
   the Start menu, and an entry in Settings, Apps to remove it.
   Everything, their data included, sits in one folder,
   `%LOCALAPPDATA%\Programs\Motherbase`. The Start menu's Motherbase folder
   holds Motherbase, STATUS and Uninstall Motherbase. Removing it asks once
   whether to delete what is stored on that PC, and never touches a shortcut
   that opens another copy.
3. The Main Menu opens on the setup page (`setup.html`, served by
   `SetupPage.cs`). Already in the system: sign in with Google, then the
   widget. First time: sign in (or Later), what to track, how often the
   status check comes and between which hours, the widget's shortcut, on top
   and start with Windows, and a code to scan for the phone. Then STATUS opens.

Their copy opens the client address, `tomoncupa.github.io/Mainmenu-client/`,
never this one: Setup writes it into `address.txt` beside the programs, which
both read (`Hosted.cs`). No `address.txt`, as here, is Tom's copy. A client
copy has its own single-instance lock and no CLAUDE panel. If their PC has no
WebView2 (rare on Windows 10, never on 11), Setup says so with a button to get it.

**It keeps itself current** (Tom, 2026-10-28). The pages inside always came
from the site. The programs themselves now do too: half a minute after either
opens, and every six hours after, a Setup-installed copy reads
`desktop/update.txt` on its site. If that fingerprint is not its own
`Setup.exe`'s, it downloads the Setup that `update.txt` names, checks it, and
runs it with `--update`, which swaps the files in without closing anything;
the next open is the new build. No connection or a bad download changes
nothing. Your own copy never checks (`Updater.cs`).

So **a change to STATUS.exe or Main Menu.exe reaches them only through the
client build**: commit the rebuilt `Motherbase Setup <date>.exe` (and the old one's removal) with them, then
`tools/build-client.py` puts it and its `update.txt` on the client site.

To test on this PC without touching your own shortcuts:
`"Motherbase Setup <date>.exe" --dir <folder> --address http://127.0.0.1:8811/`.

## Personal Design Toolkit

Tom, 2026-11-19: "Turn this into an Exe, Name it Personal Design Toolkit."
A separate program, not part of Motherbase: 214 behaviour change tools as
fill-in worksheets, each writing its own summary, with a personal board and
the best next steps for every tool. The same page is the claude.ai artifact
Pattern Toolwall.

Double click **Personal Design Toolkit.exe**. It writes the page to
`%LOCALAPPDATA%\Personal Design Toolkit\app` and opens it in Edge (or
Chrome) as an app window with its own profile there, so entries stay on that
PC. Nothing syncs and no account is used: **Save a backup** and **Restore a
backup** in its top bar are the only way to move or keep entries. The Ask
Claude reflection is hidden in it; the summaries work without it.

Unsigned, so Windows may say "Windows protected your PC" the first time:
More info, Run anyway.

My plan (2026-11-22, `page/plan.js`) puts the pattern, its count, plans, tools
being tried, in-the-moment cards and the journal on one tab, prints the plan,
pocket cards and a journal week, and holds the one-tap counter, the guided
timers and the values sort.

Rebuild after changing anything in `toolkit/page`:
`py -3 desktop/toolkit/build.py`. It needs Go, and `go-winres` for the icon
(`go install github.com/tc-hib/go-winres@v0.3.3`). Without Go it still writes
`toolkit/toolwall.html`, the page to republish as the artifact.

## Building it

Only needed if the `.cs` files change. Editing STATUS never needs a rebuild.

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

Nothing to install: it uses the C# compiler already inside Windows, and the
three Microsoft WebView2 files in `lib\`.

## Files

| File | What it is |
|---|---|
| `STATUS.exe` | the program |
| `StatusApp.cs` `KeyBox.cs` | its source |
| `build.ps1` | rebuilds it, even while it is open: the running copy is moved aside as `.old` |
| `status.ico` `menu.ico` | the icons built into STATUS.exe and Main Menu.exe, cut from `status/icon-512.png` and the root `icon-512.png`. A shortcut reads the file's icon, never the window's |
| `lib\` | Microsoft's WebView2 files, so there is nothing to download |
| `Personal Design Toolkit.exe` | the toolkit program, built from `toolkit/` (`main.go` the launcher, `page/` the page in parts, `winres/` its icon and version, `build.py` rebuilds it) |
| `data\` | its store. Deleting this empties it; it refills from sync |
| `status-app.txt` | your shortcut, always-on-top and widget position |
| `status-app.log` | what happened on the last run, for when something misbehaves |
| `StatusDesktop.cs` | the old Chrome launcher, kept until the new one has earned its place |
| `Backup.exe` `Backup.cs` | the nightly backup and its source; reads `tools/backup.html` |
| `install-backup-task.ps1` | sets up (or `-Remove`s) the 4am task that starts it |
| `Motherbase Setup <date>.exe` `Setup.cs` | the package for someone else, and its source |
| `setup.html` `SetupPage.cs` | the first-run setup page, and how the Main Menu serves it |
| `Hosted.cs` | which address both programs open (`address.txt`) |
| `Updater.cs` | a given copy updating itself from the client site |

Windows only. Not in the client build, except `Motherbase Setup <date>.exe` and its
`update.txt`, which the client site carries for the update check.

## Opening from the saved copy (2026-11-16)

STATUS.exe, Main Menu.exe and SPEAK.exe open the hosted page without `?fresh=1`, so the copy `sw.js` kept answers at once. With `fresh=1` the page and every script went to the network first and waited up to 3 s each (`SLOW_MS`) before the kept copy answered, and one of GitHub Pages' four addresses (185.199.111.153) never answers from Tom's ISP, so STATUS took 6 s to draw. New code still arrives: `sw.js` refreshes kept copies in the background, `mobile.js` reopens an untouched page onto new code, and STATUS reloads itself onto a newer version when idle. Measured launch to page loaded: 0.6 to 0.7 s, was about 6 s.
