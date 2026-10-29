# Hero mobile refinement — 2026-10-29

Kept the approved desktop direction, logo, Cairo and palette. Mobile now uses a dedicated composition: compact copy and two actions above a visible 380px landscape layer, with a flatter gold-edged wave and a two-column values strip. Removed the media credit overlay; licensed stock attribution remains in the footer. The functional pause/resume control is rendered in the footer as well.

Motion: staged copy entry, expanding harvest brush, staggered values, reversible scroll parallax and a gently settling image in the next section. Reduced motion skips these scenes and does not fetch the background video. No scrolling interception.

The following section shares the ivory ground, Cairo hierarchy and organic image corners. Actual screenshots reviewed at 390px and 1440px, with automated layout checks at 320, 390, 768 and 1440px. First screenshot review caught a wave overlapping a values label on mobile; flattened the wave to separate the text from its edge.

Validation: production build, TypeScript and ESLint pass. Browser script `scripts/check-reference-hero.mjs`: 45 checks, including video autoplay/loop, footer playback control, no hero overlays, repeated bidirectional reveals, no horizontal overflow, primary actions, menus and reduced motion. This is a targeted review, not a complete accessibility or performance audit.
