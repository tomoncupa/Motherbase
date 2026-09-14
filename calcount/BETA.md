# Running the CALCOUNT beta in Skool

The app is already live and works on any phone with a browser:

- **The app:** https://tomoncupa.github.io/Motherbase/calcount/
- **The free calories page:** https://tomoncupa.github.io/Motherbase/calcount/calories.html

On 15 September 2026 both addresses answered and were serving the latest code.
Every time Claude pushes a change, these update within a few minutes. There is
no separate release step.

**Anyone with the link can use it.** The address is public, like the rest of
the Motherbase repo. That is fine for a beta, and worth knowing before you
post it anywhere open.

**The address says Motherbase.** Testers will see that word. It goes away when
CALCOUNT gets its own address, which the Play Store needs anyway: see
`PUBLISH.md`.

---

## The post

A draft for you to rewrite in your own voice. How the app talks to people is
your call, not Claude's.

> **I built a calorie counter for Filipino food, and I need 20 people to break it.**
>
> Every calorie app I have tried is American. You search tapsilog and get
> nothing, or you log a Chickenjoy as "fried chicken" and hope.
>
> CALCOUNT has Jollibee, Mang Inasal, McDo, Chowking, Andok's, 7-Eleven,
> Lawson, S&R, silog, sinigang, pandesal, taho and milk tea, in the servings
> you actually order. Type "kanin" and it knows.
>
> It is free, there is no sign up, and your log stays on your phone.
>
> **What I need:** log everything you eat for 7 days. Every time you cannot
> find a food, or a number looks wrong, comment below.
>
> **Open it on your phone:** https://tomoncupa.github.io/Motherbase/calcount/
>
> Then add it to your home screen so it opens like an app. Steps are in the
> first comment.

## The first comment: installing it

> **Android (Chrome):** open the link, tap the three dots at the top right, then
> **Add to Home screen** or **Install app**. Open CALCOUNT from your home screen
> from now on.
>
> **iPhone (Safari):** open the link, tap the **Share** button at the bottom,
> scroll down, tap **Add to Home Screen**. Open it from your home screen from now
> on. This matters on iPhone: Safari clears a website's saved data after 7 days
> without a visit, but not an app added to the home screen.
>
> **Keep your log safe:** your food log lives only on your phone. Once a week,
> open Settings and tap **Save a backup file**.

## What to ask testers to report

Short, so people actually do it:

1. **A food you could not find.** What you typed, and what the food was.
2. **A number that looks wrong.** Which food, what it said, what you think it
   should be, and why (the label, the restaurant, a guess).
3. **Anything confusing.** What you were trying to do, and where you got stuck.
   A screenshot helps.

The first list is the most valuable thing the beta produces. It is the
shopping list for the dish-building month.

## What is not ready

Say this up front, so nobody thinks it is broken:

- **Photo scan** says it is not switched on yet. It needs the setup in
  `worker/SETUP.md`, and every scan costs you money.
- **Barcode scanning with the camera** only works in Chrome on Android. On an
  iPhone, you type the numbers under the barcode instead. Products not found
  can be added by hand from the label, and are then remembered.
- **Nothing syncs.** A new phone starts empty unless they restore a backup file.

## Choosing the 12 for Google Play

Google makes a new personal developer account run a closed test with at least
12 testers for 14 days in a row before the app can go public. Pick them from
the beta:

- They must use **Android**.
- You need the **Gmail address** they use on that phone.
- They must **opt in** from a link you send and keep the app installed for the
  full 14 days. Pick people who logged all 7 days of the web beta: they are the
  ones who will still be there on day 14.
- Pick a few more than 12, because someone always drops out.
