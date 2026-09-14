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
| **ALLOCATED** | pots, plus every bill due in the window he picks, by default before the next money lands |
| **FREE** | liquid minus allocated. The only number that answers "can I?" |

And under them, **RUNWAY**: how many months he could keep paying himself and
the bills if every client left tomorrow.

Runway is the app's real subject. Liquid goes up and down for boring reasons.
Runway only moves when something structural changed, and it is the number that
tells him whether the business is getting safer or not. It is also, in the
language of the root brief's psychology section, a **competence** signal rather
than a compliance one: it is evidence the thing is working, not a scolding
about a budget he missed.

### How far ahead FREE looks

Tom, 2026-09-14: *"Let me adjust the window for what's free to spend."*

FREE holds money back for the bills due between today and a date. That date
used to be fixed: the next unpaid client payment, or 30 days out if none was
expected. The default is still that. But a client due tomorrow shrinks the
window to one day, rent on the 30th stops counting, and free looks biggest in
exactly the good week this brief warns about.

So "Change how far ahead", under the big number, picks one of: until the next
client payment, until the end of this month, or the next 7, 14, 30 or 90 days.
It is the `wealth.freeTo` setting, so it travels in a backup, and anything
unrecognised reads as the default. Pots count whatever the window. **The
screen always says in words which window it is using**, and the ALLOCATED tile
names its end date, because a number whose rules changed without the screen
saying so is the quiet lie law 1 forbids.

Watched: a ₱100,000 count, rent ₱20,000 on the 17th, internet ₱2,000 on the
28th, gym ₱1,500 on the 10th and a client due on the 20th, on 14 September.
All six windows gave what was worked out by hand, from ₱20,000 allocated for
the next payment to ₱70,500 for 90 days. Picking 30 days from the menu saved
the setting and moved FREE from ₱80,000 to ₱76,500.

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
| `client` | client id | `{name, rate, cycle, every, start, days, day, perWeek, status, note}` — `days` is a list of days of the month; `day` is its first, kept for rows written before the list; `perWeek` is his rough pace for a client paid by the session |
| `sesh` | date + id | `{client}` — one session delivered, for a client paid by the session |
| `pack` | date + id | `{client, n, price, note, parts, when}` — sessions sold before they happen; `parts` splits the price, `when` is `before` or `after` each block |
| `paid` | date + id | `{amt, acct, client, note, t}` — money in. No client means a one-off |
| `bill` | bill id | `{name, amt, day, acct, cat, from, until, cycle, every, start}` — a recurring outgoing. `cycle` is `month`, or `days` for one due every `every` days after `start`, the day it was last paid. No `cycle` reads as monthly |
| `pot` | pot id | `{name, target, acct, ord}` |
| `move` | date + id | `{pot, amt, dir}` — money into or out of a pot |
| `debt` | debt id | `{name, owed, rate, min, day}` |
| `recon` | a statement line's fingerprint | `{d, amt, acct, kind, spend, sdate, skip, comment}` — this line has been dealt with. What makes reading the same file twice harmless. `comment` is his, typed on the statement viewer |
| `xfer` | date + id | `{from, to, amt, note, t, stmt}` — his own money moving between two of his accounts. One row however many statements show it; `stmt` maps each account to the statement line that confirmed it |

### Shared with STATUS, and the care that needs

`spend` and `acct` are written by both apps. The root brief permits that and
sets the condition: **change a row by merging into what is there, never by
rebuilding it.** WEALTH reads the whole payload, changes its own fields, and
writes it back entire.

Two structural decisions keep that from being a promise nobody checks.

**0. WEALTH may CREATE a spend, and does.** Tom, 2026-09-11: *"I should be
able to log spending here."* STATUS stays the phone in the supermarket queue;
this is the desk, for putting in a bank statement or a purchase missed on the
day. It writes a fresh `spend` row, which is a different act from rebuilding
somebody else's, and the category still goes in a `mark`.

**1. WEALTH never labels a spend by editing the spend.** A category, a tag or a
big-purchase flag goes in a `mark` row keyed off the spend, not into STATUS's
payload. So the food price, the account, the receipt photo and the meal link
STATUS put there cannot be dropped by an app that does not know they exist.
This is the calcium bug, designed out rather than remembered.

**2. WEALTH never puts a balance on an account.** STATUS seeds accounts as
`{name, order}` and would wipe anything else on that row. So a counted balance
is a `count` row of its own, keyed by the day it was counted. That also makes
balance history free, which is what the reconciliation screen reads.

**3. A purchase's account is its NAME, because STATUS writes it that way.**
STATUS stores `spend.acct` as the account's display name, "GCash", and STATUS
owns that row's shape. WEALTH looked accounts up by key, "gcash", so until
2026-09-14 every purchase logged day to day in STATUS was "unknown account"
here and never came off a balance. Watched: GCash counted at ₱1,000 with a
₱250 lunch logged the STATUS way read ₱900 instead of ₱650. Every read now
goes through `acctKey`, which accepts either form, and every purchase WEALTH
writes or corrects carries the name. Rows WEALTH owns (`paid`, `xfer`, `bill`,
`pot`, `count`) keep using the key.

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

**But refusing to guess is not the same as refusing to speak.** Tom,
2026-09-11: *"I told it I received money in the bank, it still shows up as
never counted."* It did, and by the letter of this law that was right, because
a payment is not a count. It was still wrong: he had just handed the app a
fact and the screen threw it away and offered nothing to do about it.

So an uncounted account now shows **what has been logged against it**, named as
movement rather than as a balance, with the count one tap away. And logging
money into an uncounted account offers to set the balance right there, because
the moment he has the information is the moment to ask.

The law is unchanged: the app still never invents a balance. The correction is
that **a law is not an excuse for a dead end.**

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

### 4. Numbers group themselves, and reading one survives it

Tom, 2026-09-11: *"Numbers should automatically have commas."* Every amount
field now groups as it is typed.

This uncovered a live way to lose money. `parseFloat('12,000')` is **12** — not
12000, not an error, twelve, with three zeroes dropped in silence. Every amount
in the app went through `num()`, which was a bare `parseFloat`, so a single
typed comma would have saved a hundredth of what he meant with nothing said.
`num()` strips grouping before parsing now, and it always should have.

Formatting on every keystroke moves the caret, which is what makes most
attempts at this horrible to type into. The caret is restored by counting
**digits** before it rather than characters, so inserting a comma to the left
of the cursor leaves the cursor after the same digit.

### 5. Nothing important is typed twice

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

### 6. A cap is his to write, and it is never a verdict

Tom, 2026-09-11: *"I dont mind budgets per category, for ex I only want to
spend X amount of outside food."*

Three rules, and they are what stop this becoming the kind of budget nobody
opens after week two.

**Nothing ships with a cap.** A cap is a claim about how somebody should live,
which is prescription, and prescription is only ever his to write.

**Show the number, never the verdict.** "3,400 of 5,000, 11 days in" is a fact
he can act on. "Over budget" is a scolding, and a screen that scolds is a
screen he stops opening, which costs the data and not just the mood.

**Pace, not just total.** Half the cap on the 5th and half on the 25th are
opposite situations and one number cannot tell them apart. Every bar carries a
mark where an even spread would put him today. It is a line to read against,
never a rule, because nobody spends evenly.

**A cap is called an allowance on screen, and it holds money back.** Tom,
2026-09-14: *"If I allot 9k for groceries, how does that work when it shows
up in my union bank import?"* and *"I also want it to show if I went over
groceries."* His word is allot, so every screen says allowance; the field is
still `cap` on the `cat` row, so nothing was migrated.

Every purchase filed under the category counts against it, from any account
and however it arrived: logged in STATUS, typed here, or read off a statement,
because the import files a line through the same rules. A UnionBank grocery
line is Groceries the moment a rule says so, and it comes off the allowance
like any other.

What is not spent yet is money already spoken for, so **FREE holds back what
is left of each allowance**: this month's remainder, never below zero, and the
whole allowance for each later month that starts inside the window. Going over
holds back nothing extra, because what was spent has already left the
account. A bill filed under a category with an allowance is not held back on
its own, or the same groceries would be held twice.

MONEY OUT lists each allowance in the card its category belongs to, as spent
of allotted this month with a bar, then how much is left or how much over. Over
is a number, as law 7 says, and it is in the warning colour because he asked
to see it. The groceries card carries "Allot a monthly amount", which opens the
category's own sheet.

Watched: a ₱9,000 Groceries allowance with ₱3,000 bought from a bank account
read "₱3,000 of ₱9,000 spent this month, ₱6,000 left", and FREE held back
₱6,000 plus October's ₱9,000 inside a 30 day window. ₱7,200 more from GCash
read "₱10,200 of ₱9,000, ₱1,200 over", and FREE held back only October's.

And the doctrine line that earns its keep: a target missed for three weeks is
not a target, it is furniture. A cap passed three months running offers to
become the middle of those three months. That is not lowering the bar, it is
the only way the bar does anything. Offered once, quietly, and never on a
single bad month.

### 7. Show the number, never the verdict

Client concentration is the case that made this a law. If one client is 34% of
his income, the app says 34%. It does not say that is dangerous, because the
published benchmarks are written for firms with staff and he is one coach. Ship
vocabulary, never prescription. The root brief's rule about never telling him
what a behaviour did to a number applies here with full force: no line ever
reads "you saved more because you cooked".

### 8. Categories are few, and rules do the sorting

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
| `month` | months | one or several days of the month, defaulting to the start date's |
| `week` | weeks | the start date, stepped |
| `sesh` | sessions delivered | nothing. It is a count, billed after |
| `pack` | — | nothing. Sessions are bought before they happen |
| `oneoff` | — | once, on the start date |

### Several days a month

Tom, 2026-09-14: *"I have a client who pays me 3500 every 1st and 15th."* One
day a month could not say that, and two client entries would split one
person's history in two.

A monthly client carries `days`, a list: `[1, 15]`. The rate is **per
payment**, so that client is ₱3,500 on each date and the sheet says it comes
to ₱7,000 a month. Each date is its own expected payment, so a missed 15th
shows as late on its own. Days are typed as "1, 15" and cleaned to sorted,
unique, real days. A client written before the list existed carries one `day`
and is read as a list of one, not migrated.

**A payment settles the nearest date, within half the gap to the next one.**
The old rule was "the first unclaimed payment within 14 days", which is right
for a monthly client and wrong for one paid twice a month: a client who missed
the 1st and paid on the 14th would have that payment settle the 1st, and the
15th would show as late. The reach is now 14 days or half the smallest gap
between that client's dates, whichever is smaller, and the nearest unclaimed
payment wins. That also tightens weekly clients, which had the same flaw.

Two days that clamp to the same date in a short month, the 30th and 31st in
February, are one payment, not two.

### The 31st

A monthly day is stored as typed, up to 31, and **clamped per month when the
date is worked out, never when it is saved.** So a client who first paid on
31 January is due 28 February and then **31 March**, not 28 March. Clamping at
save time would have quietly turned every 31 into a 28 and no screen would
have said so.

The same applies to a bill. Rent on the 30th is the 30th in every month that
has one, and February's last day in the one that does not.

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

### Packages bought up front

Tom, 2026-09-11: *"I want tracking for clients who pay for sessions upfront
either whole or partial as well as session tracking."*

A `pack` is sessions sold before they are delivered. It asks two questions at
once and they pull opposite ways:

- **Do they owe me money?** The package price, less what has been paid.
- **Do I owe them sessions?** What the money actually covers, less what has
  been delivered.

The second is the one nobody tracks, and it is a real liability: he has been
paid for work he still has to do. **Both are shown and never netted**, because
they are not the same kind of thing.

**Payments are applied to packages in order, oldest first, never tagged to
one.** Partial payment then needs no extra field and no choice anyone can get
wrong. Pay half of a package and half of it is outstanding. Pay two at once and
the money runs on into the second.

**"Sessions you owe" counts only what the money covers.** Summing sessions
remaining would count a package bought and not paid for as work owed, which it
is not: that is a debt they have. Each package converts its allocated money
into whole sessions at its own price, because two packages can be priced
differently.

`sesh` and `pack` are two kinds rather than one with a flag, because they are
opposite ways round: one bills after the sessions, the other before.

### Packages paid in parts

Tom, 2026-09-14: *"I have a live online client, 45k for 30 sessions but we
split it into 22.5 every 15 sessions at roughly 4x a week."*

Before this a package was owed in full the day it was sold, so the second
₱22,500 would have read as late from day one. A package now carries `parts`
and `when`. The price splits evenly, with the last part taking any rounding.
With `when` set to `before`, the default, a part is due at the start of its
block: the first when the package is sold, the next when the session that
ends the previous block is done. With `after`, a part is due when its own
block ends. Sessions belong to packages oldest first. A package with one part
behaves exactly as it always did.

**Money that is not due yet is not owed.** A part that is reached and unpaid
is owed, and late the day after. A part not reached yet is "to come", and
payments still apply oldest part first.

**A guessed date says it is a guess.** A client can carry `perWeek`, roughly
how many sessions a week. From it, a part not reached yet gets an estimated
date: the latest session or the sale date, plus the sessions still to go at
that pace. It is never earlier than today. It appears under Expected next as
"about" that date and is never counted late. Without a pace, the part has no
date and the sheet says what would give it one.

### Sessions as boxes

Tom, 2026-09-14: *"For clients on session, I want to be able to check boxes.
Upon opening the client profile let me input the date of each session."*

A block is the sessions one payment covers: every N for a session client, a
package's size for a package client. The client's sheet shows one box per
session in the block being worked through. A ticked box is a `sesh` row, the
same row as always, and shows its date, which can be changed right there. An
empty box ticks as today. A date in the future is refused, because the future
is not a record. Unticking takes the session back, with undo. "Show earlier
sessions" draws every block.

Boxes follow the sessions in date order, so moving a date can move a session
to another box, and the count can never disagree with the rows. For a package
client the block shown is the oldest package not yet full, because sessions
belong to packages oldest first; sessions past every package bought show as
their own block. "Log a session today" stays on the CLIENTS tab and in the
client's menu, where one tap is the point.

Watched: a client paid every 10 with 12 sessions opened on sessions 11 to 20
with two ticked and dated. Ticking 13 added a session dated today; changing its
date moved the row and kept 13; a 2027 date was refused and put back;
unticking 11 left 12 sessions with the rest moved up a box. A package of 5 with
2 delivered showed five boxes, two ticked.

### What a session earns

Tom, 2026-09-14: *"For session clients, I'd like to show me how much I make
per session, and also a setting for sessions per week, which also lets me see
how much I earn per week for that client."*

A client paid every N sessions earns their rate over N. A package client earns
their latest package's price over its sessions, since a renewal at a new price
is the price that is true now. With a pace, a week's worth is that times the
pace, shown as "about", because the pace is his rough figure. It sits on the
client's row in CLIENTS and in their sheet, where it follows what is typed
before it is saved.

### One-offs

A `paid` row with no client is a one-off: a commercial, a workshop, anything.
Same row, one field empty.

**Everything about a client is visible**, set by Tom: every payment they have
ever made, when they started, what they are worth, what share of income they
represent, and for a session client every session delivered.

**What a client paid is shown exactly, never rounded.** Tom, 2026-09-14:
*"Don't round up client ever paid."* EVER PAID on the client's sheet and each
client's total on CLIENTS show centavos when there are any, through
`exactMoney`. The second-currency view keeps its own rounding, because it is a
view and not the money.

**There is no average lateness.** Tom, same day: *"I don't need to know if a
client pays on time on average, I've logged 8 sessions with [a client] But
WEALTH was only born recently."* Most of a client's history happened before
the app did, so "pays +3d on average" described the app's age, not the client.
The PAYS tile is gone. A single payment that is late today still shows as
late, because that is a fact about today.

Clients have their own tab, **CLIENTS**, set by Tom on 2026-09-14: every client
with where they stand today (the oldest unpaid date, or the next one coming),
what is due this month and how much of it is paid, what is owed, and the
session tracker. `+` on that tab adds a client by name and opens their sheet.
MONEY IN stays about money arriving: owed, next, received.

**The CLIENTS bars measure what each client is worth a month, not what they
have paid.** Tom, 2026-09-14: *"These bars arent fair since they dont count
past payments."* They were each client's share of payments logged in the last
twelve months, and WEALTH only holds payments from mid July, so a client of a
year looked no bigger than a new one. `clientMonthly` reads the terms instead:
a monthly client is their rate times their days a month over every how many
months, a weekly one their rate times the weeks in an average month, and a
session or package client their price a session times their sessions a week,
shown as "about" because the pace is his rough figure. Without a pace that
client's worth is unknown and says so, rather than being counted as zero. The
list sorts by worth, each row's figure is worth a month, and the payment count
says "logged" because it only goes back as far as the app. What a client has
ever paid stays exact on their own sheet.

Watched with six made-up clients shaped like his: a package client at ₱1,500 a
session and four a week read about ₱26,089 a month and 60%; ₱3,500 on the 1st
and 15th read ₱7,000; ₱12,000 every three months read ₱4,000; a session client
with no pace read a dash and asked for sessions a week.

**Card titles say what is on the card, not how to feel about it.** The card
of bills that renew on their own was called STILL PAYING FOR, and Tom, same
day, heard it as a complaint about money he chose to spend. It is
SUBSCRIPTIONS AND MEMBERSHIPS now.

---

## Bills every few days

Tom, 2026-09-14: *"I pay Meralco roughly 1040 every 6-7 days, how do I put
this in monthly bills?"* Prepaid electricity has no day of the month, so a
bill that could only say "the 17th" could not hold it.

A bill is now **once a month** on a day, or **every few days**: a number of
days and the day it was last paid. The amount is per payment. The number may
be a fraction, and that is the point: 6.5 gives dates 6 and 7 days apart in
turn. Each date is rounded from the start, never from the date before, so the
rounding cannot drift. The day it was last paid is not itself due.

What it comes to in a month is the amount times 30.44, the days in an average
month, over the number: ₱1,040 every 6.5 days is ₱4,870. Runway, the monthly
total and the subscriptions card all use that figure; FREE and the list of
bills coming up use the real dates. The bills list reads "every 6.5 days,
about ₱4,870 a month", and a monthly bill shows its day as just the number,
"17", as Tom asked the same day.

Watched: a ₱1,040 bill every 6.5 days from 4 September, made through the bill
sheet with its own buttons, was due 17, 24 and 30 September, then 7 and 13
October, and showed in the list and the upcoming dates exactly so.

### A loan's payments are bills, with an end

A debt says what is owed and is never taken off cash. It does not hold its
payments back. So when Tom added two GLoans on 2026-09-14 and said *"add them
in bills"*, each payment went in as a bill as well, filed as Debt payment and
paid from GCash, so FREE holds it back before its date. A loan ends, so its
bill carries `until`, the date of its last payment; a loan with one payment
left carries `from` and `until` on the same day, or it would repeat every
month for ever. Neither field is on the bill sheet yet, so set by hand, and
the Debt payment category is not in the sheet's picker either; editing such a
bill keeps both, because the sheet merges.

Debt payment is in the `move` group, so an imported GLoan repayment filed
there is never counted as spending, and the bill is counted once, in runway.

### Three cards on MONEY OUT

Tom, 2026-09-14, asked for these as separate cards, in his words:

| Card | Bills filed as |
|---|---|
| **BILLS & UTILITIES** | everything not below: Rent, Utility Bills, uncategorised |
| **SUBSCRIPTIONS, MEMBERSHIPS & OPERATING COSTS** | Subscriptions, Gym, or any `biz` category |
| **GROCERIES, WATER & REGULAR SPENDING** | Drinking Water, or any `var` category |

Every bill is in exactly one card, and the card follows its category, so
re-filing a bill moves it. Before this, the subscriptions card repeated bills
already listed above it and led with the yearly figure. Now every row's
figure is **what it comes to a month**, a bill every few days says what each
payment is underneath, and each card totals a month. The subscriptions card
alone adds the year after it, unbolded, because he asked for the monthly
cost to lead, not for the year to go.

**A bill filed as everyday spending is left out of runway.** Runway is the
bills plus a normal month of everyday spending, measured from what was
actually spent. A Groceries bill added on top would count groceries twice.
FREE still holds back its dates, because the money still goes out on them,
and the note under runway says when bills were left out.

Watched: nine made-up bills, one per category, landed one each in the right
card with ₱24,870, ₱6,749 and ₱11,600 a month. With ₱20,000 rent and an
₱8,000 Groceries bill, runway counted ₱20,000 of bills and FREE held back
₱28,000.

## Import, and what it took

**Statement import.** Built 2026-09-11. Tom: *"the purpose of the statement
import to make sure I have everything correct but we definitely dont want
duplicates, maybe uncertain cases you can ask me everything whether 2 things
are the same or not, then we can create a master entry."*

The important half is the second half. **An import that only ADDS is worse than
no import**: the same lunch appears twice, every total is wrong, and the app
has quietly become less true than the notebook it replaced.

Every line lands in one of four places.

| | |
|---|---|
| **known** | reconciled on an earlier import. Silent, and this is what makes reading the same file twice harmless |
| **certain** | same account, same amount to the peso, same day, and nothing against it: when both sides know the time it agrees within 45 minutes or the shop name matches. Merged without asking |
| **ask** | close but not certain. He decides one at a time, and the question is always "are these the same thing" |
| **new** | nothing like it. Offered as something to add |

Certainty is deliberately narrow. A wrong automatic merge is invisible and a
question costs three seconds.

**Merging makes a master entry, not a second row.** What he knows — the
category, the note, the receipt, the occasion — stays. What the bank knows
better — the exact amount, the date it cleared, its own wording — is written
over the top. The row keeps its identity, so a category set six weeks ago
survives being reconciled. Watched: a hand-logged ₱5,395 became ₱5,400 and
kept its Groceries.

**Nothing is written until he presses apply.** The whole run is worked out in
memory and shown as a tally first, because an import that has already happened
by the time you see it is not something you can say no to.

**A skipped line is remembered too.** Otherwise the second import asks the same
question again, and a question you have already answered is how somebody
learns to click through questions without reading them.

### What the parser had to learn

**The delimiter is decided once for the file, not per line.** Deciding per line
bit immediately: `5,400.00` made a pasted PDF line look comma separated, so one
statement was read with three different column counts and came out as a single
nonsense row. Each candidate is tried and the one giving the same column count
on the most lines wins. A thousands separator cannot win that, because it only
appears on the lines with big numbers. Comma is tried last on a tie: a run of
spaces is never accidental, a comma very often is.

**Columns are found by a header row if there is one, by shape otherwise** — the
column that parses as a date every time, the one that parses as a number every
time, and the longest text for the description. Separate debit and credit
columns are handled.

**Day-first versus month-first is settled once, for the whole file.** A number
over twelve proves it. If nothing proves it, he is asked — but only if the file
actually contains a loose date. A file of ISO dates states its own order on
every line, and asking a question with no doubt behind it is the fastest way to
teach somebody to click through questions.

**PDFs and spreadsheets are opened directly.** An earlier version of this
brief said PDF parsing was forbidden because it needs a CDN library. That was
wrong: hard constraint 4 forbids a dependency the app cannot run WITHOUT, and
SheetJS was already the precedent. The PDF reader (pdf.js 3.11.174) and the
spreadsheet reader (SheetJS) load from cdnjs only when a file needs them, and
if either fails the import says so and pasting still works. Nothing else in
the app waits on them.

PDF text is taken in the order the file drew it, not rebuilt from positions on
the page. Rebuilding by position is what scrambled GCash's layout in the first
attempt, with amounts landing on the wrong rows. Drawing order is one
transaction at a time.

A locked PDF asks for its password on screen. The password is handed to the
reader and nowhere else: not a setting, not a row, not the console.

### What his real statements taught

Built 2026-09-13 against Tom's own GCash PDF (249 lines, 15 July to 12
September) and UnionBank spreadsheet (38 lines, 14 August to 12 September).
Each lesson is a way an honest-looking import puts wrong money in the app.

**1. A printed amount is not always money that moved.** GCash prints ride
holds as payments. Two ₱62 Angkas lines three minutes apart, the balance still
on the second, then a ₱93 line that takes ₱31. Wherever a statement has a
running balance, **the amount of every line is what the balance did**, not
what was printed. On the GCash file that removed 19 holds printed at ₱2,685
and folded 11 part-charges into the purchase they finish, so that ride is one
₱93 entry. The statement's own "Total Debit" overstates what left the wallet.

**2. A statement checks itself.** Opening plus every movement lands on the
closing balance to the centavo, or something is wrong: a missing page, text in
the wrong order. Both real files close exactly. When one does not, apply is
refused unless he turns on "import it anyway". Watched as the check under the
bug: the rows the app writes for an account reproduce the statement's closing
minus opening, not merely look right.

**3. A reversal cancels its original.** UnionBank sent ₱1,600 to a mistyped
GCash number and put it straight back. A line reading "Reversal of <ref>" and
the line carrying that reference are netted out together.

**4. His own money appears on both statements.** ₱5,500 from UnionBank to his
GCash is a debit on one and a credit on the other. Imported as spending and
income it inflates both. It is one `xfer` row, and the second statement links
to the row the first one wrote instead of adding another. A transfer changes
both balances and never touches spending or income.

**5. A match is decided for the whole statement, not line by line.** The first
build matched in date order, and "same account, same amount, within three
days" counted as certain. On the real GCash file that merged a hand-logged
"Angkas home ₱93" on 6 August into a "Bancnet P2M Send ₱93" on 5 August, moved
the entry there, and added the real ride as a second row. **Every total still
balanced**, so the self-check could never have caught it: arithmetic proves
the money is right, not that each entry is the right one.

Now an automatic merge needs the same day and no evidence against it. When
both sides carry a time they must agree within 45 minutes, or a word of the
shop name must match. When several lines want one logged entry, only a line
the clock or the name clearly picks may take it. Everything short of that is
asked, and a logged entry already given to one answer is never offered to
another.

**6. Apply runs once, and a statement saved twice can be undone.** Tom,
2026-09-14: *"Why am I seeing duplicate transactions?"* Read off his own
device: every line of his first GCash import was saved twice on 13 September,
175 purchases, 10 payments in and 15 transfers. Both copies of each line
carried the same fingerprint and were written about 24 seconds apart, which is
how long the first save took. It was not two imports, because a second import
would have recognised every line as already imported.

The cause was one level under the button. Every saved row announces itself,
and WEALTH redrew the whole app on each announcement, so a thousand rows was a
thousand redraws and the page froze. A second press on Apply queued during the
freeze and saved the statement again the moment the first finished. WEALTH
now redraws once per burst of saves, which took 300 saves from a freeze to 10
milliseconds and one redraw, and Apply ignores every press after the first.

The copies already saved are listed on SPENDING as **SAVED TWICE**, with a
button that removes them after a confirm and can be undone. Only copies that
share a fingerprint holding the bank's reference number are counted, because
that names one real line; two ₱93 rides with no reference can share a
fingerprint and both be real. The copy kept is the one changed most recently,
its category included, and the "already imported" record is pointed at it.

Watched: a pasted two-line statement driven through every import screen, with
Apply pressed twice back to back, saved two purchases, not four. Made-up
copies with and without a reference: only the referenced pairs were listed,
the copy re-filed later kept its new category, and undo put every row, mark
and record back.

Removed on his device the same day, at his request, after checking that the
two copies of every one of the 200 pairs were identical, category included.
Rows from statements went from 369 purchases, 20 payments and 30 transfers to
194, 10 and 15, with no pair left and no "already imported" record pointing
at a row that is gone.

### A PDF that is only a picture of the pages

Tom, 2026-09-14, with his UnionBank history saved through Microsoft's Print to
PDF: *"Wealth cant handle this current. Handle the data integration and update
the import feature."* Printing turned every letter into a drawn shape. The
file has four pages, no fonts and one image, the bank's logo, so the text
reader found nothing and the import said it could find no dated amounts.

**Such a PDF is now read the way a person reads it.** When a PDF gives no text,
each page is drawn and read by Tesseract, loaded from jsDelivr only then, the
same way the PDF and spreadsheet readers already are. If it will not load, the
import says so and suggests the spreadsheet. A word's column is decided by
where it starts against that page's header row; a line with a date starts a
transaction; a line whose words all sit in the description column carries on
the one above; anything else, footers and shading included, is skipped. What
comes out is an ordinary table for `readTable`, so everything after it is the
path a spreadsheet already takes.

**A misread figure cannot slip through quietly.** Every UnionBank line carries
its running balance, and the statement screen refuses a chain that does not
add up unless he turns on "import it anyway". Reference numbers are tidied,
because the reading returned `$41055193` and `S§39436773` for `S41055193` and
`S39436773`; a wrong reference would change a line's fingerprint, not its
money, but it would make reading the same file twice add it twice.

**His own account, known by the name he saved it under.** The spreadsheet
prints where money went, "to account: … 09…". The printed history does not:
"Sent to Tomm GXI 860671", where the digits are a trace number that changes
every time. So a recipient name and bank code is offered under "are any of
these yours?" like a number is, labelled "via GCash" for GXI so the most used
one is suggested, and kept in `wealth.ids.<account>` as `to:tomm:gxi`. Every
later line with that name and code is a transfer between his accounts, never
spending. A code read off a picture can come back as GX1, so digits in a bank
code are read back as letters. `payeeOf` also reads the short wording, so a
PPI line is the shop and any other code is a person, keyed by name and code
instead of a trace number that would make every payment a new payee.

**A same-day charge and refund cancel.** UnionBank printed an Angkas ride as
a ₱60 debit and a ₱60 credit on the same day with the same wording. Kept, it is
₱60 of spending and ₱60 of income that were neither. `settle` now cancels such
a pair like a reversal, for every statement.

Watched on his real file, in the test browser's own store and never his:
all 49 lines from 16 August to 14 September were read, the running balance
chained from ₱4,534.66 to ₱29,694.14 with nothing broken, which proves every
amount was read exactly, and multi-line descriptions came out whole. The
first pass returned two card references with the S read as an 8; `cleanRef`
now restores them, and every reference in the finished run was clean.
Dropped onto the import sheet, the account number ending 5046 chose Bank,
"Tomm via GCash · 7 times" was offered with GCash already picked and seven
other recipients left as not mine, and Apply read 38 added and 7 transfers:
exactly the seven "Sent to Tomm" lines. The Angkas ₱60 pair and the ₱1,600
reversal were not imported. Reading the four pages took about 15 seconds
with the page in view and 79 with it hidden, where the browser slows it.

Imported on his device the same day, with his answers. The account chose
itself, the recipient name was confirmed as GCash, and apply read 6 matched,
32 added and 7 transfers. Six of the transfers linked to rows his GCash
statement had already written, so each is now confirmed by both statements
and counted once; the seventh, on the last day, is new. Three lines were
asked about. A client's package payment he had logged into GCash arrived in
UnionBank, and was the same payment, so it moved to Bank and kept its client.
Two purchases of the same price six days apart were different. A ₱77 7-Eleven
line and a ₱79 entry four days later were the same, and the merge took the
bank's ₱77 and date.

That last answer came with a rule, and it is the rule the merge already
follows: *"Obey the numbers from the actual files rather than whats from
STATUS."* The bank's amount and date win; his category, note and client stay.

His Bank count had been taken partway through the statement's last day, and
lines dated on a count's own day do not come off it, so the count was
corrected to the statement's closing balance, ₱29,694.14, at his word.

### Seeing a statement, and commenting on it

Tom, 2026-09-14, sure a UnionBank line had been imported when it had not:
*"I also want to be able to view this and add comments."*

ACCOUNTS has **See statement lines**, and each account's menu has the same.
It lists every line read for that account in the bank's own words, newest
first and grouped by month, with a search over wording, amount and comment.
Each line says what the app did with it: added from the statement, matched to
what he logged, a transfer between his accounts, left out, or no longer in
the app. Tapping a line opens the purchase or payment it became.

**A comment belongs to the statement line**, merged into its `recon` row, so
it survives the file being read again, and it shows on the purchase or
payment that line became. The line's date is read from its fingerprint,
because a skipped line stores no other date.

**The reconciled count is said per account**, "GCash 219, Bank 0". The total
alone hid the fact that nothing had ever been read from his bank, which is
exactly the question he could not answer from the screen.

Watched: four made-up lines on one account showed under September and August
as added, matched, left out and a transfer. A comment typed on the added line
saved into its `recon` row with every other field kept, was found by search,
and showed on that purchase's sheet. An account with no lines had no menu
item for them.

### How an account is recognised

By a number: a GCash mobile number, or the last four digits of a bank account.
They live in settings as `wealth.ids.<account>`, not on the `acct` row, for the
same reason a balance does: STATUS writes that row as `{name, order}`.

The statement being read supplies its own: UnionBank's header carries the
account number, and a GCash owner is the number money is most often sent
FROM. Numbers that money moves to or from are then offered as a question, "are
any of these yours?", with one suggested only when a number sits under an
account's name AND is the most used number under that name. The one-off
mistyped GCash number is left as "not mine". Answers are remembered, and the
account sheet shows the numbers so a wrong guess can be fixed.

A four-digit number only counts when introduced as an account ending. Four
digits on their own turn up in every reference number.

### Import setup, asked once

Tom, 2026-09-13: *"Maybe we should have an import setup, where we can
categorize where things like Lawson Acqua Pebbles always get categorized,
asked once upon import first time."*

After the statement screen and before the questions, an import lists every
payee it has never decided: no rule matches it, and he has not already said to
leave it. He picks a category once and it becomes a rule, and a rule files the
whole history, so one answer sorts every past and future payment to that name.
The matched text is editable, because a bank's wording does not always stop
where the shop name does: "Acqua Pebbles" catches both GCash's "Lawson Acqua
Pebbles" and UnionBank's "LPI ACQUA PEBBLES".

"Not now" asks again next time. "Leave uncategorised" never asks again, and is
remembered in the `wealth.skipNames` setting. Rules the setup writes carry an
`imp-` id prefix so they can never replace a rule he wrote himself. Nothing is
saved until apply, and the review already shows what each line will be filed
as, counting the answers not yet saved.

**A payee is who was paid, not the first word.** The ALWAYS button used to key
its rule on the first word of three letters or more, and every GCash payment
begins "Payment to": one press on a Lawson purchase would have filed every
GCash payment as groceries. `payeeOf` now reads the name out of the bank's
wording, dropping branch cities, country codes, trailing reference numbers and
"with Reference No." tails, so four GLoan repayments are one payee.

### Transfers to people, and Unsure

Tom, 2026-09-13: *"Gcash will sometimes have transfers to numbers, I wont
always remember this. I would like to set an unsure tag incase I remember in
the future but treat them as one time transfers."*

A transfer to a person is recognised by its shape: GCash's "Transfer from X to
Y", a UnionBank "Sent to" with any code but PPI (PPI is a Maya QR payment to a
shop), or GCash's "Sent GCash to <bank> with account ending in". The person is
their account number, which is the same number whichever of his statements
shows it, so one answer covers both. A four-digit ending is keyed with the
words "ending in" around it, because four digits alone sit inside every
reference number.

Unless he picks a category, a transfer to a person is filed as **One-time
transfers**, tagged **Unsure**. It stays counted as money out, because it left:
excluding it would make spending look smaller than it was, which law 1
forbids. Every Unsure transfer waits in a STILL UNSURE card on the Spending
screen. Giving one a real category is remembering it, so the Unsure tag is
cleared in the same save. The number is remembered in `wealth.seenNums` so it is
not asked about again.

The One-time transfers category and the Unsure tag are vocabulary added after
first launch, so an already-seeded device gets them once, behind a flag rather
than a check for the row: deleting either keeps it deleted.

**A statement line is fingerprinted by its bank reference when it has one.**
Two ₱93 rides on one day share a date, an amount and a description; without
the reference the second would be skipped as already imported.

**Tax.** Deliberately absent. Tom is not registered. One factual line was said
once and will not be repeated: back tax would be a real claim on the buffer.
Nothing in the app mentions it.

---

## Time, days and weeks

Tom, 2026-09-11: *"I also want time tracking for the entries"* and *"I want to
review individual days and weeks."*

Every money row already carried a `t` millisecond stamp and nothing ever showed
it, so a day was a bag of amounts in no order. `t` stays the stored fact, since
it is what STATUS writes and what sorts correctly; the app turns it into
something a person reads and types.

**A time is typed against the row's own date, never the clock.** Editing
yesterday's entry must not move it to today.

**Untimed rows sort last, not first.** A pot move carries no clock, and a zero
stamp put it above a 7:15am coffee, which reads as midnight.

A time is **the one field WEALTH writes INTO a spend** rather than alongside
it. A time is the fact itself, not a label, so a `mark` would be the wrong
place and two sources of truth for when something happened is worse than the
separation is worth. It is safe because it goes through `merge`, which keeps
every field STATUS put there.

### Three zoom levels, one screen

Day, week and month on the SPENDING screen, not three screens, because it is
the same question asked at three distances and splitting it would mean three
places to keep in step. The arrows step by whatever is selected.

- **Day** is a timeline: what was bought, what arrived, a session delivered,
  money moved into a pot, down the clock. Things that moved money rather than
  spending it are greyed and carry no amount, because mixing them into a total
  is how law 2 gets broken.
- **Week** is seven rows, drawn whether or not anything happened, because an
  empty day is a fact about the week and a gap in a list is not. Monday first:
  a week starting Sunday puts a Saturday night out in the same week as the
  Monday being planned.
- **Month** is what it was.

## Currency

Tom, 2026-09-11: *"In settings, I want the option to pick currency. Then a
toggle to turn all the amounts into usd view, and back."*

**Every amount is stored in the base currency, always. The toggle is a view.**
Nothing in the store ever changes currency, so flipping the switch cannot
alter a number and flipping it twice is guaranteed to land exactly where it
started. That was checked by comparing the whole screen before and after a
round trip, character for character.

**Typing stays in the base currency even while the view is in dollars.**
Convert on the way in and a typed 100 becomes 5,850 becomes 99.99 on the way
out, and a round trip quietly loses money. So an amount field keeps the
currency the money actually is, says so in its label, and shows the other
figure underneath as a live hint. Both are on screen and only one is a fact.

**The rate is his number, not a live one.** Fetching it would put a network in
the middle of a money app that has to work on a plane, and hard constraint 4
says a dependency the app cannot run without is not allowed. A rate that goes
stale in silence is also worse than one he set on a day he remembers. So he
types it, the app stamps the date, and says how old it is. Past thirty days it
says so in warning colour.

**The switch lives in the header, not in settings.** A view you flip to check
something and flip straight back is a control, not a preference. It is hidden
entirely until a rate exists, because a switch that does nothing is worse than
no switch. The button shows the currency it will switch TO, so it says what
pressing it does rather than where you already are.

**Changing the base currency re-labels and does not convert.** The app cannot
know which of the amounts already entered were really in another currency, and
guessing would corrupt the whole history. The settings panel says this where
the choice is made.

Rounding: the base view shows whole units, exactly as it always did. The
second currency shows two decimals below a hundred, because ₱180 is $3.10 and
"$3" is a different claim, and whole units above that, where the decimals are
noise.

Currency settings are `setting` rows under the `wealth.` prefix, so the base,
the second currency, the rate and its date all travel in a backup.

## Pictures

**Where it went is a pie or ranked bars**, Tom's choice, remembered. Tom,
2026-09-14: "I would like some pie charts in WEALTH, perhaps give me more
viewing options there." It splits by category, group (fixed costs, business,
everyday), account or occasion. The pie is `Chart.pie`: the total in the
middle, a key of every slice with its amount and share, anything past six
folded into Other, and pointing at a slice or its row says that slice. The
bars are `Chart.shares`: the total on top with the biggest share in words.
By category, tapping one still filters the purchases below. Big one-offs stay
out of both, as everywhere.

**Where it came from**, on MONEY IN, is the same pair of views over who paid,
for this month, three months or a year, with one-offs as their own slice.

**The six-month chart** leads with the average month's net, and dragging across
it shows that month's net with what came in and went out. Money in is the
line, money out the quiet bars with this month lit, net the dashed line, with a
legend beneath. `moneyScale` and `chartInto` are gone: the engine does both.

**Monthly net** is in minus out, and it answers a different question from
liquid. Liquid says "can I?". Net says "did that month pay for itself?" A month
can end richer only because a client paid two months at once, which is why both
are shown and neither replaces the other. The six-month chart carries net as
its own line with a rule at zero, and the scale always includes zero or a
negative month falls off the bottom.

## Menus, rearranging and deleting

Tom, 2026-09-14: *"add right click functionality, let me rearrange with
holding, How do I delete an account?"*

Every row that opens something has a menu on right click and on a hold,
through `Mobile.hold`, which wires both from one call (DOCTRINE law 14). A row
opts in by carrying `r.menu` beside its `onclick`, and one pass after each
draw wires them. Every menu item also exists in that thing's own sheet, so
the menu is a shortcut and never the only route (law 6).

**Menus opened with a mouse did nothing until 2026-09-14.** Tom: *"Input
does not work on desktop unless I make the window narrow."* On a wide window
`UI.menu` floats a list and closes it on the next press anywhere, including a
press on its own item, so the item was gone before its click landed. A narrow
window gets a sheet, which is why narrowing fixed it. The + button, "Count an
account", "Log a session" and every right-click menu were dead at desk width.
Every menu now opens through WEALTH's `menu(at, items, opts)`, which swaps that
listener for one that ignores presses inside a menu and places the menu beside
what opened it. The cause is in `shared/ui.js` and is item 11 on the root
brief's foundation list; delete the swap when that is fixed.

**Rearranging** is for lists whose order is his to choose: accounts, pots,
categories and debts. A mouse presses a row and drags it; a thumb drags by the
grip, since on a narrow window pressing and moving is scrolling. The order is
read back off the page on drop. Accounts keep their place in `order`, the
field STATUS sorts by, so the order he sets shows in STATUS too; WEALTH's own
lists use `ord`. Clients are not draggable, because they are ranked biggest
earner first on purpose, and bills are not, because they run in due-date order.

**Deleting an account** moves everything that names it first: purchases (by
name), payments, transfers, bills and pots go to the account he picks. A
transfer between the two becomes money moving to itself and is removed.
Balance counts go with the account, because a count of one account is not a
count of another. The whole move is one undo. Nothing is ever left pointing at
an account that no longer exists.

**A client with history is not deleted.** Payments, sessions or packages would
point at nobody, so deleting one offers "mark finished" instead. A pot with
money set aside asks first, and says the money itself stays in its real
account.

**A purchase made from a restaurant meal** is removed the way STATUS removes
it: the meal loses its account, or saving the meal again would bring the
purchase back.

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
