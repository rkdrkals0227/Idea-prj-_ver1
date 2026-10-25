# Solid buildings and exactly three moving residents

User requested sturdier buildings and exactly one otter, one turtle and one crane; remove all other NPCs and make remaining residents walk. Existing delegation covers implementation decisions.

Evidence: buildings were decimated to6k triangles and512px. Restore original geometry buffers (no Blender decimation/re-export), resize textures to1024px only. Keep original upload files untouched. Verify raw vertex/index buffer equality, original vertex counts and before/after images, preserve footprint/collisions/entrances.

Replace occasional0.35m sway with bounded multi-metre patrol loops for the three NPC IDs. Update entity positions, proximity, camera-facing greeting and objective/map markers. Stop for nearby player, modals, interiors or reduced motion. Walking animation only while moving; avoid world colliders.

Remove resident/postman/manager animal objects and model roles. Move household issues to a neighborhood noticeboard, letter stories/quiz/write to mailbox, ecology guide/practice handover to a static management station. Keep quest, quiz, letter and save IDs compatible. Mail delivery uses an envelope, not another animal. Student artworks remain.

Test missing behavior first, implement pure patrol stepping and actual browser invariants; adapt legacy tests to facilities rather than expecting deleted characters. Review, verify gameplay/storage and model imagery, build and publish source + gh-pages with standing authorization.

## Evidence and progress

Original-vs-web accessor buffer comparison passes for all3 buildings; raw geometry is preserved exactly. Vertex regression73835/71399/75933 and exactly3-walking-NPC/facility browser tests pass. Unit25 pass. Affected dialogue/quiz and lake regressions pass. Letter reload test initially hit old90s budget because the low-quality fixture had not persisted its graphics setting; saving the fixture setting across reloads fixes it and rerun passes in56s. Model tests now wait2 actual rendering frames before key input and allow30s for the real5.33s greeting under software WebGL; input and bone/mixer time were instrumented, no game conditions weakened. Model+entry regressions pass. Fresh reviewer found no material issue. Four-level completion/final reload, weekly recovery and missing-model regressions passed. Four-level case needed180s test budget for software WebGL, passed in2.1m. Unit25, selected10 browser cases (including reruns), build green. Full21 browser set not re-run; unrelated cases covered in prior records.
