# SPEAK — the app's own brief

Governs `speak/` only. The root `CLAUDE.md` and `DOCTRINE.md` still apply and
win any argument. Written 2026-09-15, the day the app was built.

## What it is for

**What SPEAK is for, as of 2026-11-16.** Tom: *"way more of what Speak is for [is] entirely on the work we've done today, which is to get me speaking like Faizan, but my own ideal version of it. So somewhere between Hormozi and Jocko Willink ... make sure it can assess how I speak correctly. So that's eye contact, that's mouth use, that's mumbling, that's voice crispness, that's coherence, that's concision. And then it's also meant to add to my data bank, my knowledge base, my second brain stuff ... And this feeds into my content as well."* Three jobs, in this order:

1. **Make him his own ideal speaker**: Faizan Asif's clarity (no crutch phrases, pauses only at full stops, the point carried by the voice), in Tom's authority register, between Alex Hormozi and Jocko Willink: claims stated flat and finished, no "right?" tags, about 160 to 190 words a minute, a held beat after the line that matters, purposeful gestures. Faizan's one measured video and Tom's own Story are the reference numbers (see the session's 2026-11-16 analysis in `HISTORY.md` if moved there).
2. **Assess him correctly** on six things: eye contact (on the lens), mouth use (evenness, opening), mumbling and voice crispness (the ear's crispness), coherence and concision (Claude's reading, below). Every verdict carries Right/Wrong marks; a reading his marks keep calling wrong gets fixed, not argued with.
3. **Feed his second brain and his content**: every transcript can go into the banks (FREE SPEAK, the topics, ADD TO KNOWLEDGE BANK), filed by subject for ARC, and any take can become a draft (REFINE INTO CONTENT).

PATH is left as it is for now (Tom: "we can leave out path for now").

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

**The speaker is a creator on camera, not a podium.** Tom, 2026-11-16: *"our
goal isn't really to be someone giving a speech at a podium. It's more to be
a master content creator, YouTuber, personality type individual ... more of a
motivational speaker than someone giving a presidential type effect."* Every
target, drill and fault is judged against a YouTuber or motivational speaker
talking to a lens: energy, personality and how he looks while talking count
as much as clarity. Formal oratory (lectern pace, set-piece structure) is
the wrong model.

**It coaches, not only counts.** Tom, 2026-11-16: *"I need Speak to actually
give me feedback and drills for what's happening. I don't need it to just
rate what I'm doing."* This replaces the old "never a verdict" rule, under
his suite-wide rule of 2026-09-24 that verdicts on him are fine when they are
correct and he can mark them right or wrong. Still no praise, no score, no
XP, no levels (root brief, behaviour rules).

**Device:** the PC first, the phone second. Tom, 2026-11-16: *"most of the
time I'm going to be using Speak will be on PC, though Speak on phone is
going to be a secondary thought."* Still built to the phone rules, which cost
nothing at a desk; a PC-only power (Claude refining a take) is fine.

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

How it was watched: HISTORY.md: Toastmasters, added 2026-11-10.

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

How it was watched: HISTORY.md: The coach, added 2026-11-16 (SPEAK 1.0.10).

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

How it was watched: HISTORY.md: The program, added 2026-11-16 (SPEAK 1.0.11).

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

How it was watched: HISTORY.md: Hearing the feedback, added 2026-11-16 (SPEAK 1.0.12).

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

How it was watched: HISTORY.md: FITNESS TOPIC and the fitness bank, added 2026-11-16 (SPEAK 1.0.13).

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

How it was watched: HISTORY.md: SPEAK PRACTICE, OTHER TOPIC and compare your answer, added 2026-11-16 (SPEAK 1.0.14).

## QUESTIONS FOR YOU, added 2026-11-16 (SPEAK 1.0.15)

The Open Decisions page moved into SPEAK (handoff
`tom-context/handoffs/motherbase-speak-questions.md`; Tom: "absorbing the
functions of open decisions into Speak... this works in the future for any
prompts that might happen from speak"). His picks: a tap counts for a pick
question, voice optional; doctrine answers go to a **Fitness Knowledge Bank**
(`tom-context/fitness-knowledge-bank.md`), "and Skool pulls from this"; LUL
is lower, upper, lower.

- **Any producer**, no code change: a Todoist task `Ask: <question>`, its
  description optionally holding a fenced `ask` block of JSON (`context`,
  `onRecord`, `kind` choice / rank / brackets / free, `options` or `items` with
  `rec`, `dest` knowledge / brand / codex, `notePrompt`). No block: the
  description is the context and the kind is free. Arrives through the
  Todoist sync as a `note` (`askQueue`, `askSpec`).
- **TODAY, first card, QUESTIONS FOR YOU** (needs-you-now), oldest first. A
  row opens the question's sheet (`openAsk`): the question, WHY IT IS ASKED
  folded (open at 900px and wider) with On record and where it goes, then by
  kind: option chips with "Recommended" written under one (never a gold
  fill); a list with up and down buttons and LOCK THIS ORDER; a bracket
  picker per item, SAVE only once all are picked, no preselected value; or a
  free answer by note or by voice. A note box under every kind. SPEAK IT
  starts a take (`AQ`, drill and skill `ask`) with the question on screen.
- **Answering** (`askAnswer`) writes an `ask` row (undated, keyed by the
  note's key: `{q, kind, answer, optId, ranking, brackets, note, said, take,
  dest, context, onRecord, tdId, askedAt, answeredAt}`), ticks the note so the
  Todoist sync closes the task, and gives UNDO for six seconds (or Ctrl+Z),
  which removes the answer and unticks the note. A spoken take on a free
  question answers it with the transcript; on a pick question it is kept as
  `said` and the question stays until tapped.
- **BANK, ANSWERED QUESTIONS**: every answer, newest first, with where it goes.
- **Filing is Claude's**, from the nightly backup, at the row's `dest`
  (`fitness-knowledge-bank.md` says how). The page cannot write tom-context.
- **Imported 2026-11-16** as Todoist `Ask:` tasks: rest 2 minutes, the
  training-priorities order, PPL and LUL timing and the Why We Lift closer
  (Skool), and market scope as a confirm (TM Brand). The brackets card was
  dropped (CODEX 1.0.4 already decided it); the Algrowrithm split was
  answered yes on 2026-11-10 and went straight into the knowledge bank.

How it was watched: HISTORY.md: QUESTIONS FOR YOU, added 2026-11-16 (SPEAK 1.0.15).

## The widget's three buttons, 2026-11-16 (SPEAK 1.0.16)

Tom asked (through the topic finder's session) for FITNESS TOPIC and OTHER
TOPIC on the small SPEAK.exe window. `#wid .wbtns` holds SPEAK, FITNESS and
OTHER side by side, each starting its drill straight away (`data-d`, through
`drillById`). Measured at 300 x 116: each 84 x 44, nothing clipped, the page
fits, so `desktop/SpeakApp.cs` and its SMALL size did not change and no new
exe was needed. Watched in headless Chromium: FITNESS opened FITNESS TOPIC,
OTHER opened OTHER TOPIC. Not watched in SPEAK.exe itself; it opens the
hosted page, so it gets the buttons on its next open (twice, per the root
brief's shared-file trap).

## YOUR VOICE, added 2026-11-16 (SPEAK 1.0.17)

Tom: *"Speak just updates and keeps a continual update of how I actually talk
and what my speech patterns are. The purpose of this would be to help Claude
write in my voice and so that I have an awareness of how I talk and be able to
compare this to other speakers."* His picks: Claude's copy lives in its own
file, `tom-context/voice-spoken.md`; compare only with speakers he adds.

- **First card on PROGRESS** (`drawVoice`). From every take's `tx` (chunks
  are breath groups) through `voiceOf`: words, words per breath group, word
  variety (different words per hundred, moving windows of 100), word length,
  I / you / we per hundred words, fillers and his crutch list per hundred
  words; pace and fillers a minute from the last 30 days' takes; phrases he
  repeats (three-word runs said 3 times or more, at least one non-stop word,
  a shifted copy of a kept phrase left out), how he starts a thought (first
  two words of a breath group), and the words he reaches for.
- **ADD A SPEAKER**: a name and a pasted transcript (30 words at least,
  40,000 characters at most), a `speaker` row `{name, text, at}`; split into
  sentences by full stops, which the screen says differs from his breath
  groups. Each one is a column in the table; a hold or dots menu removes it
  with UNDO.
- **COPY FOR CLAUDE** puts the profile on the clipboard as Markdown, the shape
  `voice-spoken.md`'s Profile section takes.
- Uses the program's `wordsOf` (one definition; a second one stopped the page
  loading until it was taken out).

How it was watched: HISTORY.md: YOUR VOICE, added 2026-11-16 (SPEAK 1.0.17).

## The camera: mouth, video, every take, 2026-11-16 (SPEAK 1.0.18)

Tom: *"add a webcam recording feature so you can see how I talk and so I can
maintain eye contact ... I need to practice speaking with my whole mouth
because apparently I have a habit of speaking from the side of my mouth."*

- **The camera is on for every take** (Settings, Camera on every take,
  `speak.camAll`, on), not only EYES, so eyes and mouth are read each time.
  EYES goals still apply only to EYES drills; the coach's eyes fault now fires
  on any camera take.
- **Mouth** (`lookAt` adds `mL`, `mR`, `shift`, `gap` from the face tracker's
  blendshapes and lip landmarks; `mouthOf`): over frames while he is
  speaking (`T.ear.level() > 0.25`) with the mouth moving, each frame's lean
  is (left - right) / (left + right) plus the mouth pulled sideways.
  `mouthEven` is 100 minus the mean size of the lean; `mouthDir` the side that
  did more; `mouthOpen` the lip gap as a share of face height; `ev.mz` the
  stretches of 0.8 s or more leaning past 0.35. Target `mouthEven` 85
  (`DEFAULT_TGT`), a first guess. **Not watched on a real face**, and which way
  the tracker's left and right fall is from its documentation, not seen.
- **Coach fault `mouth`** ("Talking from one side") with its moments, fixed by
  **`fix-mouth`, Whole mouth**: a read passage to the camera, the third meter
  showing evenness live (`mouthLive`), goal one step up. Also under QUICK
  PRACTICE while the camera switch is on.
- **Video**: with the camera on, the recorder takes picture and sound
  (`video/webm` VP8 and Opus, 250 kbps, else `video/mp4`; Settings, Record
  video, `speak.recVid`, on). Same `tclip` row, device only; `take.vid`.
  The take's player shows it mirrored above the strip, and every moment button
  plays the picture at that moment. About 30 KB a second.
- **A speaker by name**: Tom asks Claude Code; Claude finds a transcript and
  adds a Todoist task `Speaker: <name>` whose description is the words (any
  `**Label:**` lines are dropped). SPEAK lists it beside his pastes, labelled
  "found by Claude".

How it was watched: HISTORY.md: The camera: mouth, video, every take, 2026-11-16 (SPEAK 1.0.18).

## Possible content and refining, added 2026-11-16 (SPEAK 1.0.19)

Tom: *"how can it detect if something is, oh, this can be content? Do you
want to refine it into a content?"*, then *"I would like Speak to have its
own copy of the possible topics, and then we're gonna do this also in Outer
Heaven ... the option to directly go into refine and iteration mode from a
fresh speak practice."*

- **The check** (`contentCheck`): a take with 60 words or more of transcript
  and at least two of `CONTENT_SIGNS` (a story, a strong claim, a list,
  advice for the viewer) gets "This could be content. It has ..." under its
  transcript. The signs are a guess [UNTESTED on his takes]; tune them from
  what he refines and drops.
- **The way in** (`contentBox`): every take with a transcript, outside the
  fix drills, ends with REFINE INTO CONTENT (filled when the check fired),
  or OPEN DRAFT once a draft exists. No draft is made until he presses it.
- **The row**: `draft`, keyed and dated as its take: `{take, prompt, tx,
  why, fmt, state, at, doneAt, vers: [{text, by, ask, fmt, at}], cur}`. `by`
  is `take` (what he said, always version 1), `claude` or `tom`. Kept to 12
  versions (the first and the newest eleven) so the row stays under 64KB
  and syncs. `state` is `''`, `done` (MADE IT) or `dropped`; nothing is
  deleted.
- **REFINE** (`openRefine`): a format (SHORT, YOUTUBE, POST, STORIES,
  CAROUSEL, `FMTS`), the version with older and newer buttons, the words in
  a box he edits himself (his typing edits his own newest version, else
  starts one, so a Claude version is never overwritten), a "what to change"
  box and REFINE, and WHAT YOU SAID. In SPEAK.exe the window grows to WIDE
  (1000 x 820) while it is open (`mbsize:wide`).
- **Claude only in SPEAK.exe** (`desktop/SpeakRefine.cs`): the page posts
  `mbrefine:{id, prompt}`, SPEAK.exe runs the bundled claude.exe with no
  tools and `voice-spoken.md` plus `brand.md` from tom-context as the system
  prompt, and posts `{mb:'refine', id, text}` back. It sets
  `window.MB_REFINE`; with no flag the REFINE box is replaced by a line
  saying so, and he can still edit.
- **SPEAK's own list**: POSSIBLE CONTENT on BANK, every draft not made or
  dropped, newest first.
- **OUTER HEAVEN** reads `draft` rows from the nightly backup, as
  `knowledge.py` reads `answer` rows. Its side is its own session's work.

## FREE SPEAK and jumping off points, added 2026-11-16 (SPEAK 1.0.20)

Tom: *"I also want the three current buttons to stack vertically, and then I
want a fourth button to be just a free speak. So speak will also become my
way of turning or transcribing speech to text, and then it will auto sort
the transcript into the relevant data bank."* And the things he talks about
*"synthesized into possible prompts"*, in his wallpaper program or *"when I
click free speech, I'm shown also these possible jumping off points, or I
can just skip directly into a free flowing ramble."*

- **The widget** stacks four buttons, SPEAK, FITNESS, OTHER, FREE SPEAK, and
  SPEAK.exe's small window is 300 x 260 to fit them. FREE SPEAK is also on
  BANK beside FITNESS and OTHER.
- **FREE SPEAK** (`FS`, `openFree`): with jumping off points, a sheet lists
  the newest six (hold: Not this one) and JUST RAMBLE; with none it starts a
  ramble straight away. No lights, no goals, the clock counts up, it stops
  itself at 15 minutes, transcript forced on. The sheet says DONE, never MET.
- **The bank**: every free speak is an `answer` with `src: 'free'`, `q`
  "Free speak" or the jumping off point, and no subject yet.
- **Filing** (`sortFree`, SPEAK.exe only): Claude reads each unfiled free
  speak of 30 words or more, oldest first, one at a time, and the answer
  gets `subj` (fitness, productivity, behaviour change, philosophy or
  observations, which ARC's three banks read), a title as `q`, and
  `sorted: 1`. Up to three jumping off points become `topic` rows, `kind:
  'jump'`, keyed `jump-<take key>-<n>` so two devices write the same rows;
  starting from one marks it `used`. A ramble made on the phone is filed the
  next time SPEAK.exe opens.
- **Points build off each other** (SPEAK 1.0.21). Tom: *"my talking points get synthesized off of each other ... if I talk about separate but related things, you can prompt me on the connection and clarifying questions. So the goal here is to also build upon my knowledge banks and get my thoughts out into an external medium while also improving how I speak."* Claude reads the ramble beside his twenty newest other answers (any kind) and makes up to three points, one of each where it can: `how: 'link'` (a connection between this ramble and earlier answers, ids in `with`), `ask` (a clarifying question about something left vague), `thread` (an idea not finished). The sheet says which, and names the answers a link joins.
- **Choose your own path** (SPEAK 1.0.22). Tom: *"occasionally act as opposition ... the things I say need to be able to withstand the opposite point of view"*, then *"choose my own path type of thing ... while still letting me revisit old options"*, one prompt at a time. A fourth kind, `push` (Push back): the strongest opposite view of a claim he made, only when he made one. WHAT NEXT sits at the foot of every free speak's sheet (`nextBox`): the points made from that take appear as soon as Claude files it (it polls while the sheet is open), plus SAY IT TIGHTER and JUST RAMBLE. A take started from a point carries `parent` (the take it came from) and `how` in its prompt and its `answer`, so a chain can be walked back. SAY IT TIGHTER (`TIGHT`): the take's title again in 60 seconds, its sheet opening with the first take's numbers beside this one's (pace, fillers, on the lens, mouth evenness). The FREE SPEAK sheet lists every point not taken and folds the taken ones under TAKEN, each startable again.
- **Points draw on the banks** (SPEAK 1.0.23, spec `talking-points-from-banks.md` from the Knowledge banks session, in the oh-speak-feed side notes). The pool is every live `answer` plus `kpiece` rows from RAMBLES (`ramble|<id>`) and graded posts (`post|<id>`), less any row named in a thread's `srcs`, never Skool (`bankPool`). Claude gets the eight nearest by shared rare words (`bankNear`, idf over the pool) and up to six empty topics from ARC's `arc.bankgaps` setting if ARC saved it (`bankGaps`). A link's `with` may hold bank keys (a `|` tells them from answer keys). A fifth kind, `gap` with `topic`, at most one per ramble and only when ARC's gaps exist. Every free speak of 30+ words is also fed to OUTER HEAVEN's RAMBLES by that side, once.
- **Only free speaks (and their tighter takes) make jumping off points** for now. The wallpaper
  showing them is OUTER HEAVEN's work, reading `topic` rows with `kind:
  'jump'` and no `used` from the nightly backup.

## From your posts and drafts made, added 2026-11-16 (SPEAK 1.0.25)

Tom approved both through the SPEAK/knowledge master chat ("Yes, all three"). FREE SPEAK is settled as his one place to ramble out loud.

- **postspeech** rows (OUTER HEAVEN, through the inbox; spec `postspeech-spec.md` in the oh-speak-feed side notes) are read as takes of two pseudo drills, `post-story` (style live) and `post-reel` (style short), so `coach()` names their fault (`postFaults`). A cut reel (`raw` false) drops um, dead-air and run-on faults. They never count in TODAY'S DRILLS, steps, PROGRESS or practice numbers.
- **FOCUS**: a fault top in 2+ posts of the last 14 days counts once more, and posts alone can raise crutch phrases. The card says "and also in N of your posts", or "the top fault in N of your posts" when only posts raised it.
- **FROM YOUR POSTS** on TODAY under FOCUS: each post of the last 14 days with pace, crutch a minute (top phrase), "at least" ums and long silences; the sheet has the coach's fault and drill, the transcript with crutch phrases marked, the `how` honesty lines and OPEN THE POST.
- **YOUR VOICE** gains a Posted column, every post's words read as one speaker.
- **draftmade** (undated, keyed by the take; `tools/backup.html` takes it): the draft shows "Posted <day> as a <kind>, graded N" with the link, leaves POSSIBLE CONTENT, and SPEAK sets its own `draft.state` to `done`, `doneBy: 'post'`, `doneAt` from the row, only if the draft was open (`syncMade`). When the row goes (Tom marked the match wrong), a draft with `doneBy: 'post'` goes back to open; one he pressed MADE IT on stays made.

## Coherence and concision, added 2026-11-16 (SPEAK 1.0.29)

Claude in SPEAK.exe reads every take of 40 words or more (not warm-ups or fix drills) and scores coherence and concision 1 to 5, each with one line why quoting his words, and his main point in one sentence (`judgeTake`, stored on the take as `judge: {coh, cohWhy, con, conWhy, point, at}`). The take's sheet shows both beside the other numbers, waiting while Claude reads. At 2 or under the coach names `unclear` (fix: Point, reason, example) or `wordy` (fix: One sentence), and his Right/Wrong mark on that fault is how the reading is checked. A take made away from the PC is read the next time SPEAK.exe is open, one at a time.

## Desktop first, 2026-11-16 (SPEAK 1.0.27)

Tom: *"Is the speak exe different from speak in main menu? Because I want them to be the same ... speak will primarily be a desktop app."*

- **SPEAK.exe opens the whole app** in an ordinary, resizable window (about 1100 x 860, size and place kept in `speak-app.txt` as `full=`). The old always-on-top widget is **Mini widget** in the tray's menu (`mini=1`); the page's `mbsize:` messages only move the window in mini mode.
- **TODAY** opens with a TODAY card: TODAY'S TAKES (a sheet of today's takes, each opening its sheet), FREE SPEAK, DRILL MENU, and the **Camera** switch (`speak.camAll`, on by default). The same switch sits on every drill's sheet. In the widget, "N takes today" is a button to the same sheet.
- **ADD TO KNOWLEDGE BANK** under any take with a transcript that is not in the bank yet: an `answer` with `src: 'take'`, filed by `sortFree` like a free speak.
- **Two minutes at least**: SPEAK PRACTICE, the topics and FREE SPEAK keep STOP locked as KEEP GOING m:ss until TARGETS' shortest time, now 120 s (red light 180 s). Tom: "set a minimum speaking time of 2 minutes".
- **Pace targets for a direct speaker** (Tom's authority style, measured against Faizan Asif's 277 wpm and his own 141 to 165): Talking head 160 to 190, Short-form 170 to 200, Live 160 to 190. A band he saved in TARGETS still wins.

## SPEAK.exe tray and desktop icon, 2026-11-16

Tom: "give Speak a desktop icon and a tray icon". SPEAK.exe has a tray icon (`Tray` in `desktop/SpeakApp.cs`): a click brings it forward, its menu has Open SPEAK, Free speak, Drill menu and Quit SPEAK. The window's close button tucks it into the tray; Quit or Windows shutting down really closes it. A `SPEAK.lnk` on his desktop opens `desktop/SPEAK.exe` (made once by hand from a session, not by the program).

## DRILL MENU, added 2026-11-16 (SPEAK 1.0.26)

Tom: *"populate the drills menu ... and then I also want you to recommend the best drill for what I'm currently working on. And I also like the idea of not stopping."*

- **DRILL MENU** (`openMenu`), a button on PATH and under TODAY'S DRILLS: BEST FOR YOU NOW on top (`menuPick`: FOCUS's fix drill; else Land it, no tag when crutch phrases showed in his posts or takes this fortnight; else Don't stop), then every drill folded by what it works on (`MENU_GROUPS`, by skill). Picking one closes the menu and opens the drill.
- **Its own drills** (`LIB`, not on PATH's stages): Don't stop (Faizan Asif's daily rep, two minutes, no STOP, `noStop`), Just a Minute (the BBC game, 60 s, no silence, no repeats), Land it, no tag (a direct speaker's statement with no "right?", crutch 0), Pace ladder 160-180, 180-200, 200-220 (crutch 0 on each rung), One word per line (the actor's operative word, `STRESS_LINES`, pitch spread goal).
- **`noStop`**: the take's STOP is replaced by a disabled KEEP GOING; the take ends itself at its time. Back still cancels.

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

Moved to HISTORY.md (HISTORY.md: History, moved from the root brief on 2026-09-22).

