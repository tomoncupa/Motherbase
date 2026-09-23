# LIVE SYNC — the second sync, beside the Google Sheet

The Google Sheet sync stays exactly as it is. This sits next to it and answers
the one thing the sheet is slow at.

| | Google Sheet | Live sync |
|---|---|---|
| How fast two devices agree | about a minute | about a second |
| Needs a sign-in | no | yes, Google |
| Works from a folder | yes | no |
| Carries photos | yes | no, see below |
| You can read it yourself | yes, it is a spreadsheet | no |

Both run at once and neither can hurt the other. Every row either one brings
in goes through the same door, and the newer edit wins per row and per field.
The worst the two can do to each other is deliver the same row twice, and the
second delivery changes nothing.

---

## What you do, once

**1. Make the project.**
Go to console.firebase.google.com, Add project, name it `motherbase`. Turn
Google Analytics off, you do not need it.

**2. Make the database.** This is the step that catches people.
In the left menu: Build, then Realtime Database, then Create Database. Pick the
region closest to Manila (Singapore). Start in **locked mode**. The rules come
next.

Until you have done this step, the config in step 5 comes out **without a
`databaseURL` line in it**, and pasting it will say so rather than half working.

**3. Paste the rules.**
On the Realtime Database page, Rules tab. Replace everything with this and
press Publish:

```json
{
  "rules": {
    "u": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        "rows": { ".indexOn": ["updated_at"] }
      }
    },
    "drop": {
      "coach": {
        ".read": "auth != null && auth.uid === 'PASTE_YOUR_UID_HERE'",
        "$from": {
          ".write": "auth != null && ($from === auth.uid || auth.uid === 'PASTE_YOUR_UID_HERE')",
          ".validate": "newData.hasChildren(['kind','at','data']) && newData.child('data').isString() && newData.child('data').val().length < 2000000"
        }
      }
    }
  }
}
```

Your rows sit under your own account and nobody else can read or write them.
The `indexOn` line is what makes "what changed since last time" fast instead of
downloading everything every time. Without it the app will say so.

**Replace both `PASTE_YOUR_UID_HERE` with your own account id.** COACH,
Settings, COACH tab, "Your account id" has a COPY button once you are signed
in. Failing that: Firebase, Authentication, Users, the User UID column on your
own row. Nothing breaks if you skip this — the shelf below simply never
delivers anything, and everything else works.

The `drop` half is the coach shelf, and it is the only place in the database
two different people meet. It is written so the database itself, not the app,
is what keeps it honest: a signed-in person may write to `drop/coach/<their
own account>` and nowhere else, so nobody can overwrite or forge another
person's parcel, and nobody but the coach can read a single one of them or
clear the shelf. A parcel is capped at two million characters so nobody can
fill the allowance.

**4. Turn on Google sign-in.**
Build, Authentication, Get started, Google, enable, Save.

Then Authentication, Settings, Authorized domains, and make sure
`tomoncupa.github.io` is on the list. Add it if it is not.

**5. Copy the config.**
Project settings (the gear, top left), scroll to Your apps, click the web icon
`</>`, register the app with any nickname. It shows you a block that starts
`const firebaseConfig = {`. Copy the whole block.

**6. Nothing to paste any more.**
Since 2026-09-23 the config is built into `shared/cloud.js` (`BUILT_IN`), so
every device and every app starts with it. Pasting a block still works, and
wins, for a different project.

**7. Sign in.**
Press Sign in with Google. That is it. It says `Live as <your email>` when it
is working.

On any other device, phone or desktop program, only step 7.

---

## The coach shelf

Tom, 2026-09-23: *"We should put an upload to coach function in train."*

A client's rows live under their own account and no coach can read them. That
is the rule that makes the sync safe to hand to a client at all, and it did not
change. What changed is how a client's SEND TO COACH travels.

| | Before | Now |
|---|---|---|
| What the client presses | SEND TO COACH | SEND TO COACH |
| What it makes | a file, shared or downloaded | a parcel on the coach's shelf |
| What the client does next | sends the file to Tom somehow | nothing |
| What Tom does | asks for it, saves it, opens it | opens COACH |

Same gesture, and still a deliberate one: nothing leaves a client's phone until
that button is pressed. This is not a live feed off their phone, which was the
other way of doing it and was not chosen.

**The file has not gone.** A client opened from a folder, not signed in, with
no signal, or with the Firebase library blocked gets the file exactly as
before, and the message says a file was saved instead and why. Hard constraint
4: the upload degrades, it is never depended on.

**What COACH does with a parcel.** `SENDS` in COACH's header says how many are
waiting, and COACH looks once every time it opens. Pressing it takes every
parcel in, through the same `takeFile` the files always went through, so the
rows merge on `updated_at` like any other sync and a second send only adds what
is new. A parcel is cleared only after its rows are in. One that cannot be read
is left on the shelf rather than thrown away, because until COACH has taken it
that parcel is the only copy anywhere but the client's phone.

**A parcel is not where data lives.** It is a delivery, off the shelf as soon
as it lands. Rows live in the store, the way everything else does.

**Photos still do not travel this way.** A check-in is not sent over the shelf
yet, only a training log; the parcel cap and the reasons under "What it does
not do" are both why.

---

## What it does not do

**Photos do not go through it.** Anything over 64KB is left out: check-in
photos, photographed labels, pasted pictures on an ARC node. Those keep
travelling by backup and by the sheet. The settings row tells you how many were
left out once it has left any out.

This is on purpose. The free plan allows 1GB stored and 10GB a month down.
Everything except photos is roughly 10MB for the whole suite, which is nothing.
Photos alone would be most of the allowance, and they are the rows you least
want going over mobile data.

**It cannot sign in from a folder.** Google checks the web address a sign-in
came from, and a file opened from a folder has no address to check. So the
folder copy shows the live sync row and explains this instead of failing.

**The desktop programs open the hosted copy** since 2026-09-23, so they sign
in like any other device. A file named `use-folder-copy.txt` in `desktop/`
sends both back to the folder copy together. Untested: whether Google lets its
sign-in window open inside a program rather than a browser. If it refuses,
the programs keep the sheet sync, and that problem gets its own fix.

**It is off until you set it up.** An app with no config pasted makes no
network request from this at all. Clients get the file and never notice it.

---

## If something looks wrong

The LIVE SYNC row in Settings, DATA says what happened in plain words. The ones
worth knowing:

| It says | What to do |
|---|---|
| no databaseURL | Step 2. The database does not exist yet. |
| the database refused the read or write | Step 3. The rules are not the ones above. |
| the database needs its index | Step 3. The `indexOn` line is missing. |
| could not reach the Firebase library | No signal, or something is blocking it. Nothing is broken; it tries again next time the app opens. |
| This page was opened from a folder | Expected. Use the hosted copy. |
| Google says the browser or app may not be secure | You are in STATUS.exe or Main Menu.exe and Google refused the program. Tell Claude. |

Nothing here can lose data. A failed sync moves no boundary, so the same rows
simply go again next time.
