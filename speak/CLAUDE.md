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

**Never:** a verdict. It counts, shows the target, and says met or not met
against a target he can change. No praise, no score, no XP, no levels (root
brief, behaviour rules). A drill's WHY is the one place the app explains
itself, because he asked for the reason, and each one is a sentence with a
source in `RESEARCH.md`.

**Device:** everywhere. A take is made wherever the camera is: a phone propped
up, or a laptop at a desk. Built to the phone rules.

**Tom only.** Flagged `mine` on the home screen, behind the line, and dropped
from the client build. Nothing in it assumes Tom, so it can be given to
clients later by removing it from `DROP_APPS` and adding it to `COPY_DIRS`.

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
browser's own recogniser, which sends the sound to Apple or Google. The face
finder is about 15MB fetched once and kept in the browser's cache, the way
CHECK IN keeps its body finder. Everything else works offline, and the drills
run without either: a take then says which numbers were not measured.

**Nothing is recorded.** The microphone feeds the ear and is dropped. The
transcript, when on, is kept on the take, capped at 4,000 characters.

## Rows

| Type | Date | Key | Payload |
|---|---|---|---|
| `take` | day | timestamp id | `{drill, skill, style, dur, m, goals, pass, asr, cam, tx, hits, prompt, at}`. `m` is every number above; `goals` is each goal as it stood, with `got` and `ok`. The warm-up is one `take` a day with `drill: 'warm'`, `steps` and `m.hiss`, `m.pitch`, `m.crispRaw`, merged as each step finishes |
| `topic` | — | id | `{text, kind}`. His own prompts: `topic`, `story`, or `bullets` split with `\|` |
| `tick` | day | `speak` | written once a day when a take is saved, so BLOCK and the home screen see it |

Settings under `speak.`: `tgt` (the targets and per-style bands), `crutch`
(his phrase list; null means the default list), `asr`, `lang`, `cam`, `facing`,
`beat`, and `open` (steps opened by hand).

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
