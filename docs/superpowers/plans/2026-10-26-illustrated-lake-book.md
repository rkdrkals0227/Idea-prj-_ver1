# Illustrated Geumhoji picture book

User explicitly asks to continue implementation and add scene-appropriate illustrations and cute lettering; existing delegation covers design choices.

- Preserve six sequential legend page IDs, teacher-editable text, level gate, read tracking and quiz/stamp conditions. Keep the legend notice visible; illustrations are imaginative retellings, not ecological evidence.
- Replace simple vector placeholders with a locally hosted six-scene watercolor atlas: two dragons meet, argue, tail creates water hollow, general mediates, blue guardian/gold ascent, children caring for shoreline. Use exact panel background positioning and meaningful scene-specific accessible alternatives. Retain vector fallback on asset failure. Extra/custom teacher pages use generic fallback rather than presenting unrelated pictures.
- Host open-license Jua Korean font locally with its license, apply to story text/headings only with readable spacing, responsive picture/text layout and system fallback. No runtime third-party request or API needed.
- Verify every scene is different, actual images decode and font loads, next/previous preserve text/image alignment and sequential quiz conditions, small viewport reading, local static subpath serving. Recheck current level2 changes; build and publish main/gh-pages.
