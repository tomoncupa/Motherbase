# SPEAK history

Build stories moved verbatim from `speak/CLAUDE.md` on 2026-11-16 to keep the brief under about 20 KB. The rules stayed in the brief.

## Toastmasters, added 2026-11-10
Watched 2026-11-10 in headless Chromium with a fake microphone at 1280 and
390, on a 3 to 8 second test window: the lights turned at 3, 6 and 8 seconds,
the take saved met with its time, SAME PROMPT showed the same question, and
the second sheet named the first take's numbers. No page errors. Not run with
a real voice.

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with a fake microphone (a
synthetic 33 s clip): take, coach, DRILL IT, the fix take linked by `from`,
BACK TO THE TAKE, FOCUS, Wrong dropping the call and saving `fb`; no page
errors, no sideways scroll. Every filler pattern, speeding up and crutch were
checked on seeded takes. The synthetic voice reads as stammered starts, so
the live ear's calls on a real voice are not known yet, and the fault weights
are a first guess to tune against his Right / Wrong marks.

From the brief, moved 2026-11-17:
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

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with a fake microphone: a 31 s
take saved a 140KB `tclip`, the moment buttons played and stopped on their
own, a tap three quarters along the strip played from there, pause worked,
the sheet reopened from the store played, Delete the recording removed it,
and with Record takes off nothing was kept. No page errors, every button 44px.
Not heard on the iPhone: whether Safari records AAC and plays it back from
the store is only proved on the phone.

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with a fake microphone and
seeded Todoist notes: today's Shoot question came first, a ticked one was
skipped, once answered the `Topic:` task came next, the take saved its
`answer` row, BANK listed it with two seeded answers, search filtered, COPY
put the words on the clipboard, EXPORT saved the Markdown file. No page
errors, no sideways scroll; review 197/197. The headless recogniser cannot
reach Google, so no real words were transcribed; real words only on his
devices.

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with a fake microphone and a
seeded `Other:` task: the subject read as productivity, the notes stayed off
the take screen and opened after it, the answer saved with `src: 'other'` and
its subject, BANK showed it. Review 197/197.

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with seeded `Ask:` notes, one of
each kind: the card first on TODAY; a chip tap saved the answer and ticked
the note, Ctrl+Z undid both; two Move up presses and LOCK saved the order;
SAVE stayed off until a bracket was picked; a note answered a free question;
BANK listed the three. No page errors, no sideways scroll.

From the brief, moved 2026-11-17:
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

## YOUR VOICE, added 2026-11-16 (SPEAK 1.0.17)
Watched 2026-11-16 in headless Chromium at 390: the empty state, then three
seeded takes showing every measure and the phrases, a pasted speaker as a
second column, COPY FOR CLAUDE. No page errors, no sideways scroll. Review
197/197. His real backup had 16 takes and no transcripts that day.

From the brief, moved 2026-11-17:
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
Watched 2026-11-16 in headless Chromium at 390 with a fake microphone and
Chromium's fake camera (no face in it): a FITNESS take turned the camera on,
saved a 377 KB video clip, the player showed and played it; `mouthOf` on made-up
frames found the right side leading at the made-up 2 s stretch; the coach named
it with that moment; Whole mouth's meter read mouth. No page errors.

From the brief, moved 2026-11-17:
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

## History, moved from the root brief on 2026-09-22
What was built and watched, newest last. Moved here verbatim so the root brief
stays small enough for per-module sessions.

SPEAK, built 2026-09-15 from `_template/`. Tom: "Speech improvement app to help me with YT and short form content", based on Duolingo, objective feedback, a guided game, daily warm-up drills, and every drill saying its goal and why. Five skills (PACE, CLEAN, FLOW, CLEAR, EYES) of five steps each, a step opening when the one before is met; three drills a day picked from the skills furthest from target; a three-step warm-up that sets the day's crispness reference; a streak with a silent freeze; no XP, no levels, no verdicts. The ear counts syllables after de Jong & Wempe, tuned on four clips with 97 counted syllables; pauses at 250ms; held sounds as the um proxy; a spectral-tilt proxy for crispness; pitch spread; the browser's own recogniser for words and crutch phrases where it exists and is switched on; Google's face landmarker for time on the lens, calibrated during the count. Driven in headless Chromium at 1280px and 390px with a fake microphone (a synthetic clip with known counts, read exactly) and a fake camera (a still face, read 100% on the lens). Tom, 2026-09-15, "make it local on my machine": the recogniser is the only thing that could send his voice out and it is off by default, so a take makes no network request at all and the page's only one is the fonts every app fetches. A drill whose goals need a switch that is off is left out of TODAY, drawn locked with the reason, offers the switch in one tap, and never blocks the step after it; a goal nothing could read says no reading, never not met. Not run on a phone, and no real voice has been through it. Has its own brief and a research file.

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

## Ending sounds and the marked teleprompter, 2026-11-17 (SPEAK 1.0.38)
Tom: *"a list of words that make me practice pronouncing the last syllable or consonant rather than having a speech"*, and the creator teleprompter *"that shows the script as you speak it, and then it shows how to intone and tempo"*. Three DRILL MENU drills (`LIB`, skill `clear`):

- **Ending sounds: words** (`lib-ends`, kind `ends`) and **in lines** (`lib-endlines`, kind `endlines`, `END_LINES` with `{target}` words). Every target is half of a pair in `END_PAIRS` whose dropped ending makes the other word (card, car), because Whisper and the browser guess the likely word and would hide a plain drop. `endScore` looks for each target in the next 8 words heard: the word is landed (1), its twin is dropped (0), neither is not heard (-1). A take keeps `endW {word: 1|0|-1}` and `m.ends` (% landed). The PC transcript lands later, so `hearTake` calls `endsApply`, which re-scores and patches the goal and pass. Missed words come back (`endOwed`: missed last time or the time before) until landed twice running; worked out from takes, never stored. The take sheet's box says what each drop came out as.
- **Teleprompter, marked** (`lib-prompter`, kind `prompter`, also every SCRIPT take shown in full). Marks in a script: `*hit*`, `/` pause, `//` long pause, `_slow_` (`parseMarks`; `stripMarks` for cue cards). It follows him by the ear's syllable count against the script's (`sylOf`), not a transcript, so it works in SPEAK.exe; a tap on a line moves the follow there (`mkTaps`). After the take `marksGrade` checks each pause mark against the ear's pauses (within 1.5 s, 0.25 s or 0.8 s long) and each slow part against his syllable rate (10% slower). Emphasis is shown, not measured. Kept as `mk` and `m.marks`. No script: a built-in marked sample (`PROMPT_SAMPLE`).
- **MARK IT FOR ME** in the script editor, SPEAK.exe only (`markScript`): Claude adds the marks; refused if any word changed.
- Watched in headless Chromium: the pairs scoring and a late transcript, the box, the owed list, marks grading on a made-up log, a live prompter take on the fake microphone following and taking a tap, the menu, 390 wide with no sideways scroll, no page errors. Not watched with his voice or in SPEAK.exe; the syllable follow's drift on a real read is unknown.

**The pile, not built yet**: per-sound scoring with a phoneme model or forced alignment (OpenPronounce, mcp-server-pronunciation, Montreal Forced Aligner; 1.0.39 only reads how sure Whisper was of each word), a pause countdown on the prompter (Storia), and the endings drill carried into free talk.

## Reminders before every take, 2026-11-17 (SPEAK 1.0.40)
Tom: reminders at the start "like to just slow down, breathe, let my words have space", then "make this intelligent ... reactive to my current biggest issues". The count-in shows up to three lines (`mindEl`): his biggest habits now (`mindRank`: every take's top three coach faults over the last 12 takes in 14 days, worse and newer counting more, kept only while the habit is in the last four takes, times 1.5 when the coming drill measures it), each with what to do (`MIND_FOR`, his rewording in `speak.mindTx`) and why ("Fillers, in 5 of your last 5 takes, and this drill measures it"). His calm lines (`speak.mind`, first three "Slow down." "Breathe in before the first word." "Let your words have space.") fill when fewer than three habits show. The count runs five instead of three while they show. Settings, REMINDERS: on or off, SHOWING NOW, his calm lines, every habit's words. Tested headless Chromium at 1280 and 390 on seeded takes, not with his voice.

## Replay marks, leaning words, shadowing, clear words, 2026-11-17 (SPEAK 1.0.39)
Tom asked whether SPEAK was the highest form it could be, then said "All" to the four picks. The take sheet already played the take back with ums and pauses on its strip; that was missed when the picks were written, and he was told.

- **The word clock.** SPEAK.exe's transcriber now returns every word with start, end and how sure it was (`desktop/SpeakRefine.cs` hear.py; `prob` added to CLIP's `tools/engine.py`). Kept on the take as `tw`: `[word, start in tenths of a second, end in tenths, sure in hundredths]`, 1,200 words at most so the row stays under 64KB. The browser's transcript has no clock, so none of the marks below exist in Chrome.
- **Replay marks** (`wordMarks`, `playerMarks`): ums, crutch phrases, dropped endings (an endings drill's `endW` 0 found as its twin) and unclear words go on the player's strip as lower-half ticks with their own key. PLAY EVERY MISTAKE plays each moment, 0.7 s before to 0.5 s after, merged where they touch, one after another. Pressing play or the strip stops the run.
- **Clear words** (`m.clear`, `clearPct`): the share of words Whisper was at least half sure of, from 20 words up. Unclear words are tappable chips under the strip. This is Whisper's sureness, not a per-sound score, and the screen says so. Tested on a Windows voice clip: "card" came back "cart" at 0.62.
- **Words you leaned on** (`leanList`, `leanBox`): a word from `LEAN` used 3 or more times in a take, or a phrase 2 or more, at least once a minute, or any run of 2 to 3 small words said 3 times; never one already on his crutch list. ADD TO CRUTCH LIST puts it there. Shows only when there is one.
- **Shadowing** (`lib-shadow`, CLEAR AND EXPRESSIVE): he picks a clip (audio or video, under 25 MB, the first 90 s used) in the drill sheet. Its pitch line is read by the same `Ear` as his voice and kept with the sound in one `smodel` row, padded past 64KB so it stays on the device, chosen by the `shadow` setting. The take plays it, draws the four seconds around now (theirs grey, his gold), stops 1.5 s after the clip ends, and scores `m.shadow`: the best correlation of his line against theirs with him 0 to 1.5 s behind. `take.sh` keeps both lines in tenths of a second so the sheet draws anywhere. The microphone has echo cancelling off, so the clip through speakers leaks into his line; earphones are asked for, and a near-perfect match with no lag is flagged as the clip heard.

Tested in headless Chromium with a faked SPEAK.exe and a made-up clip: marks, the run, the chips, the leaning box and its button, a live shadow take on the fake microphone, the sheet, 390 px with no overflow, no page errors. Not tested: his voice, a real clip, earphones, inside SPEAK.exe.

## TODAY'S PLAN, from the day before, 2026-11-17 (SPEAK 1.0.37)
Tom: *"At the end of the day I want Speak to analyze my takes for the day to create a smarter plan for tomorrow."*

- **One `splan` row per practice day** (dated the day it read, key `''`). `planRules`: the top fault of each take tallied, the fix drill of the top two, any step not met that day, the stage's next steps, Don't stop, three in all; a headline ("3 takes, 0 met. X came top in 3."), one cue for every take. Then in SPEAK.exe `planClaude` sends every take's numbers, faults and Claude's point with a list of allowed drill ids and keeps Claude's three (unknown ids dropped, filled from the rules' list), its headline and cue.
- **When it is made**: by itself at midnight while SPEAK is open (`Day.on`), on the first open after a practice day, again when that day gained takes, and by Claude the first time SPEAK.exe opens after a phone-only plan (`planCheck`). PLAN TOMORROW on the TODAY card makes it from today's takes now and opens it; once made it reads TOMORROW'S PLAN.
- **Where it shows**: TODAY'S DRILLS becomes TODAY'S PLAN with the plan's drills in order, each with its why; REMEMBER THIS TIME hides until the day's first take, since the plan carries the cue.
- **Right/Wrong** on the fault it names: Wrong makes the plan again without that fault (`no`).
- Watched in headless Chromium with three seeded takes and a fake Claude: the rules plan, Claude's plan (a bogus id dropped), Wrong remade it, PLAN TOMORROW, 390 wide no sideways scroll. Not watched inside SPEAK.exe with real Claude.

## DO THIS NEXT and SEND TO WRITE, 2026-11-16 (SPEAK 1.0.34)
Tom: *"I don't just want numbers and statistics. I want the best course of action given what I just outputted. It doesn't have to be every speak take. It can just give me a button with content or send to [WRITE's] inbox as a raw seed."*

- **DO THIS NEXT** at the top of every take's sheet (`doNext`), one verdict with its button, the numbers below: no transcript and the PC can write one, WRITE THE TRANSCRIPT; else the take reads like content (the content check, or coherence and concision both 4 or better), REFINE INTO CONTENT; else the weakest fault's drill, now ("Fix the weakest thing now: ..."); else Don't stop. It waits for the PC transcript and Claude's reading, and redraws when they land.
- **SEND TO WRITE AS A RAW SEED** beside it on any take with a transcript: marks the take `seed: 1, seedAt`. OUTER HEAVEN brings only marked takes into WRITE's Inbox as raw seeds.
- **The coach weighs ums by count as well as rate** (14 ums against 2 outranks 4 stammered starts), so the weakest fault matches what the numbers show.
- **How this was missed**: every test ran in headless Chromium with a fake transcript plugged in, never a real take inside SPEAK.exe, whose engine has no speech-to-text. Root brief, Known traps.

## The transcript on the PC, summary, weakest, retry, 2026-11-16 (SPEAK 1.0.33)
Tom: *"why was there no transcript? I also want to know which was my weakest metric ... a summary of what I said to be created as a draft to be added to data bank OR an option to retry the prompt WITHOUT losing my first entry."*

- **Why there was none**: SPEAK.exe runs the page in WebView2, which has no speech-to-text of its own (Chrome and Edge get it from an online service), so every take made in SPEAK.exe came back with no transcript and pace "estimated from syllables". The recogniser's error is now kept on the take as `asrErr`.
- **The fix** (`hearTake`, `desktop/SpeakRefine.cs` `Hear`): when a take ends with no transcript inside SPEAK.exe (`window.MB_HEAR`), its recording goes to SPEAK.exe (`mbhear:{id, ext, b64}`), which runs CLIP's transcriber (faster-whisper in `Downloads/CLIP/tools/venv`, `engine.transcribe(video, 'fast')`) and posts back the sentences. The take gets `tx`, `asr: 1`, `asrBy: 'pc'`, crutch phrases from `scan`, word count and pace from words; a bank answer for the take gets the words; then coherence, concision and filing run. An older take with a recording shows WRITE THE TRANSCRIPT ON THIS PC. Needs Record takes on (the default). Tested on Faizan Asif's video: every word came back.
- **Weakest this take** heads NEXT TIME: the coach's top fault and why.
- **SUMMARY**: Claude's reading (`judgeTake`) also writes 2 to 4 sentences of what he said (`judge.sum`), shown on the take with ADD TO KNOWLEDGE BANK; an answer in the bank gets it as `sum`.
- **RETRY, KEEP THIS ONE** (was SAME PROMPT): a new take on the same prompt; the first take and its answer stay.
- **QUESTIONS FOR YOU** hides a question once any copy of it is answered (matched by its words too) and shows each question once (`askKey`). Tom: "why is this still open I just answered it".

## What each number means, NEXT TIME and reminders, 2026-11-16 (SPEAK 1.0.32)
Tom: *"I have these numbers but I don't know what my metrics are or what I can do about them"*, "3 suggestions for drills", "reminders for the next time I do a speak entry".

- **Every reading on a take's sheet** (`readOf`) shows its target, met (green) or missed (amber), and when missed the one thing to do (`MEAN_FIX`). Targets: his TARGETS and the style's pace band; for counts with no target of his own, a coach's line (held sounds 2 or fewer, stammered starts 1 or fewer, sound share 80% or under, long pauses 2 or fewer, crutch phrases none).
- **NEXT TIME** under the numbers (`nextBoxFor`): the coach's top cues and three drills (`nextDrills`: the fix drills of the top faults, then Silence not um or Soft start when the counts call for them, then Land it no tag, Don't stop, Just a Minute).
- **The reminder** (`speak.remind`, written when a take finishes, `remindFrom`): REMEMBER THIS TIME on TODAY under the TODAY card, and the first cue on the count before every take. A take with no transcript adds "Transcript was off".

## CHECK THE COACH, added 2026-11-16 (SPEAK 1.0.30)
Proves the eye, mouth and crispness readings follow him before he trusts them. One minute, camera on, four parts of 15 s the screen names (`CHECK_PH`): NORMAL, LOOK AWAY, SIDE OF THE MOUTH, MUMBLE. Each part is measured on its own (`checkSnap`: on-the-lens share of that part's looks, `mouthOf` evenness, the ear's raw crispness from the part's start). A reading passes only if it moved the right way against NORMAL (`checkResult`): on the lens down 30 points or more looking away, evenness down 10 or more from one side, crispness 15% or more lower mumbling. Stored as a take of `lib-check` with `m: {check}`; the coach and FOCUS ignore it. Pressed from TODAY (CHECK THE COACH) or the DRILL MENU under EYES ON THE LENS. Headless Chromium's fake camera has no face, so eyes and mouth read "not measured" there and its constant tone fails crispness, as it should; only his own face and voice can pass it.

## Coherence and concision, added 2026-11-16 (SPEAK 1.0.29)
Claude in SPEAK.exe reads every take of 40 words or more (not warm-ups or fix drills) and scores coherence and concision 1 to 5, each with one line why quoting his words, and his main point in one sentence (`judgeTake`, stored on the take as `judge: {coh, cohWhy, con, conWhy, point, at}`). The take's sheet shows both beside the other numbers, waiting while Claude reads. At 2 or under the coach names `unclear` (fix: Point, reason, example) or `wordy` (fix: One sentence), and his Right/Wrong mark on that fault is how the reading is checked. A take made away from the PC is read the next time SPEAK.exe is open, one at a time.

## Desktop first, 2026-11-16 (SPEAK 1.0.27)
Tom: *"Is the speak exe different from speak in main menu? Because I want them to be the same ... speak will primarily be a desktop app."*

- **SPEAK.exe opens the whole app** in an ordinary, resizable window (about 1100 x 860, size and place kept in `speak-app.txt` as `full=`). The old always-on-top widget is **Mini widget** in the tray's menu (`mini=1`); the page's `mbsize:` messages only move the window in mini mode.
- **TODAY** opens with a TODAY card: TODAY'S TAKES (a sheet of today's takes, each opening its sheet), FREE SPEAK, DRILL MENU, and the **Camera** switch (`speak.camAll`, on by default). The same switch sits on every drill's sheet. In the widget, "N takes today" is a button to the same sheet.
- **ADD TO KNOWLEDGE BANK** under any take with a transcript that is not in the bank yet: an `answer` with `src: 'take'`, filed by `sortFree` like a free speak.
- **Two minutes at least**: SPEAK PRACTICE, the topics and FREE SPEAK keep STOP locked as KEEP GOING m:ss until TARGETS' shortest time, now 120 s (red light 180 s). Tom: "set a minimum speaking time of 2 minutes".
- **Pace targets for a direct speaker** (Tom's authority style, measured against Faizan Asif's 277 wpm and his own 141 to 165): Talking head 160 to 190, Short-form 170 to 200, Live 160 to 190. A band he saved in TARGETS still wins.

## SPEAK.exe: the tray, the mini widget and the full app, 2026-11-16 (SPEAK 1.0.31)
Tom: *"I want speak to auto start, and I want it to be a tray icon. And if I click the tray icon, I can have the four buttons always available. Just give it a complete settings menu for the mini widget and for the full EXE app."*

- **A tray icon first** (`desktop/SpeakApp.cs`, `App`). Start with Windows writes `SPEAK.exe --tray` to the Run key; with "Start in the tray" on, no window opens at boot. Opening SPEAK again (the desktop shortcut) signals the running copy, which opens the full app.
- **Two windows, one store**: the **mini widget** (`?widget=1`, the four stacked buttons, growing for a take and shrinking back) and the **full app**. A left click on the tray icon opens the widget by the tray (click again to tuck it away); the right-click menu has Mini widget, Open SPEAK, Free speak, Drill menu, Settings and Quit SPEAK.
- **PROGRAM** tab, first in SPEAK's Settings inside SPEAK.exe (`drawProgram`), in both windows: Start with Windows, Start in the tray, what a tray click opens (Mini widget or Full app), where the widget opens (by the tray or where it was left), widget on top, widget tucks away when clicking elsewhere, full app on top, and the full app's close button (into the tray or quit). The page posts `mbset:key=value`; the program saves `speak-app.txt` and tells every window (`{mb:'exe', cfg}`, `window.MB_EXE`).
- **The widget's top row** has today's takes, a button to the full app (`mbopen:full`) and Settings.
- A `SPEAK.lnk` on his desktop opens `desktop/SPEAK.exe`.

## DRILL MENU, added 2026-11-16 (SPEAK 1.0.26)
Tom: *"populate the drills menu ... and then I also want you to recommend the best drill for what I'm currently working on. And I also like the idea of not stopping."*

- **DRILL MENU** (`openMenu`), a button on PATH and under TODAY'S DRILLS: BEST FOR YOU NOW on top (`menuPick`: FOCUS's fix drill; else Land it, no tag when crutch phrases showed in his posts or takes this fortnight; else Don't stop), then every drill folded by what it works on (`MENU_GROUPS`, by skill). Picking one closes the menu and opens the drill.
- **Its own drills** (`LIB`, not on PATH's stages): Don't stop (Faizan Asif's daily rep, two minutes, no STOP, `noStop`), Just a Minute (the BBC game, 60 s, no silence, no repeats), Land it, no tag (a direct speaker's statement with no "right?", crutch 0), Pace ladder 160-180, 180-200, 200-220 (crutch 0 on each rung), One word per line (the actor's operative word, `STRESS_LINES`, pitch spread goal).
- **`noStop`**: the take's STOP is replaced by a disabled KEEP GOING; the take ends itself at its time. Back still cancels.

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

## Eye reading fixed, full app preloaded (1.0.46, 2026-11-17)
- Tom: "I don't think Speak is able to accurately measure how much eye contact I have with the camera." His only camera take (16 Nov, an `ask`) read 1% on the lens with a 30.6 s look away. Cause: the lens zone was read during the count, while the screen showed a big number and reminders to read, and before the face finder had loaded, so the zone was missing or taken from the screen. Now `lensLock` waits for the finder, shows only LOOK AT THE LENS at the top edge, and takes the median of 1.5 s of looks. No zone means "not measured", never a low number. [UNTESTED on his face: run Check the coach]
- SPEAK.exe builds the full app hidden at start (`PreloadFull`, `Warm`), so the mini widget's open-full button and the tray only show a page already loaded. [TESTED: log shows the full page loaded 2 s after a --tray start, before any click; a second start showed the window]
- 1.0.47, same day. Tom: "my webcam is often folded up, and I don't have enough time to get it fully in frame by the time I press speak ... in the first 10 seconds get the average of where I'm looking." The pre-take lock is gone. Each look keeps its raw direction; once the face has been seen 10 s the lens zone is their median, and every look from the start is judged against it. The live meter says `reading` until then. [TESTED with made-up looks: 80% on in the first 12 s with glances, 44% once 10 s on the screen followed. UNTESTED on his face]

## Faster bands, speed is earned (1.0.48, 2026-11-18)
- Tom picked raising the pace after the models were measured (RESEARCH.md, Measured models): Talking head and Live 175-205, Short-form 185-215. A band saved in TARGETS still wins (he had none).
- His worry, "ensures I don't pick up bad habits along the way": new fault `rushed`, Speed costing clarity. Past the band's first 15 wpm, a take whose crispness, fillers, stammered starts or mouth evenness missed target is told to hold the low end until clean; it outranks every pace fault, and its pre-take reminder is "Clean first, fast second". [TESTED on made-up takes: 200 wpm at 70% crispness named rushed first; the same at 95% named nothing]

## ASHA upgrades A-D (1.0.49, 2026-11-18)
Tom picked all four from the ASHA Practice Portal read (RESEARCH.md).
- A, fading: a drill met on 3 days before this take shows MET or NOT MET; the coach and numbers sit behind SHOW THE NUMBERS (`learnedDays`, `gate`). Mixing the drill order was not built.
- B, clear words a minute (`cwpm`, `cwpmOf`): sure words less fillers and stammered starts, a minute; needs SPEAK.exe's word clock. Joins the `rushed` slips below 85% of the pace.
- C, line ends (ear `fade`, `fadeShare`, `fadeAt`, `pauseCv`): a line is speech between 250 ms pauses, 0.8 s or more; its fade is the last 0.25 s under the rest in dB. Fault `fade` at 35%+ of lines, drills Land the ending (`fix-land`) and Fast with pauses (`fix-fastpause`); fading lines also count as a `rushed` slip.
- D, guess first: a fresh take asks CLEAN, OK or MESSY before anything shows; `guess` and `real` (from the coach's faults: none clean, 1-2 OK, 3+ messy) go on the take, with the match rate over the last 20. Posts against practice was already the Posted column in YOUR VOICE.
[TESTED headless Chromium: synthetic tone lines, 4 of 8 faded, read 50% and 10.5 dB; cwpm 157 on a worked case; guess hid the numbers, CLEAN revealed them and saved 3/3; three earlier met days put the numbers behind SHOW THE NUMBERS; no page errors. UNTESTED on his voice or inside SPEAK.exe]

## Camera off and listening while he talks, 2026-11-18 (SPEAK 1.0.51)

Tom: "I want a button that lets me disable the camera. Sometimes my webcam is off ... And why can't it start transcription in parallel with while I'm talking?"
- CAMERA OFF on the take's top bar (`camBtn`, `#tkCam`): the picture goes dark (the video track disabled, so the recording keeps going), this take's eyes and mouth are dropped, and `speak.cam` goes to 0 so every take after starts without the camera. CAMERA ON sets it back for the next take. The drill sheet's Camera switch now flips `speak.cam` too; it flipped `camAll`, which left the EYES drills, the fix drills and CHECK THE COACH opening the camera anyway.
- Live hearing (`liveHearStart`, `lhSend`, `liveHearEnd`, `mblive:` in `desktop/SpeakRefine.cs` `Live`): the transcriber starts with the take, so the model loads during the count; every 25 s the new recording chunks go over, appended to one file, and the piece up to the quietest moment in its last five seconds is written while he talks. STOP leaves only the last piece. A failed live run falls back to writing the whole file the old way; a cancelled take drops it.
[TESTED headless Chromium with the fake camera and a 75 s speech clip as the microphone, the page's real recorded chunks run through the same Python SPEAK.exe runs: CAMERA OFF darkened the track, the take saved cam 0 and no eye reading; one piece cut at 22.4 s, the transcript landed 1.1 s after STOP with 63 word times. The same clip written the old way took 7.2 s. SPEAK.exe compiled; not yet run inside SPEAK.exe or on his voice.]
