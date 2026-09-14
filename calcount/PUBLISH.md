# Putting CALCOUNT on Google Play

**What this is:** the route from the web app that already works to an app in
the Play Store. No coding and no Android Studio. A free website called
PWABuilder wraps the web app in a thin Android shell, Google's own method for
this (a "Trusted Web Activity"). The app inside the shell is the live website,
so **every change Claude pushes reaches the Play Store app too**, without a new
upload.

**How sure this is:** the steps come from PWABuilder's and Google's own
documentation as of September 2026. Claude has **not** run PWABuilder on
CALCOUNT or opened a Play Console. Screens get renamed; the order of the steps
does not.

---

## Before you start

- **The app is live** at https://tomoncupa.github.io/Motherbase/calcount/,
  with its install file, icons and offline copy, all checked on 15 September
  2026. Those are what PWABuilder looks for.
- **A Google Play developer account.** $25, once. Start it first: Google
  verifies your identity, and that can take days.
- **12 Android testers** for a 14-day closed test, which Google requires of
  every new personal account before an app can go public. See `BETA.md`.
- **A privacy policy page.** Play Console asks for its web address. See the
  end of this file.

## 1. Make the Android package (10 minutes)

1. Go to **pwabuilder.com**, paste the app's address, press **Start**.
2. It scores the app. Note anything it flags and send it to Claude.
3. Press **Package for stores**, then **Android**, then **Generate**.
4. **Package ID:** something like `com.personalprotagonist.calcount`. Choose
   carefully. **It can never be changed** once the app is on Play.
5. **App name:** CALCOUNT.
6. Download the zip. It holds the file you upload to Play (ending `.aab`), a
   file you can install on your own phone to try it (ending `.apk`), and a
   **signing key** with its passwords.

**Keep the signing key and its passwords somewhere safe, forever.** Without
them you cannot update the app. Put them in a password manager and a second
place.

## 2. Prove you own the website

**Why:** Android opens the app full screen, like a real app, only when the
website says "this app is mine". Without that, the app still works, but shows
a web address bar across the top. **That is acceptable for the closed test**, so
this step does not have to block anything.

**The catch, checked on 15 September 2026:** the proof is a small file that
must sit at the very top of the web address,

```
https://tomoncupa.github.io/.well-known/assetlinks.json
```

and nothing lives at `https://tomoncupa.github.io/` today. It answers "not
found". A file inside the Motherbase folder does not count.

Two ways to fix it, your call:

| | How | Cost | Also |
|---|---|---|---|
| **A. Free** | Create a GitHub repository named exactly `tomoncupa.github.io`, and turn on Pages for it. Claude then adds the proof file and one empty file called `.nojekyll`, without which GitHub hides any folder starting with a dot. | Nothing | The address strangers see still says Motherbase |
| **B. Own address** | Buy a domain, for example a `.ph` or `.app` name, and point it at the app. The proof file goes on that domain instead. | A yearly fee. Prices not checked | Removes Motherbase from the address, and looks like a real product |

Creating the repository or buying the domain is yours to do. Everything after
that, Claude can do.

**What goes in the file:** PWABuilder's zip includes an `assetlinks.json`
already filled in with your signing key's fingerprint. After you upload to
Play, Google signs the app again with its own key, so the file also needs
**Google's** fingerprint, from Play Console, **App integrity**. Both go in the
same file. Send Claude both and it will write it.

## 3. Play Console (an evening, then 14 days)

1. **play.google.com/console:** create a **personal** developer account, pay
   the $25, and verify your identity.
2. **Create app:** name CALCOUNT, app (not game), free.
3. **Fill in the app's details.** Play Console walks through a checklist.
   Expect: the privacy policy address, a **data safety** form, a content rating
   questionnaire, the target age, and extra questions for health apps. Answers
   for data safety, as the app stands today:
   - The food log, weight and details **stay on the phone**. Nothing is sent
     to a server of yours.
   - A **photo** is sent for a photo scan, once that is switched on. It goes to
     the scan server and to Anthropic to be read, and is not kept by CALCOUNT.
   - A **barcode number**, and nothing else, is sent to Open Food Facts when a
     product is looked up.
   - No account, no advertising, no tracking.
   If any of that changes, the form must change with it.
4. **Store listing:** a short description, a long description, the 512px icon
   (`calcount/icon-512.png` is ready), and phone screenshots. Claude can draft
   the text; screenshots are best taken on your own phone.
5. **Testing, then Closed testing:** create a track, upload the `.aab`, add the
   testers' Gmail addresses, and send them the opt-in link. **The 14 days start
   when 12 of them have opted in**, and they need to keep it installed.
6. After 14 days, **apply for production access**. Google asks a few questions
   about the test. Then publish.

## The privacy policy

Play needs a public web page. Claude can draft `calcount/privacy.html` from
what the app really does, which is short because it collects almost nothing.
**A draft is not legal advice.** Read it, and have someone qualified look at it
before charging money.

## After it is on Play

- **Updates need no upload.** Push to the website and the app shows the new
  version on its next open.
- **Upload again only** when the shell itself must change: a new icon, a new
  name, or Play asking for a newer Android target, which it does about once a
  year.
- **Charging money** happens on your own site with GCash, never inside the app.
  The app only needs to let people sign in. That needs accounts, which do not
  exist yet.

## Sources

- [PWABuilder, Google Play packaging](https://github.com/pwa-builder/pwabuilder-google-play)
- [PWABuilder, asset links setup](https://github.com/pwa-builder/pwabuilder-google-play/blob/main/Asset-links.md)
- [Google, using a PWA in your Android app](https://web.dev/articles/using-a-pwa-in-your-android-app)
- [Google Play developer fee and the 12-tester rule](https://www.iconikai.com/blog/google-play-developer-account-fee-2026)
