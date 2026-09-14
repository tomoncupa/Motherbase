# CALCOUNT

**A calorie tracker that knows Filipino food.** Jollibee, Mang Inasal, Chowking,
Andok's, 7-Eleven, Lawson, the S&R and SM aisles, and what gets cooked at home,
in the servings people actually eat: a cup of rice, one order, solo or family.

Governs `calcount/` only.

## It is not a Motherbase app

Set by Tom on 2026-09-05: "this app is Motherbase independent."

It lives in this repo because this is where commits, GitHub Pages and the
handoff between sessions already work. It is a guest here, not a member:

- **It loads nothing from `../shared`.** No store, no themes, no icons, no
  sounds. Every file it needs is inside `calcount/`, so the folder can be
  lifted into its own repo on the day it needs one, with nothing to untangle.
- **It shares no data with the suite.** Its rows are its own, under keys that
  start `cc.`, and it never reads or writes Motherbase's.
- **It is not in the home screen dock and not in the client build.**
  `tools/build-client.py` copies an allow-list of folders, so a new folder is
  left out without anyone having to remember.
- **The root `CLAUDE.md` still applies to how the work is done**: how to talk
  to Tom, complete truth, testing in the browser, commit style, staying in
  your folder. What does not apply is its data model, its shared foundation,
  its theming contract and its app ownership table.

Why it is independent: CALCOUNT is a product sold to strangers. It will need a
server for the AI scan, accounts, payment, and a food database everyone shares.
The suite is one person, one device, no server, on purpose. Those are opposite
shapes, and forcing one into the other would damage both.

## Who it is for

The overwhelmingly common Filipino goal: lose weight. The person who tried
MyFitnessPal, could not find tapsilog or a Chickenjoy with the right serving,
typed "chicken fried" and got a number from an American restaurant, and quit.

**The one job:** make logging what a Filipino actually ate take less effort than
skipping it. Every screen is judged against that.

### The lowest common denominator

Tom, 2026-09-15: *"People just want a quick and easy to use calorie counter
that doesn't overwhelm and gives them confidence. Market is Filipino. Account
for the lowest common denominator of calorie aware people."*

Design for the person who knows calories exist and nothing else. They do not
know what a macro is, will not weigh food, will not read a paragraph, and are
on a budget Android phone with prepaid data. What that means, concretely:

- **One number.** Calories left today. Protein, carbs and fat exist but are
  hidden until someone switches them on in settings.
- **Three taps to log.** Add, type a few letters, tap the plus. The serving
  defaults to one of the usual size; the meal is picked from the time of day.
  Everything else is optional.
- **Servings in the words people order in.** One cup of rice, 1 pc, solo,
  one stick, one bowl, one sachet. Never grams first.
- **Setup is six taps, one question per screen.** Height in feet and inches by
  default, because that is how most Filipinos know it.
- **Confidence, not doubt.** The headline never shows a plus-or-minus. A small
  Official tag on a chain's own figures builds trust; the word Estimate sits
  quietly on a food's detail, not on the home screen. Honesty lives in the
  data and one tap away, not in the face of someone who is trying.
- **Going over is not red.** Over is just a number.
- **Light.** One file, system fonts, no libraries, nothing to download beyond
  the page itself. It must feel instant on a Galaxy A-series.

## Decisions already made

All from Tom, 2026-09-05. Do not reopen these without him.

| Decision | What it means |
|---|---|
| Independent of Motherbase | See above |
| Picture input and AI tracking matter | The scan is a headline feature, not an extra |
| The database is the moat, not the app | An AI tracker is a weekend. Verified Philippine data is months |
| A month of adding dishes happens **after first profit** | There is no capital. Launch on a smaller, honest database |
| PhilFCT licensing is not a blocker | Calorie figures are facts. Tom: "don't let such trivial things stop us" |
| Beta through Skool | The first users are his community |
| Android first | Google Play is $25 once and 85.6% of Philippine phones (StatCounter, Aug 2026). Apple is $99 a year and 14.4%. Apple waits for revenue |
| A web app is not the product | Tom wants a real store app. The web version is the beta and the engine a store app will wrap |
| Sell on his own site, never inside the app | Apple does not allow linking out to a checkout from Philippine apps. Buy on the web with GCash, sign in on the phone |
| AI scans have a monthly cap | A small loss on the few who max it is accepted |
| All five money ideas are in | Free app feeding the paid Skool tier; a coach view charged to coaches; load-style scan credits; a lifetime unlock that excludes scans; a monthly plan |

## How it is built

**One HTML file, vanilla JavaScript, no build step.** Not because the suite
requires it (it does not govern this folder) but for the same practical
reasons: there is no Node on this machine, Tom cannot run a build, and a file
that deploys by copying is a file that cannot fail to build.

| File | Job |
|---|---|
| `index.html` | The app. Phone first. |
| `foods.js` | The Philippine food database. Loaded by the app with a plain script tag. |
| `worker/scan.js` | The AI scan's server half. A Cloudflare Worker that holds the API key, so the key is never inside a file anyone can download. |
| `worker/SETUP.md` | How Tom turns the scan on, in plain language. |
| `calories.html` | The free public page: tap foods into an order and see the total. The marketing test. |
| `sw.js`, `manifest.json`, `icon*.` | Working with no signal, and installing to a home screen. |
| `_test.html` | Checks over the maths, the data, the store, the screen and the scan server. Run it after touching anything, with a new `?cb=`. |

### Why the AI needs a server

An API key inside `index.html` is a key anyone can read and spend Tom's money
with. The Worker is the smallest server there is: one file pasted into
Cloudflare's dashboard, free tier, no npm. Until it is set up, **the app works
completely without it**: search, barcode, manual entry, targets, weight. The
scan button says it is not switched on yet.

The Worker calls the Claude API with raw `fetch`, not the Anthropic SDK: the
Cloudflare dashboard editor cannot install packages, and Tom cannot run a
build to bundle one.

### Storage

Rows, the same idea as Motherbase and for the same reason: when accounts and
sync arrive, a row that knows its own identity and when it last changed can be
merged with a comparison instead of a guess.

```
{ id, type, date, key, payload, updated_at, deleted }
```

Kept in `localStorage` under `cc.row.<id>`. Photos never go in a row; a scan's
photo is shrunk, sent, and dropped.

| Type | Key | Payload |
|---|---|---|
| `profile` | `''` | `{goal, sex, age, cm, kg, act, rate}`. `goal` is `lose`, `keep` or `gain`; `act` is `sit`, `feet` or `hard`; `rate` is kg a week |
| `entry` | timestamp id, dated | one thing eaten: `{food, name, brand, serve, qty, kcal, p, c, f, meal, src, err, t}`. Numbers are frozen in, so fixing a food later never rewrites what was eaten |
| `food` | food id | a food the person made themselves, same shape as `foods.js`. May carry a `barcode` |
| `weight` | `''`, dated | `{kg}`, one per day, last one wins |
| `usage` | `YYYY-MM` | `{scans}`, AI scans used that month |
| `setting` | name | `{v}`. `goalOverride` is a goal the person set by hand or accepted from the goal check; `macros`, `hUnit`, `wUnit`, `scanUrl` and `device` are the rest |

**The scan cap is enforced on the device until accounts exist.** A determined
person can clear it. That is known and accepted for a Skool beta. The Worker
has its own per-device monthly count as the real limit once it is deployed.

## The food database

`foods.js` defines `CC_FOODS`. One food:

```js
{ id: 'jb-cj-thigh', name: 'Chickenjoy Thigh', brand: 'Jollibee', cat: 'fastfood',
  aka: ['chicken joy', 'cj'],
  per: { g: 125, kcal: 380, p: 27, c: 5, f: 28, na: 400 },
  serves: [{ l: '1 pc', m: 1 }],
  src: 'pub-us' }
```

- `per` is one reference serving with its weight in grams.
- `serves` are the ways people order or scoop it, as multiples of `per`.
- `aka` is every other thing someone might type: Tagalog, Taglish, shorthand,
  misspellings. Search is only as good as this list.

### Every number says where it came from

This is the part that must never be relaxed, because a wrong number presented
as a verified one is worse than no number: the person trusts it, eats to it,
and does not lose the weight.

| `src` | Meaning | Shown as | Error margin |
|---|---|---|---|
| `pub` | Published by the chain for the **Philippine** menu | Official | 5% |
| `pub-us` | Published by the chain for its **US** menu. Philippine portions and recipes may differ | Official (US) | 15% |
| `label` | Read off the printed nutrition label of the product | Label | 5% |
| `ref` | Standard food composition values (USDA FoodData Central style) for a plain food | Reference | 10% |
| `est` | Calculated from a typical recipe and portion. **Needs verifying** | Estimate | 25% |
| `off` | Open Food Facts, looked up by barcode. Entered by volunteers | Community | 15% |
| `mine` | A food the person made themselves, usually off a label | Yours | 10% |
| `ai` | Guessed from a photo and not matched to a database food | Photo guess | 30% |

The error margin is carried onto every entry, so the data can always answer
how sure a day's total is. **The home screen does not show it**: see "The
lowest common denominator" above. It appears on a food's detail sheet and in
the weekly view, where someone who wants it will look.

In `foods.js`, every estimate gives its macros and leaves calories blank, and
the calories are worked out from them. So an estimate can never disagree with
itself. Figures from a source are copied as printed, and `_test.html` flags any
whose calories and macros are more than 15% apart.

**As of 2026-09-15 most of the database is `est`.** That is the honest state
before the dish-building month. The `pub-us` Jollibee figures come from
Jollibee USA's own Nutrition Facts sheet dated 01 July 2026. Nothing in here is
`pub` yet, because no Philippine chain's figures have been checked.

**Never upgrade a `src` without a source.** Changing `est` to `pub` means the
figure was read from something the chain published, and the commit says where.

## Targets

- **Maintenance** is Mifflin-St Jeor resting energy times an activity factor
  (1.2 desk, 1.375 light, 1.55 moderate, 1.725 very active). It is the most
  used equation in dietetics and it is still an estimate, typically within
  about 10% for most adults. The app says so.
- **The deficit** comes from the chosen weekly rate, at 7,700 kcal per kg of
  body weight, the usual rule of thumb. It is known to overstate loss over
  months, because the body adapts.
- **A floor**: never below 1,200 kcal for women or 1,500 for men, the common
  guideline for eating without supervision. If the rate asks for less, the
  target sits at the floor and the app says the rate is not reachable.
- **The goal check.** Once someone has logged 14 of the last 21 days and
  weighed in during each of the last 3 weeks, Progress compares the goal with
  what their weight really did: average calories on logged days, minus the
  weight trend at 7,700 kcal per kg, gives what this body actually burns. That
  beats any equation, and it is what makes a coach's app worth more than a
  calculator.
  - Within 100 of the goal, it says the goal is right. That sentence is the
    confidence Tom asked for, earned from their own numbers.
  - If they can eat more, it offers up to 300 more, one step at a time.
  - If the numbers say eat less, it does not believe them straight away.
    People forget food far more often than they invent it, so it names the
    easy things to miss first (extra rice, drinks, sauces, oil) and offers
    only 150 less. At the safety floor it offers nothing.
  - Under 18 is never steered toward a deficit, here or anywhere.
  - It only suggests. Nothing changes until the person taps the button.

## Behaviour

The suite's evidence-based rules are good rules, so they are borrowed here by
choice rather than inherited:

- A streak counts days with **anything** logged, not days on target.
- One missed day is forgiven silently. Two is when anything is said.
- No levels, no XP, no badges for their own sake.
- Never tell someone what a food "did" to them. Show the number and let them
  decide.
- No red for going over. Over is information, not failure.

## Copy

- English, with Filipino food names as Filipinos write them. Tagalog and
  Taglish in search, always.
- No em dashes in anything a user reads. Tom's rule for published copy.
- Short. The person is holding a plate.

## Roadmap

1. **Done first:** the app on the device, the database with sources, the
   Worker, the tests.
2. Deploy the Worker (Tom, about 15 minutes, `worker/SETUP.md`).
3. Beta in Skool. The 12 Google Play testers come from the same people.
4. Accounts and sync, which is when the shared database and the real scan cap
   arrive.
5. Google Play, as a wrapper around this app.
6. The dish-building month, after first profit.
7. The coach view.
8. Apple.

## Current state

**It is live, and public.** GitHub Pages serves this repo, so every push to
`main` publishes the app at https://tomoncupa.github.io/Motherbase/calcount/
within minutes. Checked 15 September 2026. Anyone with the link can use it.
Treat a push as a release: never push a half-working app.

Two consequences, both written up for Tom:

- `BETA.md` runs the Skool beta from that link: a draft post, install steps,
  what to report, and how to choose the 12 Google Play testers.
- `PUBLISH.md` is the route to Google Play. The one real obstacle: Android's
  ownership file must sit at `https://tomoncupa.github.io/.well-known/`, and
  nothing is served at that root today. Tom either creates a repository named
  `tomoncupa.github.io` (free) or buys a domain. Until then the Play app works
  but shows an address bar, which is acceptable for a closed test.

| Part | State |
|---|---|
| `CLAUDE.md` | Written 2026-09-15. |
| `foods.js` | 220 foods, 17 of them combos, counted from the loaded file 2026-09-15. 19 are Jollibee USA's own published figures, 28 are standard reference values, and 173 are estimates that give their macros so they cannot contradict themselves. Chains: Jollibee, McDonald's, Mang Inasal, Chowking, Andok's, Greenwich, 7-Eleven, Lawson, Ministop, S&R. "SM" in Tom's first list was read as SM Supermarket, so it is covered by the packaged goods rather than a brand of its own. Nothing is `pub` yet. |
| `index.html` | Built and tested in the browser 2026-09-15 at 375px, light and dark. Setup, Today, Add food with Tagalog search and one-tap add, Eat this again (a meal of two or more foods from an earlier day, re-added in one tap, because Filipino breakfasts and lunches repeat), servings, quick calories, make a food, barcode (the phone's own reader on Android Chrome, typing everywhere else, then Open Food Facts), photo scan with a confirm list, weight and the last 7 days, settings, backup and restore. **Not seen on a real phone.** The barcode camera and the photo picker cannot be driven from a desktop browser, so both are reasoned, not watched. |
| `worker/scan.js` | Written 2026-09-15 and checked in the browser with the network faked: request shape, key handling, the monthly cap, refusals, outages and bad answers. **Never called the real Claude API**, because that spends Tom's money. The first real scan is the real test. |
| `worker/SETUP.md` | Written 2026-09-15. Tom has not deployed it. |
| `sw.js`, `manifest.json`, icons | Offline copy and home-screen install, 2026-09-15. Watched on the test server: the offline copy registers, takes over the page and stores all five files. **Loading with the network actually cut has not been watched.** It is off on a test server unless the address has `?sw`, and it steps aside for any `?cb=` address, so tests are never answered from an old copy. The icons are drawn by a short Python script with no libraries, because Pillow is not installed here. |
| `calories.html` | The free public page, 2026-09-15: "How many calories are in your order?" Tap foods into an order, change servings, share it. No account, stores nothing. A link can open it filtered, `calories.html?brand=Mang Inasal` or `?cat=drinks` or `?q=chickenjoy`, which is what a post or a reel links to. Tested in the browser at 375px. It is the cheapest test of demand: if people use and share this, the app earns the months. |
| `_test.html` | 109 checks, all passing, 2026-09-15. It sets the browser's own CALCOUNT data aside and puts it back exactly. |

### Releasing a new version

1. Change `mb-version` and `VERSION` in `index.html`.
2. Change `CACHE` in `sw.js` to match. **Without this, phones keep the old
   copy**, because the offline copy only clears itself when that name changes.
3. Run `_test.html` with a new `?cb=`.
</content>
</invoke>
