# LifeOS foundation — the plan, in plain English

> ## ⏸ PARKED — 2026-08-19
>
> Hosting and accounts are off the table for now. **Everything is local**: one
> folder, one browser, no server, no sign-in. See `LIFEOS.md` for what actually
> exists today.
>
> This document is the plan for *if* the apps ever go to other people. Three of its
> decisions were kept and are already live locally:
>
> - **Whoever saved later wins.** Ticks land on one cell per activity per day, and
>   the last write is the truth.
> - **Backups instead of sync.** The `DATA` button in `lifeos.html` does the whole
>   safety net: one restorable JSON, plus CSV exports.
> - **Build order still holds** if this restarts: shared plumbing first, BLOCK first
>   among the apps.
>
> The part *not* yet adopted is permanent hidden IDs — locally, things are still
> matched by name, so renaming something restarts its history. Worth fixing on the
> day that bites, or on the day this plan un-parks.

**Rev 2, 2026-08-19. Firebase. Nothing built yet.**
Answers [ARCHITECTURE-BRIEF.md](ARCHITECTURE-BRIEF.md). Readable version:
https://claude.ai/code/artifact/0cc23bb2-0212-4216-aa4d-03828d380173

## The one idea everything hangs off

**Signing in is optional. It buys exactly one thing: your stuff on more than one
device.** Every app still works with no account, like today. Nobody is blocked at a
login screen before the app has proved useful, and you only pay for a text message
when someone actually wants sync.

## Why Firebase (Tom's call, and it holds up)

Firebase sends the text messages itself. With Supabase you sign up with a texting
company and, in the US, register your business with the phone networks before
messages deliver reliably. Firebase skips that. It also brings offline saving and
live updates built in — two things I would otherwise write by hand.

## 1. Signing in

Phone number → six-digit code → done. No password, no email to find.

- They can skip it entirely; a quiet "sign in to use this on your phone too" button.
- Email sign-in as a backup. A password for Tom.
- **Turn on Firebase's bot check and restrict sign-ups to the countries served.**
  There is a scam where fake numbers are fed into sign-up forms to farm the text
  revenue, billed to you. Five-minute job, must be done.

Cost, roughly (verify current pricing):

| | 100 users | 1000 users |
|---|---|---|
| Text messages | a few £/mo | ~£20–100/mo |
| Database + hosting | free | free, or a few £ |

Firebase needs a card on file for phone sign-in even inside the free allowance.

## 2. How apps agree on what things are

Today "Morning Run" in BLOCK and in the habit tracker are only the same because
they are spelt the same. Rename one and the streak resets; two different "Session"s
silently merge.

**Fix:** every thing gets a permanent hidden ID when first created. The name is a
label on top. Rename freely — the ID never moves, so history stays attached.

When an app wants "Morning Run" it asks the shared list rather than guessing: *do we
have one of these?* Existing ID back, or create one — as a single step, so two apps
can never end up with two IDs for one thing. If "Run" and "Morning Run" turn out to
be the same, point one name at the other; both lead to the same record.

A new app in six months asks the same list. Nothing to redesign.

> Implementation: Firestore, one doc per activity under a generated id, plus a
> lookup doc `{kind}__{slug} → id`. Resolve = a client transaction (read lookup,
> create both if absent). Renames add a lookup; merges repoint one. No server.

## 3. Who decides whether you did it

Nobody. One shared checklist, one line per thing per day, every app writing to it —
which is how the local build already works.

**Most recent tick wins.** For a checkbox that is correct: the last thing you did is
what you meant. Ticking twice is agreement, not conflict.

Each app still owns its own stuff (BLOCK the schedule, ARC the maps). Others may
show it, never change it.

**Open:** amounts are not ticks. 20 minutes vs 35 minutes needs a rule — keep the
bigger, add them, or ask. Default: keep the bigger.

## 4. Offline and two devices

Firebase's job, not mine — a real dividend of the Firebase choice.

- No signal: keeps working, saves locally, uploads itself later.
- Two devices: tick on the laptop, phone updates in about a second.
- Only the first sign-in on a new device truly needs the internet.
- Apps show sync state honestly (synced / 3 waiting / offline).

## 5. Where it lives

**Firebase Hosting, not GitHub Pages** — one company, one web address. One address
means one sign-in covers every app; separate addresses would mean a login each.

Trade: apps that sign in can no longer be opened from the Downloads folder. Local-only
ones still can.

| App | Storage per person | Verdict |
|---|---|---|
| BLOCK | a few KB | **multi-user** |
| Daily Quest OS | a few KB | **multi-user** |
| ARC | small unless maps hold images | **multi-user, with an image limit** |
| Form Review | hundreds of MB of video | **stays Tom's only** |

Pose tracking is free (runs on the viewer's machine); storing and serving video is
not. Videos stay on the device.

**Skool stays separate.** People find the apps through posts and sign in by phone. A
join code can tag where someone came from. Not a lock on the door — none was asked for.

## 6. Build order

1. **Firebase set up** — the shared list and shared checklist.
   *Test: two throwaway pages ask for "Morning Run", get the same ID.*
2. **Phone sign-in**, with skip.
   *Test: phone and laptop land in the same account.*
3. **Connect ticking to the existing kernel.**
   *Test: tick on laptop → phone updates; airplane mode → catches up.* Done alone,
   because this is the step that must be right.
4. **BLOCK** — already speaks the shared language, not being rebuilt, so a failure is
   the new plumbing rather than new app code.
5. **Daily Quest OS** — fresh, but against plumbing BLOCK has already proven.
6. **ARC** — bigger maps, saved-not-streamed.
- **Form Review** — unchanged, local.

## Settled

- **habits.html is a stand-in** → Daily Quest OS replaces it. Harvest the 28-day
  grid, streaks, and one-click promote-from-routine. Stop adding to that file.
- **Client data is private, no coach view** → rules stay simple: each person reaches
  only their own data. Adding coach visibility later is real work, not a switch.

## Still needed

- Where are the users, mostly? (UK / US / mixed — changes SMS setup and bill.)
- Do ARC maps hold images? (Changes storage sizing.)
- Amounts rule: bigger, sum, or ask?
