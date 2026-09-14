# Drafts for the Google Play listing

Two pieces of writing Play Console asks for, drafted from what the app does
today (15 September 2026). **Both are drafts for Tom to rewrite.** How the app
speaks to people is his call, and the privacy policy is not legal advice:
have someone qualified read it before the app charges money.

No em dashes anywhere below, because this is published copy.

---

## Store listing

### App name

CALCOUNT

### Short description (80 characters at most)

> Calorie counter that knows Filipino food, from Chickenjoy to sinigang.

70 characters.

### Full description

> **Finally, a calorie counter that knows Filipino food.**
>
> Other apps are made for other countries. Search for tapsilog and you get
> nothing. Log a Chickenjoy as "fried chicken" and hope for the best.
>
> CALCOUNT has more than 250 Filipino foods and drinks, in the servings you
> actually order and eat:
>
> - Jollibee, Mang Inasal, McDonald's, Chowking, KFC, Andok's, Greenwich,
>   Shakey's, Max's, Potato Corner, Tokyo Tokyo, 7-Eleven, Lawson, Ministop
>   and S&R
> - Silog, adobo, sinigang, tinola, kare-kare, pancit, lugaw and more home
>   cooking
> - Street food and merienda: fishball, kwek-kwek, banana cue, taho, turon,
>   halo-halo
> - Milk tea, 3-in-1 coffee, softdrinks, beer and more
>
> **Quick to use.** Type a few letters, in English or Tagalog, and tap plus.
> "Kanin" finds rice. Had the same breakfast as yesterday? One tap adds it
> again.
>
> **One number to watch.** Calories left today. Nothing to calculate.
>
> **A goal made for your body.** Answer a few quick questions for a starting
> goal. After two weeks of logging and weighing in, CALCOUNT checks your goal
> against your real weight and tells you if it is right.
>
> **Honest numbers.** Every food shows where its number came from. Figures
> worked out from typical recipes are marked as estimates.
>
> **Works without signal.** Log on prepaid data or no data at all.
>
> **No account, no sign up.** Your food log stays on your phone.
>
> CALCOUNT gives estimates for general health and wellness. It is not medical
> advice. If you have a medical condition, are pregnant, or are under 18, talk
> to a doctor before changing how you eat.

Before publishing, check every line is still true of the app. "More than 250"
was true on 15 September 2026, at 257 foods.

### Category and tags

- **Category:** Health and Fitness
- **Tags to choose from:** calorie counter, diet, weight loss, nutrition

### What only Tom can supply

- Phone screenshots, taken on a real phone, with real-looking meals logged.
- A feature graphic, 1024 by 512 pixels.
- A contact email for the listing.

---

## Privacy policy (draft)

> **CALCOUNT privacy policy**
>
> Last updated: [date]
>
> CALCOUNT is a calorie counter. This page explains what happens to your
> information when you use it.
>
> **The short version.** Your food log, weight and details stay on your phone.
> There is no account. There is no advertising and no tracking. A few features
> send one specific thing to another service, listed below, only when you use
> them.
>
> **What stays on your phone**
>
> Everything you enter: the foods you log, your weigh-ins, your age, height,
> weight, sex, activity level and goal, foods you add yourself, and your
> settings. It is stored in your phone's browser storage for this app. We do
> not receive it and cannot see it. If you uninstall the app or clear its
> data, it is deleted, unless you have saved a backup file.
>
> **Backup files**
>
> If you choose Save a backup file, the app creates a file on your phone
> containing your log. Where that file goes is up to you.
>
> **Photo scan**
>
> If you use the photo scan, the photo you choose is made smaller and sent to
> our scan server, which passes it to Anthropic, the company whose AI reads
> the food in it. The answer comes back to your phone. We do not keep the
> photo. Anthropic handles it under its own terms. The request also carries a
> random code created on your phone, used only to count how many scans that
> phone has used this month. The code is not linked to your name or any
> account. Our scan server runs on Cloudflare, which processes your internet
> address to deliver the request.
>
> **Barcode lookup**
>
> If you scan or type a barcode that is not already saved on your phone, the
> barcode number is sent to Open Food Facts, a free public food database, to
> look up the product. Like any website, it also receives your internet
> address.
>
> **Children**
>
> CALCOUNT is not intended for children under 13, and asks your age during
> setup. Anyone under 18 is given a goal to keep their weight, never to lose
> it.
>
> **Changes**
>
> If this policy changes, the new version will be posted here with a new date.
>
> **Contact**
>
> [contact email]

### What to check before using this

- **Anthropic's handling of photos.** The policy says Anthropic handles them
  under its own terms, without claiming what those terms are. Read Anthropic's
  current commercial terms and data retention for the API, and say more if
  you want to.
- **Cloudflare logging.** Whether the Worker keeps logs depends on settings in
  your Cloudflare account. The draft assumes nothing is kept beyond delivering
  the request. Check.
- **Accounts and payment.** The day accounts, sync or payment arrive, this
  policy is wrong and must be rewritten before they go live.
- **The Play data safety form** must say the same things as this page. See
  `PUBLISH.md`, step 3.
