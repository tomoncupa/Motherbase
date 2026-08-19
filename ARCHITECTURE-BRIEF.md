# Brief — shared foundation before any app rebuild

Captured 2026-08-19, verbatim from Tom. Architecture doc first, no app features.

Apps in scope: Daily Quest OS, BLOCK, ARC, future tools. Today they are standalone
HTML/JS with independent localStorage and overlapping data — BLOCK's schedule and
Daily Quest OS's day log both need to agree on whether "Morning Run" got done today.

**Deliverable: a written architecture doc, not code, to review and approve before
anything is built. Flag every assumption so it can be corrected before it becomes
20 files built on a wrong premise.**

1. **Shared identity layer** — one auth system, one user identity, all apps. Must
   support phone/SMS auth, not just email: end users include non-technical, older,
   less tech-literate people who do not reliably check email or find magic links.
   Recommend a specific backend and justify it against *that* constraint, not generically.

2. **Shared data vocabulary** — a canonical way to name/identify activities or
   entities that several apps reference (a workout, a habit, a scheduled block), so
   two apps calling the same thing by the same name are *provably* the same record,
   not just similarly named. Propose the ID convention (slugs, UUIDs, canonical
   registry — my call, but justified). Explain how an app built in 6 months plugs in
   without renegotiating the schema.

3. **Ownership and conflict rules** — for anything writable by more than one app
   ("did the user complete this today"), name the source of truth and how others
   read/subscribe instead of keeping their own copy. Define conflicting-write
   behaviour: last-write-wins or something more deliberate.

4. **Sync model** — real-time cross-app sync where it matters (tick a habit in one
   app, it shows in another with no manual refresh) vs where eventual/manual is fine.
   Offline: keep functioning locally and reconcile later, or require connectivity?

5. **Hosting and auth boundaries** — all apps static HTML/JS, no dedicated app
   servers, GitHub Pages or equivalent free static hosting. Discovered via links
   inside a Skool community; Skool does not host them and does not provide identity.
   Assume Skool membership and app identity are separate unless there is a specific
   reason to unify. Some apps (Daily Quest OS) may stay single-user/personal; others
   (BLOCK) will be used by many community members — **ask which are personal-only vs
   multi-user if it changes the recommendation, rather than assuming.**

6. **Migration path** — Daily Quest OS has a working localStorage + Supabase sync
   implementation being rebuilt from scratch: clean slate, no back-compat. BLOCK is a
   standalone HTML file, localStorage only, opened from Downloads, no backend. Propose
   the build order — shared backend first, then which app first, and why.
