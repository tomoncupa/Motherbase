# LifeOS — shared foundation architecture

**Status: proposal, for review. No code written against this yet.**
Answers the brief in [ARCHITECTURE-BRIEF.md](ARCHITECTURE-BRIEF.md). Written 2026-08-19.

Your three answers shaped this: multi-user for anything **cheap to host**, a
**100–1000 user** ceiling with SMS abuse treated as real, and **today's local kernel
stays** as the offline layer with the backend syncing into it.

---

## 0. The decisions, in one page

| Question | Decision |
|---|---|
| Backend | **Supabase** — Postgres + RLS + Realtime + Auth in one system |
| Phone auth | **Supabase Auth phone OTP via Twilio Verify** (not raw SMS) |
| Escape hatch | Firebase Phone Auth as the identity provider, Supabase accepting its JWT — costs a vendor, changes no table |
| Identity of things | **UUID in a canonical registry**; slug is a human alias, never the key |
| How two apps agree | A resolver RPC that upserts-and-returns — same UUID *by construction*, not by convention |
| Source of truth for "done today" | An **append-only completions log**. No app owns it; every app emits to it and reads from it |
| Conflicts | Per-cell last-write-wins on `(user, activity, local_date)`, tiebreak `(server_received_at, client_id)`; tombstones, never deletes |
| Sync | Local-first always. Realtime only for the small hot data. Outbox + cursor for everything else |
| Offline | Fully functional; only a first login on a new device needs the network |
| Hosting | Static, **all apps under one origin** — that is what makes one session work everywhere |
| Skool | Stays separate. Distribution channel, not an identity provider |
| Build order | Backend skeleton → auth → sync adapter (completions only) → **BLOCK** → Daily Quest OS → ARC |

The load-bearing idea: **an account is optional and sync is the upgrade.** Every app
works logged-out on local storage exactly as it does today. Signing in turns on
cross-device sync. That is simultaneously the kindest onboarding for a
non-technical user (nothing to do before the app is useful) and the cheapest SMS
bill (you only pay for people who actually want their data on two devices).

---

## 1. Shared identity layer

### Recommendation: Supabase, with phone OTP delivered through Twilio Verify

The constraint that decides this is not "which backend is nicer" — it is *phone auth
for people who don't check email*, at 100–1000 users, from a static page, maintained
by one person.

**Why Supabase wins on everything except SMS plumbing.** One system gives you
identity, the database, row-level isolation and realtime. For a solo maintainer that
is the whole argument: one dashboard, one mental model, one place a bug can be. RLS
in particular means multi-tenancy is a policy on a table rather than code you write
and can get wrong per app — at 100–1000 users, isolation you can *prove* beats
isolation you have to test. You have used it before, so the rebuild is not also a
learning project.

**Where Supabase is genuinely weaker, and it is exactly on your constraint.**
Supabase does not deliver SMS itself; you bring a provider. That means you own the
carrier paperwork:

- **US:** A2P 10DLC registration (brand + campaign) before messages deliver
  reliably. Small monthly fee plus per-message carrier fees, and a few days of
  approval. This is the real cost — the friction, not the cents.
- **UK/EU:** simpler. Alphanumeric sender IDs, no 10DLC equivalent, faster to live.

Firebase Phone Auth hides all of that: Google does the delivery and the carrier
relationships, and abuse protection (reCAPTCHA/App Check) is built in. **If your
users are US-based, that convenience is worth taking seriously.** It is the one
place where I would not argue with you choosing Firebase.

I still recommend Supabase because the paperwork is a one-time cost and the data
model is a permanent one — and because splitting auth from data is a tax you pay
every day. But the door stays open (see below).

> **Assumption A1 — I do not know where your users are.** US vs UK/EU changes setup
> effort more than it changes cost. Correct me and I will adjust this section.

### Use Twilio **Verify**, not raw Twilio SMS

You flagged 100–1000 users as the tier where abuse matters, and you are right: SMS
pumping (fraudsters cycling premium numbers through your OTP form to farm carrier
revenue) is *the* attack on phone auth, and it bills you for the privilege. Verify
is Twilio's managed OTP product: it handles code generation, expiry, per-number and
per-IP rate limits, geo permissions and fraud signals. Supabase supports it as a
first-class provider. The alternative — raw SMS plus your own attempt limits — means
reimplementing that, badly, and finding out you got it wrong via an invoice.

Layer it: **Cloudflare Turnstile or hCaptcha on the sign-in form** (Supabase supports
captcha natively), Verify's rate limits underneath, and **geo-restrict to the
countries you actually serve**. Those three together are what makes 100–1000 users
safe rather than exciting.

### Rough cost at your ceiling

Order of magnitude only — **verify current pricing before committing**, this moves.

| Item | 100 users | 1000 users |
|---|---|---|
| Supabase | Free tier | Free → Pro (~$25/mo) once you pass free-tier rows/storage |
| SMS (≈2 verifications/user/month) | ~$2–10/mo | ~$20–100/mo, region-dependent |
| Twilio Verify base | Small monthly | Small monthly + per-verification |
| Static hosting | £0 | £0 |

SMS dominates, and it dominates under *any* provider. Which is the strongest
argument for the optional-account model: an SMS is only ever spent on someone who
asked for sync.

### The identity table that keeps your options open

Do not scatter `auth.uid()` through the schema. One indirection:

```sql
profiles (
  id            uuid primary key default gen_random_uuid(),  -- the internal user id
  auth_subject  text unique not null,   -- whoever the current auth provider says they are
  phone         text,
  display_name  text,
  cohort        text,                   -- e.g. which Skool intake, for your own reporting
  tz            text not null default 'Europe/London',
  created_at    timestamptz default now()
)
```

Every other table foreign-keys `profiles.id`, never the auth provider's id. Swapping
Supabase Auth for Firebase later becomes: repoint `auth_subject`, rewrite the RLS
helper, migrate nothing. That single column is what makes "Firebase as an escape
hatch" true rather than aspirational.

**Also offer email magic-link and, for you, a password.** Phone is the default
because of who your users are; it should not be the only door. And phone numbers get
recycled — allow a second factor to be added later so a recycled number can't
inherit someone's history.

---

## 2. Shared data vocabulary

### The problem with what I built today

Today's kernel keys everything by `slug(name)`: `'Morning Run'` → `morning-run`.
That is exactly the failure mode you described. Two consequences:

1. **Rename destroys history.** Change "Morning Run" to "AM Run" and the streak
   starts from zero, because the key changed underneath it.
2. **Same name ≠ same thing.** Two different things called "Session" collide
   silently, and nothing in the system can tell you it happened.

Slugs are a good *display* and a good *lookup*. They are a bad primary key.

### The convention: UUID primary key, canonical registry, slug as an alias

```sql
activities (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id),
  kind        text not null,             -- 'habit' | 'block' | 'workout' | 'quest' | …
  slug        text not null,             -- derived from name, human-facing
  name        text not null,
  meta        jsonb not null default '{}',
  created_at  timestamptz default now(),
  archived    boolean default false,
  unique (owner_id, kind, slug)
)

activity_aliases (
  owner_id    uuid not null references profiles(id),
  alias_slug  text not null,
  activity_id uuid not null references activities(id) on delete cascade,
  primary key (owner_id, alias_slug)
)
```

**The registry is not a table apps read — it is a function apps call.** No app ever
mints an activity id:

```sql
resolve_activity(p_kind text, p_name text) returns uuid
```

It slugifies the name, follows `activity_aliases`, returns the existing id if there
is one, and inserts-and-returns if there is not. Two apps that both call
`resolve_activity('habit', 'Morning Run')` get the same UUID **because the database
decided, not because they agreed on a convention.** That is the difference between
provably the same record and hopefully the same record. Convention decays as soon as
one app slugifies apostrophes differently; a resolver cannot.

Then:

- **Renames** update `name` (and `slug`), leave `id` alone, and write the old slug
  into `activity_aliases`. History survives, and the old name still resolves.
- **Merges** — the inevitable "Run" and "Morning Run" turn out to be one thing — are
  an alias row plus a completions re-point. One transaction, reversible.
- **`kind` is part of the key** so a habit called "Stretch" and a scheduled block
  called "Stretch" can be deliberately distinct. Cross-`kind` linking, when you want
  it, is an explicit `meta.links_to` — never an accident of naming.

### How an app you build in six months plugs in

The contract is three rules, and they are the whole extensibility story:

1. **Never add a column to a shared table.** App-specific fields go in
   `activities.meta` (jsonb, namespaced by app: `meta.block = {...}`) or in a table
   the new app owns, keyed by `activity_id`.
2. **Never invent an id.** Call `resolve_activity`. If your app has a concept nobody
   else has, give it a new `kind` — that requires no migration and no coordination.
3. **Never write another app's tables.** Emit events; read views.

A new app therefore needs: a `kind` string, an RLS policy on its own table if it has
one, and the client kernel. Nothing about the shared schema has to be renegotiated,
because nothing about the shared schema is app-specific. The schema is deliberately
boring: users, things, and things-that-happened.

---

## 3. Ownership and conflict rules

### Three tiers of data

| Tier | Examples | Who writes | Who reads |
|---|---|---|---|
| **App-private** | BLOCK's lanes and variants, ARC's maps, DQO's quest layout | Exactly one app | That app; others only via a published summary |
| **Registry** | activities, aliases | Nobody directly — only `resolve_activity` | Everyone |
| **Shared events** | completions | Everyone, append-only | Everyone |

The rule that prevents the mess you are trying to avoid: **an app may publish a
summary of its private data for others to display, but that summary is read-only to
everyone else.** BLOCK publishes today's plan; the home screen renders it and can
tick it; the home screen cannot reschedule it. Exactly the `today` payload the local
kernel already does — the pattern survives the move to the backend.

### "Did the user complete this today" — the crux

**No app is the source of truth. The completions log is, and every app is a peer
that emits to it.** BLOCK doesn't own it because BLOCK doesn't own your morning;
Daily Quest OS doesn't own it because you might tick it from the home screen.

```sql
completions (
  id           uuid primary key,          -- generated client-side → replay-safe
  owner_id     uuid not null references profiles(id),
  activity_id  uuid not null references activities(id),
  local_date   date not null,             -- the user's local day, not UTC
  state        boolean not null,          -- true = done, false = tombstone
  qty          numeric,                   -- optional: minutes, reps, sets
  source       text not null,             -- 'block' | 'dqo' | 'home' | …
  client_id    text not null,             -- which device
  client_ts    timestamptz not null,
  server_ts    timestamptz default now(),
  unique (id)
)
```

Append-only, and that is the point:

- **Offline merging is a union.** Two devices offline for a day produce two sets of
  rows; syncing is inserting both. No merge algorithm, no lost updates.
- **Disagreements are visible.** "BLOCK says done, DQO says not" is two rows with
  timestamps and sources, not a silently overwritten boolean. You can debug it, and
  later you can show it.
- **Undo is a tombstone** (`state = false`), never a `DELETE`. A delete replayed from
  a stale device resurrects data; a tombstone cannot.

Current truth is a reduce, exposed as a view so clients read one row per cell:

```sql
day_state:  for each (owner_id, activity_id, local_date)
            → the row with the greatest (server_ts, client_id)
```

### Conflict policy, stated plainly

**Last-write-wins per `(user, activity, local_date)`, ordered by `server_ts` then
`client_id` as a deterministic tiebreak.** Not last-write-wins on a document — on a
single cell whose value is a boolean. Two apps "conflicting" almost always means
they agree (both say done) or one is a correction (you unticked it). LWW is honest
here in a way it never is for documents.

Two carve-outs to decide before they bite:

- **Quantities are not booleans.** If DQO logs 20 minutes and BLOCK logs 35 for the
  same activity and day, LWW picks one arbitrarily. Options: `max`, `sum`, or
  per-`kind` policy. **Open question Q1** — I would default to `max` for durations
  and `sum` only where an app explicitly says so.
- **Backfill vs live.** Editing last Tuesday from the habit grid and a device that
  was offline last Tuesday both write to the same cell. `server_ts` ordering means
  the *sync* order wins, not the *intent* order. If that ever feels wrong, the fix is
  ordering by `client_ts` with clock-skew clamping — a change to one view, which is
  precisely why the view exists.

---

## 4. Sync model

Three rings, each doing what it is good at:

| Ring | Mechanism | Latency | Works offline |
|---|---|---|---|
| Within a page | The kernel's in-memory doc + subscribers | instant | yes |
| Across tabs/frames on one device | `postMessage` + `BroadcastChannel` (built, working) | instant | yes |
| Across devices | Supabase Realtime + outbox flush | ~sub-second online | queues |

The local rings already exist and are tested. **The backend only adds the third
ring** — this is what "keep the kernel as the local layer" buys you.

### What gets realtime, and what does not

**Realtime (Postgres changes, filtered to `owner_id`): completions and activities.**
Small, hot, and the thing you notice: tick in one app, it appears in another. That
is a handful of rows a day per user — realtime on this is nearly free.

**Not realtime: BLOCK layouts, ARC maps, DQO configuration.** These sync on save and
pull on open. They are big, they change while you are editing them, and nobody needs
another device to watch you drag a block. Pushing them live would burn bandwidth and
invent conflicts you do not have.

### Offline behaviour: local-first, no exceptions

Every app reads and writes local storage first and renders from it. Writes append to
an **outbox**; a flusher drains it when online. Each event carries its client-generated
UUID, so a retried flush is a no-op (`on conflict (id) do nothing`) — at-least-once
delivery becomes exactly-once state.

Pulling uses a **cursor per device** (`last_server_ts` / `server_seq`), so
reconnecting fetches a delta, not the world.

The one thing that genuinely requires connectivity is **first login on a new device** —
there is nothing local to show yet. Everything after that degrades to "works, syncs
later". Show sync state honestly in the UI (synced / pending *n* / offline); users
who have been burned by silent sync failures will not trust a system that hides it.

---

## 5. Hosting and auth boundaries

### One origin, and this is not a detail

Put every app under a single origin — `lifeos.yourdomain.com/block/`,
`/quest/`, `/arc/` — rather than scattered files or separate hosts.

Under one origin, a Supabase session in localStorage **is** the session for every
app: one sign-in, one SMS, everywhere. Across origins you would be building token
handoff between apps, which is real cryptographic work and a genuinely bad place for
a solo maintainer to spend risk budget. One origin makes cross-app SSO a non-feature.

Consequence to accept: **authed apps stop being "open the file from Downloads".**
`file://` origins are opaque — storage is unreliable, and auth redirects do not work.
Local-only use keeps working from a file; sync does not. GitHub Pages with a custom
domain is fine, free, and enough. (A custom domain rather than
`tomoncupa.github.io` so an account isn't tied to a hostname you might outgrow.)

Static-hosting implications, none of them blocking:

- The `anon` key is public by design; **RLS is the security boundary.** The service
  role key never touches a browser. Ever.
- No app servers means anything privileged is a Postgres function or an Edge
  Function, not a Node process.
- `supabase-js` comes from a CDN import — one network dependency the current
  single-file apps do not have. Vendor a pinned copy if that bothers you.

### Which apps go multi-user, on your cost rule

You said: multi-user for whatever is practically free to host. Applying that:

| App | Data per user | Verdict |
|---|---|---|
| **BLOCK** | A few KB of JSON — lanes, blocks, ticks | **Multi-user.** Free tier absorbs 1000 of these |
| **Daily Quest OS** | Same order | **Multi-user** |
| **ARC** | KBs of map JSON — *unless* images are embedded | **Multi-user with a media rule** (below) |
| **Form Review** | Video: hundreds of MB per user | **Personal / local-only.** Do not upload video |

Form Review is the one that breaks the rule. Pose detection runs client-side so
compute is free, but storing and serving video is not, and egress is the line item
that surprises people. Keep the videos on the user's device: it stays a local tool
that happens to live under the same roof. If you later want clients to send you a
lift, that is a different product decision with a different budget — flag it and we
design it separately.

> **Assumption A2 — ARC and images.** If ARC maps embed base64 images, per-user
> storage goes from KBs to tens of MB and the free tier disappears. Either cap
> embedded media, or move images to Supabase Storage with a per-user quota. Tell me
> which and I will size it.

### Skool: separate, and deliberately so

Keep membership and app identity apart, as you suggested. Skool gives you no
identity API to lean on, and tying accounts to a membership means a lapsed member
loses their data — which is a support problem *and* a bad look.

Practical middle ground: a **join code** in the Skool post that tags
`profiles.cohort` at sign-up. You get to see who came from where; the user gets no
extra step; nothing breaks when their membership lapses. It is not access control —
anyone with the link can sign up — but access control is not what you asked for.

> **Assumption A3 — no gating.** I am assuming you do not need to *prevent*
> non-members from using the apps. If you do, that is manual approval or paid
> integration work, and it changes this section.

---

## 6. Migration path and build order

Clean slate on Daily Quest OS, BLOCK extended rather than rebuilt.

**Step 0 — Origin.** Pick the domain, move the apps under it. Cheap, and everything
else assumes it.

**Step 1 — Backend skeleton.** Supabase project; `profiles`, `activities`,
`activity_aliases`, `completions`; RLS on all of them; `resolve_activity`; the
`day_state` view. Exercised by a throwaway test page, not by an app. Deliverable: a
page that resolves an activity from two "apps" and proves the same UUID comes back.

**Step 2 — Auth.** Phone OTP via Twilio Verify, captcha, geo-restriction, email
fallback. Built as a **sign-in that the apps do not require** — the optional-account
model. Deliverable: sign in on a phone and a laptop, same profile.

**Step 3 — Sync adapter, completions only.** The outbox, the cursor, realtime
subscription, and the reduce — plugged in *underneath* today's kernel so its API does
not change. **This is the piece that must be right**, and doing it with one table
means when it misbehaves there is exactly one place to look. Deliverable: tick on the
laptop, watch the phone update, then do it with the phone in airplane mode and watch
it reconcile.

**Step 4 — BLOCK.** First real app on the stack. It already emits ticks through the
kernel, it is the one going to community members, and it is not being rebuilt — so
if something breaks, it is the new layer, not new app code. That attribution is worth
a lot on the first app.

**Step 5 — Daily Quest OS.** Built from scratch *against a proven contract* rather
than co-evolving with one. Rebuilding the app and inventing the sync layer at the
same time is how you get a rebuild that is really two rebuilds.

**Step 6 — ARC**, once the media question is settled. Different sync tier (blobs on
save), so it should not go first.

**Never — Form Review.** Stays local. Revisit only as a deliberate product decision.

The obvious counter-argument, stated: Daily Quest OS is being rewritten anyway, so
doing it first would avoid touching BLOCK twice. I still say BLOCK first, because
BLOCK's changes are additive (it already speaks the kernel) while DQO is a blank
page — and you want your first integration to be the one where the app side is
boring.

---

## Assumptions to correct before I build anything

| # | Assumption | Why it matters |
|---|---|---|
| A1 | Users' country is unknown to me | US needs A2P 10DLC registration; UK/EU does not. Changes setup effort and slightly the vendor case |
| A2 | ARC may embed images as base64 | Turns KBs/user into tens of MB/user and breaks the free-tier premise |
| A3 | No need to gate non-Skool-members out | Real gating needs manual approval; changes §5 |
| A4 | `habits.html` (built today) is a stand-in, and Daily Quest OS supersedes it | If DQO *is* the habit tracker, today's app is a prototype to harvest, not a thing to migrate. **Tell me which** |
| A5 | No coach-views-client data | Sharing is much cheaper designed in now than retrofitted into RLS later. If coaching views are coming, say so now |
| A6 | Phone + display name only; no health data beyond activity names | Anything clinical raises the compliance bar |
| A7 | One timezone per user, dates stored as the user's local date | Streaks across travel behave sanely; UTC storage would not |
| A8 | You are the only developer | Every recommendation above trades cleverness for one-person maintainability |

## Open questions

- **Q1 — quantities:** when two apps log different amounts for the same activity and
  day, is that `max`, `sum`, or per-app? (Booleans are settled; numbers are not.)
- **Q2 — does the tick history from today's local build need to survive** into the
  backend, or is that a clean slate too?
- **Q3 — do you want the disagreement surfaced** ("BLOCK said done at 07:10, you
  unticked it at 21:00") or silently resolved? The log supports either; the UI is a
  choice.
