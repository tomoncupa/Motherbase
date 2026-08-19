# SHARED — the foundation (CLAUDE.md)

Governs `shared/` only. The repo-root `CLAUDE.md` governs everything else and
still applies here.

**Every app depends on these seven files.** A mistake in an app breaks one app. A
mistake here breaks all of them and can lose data. Work slowly.

## The one-session rule

Only one conversation touches this folder at a time, and it does not touch
anything else. App conversations read these files and never edit them. If you find
uncommitted changes in here that you did not make, stop and say so.

After any change in this folder, tell Tom to restart his app conversations. They
are holding a stale copy of whatever you just changed.

## What each file is for

| File | Job | Care level |
|---|---|---|
| `records.js` | The store. Rows, merge, subscriptions. | Highest. Holds his history. |
| `day.js` | One definition of "today" for the whole suite. | High. Everything dates through it. |
| `skins.js` `skins.json` | Themes, and the colour layer on top. | Medium. Cosmetic but wide. |
| `sound.js` | Sound themes and instruments, synthesised. | Low. |
| `ui.js` | Toasts, dialogs, menus, the Settings panel. | Medium. |
| `io.js` | Backup, restore, spreadsheet export. | High. It is the safety net. |
| `health.js` | Answers "is my data okay". | Low. |
| `_smoke.html` | 35 checks over all of it. | Run it every time. |

## Rules

1. **Never break the API an app already calls.** Add, do not rename. Three apps
   plus the kernel are calling into these.
2. **`records.js` is append-thinking.** Rows are addressable and merge by
   `updated_at`. Any change that makes state whole-document again is wrong,
   whatever it saves in code.
3. **Plain `<script src>` only.** No modules, no imports, no build step. It has to
   work opened from a folder.
4. **Every colour is a token.** No hex in `ui.js`, ever. Use the skin tokens with a
   fallback so the file works before a skin is applied.
5. **`_smoke.html` must pass before you commit.** Add checks when you add
   behaviour; the count only goes up.
6. **The kernel is copied into three apps.** Edit the copy in the root
   `index.html`, then run the sync script, which asserts all copies are identical.
   Never hand-edit a copy.

## Testing

```
py -3 -m http.server 8777 -d "C:\Users\user\Downloads\Claude Code"
```

Then open `http://127.0.0.1:8777/shared/_smoke.html` in a browser and read the
result. Drive the real apps too: a green smoke test does not prove the apps still
work. Clean up any test data you write, and stop the server when you are done.

`node` is not installed here. Do not reach for it.

## Where the bodies are buried

- A literal closing script tag inside inline code ends the script element, even
  inside a comment. It has already silently truncated three apps.
- Anything flagged `custom` passed to `Skins.apply` is persisted, so a live preview
  must not be flagged custom.
- An app that computes its own "today" will disagree with `day.js` between midnight
  and the day-start hour. BLOCK did exactly that.
- `localStorage` is roughly 5MB. `health.js` warns at 3MB. Rows are small but the
  tick log only grows.
