# Uploaded model integration

The user delegated composition by file role. Preserve existing quest IDs and four-level progression. Use available uploads; never claim blocked uploads are installed.

- Inspect GLB geometry, bounds and clips; record the 12 files blocked by the 32 MiB transfer limit.
- Prepare web copies: resize embedded textures, simplify static meshes, preserve animated rigs and clips. Keep provenance.
- Test normalization and animation switching/fallback before implementing reusable cached model loading.
- Connect turtle, crane, signs, lamps, benches, waste and tactile tiles. Use instancing for repeated paving/grass/water, maintain existing collision and interaction anchors.
- Verify actual rendered models, walk/idle/greet transitions, path repair, collection persistence, fallback and full existing tests.
- Build, publish source and compiled gh-pages distribution; document remaining blocked roles.

## Execution notes

- Downloaded18, blocked12 over 32MiB; user will reupload smaller files. User asked for Meshy compression guidance; advised lower texture resolution if available and lower polygon count, verify <30MB. No blocked file is reported installed.
- Original available files total378.6MiB -> web copies6.9MiB. Static mesh/texture preparation script and provenance included.
- Normalization, state transitions, missing idle recovery and legacy animation mappings:22 unit tests pass.
- Fresh reviewer found2 P2 issues (partial idle failure overlap/frozen greeting; legacy walking mapping). Both reproduced, fixed, re-tested and reviewed. No remaining findings in fixes.
- Production subpath browser check:18 GLB200, canvas1, school entry correct, no exceptions/resource errors.
- Full18 browser tests passed (9.1m) with source frozen after final fixes. Build passed. Initial tests run during HMR changes was interrupted; focused failures rerun, retained error wording regression fixed.
- Remaining external work:12 smaller source uploads, actual classroom device performance, public Pages access (network proxy blocks this environment). No class backend added.
