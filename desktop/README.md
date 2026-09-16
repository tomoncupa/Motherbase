# STATUS Desktop tracker

STATUS as a Windows app: its own window with no browser bars, sitting above
everything else, a Mini mode that shrinks it to one strip, a check in that
comes round on its own, and Ctrl+B from anywhere.

## Using it

Double click **STATUS Desktop tracker.exe**. That is it. An icon appears in the
tray next to the clock; right click it for the menu.

**It opens as the widget**, because that is the part you wanted. The whole app
is one click away and it remembers which you were last in.

- **Mini mode** is the widget: a strip exactly 470 by 56 in the top right,
  showing Mood, Energy and the next two measures you have switched on. It has
  no title bar, so the window is the strip and nothing around it. **Push it
  anywhere with the mouse** and it stays there next time. The chevron on the
  right opens the whole app; the chevron in the app's top bar shrinks it back.
- **The check in** asks mood, energy and what you are up to, on a gap that is
  different every time, 60 to 90 minutes by default. Set the range in
  **Settings → DESKTOP**. It only asks between the hours you choose, it never
  stacks up, and Skip writes nothing. If the window is minimised it brings
  itself back to ask.
- **Ctrl+B** opens a bullet, even when you are in another program. If something
  else on your machine already owns Ctrl+B, the tray menu has Ctrl+Alt+B and
  Ctrl+Shift+B.

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
