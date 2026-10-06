# Validation

Run `npm run verify` on Node.js 22.15.0 with Playwright Chromium installed.

The local run passed **24 unit tests and 17 browser tests**. It covers photo normalization and metadata removal, cache invalidation, statistics pagination and fallback, animation timing, hover cancellation, pinning, keyboard focus, album/lightbox navigation, hash restoration, YAML editing and reduced motion. Layout checks cover 1200, 900, 760, 430 and 375px viewports in dark mode. The new bubble check confirms that the body moves between California and New Jersey while its tail keeps the same local position.

Production contains **25 visited states and Washington, D.C.**, with DC excluded from the fifty-state count. No original travel photographs have been supplied. Empty visited states receive three labeled sample images, with zero real photographs in the manifest. Real uploads replace these samples automatically. Photo-stack and album checks use explicitly labeled synthetic fixtures, isolated from production.

The SVG `<img>` test captures multiple animation stages and checks changing bubble pixels, the return to idle and stable 1200×404 boundaries. In-fill geometry checks verify all fifty state anchors and the DC boundary. Output validation passed for 22 files, including resource resolution, forbidden executable SVG content, private paths and photo metadata.

Reference comparison normalizes the supplied images to 1200×404 and masks changing statistics, dates, map colors and fixture photos. Mean RGB differences were **6.716/255 for P1** and **9.026/255 for P2**, under the broad layout/palette regression threshold of 18/255. This measurement is not a claim of pixel-perfect reconstruction. Foreground photographs remain sharp; rear layers are progressively blurred and translucent, and the bubble samples a blurred backdrop beneath its glass tint.

Screenshots: [P1 fixture](screenshots/p1-fixture.png), [P2 fixture](screenshots/p2-fixture.png), [travel page](screenshots/travel-desktop.png), [mobile page](screenshots/travel-mobile.png). Fixture screenshots contain synthetic test images, not travel records.

## Public browser checks

`node scripts/check-live.mjs` checks the public GitHub README picture sources in light, dark and reduced-motion modes, 1200×404 natural image dimensions, the whole-image link to Pages, live visit counts, startup errors, fresh statistics and SVG Content-Type. The separate [compatibility page](compatibility-probe.md) exercises embedded WebP, clipping, blur and animated photo layers through GitHub’s image renderer.

The public checks use an unauthenticated Chromium session. Safari and Firefox have not been separately exercised.

The local image-context test verifies a one-second bubble followed by a two-second fully retracted interval, then a different state. Browser checks also verify the fraction-only hero, parallel photo edges and equal image dimensions, a single Visited: line above photos, two-line clamping, sample albums and removal of rectangular map focus outlines.
