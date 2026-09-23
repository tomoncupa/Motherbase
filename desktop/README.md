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
  takes the **whole screen**. It comes up in front of whatever you are doing,
  takes the focus and makes a sound. There is no close button and no skip:
  SAVE is the only way out, and until every scale is pressed it names the one
  still missing. It wears a status window, and which one is in Settings,
  DESKTOP. If one comes due while you are away from the desk, it
  waits, and goes up the moment you touch the mouse or keyboard. Settings,
  DESKTOP, Wait until I am at the desk, turns that off. Answering it pushes the next one back, so the one you answered
  yourself is not followed by another ten minutes later. Walking away from one
  at night ends the night: you get one, and it closes when you answer it.
- **Ctrl+B** writes a bullet from anywhere, even from inside another program.
  Change it from the tray: **Bullet shortcut**, **Choose my own**, then press
  the keys you want. It needs Ctrl, Alt or Shift in it, because Windows will
  not give a plain letter to a program that is not in front.
- **The pencil** writes a bullet without leaving the widget. It opens on
  Entry. Enter saves, Shift and Enter makes a new line.
- **The chevron** opens the whole of STATUS. The chevron in its top bar takes
  you back to the widget.

Right click the tray icon next to the clock for **Open STATUS**, **Check in
now**, always on top, the shortcut, and **Quit**.

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

Closing the window quits the program, so it can never sit in the tray switched
off.

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
| `build.ps1` | rebuilds it |
| `lib\` | Microsoft's WebView2 files, so there is nothing to download |
| `data\` | its store. Deleting this empties it; it refills from sync |
| `status-app.txt` | your shortcut, always-on-top and widget position |
| `status-app.log` | what happened on the last run, for when something misbehaves |
| `StatusDesktop.cs` | the old Chrome launcher, kept until the new one has earned its place |

Windows only, Tom only. Not in the client build.
