# CHECK IN — the app's own brief

Governs `checkin/` only. The root `CLAUDE.md` and `DOCTRINE.md` still apply and
win any argument. Written 2026-09-15, when this conversation became the one
master conversation for CHECK IN (Tom: "This is now the only check in convo").

## What it is for

Tom, 2026-09-15: *"I give: Goal Physique, and then regular check in pictures.
You tell me how far off I am. Can we include some manner of timelapse
feature?"* For his own body and his clients'.

**Function.** See a body change, check-in to check-in, in photos and numbers,
against a goal.

**Never:** a verdict. It shows the goal, the first and the latest, three ratios
under each and the change since the first. Nothing on screen says whether a
number is good (Tom: "Yes just give neutral numbers"). The one place words
about a body are asked for is Copy for Claude, and that happens in Claude, not
here.

**Device:** everywhere. The photo is taken standing up with a phone; progress,
timelapse and clients are looked at on either.

## The pieces, and why each is the way it is

**Poses.** Front is always there and cannot be hidden. **Add a pose** is one tap
with no name to type (Tom: "why are we typing pose names?"); it becomes Pose 2,
Pose 3, and can be renamed by holding it. Every pose is its own line of photos,
with its own ghost, its own numbers and its own timelapse. Numbers are taken
on every pose, flexed ones included (Tom: "Numbers for all poses, that's what
the ghost is for"): each pose is only ever compared with itself.

**The body finder.** Google's MediaPipe pose landmarker, `full` model, on the
processor. Chosen as the best tool that runs on the device with nothing
uploaded: MoveNet has no outline, BodyPix is retired, and body-part models that
read a waist better are 50 to 200MB. Engine from jsDelivr (11MB), model from
Google's storage (9.4MB), both kept in the browser's Cache API under
`checkin-body-finder-1` so it works with no signal afterwards. That is Google's
code, not his data, so it is deliberately not in the store and not in backups.

- **The graphics-chip path is not used.** In the test browser it found no body
  in a photo the processor path found in 0.36 seconds. A wrong "nobody there" is
  the worst failure this could have.
- **If it cannot load**, nothing breaks: the dots start in the middle of the
  photo and he drags them (root constraint 4).

**Measuring.** Three widths read off the body outline, row by row, as the run
of body containing the middle of the torso. Torso length is shoulder joints to
hip joints.

| Line | Where it looks | Takes |
|---|---|---|
| Shoulders | 5% above the shoulder joints to 15% down | the widest row |
| Waist | 35% to 90% down | the narrowest row |
| Hips | 80% to 105% down | the widest row |

Arms are the hard part. Decided **once per photo, per arm**, from the rows
between chest and hips: an arm with a gap beside the torso on most rows is
apart, and the edge on that side may not run past the torso edge seen while it
was apart (plus 10% of the torso, for the hips flaring out). An arm with no gap
is against the body, and the edge is cut at the arm's line plus 7% of the torso.
Either cut marks that line's dots as a guess, drawn in the warning colour.

Three ratios: shoulders to waist, shoulders to hips, waist to hips. Ratios do
not care how far away the camera was, which is the whole reason for them.

**Checking the dots.** Six dots on three lines, full screen. Dragging a dot
moves its line up or down with it, so a width is always straight across.
**Done** saves the dots as checked, and a checked photo is never re-measured by
the app, including by a queued job that finishes after he checked it.

**The Check In camera.** Every one of these was agreed with Tom on 2026-09-15:

| Aid | What it does | Default |
|---|---|---|
| Ghost | last time's photo in this pose over the live picture, with a slider | on, 35% |
| Body match | last time's skeleton dashed; Distance, Position, Height and Turn go green | on |
| Takes itself | all green and still for 0.7s, a three-beat count, a photo | on |
| Beeps | quicken as the score rises, like a parking sensor, through `Sfx` | on ("we can experiment") |
| Spoken directions | the phone's own voice, one direction every 2.6s at most | on ("we can experiment") |
| Tilt | the phone's angle against last time's, where the phone reports one | on |
| Same camera | front or back, remembered | front |
| Light | brighter or darker than last time. A warning, never a blocker | on |
| Setup photo | where the phone sits and where he stands, shown first | **off**: Tom worried about friction, so it is a switch |
| Last time's clock | "Last check-in: 7:12am, 14 Sep" on the check-in card | always |
| Match score | 0 to 100, saved on the photo; the timelapse can leave out anything under 70 | always |

Directions are in terms of his body, not the picture: the camera faces him, so
the right of the picture is his left. The turn direction names a shoulder, and
which shoulder depends on whether his face is visible.

**Photos.** Stored at 1920px on the long edge, JPEG 0.85, about 400KB. That is
the size a timelapse video is made at, so a stored photo is never the soft frame
in the video. **Use the phone's own camera** and **Choose a photo** stay on
every slot for full camera quality; the original then lives in his Photos.

**Timelapse.** Every photo in one pose, each moved, scaled and turned (turn
capped at 10 degrees) so its shoulder and hip midpoints land where the first
frame's did. 1080 by 1920, story-shaped. Flipbook or before-and-after wipe,
three speeds, a fade, date and weight along the bottom, and the face shown,
blurred or covered by an animal. Saved as MP4 where the browser can make one
and WebM where it cannot, by playing it once onto a canvas while it records.
Handing the file over is a second tap on purpose: an iPhone only shares inside
a tap, and a recording outlasts one.

**Animals.** Eight, drawn on a canvas: bear, cat, dog, panda, rabbit, fox, frog,
monkey. Each person picks their own, and it travels in their check-in file.
**The one place this app writes colours down**, as `hsl()` in script, never in
CSS: an animal is part of a picture that leaves the app and must be the same in
every theme. The blur is the face shrunk to 12 pixels and grown back, because
canvas filters are not on every iPhone.

**Saving photos.** Named `2026-09-15 Tom Front.jpg`. A phone gets the share
menu (Save to Files, into iCloud Drive, is what Tom wants); a desktop gets one
zip, written by a forty-line store-only zip writer because photos are already
compressed. **Add photos from files** and **Add a folder** read those names
back onto the right day and pose, skip anything already there, and say how many
they could not place.

**Copy for Claude.** Tom: a manual bundle, not a paid connection. One picture
(goal, first and latest for each pose, with the ratios printed under each) and
one question, copied to the clipboard as the panel opens and shown in a box
for copying by hand. One picture reads cheaper than six and cannot arrive out
of order.

**Clients.** Each client uses their own copy of CHECK IN and sends a file.
Opening it **keeps** it (changed 2026-09-15; it used to show and discard):
their rows are stored under their id in front of the key, `pid|front`, and a
`cperson` row carries their name, animal, unit and the questions and poses
their file described. A newer row wins, the way the store merges, so an old
file never undoes dots Tom has checked. His own file, sent from his phone to his
desk, is recognised by its sender id, or by asking once. **Both**: a later COACH
app can read these same rows.

## Rows

| Type | Date | Key | Payload |
|---|---|---|---|
| `cfield` | — | field id | `{label, kind, unit, ord, on}`. `kind`: photo, number, scale, text |
| `cval` | day | field id, or `pid\|id` | `{v}`. A client's weight is `pid\|weight` |
| `cphoto` | day | pose id, or `pid\|pose` | `{img, w, h, t, cam, src, lum, tilt, match}` |
| `cmark` | day, or none for a goal | same key as its photo | `{pts:{sh,wa,hi:{y,l,r}}, guess, lm, by, found, at}`. `by`: auto, checked, manual |
| `cref` | — | `goal:pose`, `setup`, or `pid\|goal:pose` | a goal photo or the setup photo, shaped like `cphoto` |
| `cperson` | — | pid | `{name, animal, unit, fields, seen}` |
| `checkin` | day | `''` | `{sent}` |

The person on this device writes STATUS's `ev` weight row, the way STATUS's
`evAdd` does. Settings under `checkin.`: `name`, `pid`, `mine`, `animal`,
`facing`, `ghost`, `auto`, `beeps`, `voice`, `light`, `setup`, and `tl*` for the
timelapse's look.

## Testing it without a phone

- **A body to measure:** the Wellcome Collection's 1865 standing figure,
  CC BY 4.0, loaded with `crossOrigin = 'anonymous'` from Wikimedia's 1280px
  thumbnail. Draw it onto a canvas at other sizes and offsets to make check-ins.
- **The check one level under:** the same body at another size and position
  must give the same widths per unit of scale. That is what caught two
  measuring bugs on 2026-09-15; looking at the dots did not.
- **A camera:** replace `navigator.mediaDevices.getUserMedia` with a function
  returning `canvas.captureStream()` of that photo, redrawn on a timer, and
  shift it to see the directions change. Replace `speechSynthesis.speak` to
  collect what would have been said.
- Delete every `cfield cval cphoto checkin cmark cref cperson` row and every
  `checkin.` setting afterwards.

## Not known yet

Written down so nobody claims otherwise. Nothing here has run on an iPhone.

- Whether an iPhone home-screen app asks for the camera every time it opens.
- Whether iOS Safari's MediaRecorder hands over an MP4 that Instagram takes.
- How fast the body finder runs live on his phone; it looks every 220ms and
  skips a look while one is still running.
- Which way "Tip the top of the phone back" actually feels, and whether the
  beeps and voice help or annoy. Both are switches.
- How often the arm rule gets the waist and hips right on real photos taken
  with arms relaxed. The test photo had one arm against the body and one apart.

**Measured on 2026-09-15**, the same 1865 photograph drawn four ways (sizes 1,
0.92, 1.06 and 1, shifted, brightness 0.9 to 1.1), widths divided by size:

| | Shoulders | Waist | Hips |
|---|---|---|---|
| Spread across the four | 276 to 278 (1%) | 170 to 175 (3%) | 192 to 209 (9%) |

The same photograph uncropped, as the goal, read shoulders to hips 1.12 against
1.32 to 1.45 on the four: a hand on the thigh still leaks into the hips there.
**Hips are the weak number**, and their dots are always marked as a guess when
an arm rule touched them. The next step, if real photos show the same, is to
measure hips on the side photo's depth or to stop at the waist.
