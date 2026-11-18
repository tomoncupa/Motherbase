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
| Fillers per 100 words | the same fillers over the transcript's words, beside the per-minute figure; um and uh also shown apart | Read against research bands, not his targets: under 2 clean, 2 to 6 normal unscripted speech, over 6 stands out (`RESEARCH.md` section 3). Only with a transcript |
| Crutch phrases | his list, whole-phrase matches in the transcript. The default list and the sounds are the suite's one list, `shared/fillers.json`, which CLIP and OUTER HEAVEN copy (2026-11-18). `right`, `like`, `so`, `okay`, `actually` count only at the edge of a chunk or beside a joining word | Marked in the transcript so he can see each one |
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

SPEAK PRACTICE (id `topics`, `TT`) is a window drill with Toastmasters lights from `ttMin` to `ttMax`; `?mini=1` opens its sheet. Takes keep `p` (the prompt) and `m.time`; RETRY reruns the same prompt and names the last take on it. (HISTORY.md: Toastmasters, added 2026-11-10)

## The coach, added 2026-11-16 (SPEAK 1.0.10)

Every take's sheet opens on the one fault that cost the most (`coach(t)`, from `ev`), a fix and a drill one step past this take, with Right/Wrong (`fb`); Wrong drops it from FOCUS. Fix drills (`FIXES`, `fix-…`) count their one fault live and never count in TODAY'S DRILLS or steps. (HISTORY.md: The coach, added 2026-11-16 (SPEAK 1.0.10))

## The program, added 2026-11-16 (SPEAK 1.0.11)

Five stages (`STAGES`): VOICE, FLUENCY, MESSAGE, CRAFT, THE TALK. TODAY offers drills only up to `curStage`, plus review; every step stays startable. Passes are by drill id, so reordering steps loses no one a pass. Transcript-only numbers are null without a transcript. (HISTORY.md: The program, added 2026-11-16 (SPEAK 1.0.11))

## Hearing the feedback, added 2026-11-16 (SPEAK 1.0.12)

The coach's strip is the take's player; each fault carries up to six moments (`at`) that play 1.5 s either side. A crutch phrase placed without a word clock is labelled "about". (HISTORY.md: Hearing the feedback, added 2026-11-16 (SPEAK 1.0.12))

## FITNESS TOPIC and the fitness bank, added 2026-11-16 (SPEAK 1.0.13)

FITNESS TOPIC (`FT`, `forceAsr`) takes prompts in order `Shoot:` task, `Topic:` task, Skool term, viewer question (`fitPrompt`). Each answer is an `answer` row under 64KB so it syncs and reaches the sheet; the recording stays on the device. The transcript is on by default. (HISTORY.md: FITNESS TOPIC and the fitness bank, added 2026-11-16 (SPEAK 1.0.13))

## SPEAK PRACTICE, OTHER TOPIC and compare your answer, added 2026-11-16 (SPEAK 1.0.14)

OTHER TOPIC (`OT`) is FITNESS TOPIC with `Other:` tasks then `OTHER_QS`, answers carrying `subj`. A Todoist prompt's description is kept as `p.notes` and shown only after the take, under COMPARE YOUR ANSWER, never during it. (HISTORY.md: SPEAK PRACTICE, OTHER TOPIC and compare your answer, added 2026-11-16 (SPEAK 1.0.14))

## QUESTIONS FOR YOU, added 2026-11-16 (SPEAK 1.0.15)

Any producer asks Tom through a Todoist `Ask:` task with an optional fenced `ask` JSON block; SPEAK shows it first on TODAY and writes an `ask` row on answer, ticking the note, with UNDO. "Recommended" is written under an option, never a gold fill. Filing to `dest` is Claude's, from the nightly backup. (HISTORY.md: QUESTIONS FOR YOU, added 2026-11-16 (SPEAK 1.0.15))

## Detailed questions, TALK and START IN CLAUDE, 2026-11-17 (SPEAK 1.0.43)

Tom: "I have to know why we're doing what we're doing, how we're doing it, what to avoid ... which links are linear and dependent and which ones run in parallel. What buttons to start the task in Claude." The `ask` block also carries `why`, `how`, `avoid` (text or a list), `waitsOn`, `holdsUp`, `alongside` (lists of other questions' words or steps) and `start` `{folder, prompt}`. `askDetail` draws WHY, HOW, AVOID and LINKS as their own blocks, two across from 900px; an old ask shows `context` as WHY. A link naming another open question opens it. Every kind has an answer box with TALK (`askMic`): inside SPEAK.exe the `mbhear:` path (CLIP's faster-whisper), in a browser the browser's recogniser, hidden where neither exists. START IN CLAUDE (`askStart`) opens `claude://code/new?q=&folder=` with the task, his answer and the question; he presses send. OUTER HEAVEN's QUESTIONS tab answers the same notes through the inbox (`ask` rows). Tested in headless Chromium at 390 and 1280; TALK tested with a spoken WAV through CLIP's real transcriber with the page's `mbhear:` message routed to the same script SPEAK.exe runs, not inside SPEAK.exe itself.

## A spoken answer is the answer, 2026-11-17 (SPEAK 1.0.45)

Tom: "why is it asking me about 2-minute rests? I believe I answered that in Speak yesterday. Integrate better." His 137 s SPEAK IT take had words only once the PC transcript landed, and a pick question waited for a tap. Now any take on a question with words answers it, any kind (`by: 'voice'`, `answer` the transcript); `askFromTakes` runs on open and whenever `hearTake` lands a transcript on an ask take. OUTER HEAVEN's `asks._answered` counts the same take, so it hides there before SPEAK opens.

## The widget's three buttons, 2026-11-16 (SPEAK 1.0.16)

The widget's buttons start their drill straight away through `drillById` (`data-d`). (HISTORY.md: The widget's three buttons, 2026-11-16 (SPEAK 1.0.16))

## YOUR VOICE, added 2026-11-16 (SPEAK 1.0.17)

YOUR VOICE (`drawVoice`, `voiceOf`) profiles how he talks from every take's `tx`, beside `speaker` rows he adds; COPY FOR CLAUDE feeds `tom-context/voice-spoken.md`. Use the one `wordsOf`; a second definition stopped the page loading. (HISTORY.md: YOUR VOICE, added 2026-11-16 (SPEAK 1.0.17))

## The camera: mouth, video, every take, 2026-11-16 (SPEAK 1.0.18)

The camera is on for every take (`speak.camAll`) and reads eyes and mouth (`mouthOf`, target `mouthEven` 85, a guess not watched on a real face). With the camera on the recording is video, same device-only `tclip`. A `Speaker: <name>` Todoist task is a speaker found by Claude. (HISTORY.md: The camera: mouth, video, every take, 2026-11-16 (SPEAK 1.0.18))

## Possible content and refining, added 2026-11-16 (SPEAK 1.0.19)

REFINE INTO CONTENT makes a `draft` row only when pressed; versions capped at 12 so it syncs, his typing never overwrites a Claude version, nothing is deleted. Claude refines only inside SPEAK.exe (`desktop/SpeakRefine.cs`, `window.MB_REFINE`). OUTER HEAVEN reads drafts from the nightly backup. (HISTORY.md: Possible content and refining, added 2026-11-16 (SPEAK 1.0.19))

## FREE SPEAK and jumping off points, added 2026-11-16 (SPEAK 1.0.20)

FREE SPEAK (`FS`) has no goals, stops at 15 minutes, and saves an `answer` with `src: 'free'`. In SPEAK.exe `sortFree` files each one (subject, title) and makes up to three jumping off points as `topic` rows `kind: 'jump'`, keyed the same on every device, of kinds link, ask, thread, push and gap, drawn from the banks (`bankPool`, never Skool). WHAT NEXT ends each free speak's sheet. (HISTORY.md: FREE SPEAK and jumping off points, added 2026-11-16 (SPEAK 1.0.20))

## Alice's questions, 2026-11-17 (SPEAK 1.0.44)

OUTER HEAVEN's Alice writes one newsletter question a night as a `topic` jump (`how: 'alice'`, key `alice-<date>`, `from: 'Alice: newsletter question'`) through the inbox; FREE SPEAK lists it as "From Alice: newsletter question", and taking it is any other jump (answer `how: 'alice'`, no parent). The inbox lets in only `topic` rows with `how: 'alice'`, `kind: 'jump'` and an `alice-` key, stores them undated and merges them, so `used` survives the same file next night. Tested in headless Chromium through `tools/backup.html` and the sheet; no real take was spoken on one.

## From your posts and drafts made, added 2026-11-16 (SPEAK 1.0.25)

`postspeech` rows are read as takes of `post-story` and `post-reel` for the coach, FOCUS and FROM YOUR POSTS, never in drills, steps or PROGRESS. `draftmade` marks a draft done (`doneBy: 'post'`) and undoes that if the row goes; a MADE IT press stays. (HISTORY.md: From your posts and drafts made, added 2026-11-16 (SPEAK 1.0.25))

## Ending sounds and the marked teleprompter, 2026-11-17 (SPEAK 1.0.38)

Endings are tested only with minimal pairs (`END_PAIRS`), since a transcriber hides a plain drop; `endScore` keeps `endW` and `m.ends`, re-scored when the PC transcript lands. The teleprompter follows by syllables (`sylOf`), marks are `*hit*` `/` `//` `_slow_`; pauses and slow parts are graded, emphasis is not. MARK IT FOR ME may not change a word. Not built yet: per-sound scoring, a pause countdown, endings in free talk. (HISTORY.md: Ending sounds and the marked teleprompter, 2026-11-17 (SPEAK 1.0.38))

## Reminders before every take, 2026-11-17 (SPEAK 1.0.40)

The count-in shows up to three reminders from his biggest current habits (`mindRank`, his takes, never a fixed list), each with why, filled by his calm lines (`speak.mind`); every word is his to change (`speak.mindTx`, Settings, REMINDERS). (HISTORY.md: Reminders before every take, 2026-11-17 (SPEAK 1.0.40))

## Replay marks, leaning words, shadowing, clear words, 2026-11-17 (SPEAK 1.0.39)

SPEAK.exe's whisper gives a word clock (`tw`), which drives the replay marks, PLAY EVERY MISTAKE and Clear words (`m.clear`, Whisper's sureness, said on screen to be no per-sound score); none exist in Chrome. Words you leaned on never repeats his crutch list. Shadowing keeps the clip on the device (`smodel`, padded) and both pitch lines on the take (`sh`); a zero-lag near-perfect match is flagged as the clip heard. (HISTORY.md: Replay marks, leaning words, shadowing, clear words, 2026-11-17 (SPEAK 1.0.39))

## TODAY'S PLAN, from the day before, 2026-11-17 (SPEAK 1.0.37)

One `splan` row per practice day, made by rules then by Claude in SPEAK.exe (unknown drill ids dropped); TODAY'S PLAN shows its drills with why. Wrong on its fault remakes it without that fault (`no`). (HISTORY.md: TODAY'S PLAN, from the day before, 2026-11-17 (SPEAK 1.0.37))

## DO THIS NEXT and SEND TO WRITE, 2026-11-16 (SPEAK 1.0.34)

Every take's sheet leads with one DO THIS NEXT verdict and button (`doNext`). SEND TO WRITE marks a take `seed`; OUTER HEAVEN brings in only marked takes. Test real takes inside SPEAK.exe, never only with a fake transcript. (HISTORY.md: DO THIS NEXT and SEND TO WRITE, 2026-11-16 (SPEAK 1.0.34))

## The transcript on the PC, summary, weakest, retry, 2026-11-16 (SPEAK 1.0.33)

WebView2 has no speech-to-text, so inside SPEAK.exe a take with no transcript goes to CLIP's faster-whisper (`hearTake`, `window.MB_HEAR`) and comes back as `tx`, `asrBy: 'pc'`; this needs Record takes on. RETRY keeps the first take. QUESTIONS FOR YOU hides a question once any copy is answered (`askKey`). (HISTORY.md: The transcript on the PC, summary, weakest, retry, 2026-11-16 (SPEAK 1.0.33))

## What each number means, NEXT TIME and reminders, 2026-11-16 (SPEAK 1.0.32)

Every reading shows its target, met or missed, and the one thing to do (`readOf`, `MEAN_FIX`). NEXT TIME gives cues and three drills (`nextDrills`); `speak.remind` carries a cue to the next take. (HISTORY.md: What each number means, NEXT TIME and reminders, 2026-11-16 (SPEAK 1.0.32))

## CHECK THE COACH, added 2026-11-16 (SPEAK 1.0.30)

CHECK THE COACH (`lib-check`) passes a reading only if it moved the right way against NORMAL; the coach and FOCUS ignore it. Only his own face and voice can pass it. (HISTORY.md: CHECK THE COACH, added 2026-11-16 (SPEAK 1.0.30))

## Coherence and concision, added 2026-11-16 (SPEAK 1.0.29)

Claude in SPEAK.exe scores takes of 40+ words for coherence and concision 1 to 5 with a quoted why (`judgeTake`, `judge`); 2 or under names `unclear` or `wordy`, checked by his Right/Wrong. (HISTORY.md: Coherence and concision, added 2026-11-16 (SPEAK 1.0.29))

## Desktop first, 2026-11-16 (SPEAK 1.0.27)

SPEAK.exe opens the whole app; the mini widget is a tray choice. SPEAK PRACTICE, topics and FREE SPEAK lock STOP until two minutes. Pace bands are a direct speaker's (160 to 190 talking head); a band he saved wins. (HISTORY.md: Desktop first, 2026-11-16 (SPEAK 1.0.27))

## SPEAK.exe: the tray, the mini widget and the full app, 2026-11-16 (SPEAK 1.0.31)

SPEAK.exe lives in the tray with two windows on one store; its PROGRAM settings post `mbset:` and are saved in `speak-app.txt`. (HISTORY.md: SPEAK.exe: the tray, the mini widget and the full app, 2026-11-16 (SPEAK 1.0.31))

## DRILL MENU, added 2026-11-16 (SPEAK 1.0.26)

DRILL MENU (`openMenu`) puts BEST FOR YOU NOW first (`menuPick`), then every drill by skill (`MENU_GROUPS`). `LIB` drills sit off the stages; `noStop` drills end themselves. (HISTORY.md: DRILL MENU, added 2026-11-16 (SPEAK 1.0.26))

## Storytelling, 2026-11-17 (SPEAK 1.0.41)

Tom: "can it also guide me towards being a better storyteller", then "A B C", and the prompts "designed in such a way so that I don't directly think about this and more like it happens naturally". Matthew Dicks's Storyworthy: a story is a five-second moment where something changed in you; start far from it, say the stakes early, end on the change.

- **Nothing asks him for a story.** `judgeTake` also asks Claude for up to two `stories` in any take of 40+ words that is not itself a telling; each becomes a `story` row keyed by its take, kept once. TODAY'S QUESTION (`DQ`, drill `daily`, `STORY_QS`, one a day by the date, skipping answered ones) is an everyday question whose answer goes to the bank as `src: 'daily'`; the word story is never in it.
- **YOUR STORIES** on BANK, least told first: TELL ONE, ADD ONE, a sheet per story (the moment, a way in, where it came from, every telling with its four parts), TELL IT (`lib-tell`), IN 60 SECONDS (`story-60`), NOT A STORY (`gone`, UNDO). A story drill's prompt is one of his stories 70% of the time (`storyNext`); a take on one keeps `p.story`.
- **The story judge**: a story take (`isStoryTake`) is read on four parts, each 1 to 5 with a quoted why (`judge.st`: moment, stakes, scene, end), shown on its sheet. Two or under is a coach fault (`ST_FAULT`: `st-moment`, `st-stakes`, `st-scene`, `st-end`), so FOCUS, the plan and the reminders (`MIND_FOR`) carry it; the reminders boost it before a story drill.
- **One system** (SPEAK 1.0.42, Tom: "everything is one cohesive system?"): Claude in SPEAK.exe also reads every RAMBLES piece and graded post (`kpiece`, `storyScan`), newest first, one at a time, and keeps their stories with `fromKind`; each piece read leaves a `st-<piece key>-scan` marker row, the same key on every device. Every finder is handed the titles already kept so a story told twice is kept once. OUTER HEAVEN reads `story` rows as post ideas (its own session, 2026-11-17).
- **Fix drills** `fix-st-moment`, `fix-st-stakes`, `fix-st-scene`, `fix-st-end` retell the story they came from, and unlike other fixes are judged again.
- Tested in headless Chromium at 1280 and 390 with a fake Claude: a story found in a free speak, a telling judged, the coach and reminders naming `st-stakes`, both sheets, BANK, a live TODAY'S QUESTION take on the fake microphone, no sideways scroll, no page errors. Not tested with his voice or real Claude; how well Claude spots his stories is unknown.

## Camera off, live transcript, mixed order, 2026-11-18 (SPEAK 1.0.51, 1.0.52)

CAMERA OFF on the take's top bar (`camBtn`) darkens the video track, drops that take's eyes and mouth and sets `speak.cam` 0; the drill sheet's Camera switch is `speak.cam` too, never `camAll`. In SPEAK.exe the transcript is written while he talks (`liveHearStart`, `mblive:`, `Refine.Live`): pieces cut at quiet moments every 25 s, the last piece at STOP, the whole take the old way if the live run fails. Learned steps (met on 3 days) come after unlearned ones in a date-seeded order (`mixLearned`). (HISTORY.md: Camera off and listening while he talks; Mixed order once learned)

## Each drill has its own rubric, 2026-11-18 (SPEAK 1.0.53)

Tom: "It's like going for a lift and then comparing it to my 5K record." A drill is graded only on its skill's metrics (`RUBRIC`, `rubricOf`) plus whatever its goals name: PACE on pace, clear words and pauses; CLEAN on fillers and crutch phrases; FLOW on silences, restarts and talk share; CLEAR on crispness, pitch, fades, mouth and endings; EYES on the lens; SHAPE on time and Claude's coherence and concision; STORY on time and the four story parts; DEVICES and SCRIPT on their own goals. `coach()` drops every other fault, so FOCUS, the plan, the guess (`realOf`) and the reminders follow, and "speed costing clarity" quotes only slips in the rubric. The sheet folds the rest under ALSO MEASURED, NOT GRADED IN THIS DRILL; BEFORE YOU LOOK asks the drill's own question; DO THIS NEXT says Met with the next step, Go again, or the drill's own fault, never REFINE INTO CONTENT unless the drill grades coherence or a story. Normal takes (Speak practice, the topic questions, free speak, today's question, posts) have no rubric and are graded on everything. Tested in headless Chromium at 1280 with made-up takes; not on a real take.

## Needs from the foundation

- A device-only row type: one `Rec` would keep and back up but live sync
  would never send. SPEAK pads `tclip` past 64KB to get that today.

## The widget, added 2026-11-10

`?widget=1` shows only the widget; the page sizes SPEAK.exe's window by `mbsize:` messages, shrinking only after 1.2 s with nothing open so it does not flicker. (HISTORY.md: The widget, added 2026-11-10)

## History, moved from the root brief on 2026-09-22

Moved to HISTORY.md (HISTORY.md: History, moved from the root brief on 2026-09-22).
