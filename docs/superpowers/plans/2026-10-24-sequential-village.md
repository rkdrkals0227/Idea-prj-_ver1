# Sequential Village Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Four ordered levels, physical signs and introductions, active destination lighting, weekly reflection and Namgang ecological exhibits.
**Architecture:** A pure journey module owns progression and permissions; main.js routes all entry points through it. World consumes the current objective and renders signs/light/exhibits; IndexedDB work metadata gains a protection pledge.
**Tech Stack:** Existing pinned Three.js 0.180.0, Vite, Node test runner and Playwright.
**Spec:** docs/superpowers/specs/2026-10-24-sequential-village-design.md

## Global Constraints
- Existing checkout; isolated cloud workspace; no additional worktree.
- Preserve existing local state, teacher wording and image blobs.
- Korean UI, physical keyboard support, no inferred actual animal habitat.
- Current destination blinks only with motion enabled; locking applies beyond button visibility.
- Three stamps now come from road, legend and Namgang exhibition.

## Review Focus
- Old saves must not bypass school or lose work (Task 1 migration tests).
- Menus/file input/import must not bypass level gates (Task 2/4 UI tests).
- Week rollover must not relock completed school (Task 1 date tests).
- Reduced motion must keep a visible steady objective (Task 3 WebGL tests).
- Deleted exhibits and imported work must not silently award completion (Task 4 save tests).

### Task 1: Journey state and guarded progression
**Files:** src/journey.js, src/logic.js, src/storage.js, src/guardian.js; tests/journey.test.js, tests/logic.test.js.
**Interfaces:** initialJourney(); journeyLevel(state):1..5; canEnterLevel(state,n); markBriefingRead(state); saveSchoolPlan(state,plan,content); saveWeeklyCheck(state,date,entry,now); registerExhibit(state,work); reconcileExhibits(state,works).
- [x] Add a failing regression: reading every legend page cannot award its stamp before school/road.
- [x] Run npm test; verify RED because current legend permits the award.
- [x] Implement pure sequential state and migrations; test calendar rollover, gated registration and invalid pledges.
- [x] Run npm test; require a green suite.
- [x] Commit the validated state changes.

### Task 2: School and unified interaction gates
**Files:** src/school.js, src/main.js, src/data/residents.js; tests/browser/game.spec.js.
**Interfaces:** school UI receives state/content/open/persist; route gate checks 1..4; NPC introductions recorded only after a permitted first conversation.
- [x] Write failing browser cases for early NPC/legend/upload access and school briefing/weekly check.
- [x] Observe RED; implement school weekly UI, level menu, first conversations and consistent routing.
- [x] Keep teacher settings and existing portfolio access; editing/publication requires level 4.
- [x] Run relevant browser tests and commit passing changes.

### Task 3: Physical signage and active objective
**Files:** src/world.js, src/style.css; browser tests.
**Interfaces:** setObjective({id,x,z}); updateObjective(); existing entity IDs remain stable.
- [x] Test absence of NPC name sprites and presence of physical building signs.
- [x] Test current objective changes from school to path to NPC to exhibition and reduced motion stays steady.
- [x] Replace world labels, add objective lighting and Namgang exhibition fixtures.
- [x] Run browser checks and commit passing changes.

### Task 4: Pledged artwork and Namgang exhibition
**Files:** src/editor.js, src/storage.js, src/main.js, src/world.js, src/data/content.js, src/data/guardian.js; tests/browser/game.spec.js.
**Interfaces:** work.protection:string; work.exhibition:'namgang'; habitat:'river'. registerExhibit is called only on an explicit local publication, not bundle import.
- [x] Write RED cases for protection-field validation and exhibit completion/deletion/export/import.
- [x] Implement upload/edit metadata and 3D/panel/gallery display; update stamp derivation.
- [x] Verify full npm test, npm run test:e2e and npm run build.
- [x] Document changed workflow, capture actual first screen/scene, review and publish on existing authorized main.
