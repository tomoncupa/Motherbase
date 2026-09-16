# STATUS Desktop tracker

STATUS as a Windows app: its own window with no browser bars, sitting above
everything else, a Mini mode that shrinks it to one strip, a check in that
comes round on its own, and Ctrl+B from anywhere.

## How to open it

Double click **STATUS** on your desktop. That shortcut points at
`STATUS Desktop tracker.exe` in this folder, and you can make another anywhere
by right clicking the exe and choosing Send to, Desktop.

To have it always one click away, open it once, then right click its icon in
the taskbar and choose **Pin to taskbar**. To have it start with Windows,
press Windows and R together, type `shell:startup`, press Enter, and drop a
copy of the shortcut in the folder that opens.

Opening it a second time while it is already running does not start a second
copy. It brings the widget you already have to the front.

## Using it

An icon appears in the tray next to the clock; right click it for the menu.

**It opens as the widget**, because that is the part you wanted. The whole app
is one click away and it remembers which you were last in.

- **Mini mode** is the widget: about 320 by 135, with no title bar and rounded
  corners, so the window is the widget and nothing around it. **Push it
  anywhere with the mouse** and it stays there next time. It shows:
  - **the last bullet you wrote**, whenever you wrote it, with its time
  - **a round button** that asks Mood and Energy. Answering also pushes the
    next automatic check in back, so the button you pressed yourself is not
    followed by the same question ten minutes later
  - today's mood and energy, once there are any, as a face and a bolt
  - **the pencil** writes a bullet without leaving the widget. It opens on
    Entry; Enter saves, Shift and Enter makes a new line. For a bullet with a
    time or a repeat on it, the chevron opens the whole app.

  The window is always exactly the size of what is inside it, because the page
  measures itself and the launcher matches. Opening the question makes the
  window taller and closing it shrinks it back.
- **The check in** asks mood, energy and what you are up to, on a gap that is
  different every time, 60 to 90 minutes by default. Set the range in
  **Settings → DESKTOP**. It only asks between the hours you choose, it never
  stacks up, and Skip writes nothing. If the window is minimised it brings
  itself back to ask.
- **Ctrl+B** opens a bullet, even when you are in another program. To change
  it, right click the tray icon, **Bullet shortcut**, then **Choose my own**,
  and press the keys you want. It has to include Ctrl, Alt or Shift, because
  Windows will not hand a bare letter to a program that is not in front. If
  something else already owns the keys you picked, a message says so instead
  of it quietly not working.

## Why it opens Chrome

This is not a separate copy of STATUS. It is your STATUS, in a Chrome window
with the browser furniture taken off, using your ordinary Chrome profile.

That matters more than it sounds. A browser keeps a page's data per profile, so
a standalone program with its own built in browser would have its own separate
store and would open **empty**: no weigh ins, no foods, no spending, no
bullets. Opening the one you already have is what makes today's numbers be
there the first time you run it.

## What it actually does

STATUS is still one HTML file. This program only does the three things a web
page is not allowed to do for itself:

1. keeps the window above other windows
2. resizes it down to the strip and back
3. catches Ctrl+B while another program is in front

It cannot see inside the page and the page cannot move its own window, so the
two talk through the window title: the page puts a word on the end of its
title and this reads it twice a second. The title says what the page wants to
be rather than announcing a change, so the two agree no matter when the
launcher found the window. The words are `small` and `show`.

## If it ever gets stuck

Quitting from the tray always puts the window's title bar back. If the
launcher is killed outright instead, by Task Manager or a crash, the widget is
left with no title bar and no close button. Two ways out: **Alt+F4** closes it,
or just start the launcher again, which puts the frame back on anything it
finds left over.

## Building it

Only needed if `StatusDesktop.cs` changes. Editing STATUS never needs a
rebuild.

```
powershell -ExecutionPolicy Bypass -File build.ps1
```

There is nothing to install. It uses the C# compiler that is already inside
Windows, at `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`.

## Files

| File | What it is |
|---|---|
| `STATUS Desktop tracker.exe` | the launcher, double click this |
| `StatusDesktop.cs` | its source |
| `build.ps1` | rebuilds the exe |
| `launcher.txt` | your hotkey and always on top choice. Delete it to reset |
| `launcher.log` | what happened on the last run, for when something misbehaves |

Windows only, and Tom's machine only. It is not in the client build.
