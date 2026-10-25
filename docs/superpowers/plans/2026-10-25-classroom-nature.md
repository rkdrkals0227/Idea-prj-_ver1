# Classroom, storybook and natural village Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans for inline execution. User delegates reasonable details and requests immediate implementation; no design approval pause.

**Goal:** Natural terrain, lake storybook, actual September classroom rules with typing, expanded tactile route, Korean real-time day/night, quiet current-only HUD and visible active play time.
**Architecture:** Keep Vite/Three and stable save/quest IDs. New focused modules for classroom rules, activity/day-time logic, natural scenery and illustrated storybook. Preserve teacher custom content and completed levels.
**Tech Stack:** existing pinned Three0.180.0/Vite7.1.12; no new paid services/dependencies.
**Spec:** User's seven numbered requirements in this turn.

## Global Constraints
- Four provided rule texts verbatim, September only (no invented date/year). Distinguish actual class rules from example community agendas.
- Rule answer normalization tolerates whitespace/punctuation/IME composition, never skips missing words.
- Day/night follows Asia/Seoul device time; foreground game activity time persists locally, no automatic student/server tracking.
- Story is explicitly a supplied legend; existing sequential reading and quiz gates/rewards remain.
- Only current quest on normal HUD; other levels/stamps accessible in overview; tools collapse behind one button.
- Keep 3 NPCs, uploaded buildings/props, images/blobs, existing progress and custom content.

## Review Focus
- Old completed saves remain completed; new players must type all four rules before first plan/check.
- Editing a rule invalidates only its former copy; Han IME keys never move player.
- Background/blur/reload must not add idle time; storage errors use existing recovery.
- Old/custom 5-tile teacher puzzle stays supported; new default route has turns, correct orientations and connected cells.
- Night remains readable and school stays warmly lit; lake click is gated until level3.

### Task 1: class rules + time logic
- [x] Add failing Node tests for rules/copy validation and timezone/activity accumulation.
- [x] Implement data/class-rules.js, classroom.js, experience.js; extend journey/storage/content migration.
- [x] Run unit suite green; preserve old completed progress.
### Task 2: playable learning interfaces
- [x] Add browser tests for typed rules/IME lock, lake book gates, current-only HUD/tool menu, extended route wrong/right completion and timer restoration.
- [x] Rewrite school modal with chalkboard and inline copy fields; preserve weekly plan/check/reflection and teacher editing.
- [x] Add illustrated book pages to existing legend reading flow; clickable lake opens book, turtle retains care menu.
- [x] Expand tactile default to connected multi-row U route; support legacy teacher solutions.
### Task 3: world presentation
- [x] Add natural terrain canvas texture, irregular paths and meandering river; remove repeated ground/water GLB grid while keeping uploaded props/buildings.
- [x] Decorate school with illustrated board, desks/chairs/windows/books; keep entry/exit accessible.
- [x] Apply minute-updated real Korean day/night with warm indoor lighting and readable night.
- [x] Collapse tools and show one current objective; add foreground session/total activity time.
### Task 4: verify and publish
- [x] Run Node suite, new browser flows and affected full journey/model regression; inspect day/night/school screenshots.
- [x] Build, static subpath smoke check, update README/VALIDATION and push main/gh-pages under standing authorization.

## Progress ledger
- Task1: unit33/33 passed. Actual rule data, whitespace-aware copying, old completed progress, Seoul time and foreground accumulation implemented.
- Task2/3: new browser four flows verified (school typing/IME/save restore; clickable lake/book/quiz; multirow route validation; tools/night/time restore). First concurrent-edit run had two HMR reload/module-state failures, source-frozen rerun2/2 passed. Avoid source edits during browser runs.
- Final review found: unvalidated route style dimensions, over-broad legacy route migration, and existing partially-read school fieldset remaining disabled after new copies. All three enter one regression fix pass.

- Review fix pass: route validator rejects injected style values and malformed grids; migration compares exact old solution as well as text; final copied rule immediately enables existing read-only plan form. Unit35/35 green and partial-save browser RED→GREEN confirmed. No deferred review findings.

- Task4: related browser12 flows green across selected runs and documented retries; actual native tab focus pause and total restoration verified. Build green; no unresolved review findings. Preparing visual/static publication check.

- Task4 complete: screenshots inspected (night in low quality due software-capture artifact), static subpath HTTP200/model25x200/E school/errors0. Source unchanged since validated build; publishing under existing GitHub authorization.
