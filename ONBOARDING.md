# ONBOARDING

How a beta tester gets the suite, and what happens after.

`CLAUDE.md` says what the suite is. `DOCTRINE.md` says what each app is for.
This says how it reaches somebody who is not you.

---

## The shape of it

Testers get a **separate, generated copy** of the suite. Not this folder.

```
py -3 tools/build-client.py
```

That writes `../Motherbase-Client`, a complete working suite with:

| | |
|---|---|
| **Apps** | HOME, ARC, BLOCK, STATUS, TRAIN, STYLE |
| **Not included** | FORM (client video), CLEX (personal), HABITS (superseded by STATUS) |
| **Themes** | Default, System, Chalkboard, Sketch, Doodle — five, from eighteen |
| **Added** | `guide.html`, the tester's five-minute setup page |

`Default` is Block renamed, `System` is Ice renamed. The ids underneath are
unchanged, so nothing a theme is saved against breaks.

### Why it is generated and not copied

A hand-made client folder is a fork, and a fork of `shared/` drifts. A fix you
make to the store, the themes or the sheet layer reaches your apps and silently
never reaches your testers — and then a bug report describes a version that no
longer exists. Generating it means there is one place anything is edited: here.

**Never edit anything inside `Motherbase-Client` by hand.** The next build
overwrites it. Everything the client copy needs that this repo does not have
lives in `tools/client/`.

The script fails loudly rather than quietly shipping something wrong. If a
future edit renames a line it looks for, you get an error naming the patch, not
a client build that still has HABITS in the menu.

---

## Publishing it, the first time

You need this once. After the first time it is two commands.

**1. Make the repo.** On github.com, New repository, name it
`motherbase-client`, **Public**, no README. (It has to be public for free
GitHub Pages. That is fine — the code is public already and no data is in it.)

**2. Push the folder.**

```bash
cd "C:/Users/user/Downloads/Motherbase-Client"
git init && git add -A && git commit -m "first build"
git branch -M main
git remote add origin https://github.com/tomoncupa/motherbase-client.git
git push -u origin main
```

**3. Turn on Pages.** In that repo: Settings → Pages → Source: `Deploy from a
branch` → Branch: `main`, folder `/ (root)` → Save. Wait about a minute.

**4. The link is** `https://tomoncupa.github.io/motherbase-client/`

Open it yourself on your own phone before you send it to anyone.

### Every time after that

```bash
py -3 tools/build-client.py
cd "C:/Users/user/Downloads/Motherbase-Client" && git add -A && git commit -m "update" && git push
```

The build stamps every shared script with a hash of `shared/` — `?v=ef908823`
— so a fix actually reaches a tester's cached home-screen icon instead of
sitting behind a stale copy. That stamp only changes when `shared/` changes.

---

## What to send a tester

Paste this. Fill in the link.

> Hey — here's the tracking setup I've been building. It's free, there's no
> account and no sign-up, and nothing you type leaves your phone.
>
> **1.** Open this on your phone: `https://tomoncupa.github.io/motherbase-client/`
>
> **2.** Read the "Start here" page first — it's 5 minutes and step 1 stops you
> losing your data: `https://tomoncupa.github.io/motherbase-client/guide.html`
>
> **3.** Use it for two weeks. TRAIN for your sessions, STATUS for everything
> else.
>
> Tell me anything that confused you, looked wrong, or that you stopped using.
> Screenshots are gold. Nothing is too small.

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
- **Watch them do it.** If a tester is in the room or on a call, do not send
  the link and hope. Four taps, thirty seconds, and it is the difference
  between a two-week test and a two-week test that evaporates on day eight.
- Ask on day 3: *"is it on your home screen?"* Not *"did you add it?"* — one
  is a question, the other invites a yes.

Second most likely: **they log on their laptop as well and expect it to sync.**
It does not. Two devices are two separate copies. Say this once, up front.

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
the first tester finds something obviously broken in the first ten minutes, and
treat that as the beta working rather than the beta failing.

One tester first, not five. Five testers finding the same broken thing is four
wasted people and one signal.

---

## Making this easier later

Ranked by what it costs against what it removes. Nothing here is built.

**1. A QR code on the link.** Ten minutes. Removes the worst step in the whole
flow — typing a URL into a phone keyboard. Print it, put it on your phone
lock screen, whatever. Do this one first.

**2. An "add to home screen" nudge in the app itself.** The page can tell
whether it is running from a home-screen icon or a browser tab
(`navigator.standalone` on iOS, `display-mode: standalone` elsewhere). If it is
a browser tab, one dismissible bar at the top saying why it matters. This is
not a walkthrough and does not break DOCTRINE law 10 — it is one fact stated
once, about the one thing that loses data.

**3. Backup that does not need a human.** Right now the safety net is a person
remembering to press a button. Two ways out, in order of cost:

   - The Sheets mirror already sketched in `CLAUDE.md` — they paste a script
     into a blank Google Sheet once, and the app pushes a copy whenever there
     is signal. No accounts, no keys, and it degrades to nothing on failure.
   - Real hosting and accounts, parked in `ARCHITECTURE.md`. Solves it properly
     and costs everything else.

**4. A starting point that is not empty.** DOCTRINE law 1 forbids shipping a
routine, and it is right. But there is a difference between prescribing a life
and demonstrating a shape, and BLOCK already walks that line with its one
skeleton routine. If testers stall on an empty TRAIN, the fix is a skeleton,
not a program.

**5. Onboarding that is per-tester rather than per-batch.** Not a feature —
a decision. The first ten testers should each cost you a fifteen-minute call.
When that stops teaching you anything new, the guide is finally good enough to
send on its own.

---

## Files

| | |
|---|---|
| `tools/build-client.py` | Generates the client copy. Run it, never edit the output. |
| `tools/client/guide.html` | The tester's setup page. Ships as `guide.html`. |
| `tools/client/README.md` | The client repo's front page. |
| `ONBOARDING.md` | This. |
