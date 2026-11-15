# SPEAK — the app's own brief

Governs `speak/` only. The root `CLAUDE.md` and `DOCTRINE.md` still apply and
win any argument. Written 2026-09-15, the day the app was built.

## What it is for

Tom, 2026-09-15: *"Speech improvement app to help me with YT and short form
content."* Pace, filler words, speaking from bullets and from nothing, mumbling
and stuttering, eye contact, and two phrases in particular: "you know what I
mean" and "right". *"Base it on Duolingo. App should give objective unbiased
feedback. Make it like a guided game."* And, the same day: *"Have it include
daily warmup drills. I need to have clear goals and know why I'm doing them,
not just mindless gameplay."*

**Function.** Practise talking to a camera and see, in numbers, whether it is
getting cleaner.

**It makes an orator.** Tom, 2026-11-16: *"the purpose of Speak is to turn
me into a great orator"*, and *"Everything, the goal is a program designed to
create a master speaker."* Delivery is half of it; the program adds structure,
story, the devices and a whole rehearsed talk (The program, below).

**It coaches, not only counts.** Tom, 2026-11-16: *"I need Speak to actually
give me feedback and drills for what's happening. I don't need it to just
rate what I'm doing."* This replaces the old "never a verdict" rule, under
his suite-wide rule of 2026-09-24 that verdicts on him are fine when they are
correct and he can mark them right or wrong. Still no praise, no score, no
XP, no levels (root brief, behaviour rules).

**Device:** everywhere. A take is made wherever the camera is: a phone propped
up, or a laptop at a desk. Built to the phone rules.

**Tom only.** Flagged `mine` on the home screen, behind the line, and dropped
from the client build. Nothing in it assumes Tom, so it can be given to
clients later by removing it from `DROP_APPS` and adding it to `COPY_DIRS`.

**It runs on his machine.** Tom, 2026-09-15: *"make it local on my machine."*
Every number is read on the device. The browser's recogniser is the only thing
in here that could send his voice anywhere, so it is **off by default** and he
turns it on for a take he wants his crutch phrases counted in. With it off a
take makes no network request of any kind; the only one left on the page is
Google Fonts, which every app in the suite makes and which falls back to the
system face when it fails. The face finder is about 15MB fetched once and kept
in the browser's cache, and the picture itself never leaves the machine.

## How Duolingo was read

What was taken, and what the root brief forbids:

| Duolingo | Here |
|---|---|
| A path of units, done in order, a lesson of about two minutes | Five skills, five steps each, in order. A step opens when the one before it has been met once. Nothing closes again. A take is 30 to 180 seconds |
| Immediate feedback on every answer | The numbers, the goals and met or not, the moment the take stops |
| A daily goal, a streak at the top, celebrated after the lesson | The warm-up plus three drills; the streak is in the header as a number beside a flame. A short sound at the end of a met take, a shorter one otherwise. No words of praise |
| Streak freeze, up to two held | One freeze earned per five practised days, two held at most, spent silently on a single missed day. Worked out from the takes, never stored |
| Target Practice built on weak areas | TODAY picks the current step of the three skills furthest from their target |
| "Jump here?" to skip ahead | Hold a locked step on PATH: Open this step now |
| XP, gems, leagues, hearts | None. Root brief: no levels, no XP, and self-determination theory says a score over an intrinsically motivated act reduces it |

## The skills, and why each step is where it is

Scaffolding: every step is one move past the one before, with the number it
asks for and the reason, and the targets are his to change in Settings.

- **PACE.** Read a passage in the band, then hold it while thinking, then to a
  beat, then the short-form gear, then the teaching gear with pauses.
- **CLEAN.** Count the fillers first, because untrained speakers do not hear
  them. Then under four a minute, under two, none of his crutch phrases, and
  finally silence in their place.
- **FLOW.** Bullets into sentences, a stream, a thirty-second hook with no dead
  air, a story with two held pauses, three minutes live.
- **CLEAR.** Over-articulate, then keep the crispness reading, then keep it
  while thinking, then at speed, then a voice that moves.
- **EYES.** Find the lens zone, hold it, eighty percent with short glances,
  eyes on the lens while thinking, everything at once.

The daily **warm-up** is three measured steps: a hiss for breath (longest
sound), a hum and siren (pitch spread), and three twisters over-articulated,
which sets the day's crispness reference. The CLEAR drills are measured against
that reference, so without a warm-up they say so.

## What is measured, and how honest each number is

Everything from sound is measured on the device by the ear (`Ear` in
`index.html`), in 10ms frames, after de Jong & Wempe 2009. Tuned 2026-09-15 on
four clips with counted syllables, 97 in all: 29 of 29, 13 of 14, 3 of 3 and
51 of 51. Fed live through Chromium's fake microphone at 44.1kHz it gave the
same counts as on the file.

| Number | How | Honesty |
|---|---|---|
| Pace, wpm | words from the transcript when there are ten or more, else syllables divided by 1.4 | The syllable estimate is labelled as one on screen |
| Syllables | voiced peaks in loudness with a 1dB dip either side, 80ms apart or more | Measured against counted clips, above |
| Pauses, long pauses, held pauses | silences of 250ms or more; 1.5s or more; 0.8 to 2s | Thresholds from the literature, `RESEARCH.md` section 4 |
| Held sounds | a voiced run over 300ms with pitch within 1.2 semitones and loudness within 8dB | A proxy for um and uh. A vowel drawn out on purpose counts too, and the screen says so |
| Fillers a minute | crutch phrases from the transcript, plus the larger of the transcript's ums and the held sounds | Chrome's transcript drops most ums, which is why the held sounds stand in |
| Crutch phrases | his list, whole-phrase matches in the transcript. `right`, `like`, `so`, `okay`, `actually` count only at the edge of a chunk or beside a joining word | Marked in the transcript so he can see each one |
| Stammered starts | three or more bursts of 40 to 150ms with gaps under 150ms | A proxy. Not measured against anyone who stutters |
| Repeated words | the same word twice running in the transcript | Only where there is a transcript |
| Crispness | first-difference energy over energy, a spectral-tilt proxy for the 2 to 4kHz band, as a percentage of today's warm-up reading | A proxy for articulation, never a clinical measure. Relative to his own over-articulated reading, so it does not depend on the microphone |
| Pitch spread | semitones between the 10th and 90th percentile of voiced frames; pitch by autocorrelation, 70 to 400Hz | Agrees with an independent cepstral estimate on the test clips |
| On the lens | share of looks with eyes and head inside a band around the reading taken during the count, when the screen says to look at the lens | Google's face landmarker. Tells the lens zone from the screen or the room; cannot tell two degrees. Not watched on a live face |

**Two things need a signal, and both are switches.** The transcript is the
browser's own recogniser, which sends the sound to Apple or Google, and it is
off until he turns it on. The face finder is about 15MB fetched once and kept
in the browser's cache, the way CHECK IN keeps its body finder. Everything
else works offline, and the drills run without either: a take then says which
numbers were not measured.

**A drill nothing can measure does not pretend.** `blocked(d)` names the
switch a drill's goals need and finds it off: No crutch phrases reads words,
and every EYES step reads the camera. Such a step is left out of TODAY, drawn
locked on PATH with the reason in its tooltip, and its sheet offers the switch
in one tap instead of a START it could not honour. It also **never blocks the
step after it**, or turning the camera off would wall off the rest of EYES
with nothing on screen saying why. Turn the switch back on and it gates
normally again, which was watched both ways. A goal that could not be read
says *no reading* and *not measured*, never *not met*.

**Each take is recorded, on the device only.** Tom, 2026-11-16: *"I also
wanted to take an audio recording of what I say, and ... show me which parts
of the feedback apply to which parts of what I said."* A MediaRecorder on the
take's own microphone stream, 32 kbps Opus (or AAC where WebM is missing),
from the moment the take starts to STOP; a cancelled take keeps nothing, and
the warm-up is never recorded. Settings, Record takes, turns it off. The
transcript, when on, is kept on the take, capped at 4,000 characters.

## Rows

| Type | Date | Key | Payload |
|---|---|---|---|
| `take` | day | timestamp id | `{drill, skill, style, dur, m, goals, pass, asr, cam, tx, hits, prompt, p, at}`; `p` is the prompt as given, for SAME PROMPT. `m` is every number above; `goals` is each goal as it stood, with `got` and `ok`. The warm-up is one `take` a day with `drill: 'warm'`, `steps` and `m.hiss`, `m.pitch`, `m.crispRaw`, merged as each step finishes |
| `tclip` | the take's day | the take's key | `{mime, dur, data, pad}`: the take's sound as a data address. Every row is padded past 64KB so live sync never sends it and it lives in IndexedDB only, on the device that made it; not in `IO.register`, so the sheet never gets it either. "Back up everything" does carry it. Deleted with its take, or alone from the take's menu, each with UNDO |
| `answer` | day | the take's key | the fitness bank: `{q, src, term, bracket, text, words, dur, at}`, one per FITNESS TOPIC answer. Syncs, in the sheet and backups |
| `topic` | — | id | `{text, kind}`. His own prompts: `topic`, `story`, or `bullets` split with `\|` |
| `tick` | day | `speak` | written once a day when a take is saved, so BLOCK and the home screen see it |

Settings under `speak.`: `tgt` (the targets, per-style bands and the table topic window), `crutch`
(his phrase list; null means the default list), `asr`, `lang`, `cam`, `facing`,
`beat`, `open` (steps opened by hand), and `script` (the script being rehearsed;
none means the newest). A `script` row is `{title, text, at}`, undated, keyed by
id; a take on it keeps `script`, its key.

## Words

Vocabulary, not prescription (DOCTRINE law 1): thirty topics anyone could talk
about, twelve sets of bullets that describe nobody, ten hook lines, eight story
starters, twelve classic tongue twisters, and three passages: The North Wind and
the Sun, Harvard sentences list one, and a paragraph of Marcus Aurelius in
George Long's translation. All public domain. His own content ideas are `topic`
rows, added on PATH.

## Testing it without a person

- **The ear on a buffer:** `Ear(sr).feed(samples).summary()` on a WAV with
  known counts. The synthetic clip used on 2026-09-15 has 51 syllables, 5
  pauses, 2 long pauses and 2 steady "ums", and the ear reads all four exactly.
- **Live:** headless Chromium with `--use-fake-device-for-media-stream` and
  `--use-file-for-fake-audio-capture=<wav>`, on a page served from localhost
  (a blank page has no `mediaDevices`).
- **The eyes:** `--use-file-for-fake-video-capture=<mjpeg>` of a face
  photograph, with the CDN and model URLs routed to local copies where the
  network blocks them. A still face reads 100% on the lens, which proves the
  pipeline and nothing about a moving one.
- Delete every `take` and `topic` row and every `speak.` setting afterwards.

## Not known yet

Nothing here has run on a phone or with a real voice through a real microphone.

- How the held-sound proxy does on his actual ums against his actual drawn-out
  vowels. The synthetic um is cleaner than a real one.
- Whether the crispness proxy moves the right way on his microphone when he
  mumbles on purpose. It should: mumbling takes energy out of 2 to 4kHz.
- The eye bands (`EYE_BAND`) on a live face: set from the literature's "about
  15 to 20 degrees of head turn" and a guess for the eyes' own look. If the
  lens meter reads 100% while he looks at the screen, tighten them; if it
  never reads on, loosen them.
- Whether iOS Safari's recogniser keeps going for a 90-second take, and whether
  its transcript carries ums.
- Whether the beat drill is usable with the click coming out of the same
  device the microphone is on. It is muted into the analysis path, not the
  room.

## Toastmasters, added 2026-11-10

Tom asked what Toastmasters teaches and how the great speakers got good, then:
*"Integrate what we can with Speak."* Three things the app lacked:

- **TABLE TOPIC**, on TODAY under QUICK PRACTICE, off the path (`TT`, drill
  `topics`, skill `topics`, chart slot 6). One question he has not seen,
  shown after the count, from `QUESTIONS`. The clock counts up and a LIGHT
  meter shows nothing, then green at the shortest time, yellow halfway, red at
  the longest, as a Toastmasters timer does. He presses STOP; it stops itself
  30 seconds past red. Goals: time inside the window, fillers at or under the
  first CLEAN target. The window is his, Settings, TARGETS (`ttMin` 60,
  `ttMax` 120). Not counted in TODAY'S DRILLS or Steps met; it does count for
  the streak and the tick. **`?mini=1` opens straight onto its sheet**: the
  address any quick-practice button or overlay opens.
- **Read like the greats.** Lincoln at Gettysburg, Roosevelt's 1933 inaugural
  and Kennedy's 1961 inaugural joined the read passages. All public domain.
  Douglass learned by reading great speeches aloud; the read drills now do that.
- **SAME PROMPT.** A take's sheet offers NEW PROMPT and SAME PROMPT. The same
  prompt runs again and its sheet names the last take on that prompt with its
  numbers: the great speakers refined the same material over many deliveries.
  A take keeps its prompt as `p`; older takes are rebuilt from `prompt`
  (`promptOf`).

Every take now also carries `m.time`, seconds from the first word to STOP.

Watched 2026-11-10 in headless Chromium with a fake microphone at 1280 and
390, on a 3 to 8 second test window: the lights turned at 3, 6 and 8 seconds,
the take saved met with its time, SAME PROMPT showed the same question, and
the second sheet named the first take's numbers. No page errors. Not run with
a real voice.

## The coach, added 2026-11-16 (SPEAK 1.0.10)

Every take's sheet opens on **WHAT TO FIX**, above the numbers:

- **A strip of the take:** each held sound (the um proxy) a gold tick, each
  pause a gap, silences over 1.5 s darker, and the pace in each third. A take
  now keeps `ev`: `end`, `held [[s, dur]]`, `pz [[s, dur]]` (every pause of
  250 ms or more, in seconds from the start) and `pace [a, b, c]`. The ear's
  summary returns `pauseAt` for it. Takes before 1.0.10 have no `ev`, so
  their coach reads the totals only.
- **The one fault that cost the most** (`coach(t)`), said with where it
  happened, a FIX in one move, and a DRILL whose goal sits one step past this
  take's number (`stepLe` 70% of the way, `stepGe` a fixed step), never the
  final target. A fault on a goal the take missed weighs 1.5 times. Faults:
  ums right after a pause, ums in the opening seconds, ums near the end, plain
  fillers over the line, crutch phrases (the top phrase named), speeding up
  across thirds, too fast or too slow for the style's band, silences over
  1.5 s (with their times), too few pauses, stammered starts, a flat voice,
  soft consonants, eyes off the lens. Up to two more show as "Also".
- **Right / Wrong** on the call. Wrong drops it (the next fault shows) and it
  never counts toward FOCUS; stored on the take as `fb {faultId: 1|0}`.
- **Nothing over its line** on a met take offers NEXT: the step it opened.

**Fix drills** (`FIXES`, ids `fix-…`): twelve short drills off the path, one
per fault, 30 to 45 s. They count their one fault live in the third meter
(`live`: ums, crutch, silences, pauses, restarts), which turns amber when it
goes up: an ah-counter on screen. FIRST LINE and LAST LINE (`prep`) count
down ten seconds with the prompt showing. A fix take keeps `from`, the take
it came from, and its sheet offers AGAIN and BACK TO THE TAKE, which reruns
the original drill on the same prompt so the same-prompt line shows whether
it carried over. Fix takes do not count in TODAY'S DRILLS or Steps met.

**FOCUS** on TODAY, above the drills: a fault that came top in at least two of
the last five takes this week, with its fix and its drill.

Watched 2026-11-16 in headless Chromium at 390 with a fake microphone (a
synthetic 33 s clip): take, coach, DRILL IT, the fix take linked by `from`,
BACK TO THE TAKE, FOCUS, Wrong dropping the call and saving `fb`; no page
errors, no sideways scroll. Every filler pattern, speeding up and crutch were
checked on seeded takes. The synthetic voice reads as stammered starts, so
the live ear's calls on a real voice are not known yet, and the fault weights
are a first guess to tune against his Right / Wrong marks.

## The program, added 2026-11-16 (SPEAK 1.0.11)

Five **stages** (`STAGES`), each a set of skills (`skill.stage`), in the
order the old schools taught: VOICE (PACE, CLEAR), FLUENCY (CLEAN, FLOW),
MESSAGE (EYES, SHAPE), CRAFT (STORY, DEVICES), THE TALK (SCRIPT).
`RESEARCH.md` section 12 has the sources.

- **The stage he is on** is the first with a step not met (`curStage`); a
  step a switch cannot measure does not hold a stage, a missing script does.
  TODAY's drills come only from skills at or before it, and when fewer than
  three are left it adds **review**: met steps of earlier stages not run for
  7 days, oldest first. TODAY'S DRILLS says "Stage 2 of 5, FLUENCY: 3 of 10
  steps met." PATH draws a heading per stage (met, now with steps to go, or
  later). **Every step stays startable**: a stage decides what TODAY offers,
  never what he may do. Not levels: nothing is earned or shown off.
- **New skills**, 5 steps each: SHAPE (one sentence, point reason example,
  three parts signposted, problem solution result, open and close a loop),
  STORY (one minute one turn, start in the scene, voices, three minutes, a
  five-minute slam), DEVICES (rule of three, the pause, contrast, repeated
  opening, all of them), SCRIPT (read it, first words only, nothing showing,
  from memory to the lens, piece to camera clean).
- **CLEAR step 2 is Pen in the teeth** (`clear-pen`, `halves: 'PEN OUT'`):
  half the take with a pen, PEN OUT at halfway, crispness measured on the
  second half only; `penGain` is the second half against the first. CLEAR's
  later steps moved down one. Passes are by drill id, so no one lost a step.
- **Window drills** (`win`): the clock counts up and the Toastmasters lights
  turn at the window's ends and middle; TABLE TOPIC is one (`win` replaced
  `lights`). `durOf(d)` gives the auto-stop, the window's end plus a quarter.
- **New numbers**, all on `m`: `openUms` (held sounds in the first 5 s),
  and from the transcript only, else null: `signs`, `callback`, `contrast`,
  `repeatOpen` (`devicesOf`), `cover` (`coverage`: script words heard in
  order, each looked for in the next 12 words heard). SHAPE adds its
  signpost and callback goals only while the transcript is on.
- **Scripts**: YOUR SCRIPTS under stage 5 on PATH; write, edit, rehearse this
  one, delete with UNDO. A SCRIPT step with none is blocked as `'a script'`
  and its sheet offers Write a script. Its window is the script at 150 a
  minute, plus or minus 15%. The sheet names the script, the rehearsal count
  and the take it first came out clean on.

Watched 2026-11-16 in headless Chromium at 1280 and 390 with a fake
microphone: stage 1 on an empty store, stage 2 after seeding every stage 1
pass with a stage 1 review added, PATH by stage with no sideways scroll,
writing a script from the blocked step's button, the cue prompt, the pen
drill's PEN OUT and `penGain`, a window drill's lights and pass, a script
take keeping `script`. `devicesOf` on known lines: "I have a dream" and "we
shall fight" three times each read 3, two contrasts read 2, a callback read
and a missing one not. Suite review 211 of 212 at 390, the one failure the
shared fonts check, not SPEAK. **Not watched:** anything from a real
transcript (headless Chromium has no recogniser; SPEAK.exe's WebView2 may not
either, which would leave DEVICES 3 to 5 and SCRIPT 2 to 5 reading "no
reading" there), a real voice, the phone.

## Hearing the feedback, added 2026-11-16 (SPEAK 1.0.12)

The coach's strip is now the take's player: a play button beside it, a
playhead while it plays, and a tap anywhere on the strip plays from there.
Each fault, the top one and the "Also" ones, carries its moments (`at`, up to
six `[s, length]`) drawn as buttons under it; a button plays from 1.5 s before
the moment to 1.5 s after it ends. Moments: the ums the pattern names, each
silence over 1.5 s, the third of the take that was fastest or slowest or
sped up (six seconds of it), the longest run with no pause, each stammered
start (`ev.rs`, from the ear's new `restartAt`), and each crutch phrase
(`ev.cx`), which is placed by when its chunk of transcript landed and labelled
"about" because the recogniser has no clock. A fault with no moment (a flat
voice, soft consonants, eyes) gets Play the take. The sound stops when the
sheet closes.

Watched 2026-11-16 in headless Chromium at 390 with a fake microphone: a 31 s
take saved a 140KB `tclip`, the moment buttons played and stopped on their
own, a tap three quarters along the strip played from there, pause worked,
the sheet reopened from the store played, Delete the recording removed it,
and with Record takes off nothing was kept. No page errors, every button 44px.
Not heard on the iPhone: whether Safari records AAC and plays it back from
the store is only proved on the phone.

## FITNESS TOPIC and the fitness bank, added 2026-11-16 (SPEAK 1.0.13)

Tom: *"a separate button from table topic to be a fitness/school topic. So
this serves a double purpose of me working on my speech, as well as I actually
get to fill up my personal data bank for use with school and elsewhere."* His
answers: the bank is *"a sort of fitness databank where other work can pull
from whether its for skool or content or future projects"*; transcript *"Yes
for everything, I want a transcript and a voice recording of all my answers"*;
prompts from viewer questions, Skool terms, and *"a separate automated system"*
that finds current topics (built by another session, see below).

- **FT**, drill `fitness`, skill `fitness` (`FIT_SKILL`, chart slot 1), on
  TODAY under QUICK PRACTICE below TABLE TOPIC. Same window and lights as a
  table topic (`ttMin` to `ttMax`), same goals, style `long`. `forceAsr`: the
  transcript is on for it even if the switch is off. Not counted in TODAY'S
  DRILLS. The coach and recording work on it like any take.
- **Prompts, in order** (`fitPrompt`): an open Todoist task in the store whose
  text starts `Shoot:` (the daily question engine, Round 1 in Todoist Content,
  see `tom-context/content-questions.md`), due today or earlier, oldest first,
  labelled "Today's Shoot question"; then an open `Topic:` task (the weekly
  topic finder, a desktop scheduled task on Mondays at 1pm, built 2026-11-16 in
  session "Automated finder for current fitness topics"); then a third of the
  time "Explain <term> to a beginner." from `SKOOL_TERMS` (39, from
  `tom-context/skool-brackets.md`, labelled with the bracket), otherwise a
  viewer question from `FIT_QS` (108, from `content-questions.md`, sources left
  out). Already-answered questions and ones passed over with NEW PROMPT this
  visit (`fitSkip`) are skipped. Todoist rows reach the store through the sync in
  `shared/todoist.js`, which runs in QUESTS and, since STATUS 1.0.97, in
  STATUS (STATUS.exe every 5 minutes). Between 8 and 16 Nov nothing ran it, so
  no Shoot task arrived; on 2026-11-16 the 30 Shoot and 7 Topic rows landed.
- **The bank**: one `answer` row per answer, keyed by its take: `{q, src
  (shoot, topic, viewer, term), term, bracket, text (the full transcript,
  20,000 characters at most), words, dur, at}`. Under 64KB, so it syncs
  everywhere, goes to the sheet's SPEAK tab (in `APP.types`) and into every
  backup: that is how other work reads it. The recording stays on the device
  (`tclip`).
- **BANK tab** (fourth on the nav): ANSWER ONE, EXPORT (the whole bank as
  `fitness-bank-<date>.md`, grouped by question), a search box over questions
  and answers, then a card per question with each answer: date, length, words,
  where the question came from, the words, COPY, PLAY AND COACH (or OPEN TAKE,
  opening the take's sheet with its player), ANSWER AGAIN (the same question),
  and a hold or dots menu with Delete from the bank (UNDO).
- **The transcript is now on by default** (`opt('asr', 1)`), replacing the
  2026-09-15 "off by default". Tom's own setting still wins where he sets one.

Watched 2026-11-16 in headless Chromium at 390 with a fake microphone and
seeded Todoist notes: today's Shoot question came first, a ticked one was
skipped, once answered the `Topic:` task came next, the take saved its
`answer` row, BANK listed it with two seeded answers, search filtered, COPY
put the words on the clipboard, EXPORT saved the Markdown file. No page
errors, no sideways scroll; review 197/197. The headless recogniser cannot
reach Google, so no real words were transcribed; real words only on his
devices.

## SPEAK PRACTICE, OTHER TOPIC and compare your answer, added 2026-11-16 (SPEAK 1.0.14)

Asked by Tom in the topic finder's session and passed on here:

- **TABLE TOPIC is now SPEAK PRACTICE** (*"because I also wanted to expand
  in scope"*): `TOPIC_SKILL.name`, `TT.name`, the SPEAK.exe widget button
  (`#widGo`) and the Settings targets lines. The id stays `topics`, so old
  takes keep their drill. `desktop/SpeakApp.cs` still says TABLE TOPIC in a
  comment only.
- **OTHER TOPIC** (`OT`, drill and skill `other`, `OTHER_SKILL` chart slot 5),
  under FITNESS TOPIC in QUICK PRACTICE: FT with its own prompts
  (`otherPrompt`). First an open Todoist task `Other: <question>` (the daily
  topic finder, scheduled task `fitness-topic-finder-daily` at 1pm, adds one
  a day, rotating productivity, philosophy and behaviour change), its subject
  read off the task's `**Found:** <date>, topic finder, <subject> (` line
  (`subjOf`); then `OTHER_QS`, 45 built-in questions, 15 per subject. Answers
  go to the same bank with `subj`; FITNESS TOPIC answers carry
  `subj: 'fitness'`. The bank is now ANSWER BANK, with FITNESS and OTHER
  buttons, the subject on each answer's line, and exports as
  `answer-bank-<date>.md`.
- **COMPARE YOUR ANSWER**: a prompt that came from a Todoist task keeps the
  task's description (`td.desc`, 6,000 characters at most) as `p.notes` on the
  take. That is the Shoot card (IDEA, OPEN, LAST) or the topic finder's Answer
  notes, What people say and Check. The take's sheet shows it folded under
  COMPARE YOUR ANSWER, and never during the take, so he never reads an answer
  off the screen.

Watched 2026-11-16 in headless Chromium at 390 with a fake microphone and a
seeded `Other:` task: the subject read as productivity, the notes stayed off
the take screen and opened after it, the answer saved with `src: 'other'` and
its subject, BANK showed it. Review 197/197.

## Needs from the foundation

- A device-only row type: one `Rec` would keep and back up but live sync
  would never send. SPEAK pads `tclip` past 64KB to get that today.

## The widget, added 2026-11-10

Tom chose "Own PC widget" for the overlay. `desktop/SpeakApp.cs` is
SPEAK.exe; `desktop/README.md` has the program's side.

- `?widget=1` puts `widget` on the body: header, nav and main hide, and
  `#wid` shows the name, today's take count, and one TABLE TOPIC button that
  calls `startTake(TT)` with no drill sheet first.
- The page sizes the window by message: `mbsize:big` the moment a take, its
  numbers or any sheet is up, `mbsize:small` only after 1.2 s of nothing
  open, because the take closing and its numbers opening leave a gap that
  would flicker the window. In a browser the messages go nowhere.
- Watched in Chromium at 300x116 and 440x760 with a fake microphone: nothing
  overflows the small window, the take ran, the numbers came up, CLOSE
  shrank it once. The exe, 2026-11-16 on his PC, live copy: 300x116 inside,
  on top, title bar #080B10; TABLE TOPIC grew it to 440x760 (moved up to fit
  the screen) with a real question and the real mic; the mouse's back button
  cancelled the take, saving nothing, and it went back to its spot. Escape
  does not end a take. Not watched in the exe: STOP, the numbers, CLOSE.

## History, moved from the root brief on 2026-09-22

What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

SPEAK, built 2026-09-15 from `_template/`. Tom: "Speech improvement app to help me with YT and short form content", based on Duolingo, objective feedback, a guided game, daily warm-up drills, and every drill saying its goal and why. Five skills (PACE, CLEAN, FLOW, CLEAR, EYES) of five steps each, a step opening when the one before is met; three drills a day picked from the skills furthest from target; a three-step warm-up that sets the day's crispness reference; a streak with a silent freeze; no XP, no levels, no verdicts. The ear counts syllables after de Jong & Wempe, tuned on four clips with 97 counted syllables; pauses at 250ms; held sounds as the um proxy; a spectral-tilt proxy for crispness; pitch spread; the browser's own recogniser for words and crutch phrases where it exists and is switched on; Google's face landmarker for time on the lens, calibrated during the count. Driven in headless Chromium at 1280px and 390px with a fake microphone (a synthetic clip with known counts, read exactly) and a fake camera (a still face, read 100% on the lens). Tom, 2026-09-15, "make it local on my machine": the recogniser is the only thing that could send his voice out and it is off by default, so a take makes no network request at all and the page's only one is the fonts every app fetches. A drill whose goals need a switch that is off is left out of TODAY, drawn locked with the reason, offers the switch in one tap, and never blocks the step after it; a goal nothing could read says no reading, never not met. Not run on a phone, and no real voice has been through it. Has its own brief and a research file.
