# WEALTH

The money app. What is coming in, what is going out, what is already spoken
for, and how long it lasts.

This brief governs `wealth/` only. It obeys the master brief at the repo root
and may add rules but never contradict them. Where the two disagree, the root
wins and this file is the bug.

The build stories are in `wealth/HISTORY.md`, read the section for the corner you are working in.

**Tom only, forever** (Tom, 2026-09-16): in `DROP_APPS`; build nothing here
for a stranger, and no onboarding for one. (HISTORY.md: Tom only, forever)

**His own data may be written when he asks for it**, in his hosted copy in
Chrome; say what was changed to what. (HISTORY.md: His own data may be written when he asks for it)

---

## FUNCTION, in one sentence

**It tells you what your money actually is, after everything already claimed.**

Not what you earned. Not what you spent. What is left once the pots, the bills
before your next payment and the debts have had their share. Everything on
every screen serves that, or it belongs somewhere else.

## Why it exists

Flat costs, uneven income: a good month looks like more than there is. STATUS
logs the day; this answers "can I afford it". (HISTORY.md: Why it exists)

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

Runway is the app's real subject: it moves only when something structural
changed, a competence signal, never a scolding. (HISTORY.md: Runway is the real subject)

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

**A package client is expected to renew** (2026-09-23): `packState().renew`, the last package again once its sessions run out, dated from `perWeek` or the last four weeks' sessions, always a guess, never late. Marking the client finished stops it.

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
| `client` | client id | `{name, rate, cycle, every, start, days, day, perWeek, status, note}` — `days` is a list of days of the month; `day` is its first, kept for rows written before the list; `perWeek` is his rough pace for a client paid by the session; `alt` `{name, price, n}` is a second kind of session at its own price (package clients), `0` for none |
| `sesh` | date + id | `{client, alt}` — one session delivered, for a client paid by the session; `alt` 1 is the client's other kind (in person) |
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

Big purchases are marked, listed on their own, and left out of every "normal
spending" figure, which says so. (HISTORY.md: 3. One big purchase must not become the story of the month)

### 4. Numbers group themselves, and reading one survives it

Amounts group with commas as they are typed. `parseFloat('12,000')` is 12, so
every amount goes through `num()`, which strips grouping first. The caret is
restored by counting digits, not characters. (HISTORY.md: 4. Numbers group themselves, and reading one survives it)

### 5. Nothing important is typed twice

Names are picked from what exists; typing filters, creating is a separate act
that refuses a near-match. The same amount to the same account within the hour
gets a question. (HISTORY.md: 5. Nothing important is typed twice)

### 6. A cap is his to write, and it is never a verdict

Nothing ships with a cap; "3,400 of 5,000, 11 days in", never "over budget".
On screen an allowance (`cap` on `cat`); FREE holds back what is left, never
below zero. (HISTORY.md: 6. A cap is his to write, and it is never a verdict)

### 7. Show the number, never the verdict

One client at 34% of income reads 34%, never "dangerous". No line ever says
what a behaviour did to a number. (HISTORY.md: 7. Show the number, never the verdict)

### 8. Categories are few, and rules do the sorting

A category earns its place by being a decision. A `rule` (text in a
description to a category) sorts all history; a `mark` overrides one spend.
**Categories say what. Tags say why.** Groceries is a category. A date is a
tag. Keeping them apart is what lets him ask "how much on eating out" and "how
much on dates" without the two questions fighting.

---

## The starting vocabulary

A starting set of categories in four groups (`fix`, `var`, `biz`, `move`),
editable, never added to by the app. Runway is figured against `fix`. (HISTORY.md: The starting vocabulary)

---

## Client payments

A cycle is **a kind and a number** (Tom, 2026-09-11). (HISTORY.md: Client payments, a kind and a number)

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

**A second kind of session owes the difference** (`client.alt`, `altOf`,
`packState`): a ticked session uses one of its package and owes its price less
the package's, due that day. Packages only. (HISTORY.md: A second kind of session owes the difference)

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

**`paidSheet` merges, never rebuilds**: rebuilding dropped `stmt` and would
have re-imported the payment. (HISTORY.md: A payment sheet must merge, like everything else)

## Bills, in short

**Bills every few days**: `every` may be a fraction, each date is rounded from
`start`, never from the date before, and a month's worth is amount × 30.44 ÷
`every`. (HISTORY.md: Bills every few days)

**Bills every few months**: `months` on a monthly bill, stepped from `start`;
never read from `every`. No sheet field yet; the sheet merges, so it survives.
(HISTORY.md: Bills every few months (the brief's version, 2026-10-21))

**A loan's payments are bills with `until`, filed as Debt payment, never
spending.** The bill sheet does not show `from` or `until` and must keep both. (HISTORY.md: A loan's payments are bills, with an end)

**Three cards on MONEY OUT, each bill in exactly one**, by category. A bill
filed as everyday spending stays out of runway; FREE still holds its dates. (HISTORY.md: Three cards on MONEY OUT)

**A bill coming up is a `note` todo** for its earliest outstanding date only,
found by its key on ANY date, never by the `wealth.billMade` setting (two
devices overwrite it). (HISTORY.md: A bill coming up is a todo bullet)

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

**A tapped category is split BY SOURCE** (`payeeOf`; names sharing a first
word are one place). **A payment past its reach** settles that client's
oldest unpaid date on or before it. (HISTORY.md: BY SOURCE, and a payment past its reach (2026-09-23))

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

**Screenshots fill the days a statement has not reached** (`ocrShots`): rows
carry `src: 'shot'` and `shot`, never `stmt`, so the statement merges over them
later; a screenshot never changes a row a statement wrote, and no rule is asked
from app wording. (HISTORY.md: Screenshots fill the days a statement has not reached)

**While importing**, a comment per line goes to `recon.comment`; a payment rail
line is filed by a `mark`, never a rule. (HISTORY.md: While importing)

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

**Desktop** (hard constraint 10). One column below 1000px, 44px targets and
safe areas still; quick entry on a phone stays in STATUS. (HISTORY.md: Device)

**On a wide window, side by side; never fold text** (Tom, 2026-10-02): three
across past 1700px, four past 2300; `wfull`, `w2`, `t2` act only there.
(HISTORY.md: A wide window)

## Moving cards (1.0.34; free since 1.0.35, 2026-10-22)

**A card goes in any spot, the way Home's widgets do** (Tom, 2026-10-22,
"Free for both"; it only reordered in 1.0.34). `FreeBoard` in the script, the
same code as COACH's: Home's 146 x 84 cell, twelve columns at least, shrunk
only in a window too narrow; a card is a column, a row and a width, its height
the rows its contents need (never cut off); nothing overlaps (the card just
moved wins, the rest pushed down, nothing pulled up, a gap stays a gap); a
window 2880 or wider wears a wide board of its own (24 columns), as Home does.
Below 1000px the cards stack in the order their spots read; a drag or Move Up
/ Down there trades spots, each with its width.

- **Saved:** setting `wealth.board`, `{'<tab>@std' | '<tab>@wide': 'id:x.y.w|...'}`,
  one board for every device, written only by a drop, a resize, Move Up /
  Down or Reset Layout and its UNDO, never on open, and settled before it is
  saved. 1.0.34's `wealth.layout` order still lays out a screen with no spots
  (in memory); Reset Layout clears both.
- **Handle:** the heading with a mouse, the grip ending it with a thumb; the
  grip pressed opens the menu a right click or hold on the heading opens
  (Move Up, Move Down, Reset Layout). The corner makes a card wider or
  narrower, a mouse only. A card with no heading (UNALLOCATED, a screen's own
  header) is fixed at the top left.
- **Default widths** are 1.0.34's at 1920: 4 of 12, `wfull` all 12; wide 6,
  `w2` 12, `wfull` 24.
- Watched in headless Chromium on the demo: at 1920 a real mouse drag of
  RUNWAY to an empty spot and a corner drag of THIS MONTH two columns wider,
  each saved once and read back after a reload with nothing written on open;
  every screen at 3840 on the wide board with no card cut off; at 390 with
  touch a grip drag moved SIX MONTHS to the top and a grip tap opened its
  menu (it closed itself at once before: the tap's click hit the menu's
  veil). Not tried in Main Menu.exe or on his screens.

## Needs from the foundation

**One board engine in `shared/`.** `FreeBoard` is copied the same into WEALTH
and COACH (between `FREE BOARD` and `const FB_FINE`), and Home's own board is a
third version of it in index.html. A foundation session could lift it into
`shared/` and point all three at it.

## First paint

Paint from localStorage immediately, redraw on `Rec.ready`. Never put the first
paint behind the store. That is item 2 of the root brief's foundation list and
STATUS is the app that got it wrong.

## Next up

**The bill sheet has no field for `months`.** Add it when the sheet is next touched.

## History

Built and watched from 2026-09-11, moved from the root brief. (HISTORY.md: History, moved from the root brief on 2026-09-22)
