# Turning on the photo scan

The photo scan needs a tiny server, because the key that pays for the AI
cannot sit inside the app where anyone could copy it. This page sets that
server up. It takes about 15 minutes, costs nothing to run on its own, and you
only do it once.

**Until you do this, the app works fully without it.** The Photo button just
says it is not switched on yet.

You need two accounts. Create both yourself; they involve a password and a
card, which Claude will not type for you.

---

## 1. Get a Claude API key (5 minutes)

This is what the AI charges against.

1. Go to **console.anthropic.com** and sign up.
2. Open **Billing** and add a card. Buy the smallest credit, $5. That is a few
   hundred scans at the costs below, and nothing is charged beyond what you
   buy.
3. Open **API Keys**, press **Create Key**, name it `calcount`, and copy the
   key. It starts with `sk-ant-`. Keep it somewhere safe; it is shown once.

## 2. Make the server on Cloudflare (7 minutes)

Cloudflare Workers is free for up to 100,000 requests a day, far beyond what
a beta will use.

1. Go to **dash.cloudflare.com** and sign up.
2. In the left menu open **Compute (Workers)**, then **Create**, then
   **Create Worker**. Name it `calcount-scan` and press **Deploy**.
3. Press **Edit code**. Select everything in the editor and delete it.
4. Open `calcount/worker/scan.js` from this folder, copy all of it, paste it
   into the editor, and press **Deploy**.
5. Go back to the Worker, open **Settings**, then **Variables and Secrets**,
   then **Add**. Choose type **Secret**, name `ANTHROPIC_API_KEY`, paste your
   key as the value, and save.

## 3. Stop people using up scans by clearing their phone (3 minutes)

Without this step, the 10 free scans a month are only counted on each phone,
and anyone who clears the app gets 10 more.

1. In the left menu open **Storage and Databases**, then **KV**, then
   **Create**. Name it `calcount-usage`.
2. Go back to your `calcount-scan` Worker, open **Settings**, then
   **Bindings**, then **Add**, then **KV namespace**. Variable name `USAGE`,
   namespace `calcount-usage`. Save.

## 4. Point the app at it

Your Worker's address is on its main page, something like
`https://calcount-scan.yourname.workers.dev`.

- **To try it yourself right now:** open CALCOUNT, Settings, and paste the
  address into **Photo scan address**.
- **To switch it on for everyone:** send the address to Claude, who puts it in
  the app so every tester has it without typing anything.

Then take a photo of a plate and see what comes back.

---

## What each scan costs

**These are estimates worked out from Anthropic's published prices, not a
bill.** The real figure shows in the Anthropic console under Usage after your
first 20 or so scans, and that is the number to price against.

Each scan sends the photo, the instructions and the whole food list, and gets
a short answer back. The food list is the biggest part, about 3,000 words'
worth of tokens. It is cached, which makes it much cheaper, but the cache only
lasts 5 minutes, so during a quiet beta most scans pay the full price.

At about ₱57 to the dollar:

| Model | Setting | Per scan, estimated | 10 free scans a month | 100 scans a month |
|---|---|---|---|---|
| Claude Opus 5 | the default | about ₱2.70 | about ₱27 | about ₱270 |
| Claude Sonnet 5 | `MODEL` = `claude-sonnet-5` | about ₱1.10 | about ₱11 | about ₱110 |
| Claude Haiku 4.5 | `MODEL` = `claude-haiku-4-5` | about ₱0.40 | about ₱4 | about ₱40 |

To change model: Worker, **Settings**, **Variables and Secrets**, **Add**,
type **Text**, name `MODEL`, value from the table.

**Which one is your call.** Opus is the most capable at telling one dish from
another, which is the whole job. Haiku costs a seventh as much and has not been
tested on Filipino food. A fair way to decide: take the same ten photos of real
meals through two models and see which one you would trust.

**This changes an earlier figure.** The first estimate given for a scan
(about ₱0.68 on Opus) left out the food list and the model's thinking. The
table above includes both. At Opus prices, a ₱149 monthly plan with 100 scans
would lose money on anyone who used all 100. Sonnet or Haiku would not.

## Other settings

All optional, all under **Settings**, **Variables and Secrets**, type Text:

| Name | What it does | Default |
|---|---|---|
| `MONTHLY_SCANS` | How many scans each phone gets a month | 10 |
| `EFFORT` | How hard the model thinks: `low`, `medium` or `high`. Higher is slower and costs more | low |
| `ALLOWED_ORIGIN` | The app's web address, like `https://tomoncupa.github.io`, so no other website can use your Worker | any |

## If something goes wrong

- **The app says the scan is having trouble.** Check the key is saved as a
  Secret named exactly `ANTHROPIC_API_KEY`, and that your Anthropic credit has
  not run out.
- **The app says it cannot reach the scan.** Check the address in Settings
  starts with `https://` and matches the Worker's page exactly.
- **To see what happened:** Worker, **Logs**, **Begin log stream**, then scan
  again.
