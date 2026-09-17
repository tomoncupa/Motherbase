# ONBOARDING

How a client gets the suite, and what happens after.

**Clients**, since 2026-09-14, are the people who get the client build. They
were called testers until then. They are not the coaching clients in WEALTH.

`CLAUDE.md` says what the suite is. `DOCTRINE.md` says what each app is for.
This says how it reaches somebody who is not you.

---

## The shape of it

Clients get a **separate, generated copy** of the suite. Not this folder.

```
py -3 tools/build-client.py
```

That writes `../Motherbase-Client`, a complete working suite with:

| | |
|---|---|
| **Apps** | HOME, BLOCK, STATUS, LOG, QUESTS, TRAIN, CHECK IN, STYLE |
| **Not included** | FORM, ARC, FOODDÉX, WEALTH, SPEAK and NOTICE (Tom's own), and the LINKS widget |
| **Themes** | Default, System, Chalkboard, Sketch, Doodle — five, from eighteen |
| **Added** | `guide.html`, the client's setup page: nine steps, about ten minutes |

`Default` is Block renamed, `System` is Ice renamed. The ids underneath are
unchanged, so nothing a theme is saved against breaks.

### Why it is generated and not copied

A hand-made client folder is a fork, and a fork of `shared/` drifts. A fix you
make to the store, the themes or the sheet layer reaches your apps and silently
never reaches your clients — and then a bug report describes a version that no
longer exists. Generating it means there is one place anything is edited: here.

**Never edit anything inside `Motherbase-Client` by hand.** The next build
overwrites it. Everything the client copy needs that this repo does not have
lives in `tools/client/`.

The script fails loudly rather than quietly shipping something wrong. If a
future edit renames a line it looks for, you get an error naming the patch, not
a client build that still has WEALTH in the menu.

---

## Publishing it, the first time

You need this once. After the first time it is two commands.

**1. Make the repo.** Done: `tomoncupa/Mainmenu-client`, public. Note the
capital M — GitHub kept it and the Pages path is case sensitive.

**2. Push the folder.** Done, and the remote is already set, so from now on
it is just `git push` from inside the folder.

**3. Turn on Pages.** In that repo: Settings → Pages → Source: `Deploy from a
branch` → Branch: `main`, folder `/ (root)` → Save. Wait about a minute.

**4. The link is** `https://tomoncupa.github.io/Mainmenu-client/`

Open it yourself on your own phone before you send it to anyone.

### Every time after that

```bash
py -3 tools/build-client.py
cd "C:/Users/user/Downloads/Motherbase-Client" && git add -A && git commit -m "update" && git push
```

The build stamps every shared script with a hash of `shared/` — `?v=ef908823`
— so a fix actually reaches a client's cached home-screen icon instead of
sitting behind a stale copy. That stamp only changes when `shared/` changes.

---

## What to send a client

Paste this.

> Hey, here's the tracking setup. It's free, there's no account and no sign-up.
>
> **1.** Start here, on your phone:
> `https://tomoncupa.github.io/Mainmenu-client/guide.html`
>
> **2.** Nine steps, about ten minutes. Step 2 is the one that matters, adding
> it to your home screen. Skip it and your phone deletes everything after a
> week.
>
> **3.** Steps 4 to 7 hook it up to a Google Sheet you own. That's your backup,
> and it's what keeps your phone and your computer holding the same thing.
>
> **4.** Then use it for two weeks. TRAIN for your sessions, STATUS for
> everything else, CHECK IN for your photos.
>
> Tell me anything that confused you, looked wrong, or that you stopped using.
> Screenshots are gold. Nothing is too small.

The link is the guide, not the menu. The guide's first step opens the app;
sending the menu instead is how a client ends up in a browser tab with no icon.

Send it in the evening before a training day, not on a Sunday. The first thing
they do should be a real session, not a poke around an empty app.

---

## The thing that will actually go wrong

**They will not add it to their home screen, and they will lose their data.**

iOS clears a website's storage after about seven days of no visits. Added to
the home screen, it stays. This is Safari's rule, not a bug in the suite, and
it is the single largest risk in the whole arrangement.

So:

- Step 1 of `guide.html` is the home-screen step, before anything else.
- **Watch them do it.** If a client is in the room or on a call, do not send
  the link and hope. Four taps, thirty seconds, and it is the difference
  between a two-week test and a two-week test that evaporates on day eight.
- Ask on day 3: *"is it on your home screen?"* Not *"did you add it?"* — one
  is a question, the other invites a yes.

Second most likely: **they stop at step 3 and never do the computer half.**
The phone works on its own, so nothing is visibly wrong, and they have no
backup and no second device. Until steps 4 to 7 are done, one cleared browser
is the whole history gone. Ask on day 3 whether the sheet is filling up.

---

## The Windows widget, and why clients do not have it

STATUS on Windows is also a real program: a small widget that sits above your
work with your last bullet in it, Ctrl+B to write one from anywhere, and a
status check that takes the whole screen until you answer it. `desktop/`, and
`desktop/README.md` explains it.

Clients get none of it. `tools/build-client.py` leaves `desktop/` out, and
three things stand in the way of putting it in:

- **It is Windows only.** A client on a Mac gets nothing.
- **The program is not signed.** Windows shows "Windows protected your PC" on
  an unsigned download and most people press Don't run. Signing costs money a
  year and an identity check.
- **It is a download, not a link.** About 900KB across four files, and the
  whole pitch to a client so far is that there is nothing to install.

What it would take, if it is worth it: add `desktop/` to the build script as a
zip, a tenth step in `guide.html` for Windows only, and a line telling them
what the warning looks like and how to get past it. That last line is the one
that decides whether it works.

Their own devices already hold the same data through the sheet, so nobody is
missing anything except the widget itself.

---

## Collecting what they did

There is no server, so there is no dashboard. What you can ask for is a
backup file.

> MAIN MENU → DATA → Back up everything

That downloads one `.json`. They send it to you. To look at it, drop it into
your own copy on a **spare browser profile** — not your daily one, or you merge
their data into yours and the two never separate again cleanly.

**Better: don't.** Ask them what they think. A backup tells you what they
logged; it does not tell you what they gave up on, and the second thing is the
only reason to run a beta.

The four questions worth asking at the end of two weeks:

1. What did you stop using, and on which day?
2. What did you want to log and couldn't find where?
3. What made you close the app?
4. Would you keep using it if I stopped asking?

Question 4 is the only one whose answer matters.

---

## What to expect, honestly

**These apps have never been used by anyone but you.** Every layout judgement in
them was made without ever seeing them on the phone they will run on. Assume
the first client finds something obviously broken in the first ten minutes, and
treat that as the beta working rather than the beta failing.

One client first, not five. Five clients finding the same broken thing is four
wasted people and one signal.

---

## Making this easier later

Ranked by what it costs against what it removes.

**1. A QR code on the link.** Ten minutes. Removes the worst step in the whole
flow — typing a URL into a phone keyboard. Print it, put it on your phone
lock screen, whatever. Do this one first.

**2. An "add to home screen" nudge in the app itself.** The page can tell
whether it is running from a home-screen icon or a browser tab
(`navigator.standalone` on iOS, `display-mode: standalone` elsewhere). If it is
a browser tab, one dismissible bar at the top saying why it matters. This is
not a walkthrough and does not break DOCTRINE law 10 — it is one fact stated
once, about the one thing that loses data.

**3. ~~Backup that does not need a human.~~ Built.** The Google Sheet mirror
is steps 4 to 7 of the guide: they paste a script into a blank sheet once, and
the app pushes a copy whenever there is signal. No accounts, no keys, and it
degrades to nothing on failure. It is also what makes two devices hold the
same thing.

   What is left is the setting up. Six clicks in Apps Script and a Google
   permission screen is the hardest part of the whole guide, and the one a
   client is most likely to abandon halfway. Doing it on a call with them is
   worth more than any wording. Real hosting and accounts, parked in
   `ARCHITECTURE.md`, is the only thing that removes it, and it costs
   everything else.

**4. A starting point that is not empty.** DOCTRINE law 1 forbids shipping a
routine, and it is right. But there is a difference between prescribing a life
and demonstrating a shape, and BLOCK already walks that line with its one
skeleton routine. If clients stall on an empty TRAIN, the fix is a skeleton,
not a program.

**5. Onboarding that is per-client rather than per-batch.** Not a feature —
a decision. The first ten clients should each cost you a fifteen-minute call.
When that stops teaching you anything new, the guide is finally good enough to
send on its own.

---

## Files

| | |
|---|---|
| `tools/build-client.py` | Generates the client copy. Run it, never edit the output. |
| `tools/client/guide.html` | The client's setup page. Ships as `guide.html`. |
| `tools/client/README.md` | The client repo's front page. |
| `ONBOARDING.md` | This. |
