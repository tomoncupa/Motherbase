# WEALTH

The money app. What is coming in, what is going out, what is already spoken
for, and how long it lasts.

This brief governs `wealth/` only. It obeys the master brief at the repo root
and may add rules but never contradict them. Where the two disagree, the root
wins and this file is the bug.

**Tom only.** It is in `DROP_APPS` in `tools/build-client.py`, like PORTION and
FORM. No tester ever sees it. That is not squeamishness about money, it is that
the app is built around one person's clients and one person's rent.

---

## FUNCTION, in one sentence

**It tells you what your money actually is, after everything already claimed.**

Not what you earned. Not what you spent. What is left once the pots, the bills
before your next payment and the debts have had their share. Everything on
every screen serves that, or it belongs somewhere else.

## Why it exists

Tom is a solo coach. His costs are flat and his income is not. Rent is the same
every month; a client can pause, finish, or pay late, and a commercial shoot
arrives out of nowhere. That shape of money is what breaks people, and it does
not break them by being small. It breaks them because in a good month it looks
like there is more than there is.

STATUS already logs the day to day. It is the phone in the queue at the
supermarket and it is good at that. It has never been able to answer the only
question that matters, which is whether he can afford something.

---

## The mission, stated plainly

Three numbers, in this order, at the top of the first screen:

| | |
|---|---|
| **LIQUID** | what is actually in the accounts |
| **ALLOCATED** | pots, plus every bill due before the next money lands |
| **FREE** | liquid minus allocated. The only number that answers "can I?" |

And under them, **RUNWAY**: how many months he could keep paying himself and
the bills if every client left tomorrow.

Runway is the app's real subject. Liquid goes up and down for boring reasons.
Runway only moves when something structural changed, and it is the number that
tells him whether the business is getting safer or not. It is also, in the
language of the root brief's psychology section, a **competence** signal rather
than a compliance one: it is evidence the thing is working, not a scolding
about a budget he missed.

---

## Ownership

WEALTH writes these types. It may read anything.

| Type | Key | Payload |
|---|---|---|
| `cat` | category id | `{name, grp, ord}` — `grp` is `fix`, `var`, `biz` or `move` |
| `rule` | rule id | `{match, cat, tag}` — text seen in a description, and what it means |
| `wtag` | tag id | `{name}` — an occasion, not a category. `date`, `gift`, `travel` |
| `mark` | `date\|spendKey` | `{cat, tag, big}` — what WEALTH thinks of one spend row |
| `count` | date + account id | `{bal}` — a counted balance, on the day it was counted |
| `client` | client id | `{name, rate, cycle, every, start, day, status, note}` |
| `sesh` | date + id | `{client}` — one session delivered, for a client paid by the session |
| `paid` | date + id | `{amt, acct, client, note, t}` — money in. No client means a one-off |
| `bill` | bill id | `{name, amt, day, acct, cat, from, until}` — a recurring outgoing |
| `pot` | pot id | `{name, target, acct, ord}` |
| `move` | date + id | `{pot, amt, dir}` — money into or out of a pot |
| `debt` | debt id | `{name, owed, rate, min, day}` |

### Shared with STATUS, and the care that needs

`spend` and `acct` are written by both apps. The root brief permits that and
sets the condition: **change a row by merging into what is there, never by
rebuilding it.** WEALTH reads the whole payload, changes its own fields, and
writes it back entire.

Two structural decisions keep that from being a promise nobody checks.

**1. WEALTH never labels a spend by editing the spend.** A category, a tag or a
big-purchase flag goes in a `mark` row keyed off the spend, not into STATUS's
payload. So the food price, the account, the receipt photo and the meal link
STATUS put there cannot be dropped by an app that does not know they exist.
This is the calcium bug, designed out rather than remembered.

**2. WEALTH never puts a balance on an account.** STATUS seeds accounts as
`{name, order}` and would wipe anything else on that row. So a counted balance
is a `count` row of its own, keyed by the day it was counted. That also makes
balance history free, which is what the reconciliation screen reads.

Both decisions cost one extra row and buy immunity from the one failure mode
the root brief says has already happened here.

---

## The laws of this app

### 1. Never show a number the data cannot support

A balance is only as true as the last time it was counted. So every liquid
figure carries how old its count is, and when that goes stale the screen says
so in words rather than quietly drifting. An account nobody has counted has no
balance, not a zero.

This is the whole reason the app is trustworthy. A money app that guesses is
worse than a notebook.

### 2. Moving money is not spending it

Paying down a debt, filling a pot, transferring between accounts. None of it is
spending, and if any of it lands in a spending total then every figure in the
app is wrong. That is what the `move` group of categories is for, and nothing
in it is ever counted as an outgoing.

### 3. One big purchase must not become the story of the month

A laptop makes a normal month look like a catastrophe and hides the ordinary
drift that is actually worth seeing. Big purchases are marked and pulled out,
listed on their own, and every "what do I normally spend" figure excludes them
and says that it does.

### 4. Nothing important is typed twice

Set by Tom: *"I want a lot of autofills because im scared of typo induced
duplicates."* He is right to be. A merchant name, a category, a client, an
account and a tag are all picked from what already exists. Typing filters the
list; it does not create a new thing. Creating is a separate deliberate act,
and it refuses a near-match: type "grab" when "Grab" exists and it offers the
existing one instead of making a second.

PORTION already works this way and refuses a second food with a name you
already have. Same rule, same reason.

There is a second duplicate this catches, and it is not a typo: the same amount
logged twice to the same account within the hour. That gets a question, not a
silent second row.

### 5. Show the number, never the verdict

Client concentration is the case that made this a law. If one client is 34% of
his income, the app says 34%. It does not say that is dangerous, because the
published benchmarks are written for firms with staff and he is one coach. Ship
vocabulary, never prescription. The root brief's rule about never telling him
what a behaviour did to a number applies here with full force: no line ever
reads "you saved more because you cooked".

### 6. Categories are few, and rules do the sorting

A category earns its place by being a decision. The starting set is his, in his
words, and the app ships it as vocabulary rather than growing it on its own.

Sorting happens through `rule` rows: text found in a description maps to a
category. Write a rule today and it sorts the whole history back to the
beginning, which is what makes categorising bearable at all. A single spend can
override its rule through its `mark`.

**Categories say what. Tags say why.** Groceries is a category. A date is a
tag. Keeping them apart is what lets him ask "how much on eating out" and "how
much on dates" without the two questions fighting.

---

## The starting vocabulary

Shipped as a starting set, editable, and never added to automatically.

| `fix` | `var` | `biz` | `move` |
|---|---|---|---|
| Rent | Groceries | Operating costs | Debt payment |
| Utility Bills | Outside food | Marketing | Savings transfer |
| Drinking Water | Transport | | Between accounts |
| Subscriptions | Health | | |
| Gym | Household | | |
| | Personal | | |

Gasoline, Grab and Angkas are all Transport. The split between them comes free
from the merchant name in the description, so it costs no categories.

`fix` and `var` is the split that matters most, because only the variable half
is steerable, and the fixed half is what runway is calculated against.

---

## Client payments

Tom, 2026-09-11: *"I need to be able to add clients with more freedom, I have a
client who pays me every 2 months and 1 who pays every X sessions."*

So a cycle is **a kind and a number**, not one of a fixed list of four.

| Kind | Number means | Repeats on |
|---|---|---|
| `month` | months | a day of the month, defaulting to the start date's |
| `week` | weeks | the start date, stepped |
| `sesh` | sessions delivered | nothing. It is a count |
| `oneoff` | — | once, on the start date |

Expected payments are **derived from that, never stored**, so correcting a rate
or a cycle fixes every future date at once and cannot leave a stale row behind.

The four older values are still read rather than migrated: `monthly` is
month/1, `4wk` is week/4, `session` is sesh/1. A migration that rewrites rows is
a migration that can go wrong, and reading two shapes costs three lines.

### A session is a row, not a counter

A client paid every ten sessions is paid off a number, so that number has to be
auditable. A running total would be one figure nobody could check or correct.
Instead every session is a `sesh` row with a date, which can be listed and
taken back one at a time.

Sessions are walked in order and chunked. Every whole chunk is a payment, dated
at the session that completed it. Twenty three sessions at ten each is two
payments owed and three into the third, which is a thing to show him rather
than a thing he has to work out.

**A session cycle settles in order, not by date.** A dated cycle matches a
payment that lands within a fortnight, because people pay late and a late
payment is still that payment. A session cycle has no date to be near, so the
second block of ten is settled by the second payment, whenever it turned up.

Because a session client's due date is always in the past, they never appear
under "expected next". They get their own card on MONEY IN, showing how far
into the block they are and what is owed, with the button he presses the moment
a session finishes.

### One-offs

A `paid` row with no client is a one-off: a commercial, a workshop, anything.
Same row, one field empty.

**Everything about a client is visible**, set by Tom: every payment they have
ever made, when they started, what they are worth, how late they usually are,
what share of income they represent, and for a session client every session
delivered.

---

## Not built yet, and honestly labelled

**Statement import.** Drop a GCash or bank export and the app sorts it into
three piles: already known, in the statement but never logged, and logged but
absent from the statement. The third pile is the real check. Matching is by
amount within a few days, and it is confirmed rather than guessed.

This is designed for and not built. Every money row already records whether it
came from a thumb or a statement, so the feature can arrive without a
migration. The reason it is second is that the file format is whatever GCash
and the bank decided to print, and that cannot be designed from a guess. It
needs one real export of each.

**Tax.** Deliberately absent. Tom is not registered. One factual line was said
once and will not be repeated: back tax would be a real claim on the buffer.
Nothing in the app mentions it.

---

## Device

**Desktop**, under hard constraint 10, like PORTION and for the same reason.
This is desk work. Reconciling a statement, setting up clients and reading a
month against another month are all sitting-down jobs with a mouse.

It still stacks to one column below 900px, keeps every target at 44px and
honours the safe areas, because a desktop app on a phone has to stay usable.

Quick entry on a phone stays in STATUS, which is what STATUS is for.

## First paint

Paint from localStorage immediately, redraw on `Rec.ready`. Never put the first
paint behind the store. That is item 2 of the root brief's foundation list and
STATUS is the app that got it wrong.
