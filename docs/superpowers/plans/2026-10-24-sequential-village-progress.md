# Execution ledger — plan: docs/superpowers/plans/2026-10-24-sequential-village.md

Pre-flight: Journey state is consumed by main gates, guardian rewards, school UI and world objective. Work metadata is consumed by storage, editor and exhibition; keep protection/exhibition/river names identical.
Ruling: Use the existing isolated cloud checkout and implement inline, following the user's standing request to decide details and continue implementation. No extra worktree and no repeated design-choice questions.
Ruling: A first daily check completes level 1; remaining weekly tracking stays available. Waiting for real weekdays would prevent an in-class playthrough.
Ruling: Retain three stamps, with ecology awarded for level 4 Namgang exhibition rather than the prior optional lake cleanup. Latest four-level request takes precedence over earlier completion rules.
Ruling: Animal home descriptions refer to game fiction; actual habitat is not asserted without evidence.
Task 1: State engine and sequential legend guard implemented; first RED reproduced unauthorized legend reward. New journey tests cover school, Seoul week boundaries, future dates, retained school completion and explicit exhibition/delete behavior. Existing reward fixtures updated because legend/village now require prior levels.
Final review: fresh read-only reviewer review_sequential reviewed current diff against base 5c6f06a. No Critical issues.
Final: fixed required NPC encounter bypass — library cannot open new legend until turtle introduction; pure award/read guards also enforce encounter. Legacy already-passed story records remain recognized.
Final: fixed own work hidden behind imported class work — explicit local exhibition IDs ordered newest first, before imported items, within moving/poster limits.
Final: Ruling: Map pledge omission is Important for this task because the requested Namgang ecological map must carry what the student can do to protect the creature. Add the pledge to map entries, with RED browser assertion.
Final: fixed optional rest activity leaving introductory dialog open — the rest is an object interaction, not an NPC; introduce() closes before dispatching its next action.
Final: minor (deferred): replacement building meshes hide the old facade plaque; independent physical entrance signs survive. Verify actual uploaded models and relocate facade signage when supplied.
Final: Ruling: Private full backup restores legitimate earned progression; importing a class artwork bundle does not. Existing explicit publish/edit is still required for an exhibition stamp.
Final: Ruling: Visual legibility is checked with actual current screenshots; uploaded replacement models have not been supplied, so their individual visual fit remains unverified.

Task 1: complete — npm test 17/17, sequential state, Seoul calendar and legacy record guards.
Task 2: complete — school weekly UI and centralized routing; full UI test finishes all four levels in order.
Task 3: complete — physical signs, no NPC Sprite tags, current goal ring/beam and steady reduced-motion behavior; actual screenshots inspected.
Task 4: complete — names and protection pledges, Namgang posters and moving art, metadata round-trip, import not awarding, explicit publication, deletion returning to level 4.
Final: fixed visual occlusion found during capture — a Raycaster test first failed because blank boards/trees hid the student's latest poster. Shared slot ordering now puts that work on the visible front-center board. Updated current location label for the new Namgang area.
Final verification: npm test 17/17; npm run test:e2e 16/16; npm run build exit 0. Normal repo, branch work, no additional worktree. Existing authorization is to publish changes on GitHub main; use a normal fast-forward push and preserve the cloud checkout.
Implementation steps were committed together after the complete integrated game passed; this avoids publishing an intermediate partially gated game.
