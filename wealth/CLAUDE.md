# WEALTH

The money app. What is coming in, what is going out, what is already spoken
for, and how long it lasts.

This brief governs `wealth/` only. It obeys the master brief at the repo root
and may add rules but never contradict them. Where the two disagree, the root
wins and this file is the bug.

The build stories are in `wealth/HISTORY.md`, read the section for the corner you are working in.

**Tom only, forever.** It is in `DROP_APPS` in `tools/build-client.py`, like
PORTION and FORM. No client ever sees it, and that is settled rather than
current: Tom, 2026-09-16, *"WEALTH is a forever Tom only app that I'm directly
working on you with."* That is not squeamishness about money, it is that the
app is built around one person's clients and one person's rent. Build nothing
here for a stranger, and no onboarding for one.

**His own data may be written when he asks for it.** The copy he opens from
the folder cannot be reached from a session, so a change he asks to be made
for him goes into the website copy in his Chrome and reaches the folder copy
through the Google Sheet, once that copy is opened again. Say so when doing
it, and say what was changed to what.

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

### How the big number behaves

**UNALLOCATED on screen, `free` in code.** Tom's pick, 2026-09-16: LIQUID is
the tile beside it. Only the words on screen changed. (HISTORY.md: It is called UNALLOCATED on screen)

**A second press of the same button within 400ms is dropped** in the capture
phase, because his mouse double-fires. `data-rapid` buttons, such as the
arrows, are exempt. CLICKS in settings, on by default. (HISTORY.md: An accidental second click writes nothing)

**FREE's window is `wealth.freeTo`**, defaulting to the next client payment;
anything unrecognised reads as the default. The screen always says in words
which window it uses, and ALLOCATED names its end date. (HISTORY.md: How far ahead FREE looks)

**A bill already paid is not held back.** `billsOwed` drops a due date once a
purchase near it names the bill or matches its category and amount, reaching
no more than half the gap between dates; one purchase settles one date. (HISTORY.md: A bill already paid is not held back)

**ALLOCATED opens `allocSheet`** (2026-09-23): the pieces `board` adds, by date, with the balance left after each and the lowest point; its last figure must equal UNALLOCATED. Built by `allocItems`, which must stay in step with `board`.

**A package client is expected to renew** (2026-09-23, Jay): `packState().renew`, the last package again once its sessions run out, dated from `perWeek` or the last four weeks' sessions, always a guess, never late. Marking the client finished stops it.

**`wealth.onTime`, off by default.** Off, FREE counts no money that has not
arrived. On, it adds unpaid client payments due inside the window, never one
already late, and says how much. (HISTORY.md: Count clients as paying on time)

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

`spend` and `acct` are written by both apps, so **change a row by merging into
what is there, never by rebuilding it.** Read the whole payload, change your
own fields, write it back entire.

**0. WEALTH may CREATE a spend**, a fresh row, with its category in a `mark`.
Tom, 2026-09-11: *"I should be able to log spending here."*

**1. WEALTH never labels a spend by editing the spend.** Category, tag and
big-purchase flag go in a `mark` row keyed off it, so STATUS's price, account,
receipt photo and meal link cannot be dropped.

**2. WEALTH never puts a balance on an account.** STATUS writes `acct` as
`{name, order}` and would wipe anything else, so a counted balance is its own
`count` row, keyed by the day it was counted.

**3. A purchase's account is its NAME**, "GCash", because STATUS writes
`spend.acct` that way. Every read goes through `acctKey`, which accepts either
form, and every purchase WEALTH writes or corrects carries the name. Rows
WEALTH owns (`paid`, `xfer`, `bill`, `pot`, `count`) use the key. (HISTORY.md: Shared with STATUS, and the care that needs)

---

## The laws of this app

### 1. Never show a number the data cannot support

Every liquid figure carries how old its count is, and says so in words when
it goes stale. An uncounted account has no balance, not a zero, and the app
never invents one. But a law is not an excuse for a dead end: an uncounted
account shows what has been logged against it, named as movement, with the
count one tap away. (HISTORY.md: 1. Never show a number the data cannot support)

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

Amounts group with commas as they are typed. `parseFloat('12,000')` is 12, so
every amount goes through `num()`, which strips grouping first. The caret is
restored by counting digits, not characters. (HISTORY.md: 4. Numbers group themselves, and reading one survives it)

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

Nothing ships with a cap. "3,400 of 5,000, 11 days in", never "over budget";
over is a number in the warning colour. Every bar carries a pace mark, a line
to read against, never a rule. On screen a cap is an allowance, under BUDGETS;
the field is still `cap` on `cat`. Every purchase filed under the category
counts, however it arrived. FREE holds back what is left this month, never
below zero, plus each later month's whole allowance inside the window, and
never holds a bill in that category twice. Nothing suggests an amount, except
a cap passed three months running offers once, quietly, the middle of those
three. (HISTORY.md: 6. A cap is his to write, and it is never a verdict)

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

### Client rules, in short

**Several days a month**: `days` is a list, the rate is per payment, and a row
with only `day` is read as a list of one, never migrated. A payment settles the
nearest date within half the smallest gap. (HISTORY.md: Several days a month)

**Clamp a day when the date is worked out, never when it is saved**, so the
31st stays the 31st. Expected payments are derived, never stored; old cycle
values are read, never migrated. (HISTORY.md: The 31st)

**Every session is a `sesh` row, never a counter**, chunked in date order. A
session cycle settles payments in order, not by date. (HISTORY.md: A session is a row, not a counter)

**A package shows what they owe and what he owes, never netted.** Payments
apply oldest package first, never tagged to one. (HISTORY.md: Packages bought up front)

**A package part not reached yet is "to come", not owed**; a paced guess says
"about" and is never late. (HISTORY.md: Packages paid in parts)

**Session boxes are `sesh` rows in date order**; a future date is refused. (HISTORY.md: Sessions as boxes)

**Earnings a session and a week**, the week marked "about". (HISTORY.md: What a session earns)

**A payer is not a client.** Names live in `wealth.payers`, keyed on what
`payerOf` reads; never invent a client for one. (HISTORY.md: Who sent it, when it arrived as a number)

**The app never picks the savings figure** (`wealth.saveGoal`). Put away means
moved into a pot. (HISTORY.md: The month has a finish line)

**A client the app cannot value is counted apart, never as zero**
(`clientMonthly` returns null). (HISTORY.md: Recurring and one-off are not the same money)

**Losing a client is shown in numbers, no advice.** (HISTORY.md: What losing one client would do)

**`netCard` leads MONEY IN and MONEY OUT**, borrowed money left out. It does not
replace UNALLOCATED. (HISTORY.md: Net is on both money screens)

**Bills carry `ord`**; one without it sorts by due date after those with it.
No Move up or Move down on bills. (HISTORY.md: Bills have a handle)

**What a client paid is exact, never rounded.** No average lateness. CLIENTS
bars are worth a month from the terms, never payments logged. Card titles say
what is on the card, not how to feel about it. (HISTORY.md: One-offs)

### A payment sheet must merge, like everything else

Found while adding the above, and older than it: `paidSheet` rebuilt the whole
payload on save, so editing an imported payment dropped `stmt`, the link to
the statement line it came from. The "already imported" record then pointed at
a row with no link, and reading that file again would have added the payment a
second time. It merges now. The calcium bug, in the money app, found by
reading rather than by anybody noticing.

## Bills, in short

**Bills every few days**: `every` may be a fraction, each date is rounded from
`start`, never from the date before, and a month's worth is amount × 30.44 ÷
`every`. (HISTORY.md: Bills every few days)

**Bills every few months** (2026-09-23): `months` on a monthly bill, stepped from `start`, the month last paid; a month's worth is amount ÷ `months`. Never read from `every`, which a bill switched from days keeps. No field for it in the bill sheet yet; the sheet merges, so it survives an edit.

**A loan's payments are bills with `until`, filed as Debt payment, never
spending.** The bill sheet does not show `from` or `until` and must keep both. (HISTORY.md: A loan's payments are bills, with an end)

**Three cards on MONEY OUT, each bill in exactly one**, by category. A bill
filed as everyday spending stays out of runway; FREE still holds its dates. (HISTORY.md: Three cards on MONEY OUT)

**A bill coming up is a `note` todo**, only its earliest outstanding date, never
for a `move` category. Found by its key on ANY date, never only the one
`wealth.billMade` remembers: that setting is one row two devices overwrite,
and trusting it wrote the same bullet twice once live sync joined them
(2026-09-23). An unticked extra is deleted; a key deleted on any date stays
deleted. (HISTORY.md: A bill coming up is a todo bullet)

**Ticking it writes one `spend` keyed `bill-<bill id>-<due date>`.** Unticking
removes it only while unedited. `billTodoSync` settles ticks before it reads
`billsOwed`; the other order was the bug. (HISTORY.md: Ticking the bullet pays the bill)

## Filing and rules, in short

**File them quickly**: one payee decision per run, `wealth.quickAlways`. (HISTORY.md: Filing, quickly)

**A bill is offered, never assumed**, after a run ends; `billCovers` skips one
he already has, and `wealth.billAsked` remembers "Just this one". (HISTORY.md: Filing something as a bill offers to make it one)

**A rule written mid-run drops what it covers from the queue.** (HISTORY.md: A rule written in a run clears the rest of the pile)

**Borrowed money is not income.** A `paid` with `loan` is out of every income
and net figure. Never invent a debt row from a transfer. (HISTORY.md: Borrowed money is not income)

**A rule is only written from a statement's wording**, never a typed note. (HISTORY.md: A rule is only written from a bank's own wording)

**A tapped category is split BY SOURCE** (2026-09-23), right under the pie: `payeeOf` on the bank wording or his note, and names sharing a first word (two if the first is a number) are one place, so "Lawson Tonkatsu" is Lawson.

**A payment past its reach still settles** (2026-09-23, Tami paid the 19th for the 1st): after the nearest-date pass, a leftover payment for that client settles the oldest unpaid date on or before it.

**WHERE IT WENT is the first card under SPENDING's totals.** (HISTORY.md: Where it went sits under the totals)

## Import, in short

**An import that only adds is worse than no import.** Lines are known,
certain, ask or new, and certain is narrow. A merge keeps his category, note
and client and takes the bank's amount and date: *"Obey the numbers from the
actual files rather than whats from STATUS."* Nothing is written until apply;
a skipped line is remembered. (HISTORY.md: Import, and what it took)

**A PDF password goes to the reader and nowhere else**: not a setting, not a
row, not the console. Readers load from a CDN only when needed; pasting still
works. (HISTORY.md: What the parser had to learn)

**The running balance decides a line's amount.** A statement that does not
add up is refused without "import it anyway". Reversals cancel; his own money
between accounts is one `xfer`; a match is decided for the whole statement;
Apply runs once. (HISTORY.md: What his real statements taught)

**`savedTwiceBare` claims a group only when exactly one copy has a statement
link and the rest have neither link nor time.** (HISTORY.md: The copies with no reference at all)

**A payment rail is not a shop**: `isRail` stops a rule ever being written on
one. (HISTORY.md: A payment rail is not a shop)

**A picture-only PDF is read by Tesseract**, and the running balance still
guards every figure. (HISTORY.md: A PDF that is only a picture of the pages)

**Screenshots fill the days a statement has not reached** (2026-09-23).
GCash and UnionBank app history, read by Tesseract (`ocrShots`). A screenshot
line is written with `src: 'shot'` and `shot: <fingerprint>`, never `stmt`
or `bank`, so the statement's line merges into it later and its wording
replaces the app's. A screenshot never changes a row a statement already
wrote. A statement lists screenshot lines on days before its last that it
does not show, and removes them unless told not to. No rule is ever asked
for from app wording. A GCash line whose sign could not be read is left out.
Two apps in one drop are refused. Anything dropped anywhere on WEALTH opens
READ A STATEMENT with it. The + menu on the first screen and ACCOUNTS carries
A statement and Screenshots, each opening the file chooser for that kind only
(`importSheet('statement' | 'shots')`).

**While importing** (2026-09-23): every added or matched line has a comment
box, merged into its `recon.comment` at apply. A payment rail line (`isRail`,
Bancnet) is asked on its own in setup, filed by a `mark` on its row, never a
rule. Category pick lists are A to Z (`catsAZ`); the CATEGORIES card keeps
his dragged order.

**A locked spreadsheet opens with its password** (`unlockXlsx`, Excel's
agile AES lock, WebCrypto only). The password is treated like a PDF's.

**A statement comment lives in its `recon` row**, merged. (HISTORY.md: Seeing a statement, and commenting on it)

**Account numbers live in `wealth.ids.<account>`, never on `acct`.** (HISTORY.md: How an account is recognised)

**Setup rules carry an `imp-` prefix** and never replace his. (HISTORY.md: Import setup, asked once)

**An unnamed transfer to a person is One-time transfers, tagged Unsure, and
still money out.** A line is fingerprinted by its bank reference. Tax is
deliberately absent: nothing in the app mentions it. (HISTORY.md: Transfers to people, and Unsure)

## Time, currency, pictures and menus, in short

**A time is typed against the row's own date, never the clock**, untimed rows
sort last, and `t` is the one field WEALTH writes into a spend, via `merge`. (HISTORY.md: Time, days and weeks)

**Day, week and month are three zooms on one screen**; money moved is greyed
with no amount. (HISTORY.md: Three zoom levels, one screen)

**Every amount is stored in the base currency; the other is a view.** Typing
stays in the base, the rate is typed and dated, never fetched, and changing
the base re-labels, never converts. (HISTORY.md: Currency)

**The six-month chart always includes zero**; net never replaces liquid. (HISTORY.md: Pictures)

**Every menu item also lives in its thing's sheet.** Deleting an account moves
everything naming it first, in one undo. A client with history is marked
finished, never deleted. (HISTORY.md: Menus, rearranging and deleting)

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

## Next up

**Movable cards, like Home's widgets.** Tom, 2026-09-23: "I want to drag
WEALTH cards the way I do Home's widgets", e.g. the pie chart on top some
days. One saved layout for every device (a setting row, so it syncs), not per
device. Read `HOME.md` and the home screen's widget grid first and reuse its
behaviour (spots, drag, the + in a gap), not only its look. Not started.

**The bill sheet has no field for `months`** (bills every few months). Add it
when the sheet is next touched.

## History

Built and watched from 2026-09-11, moved from the root brief. (HISTORY.md: History, moved from the root brief on 2026-09-22)
