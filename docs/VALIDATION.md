# Validation

Run `npm run verify` on Node.js 22.15.0 with Playwright Chromium installed.

The local run passed **27 unit tests and 20 browser tests**. Coverage includes image normalization, cache invalidation, statistics fallback, animation timing, state geometry, hover cancellation, pointer tracking, pinning, keyboard focus, albums, hash restoration, YAML editing and reduced motion. Layout checks cover 1200, 900, 760, 430 and 375px viewports in dark mode.

The README cycles through **all 25 visited states and Washington, D.C.**, with no missing or repeated place before the loop restarts. A browser test seeks through every place in the generated SVG and verifies exactly one visible bubble at each stop. The complete 26-place cycle lasts **104 seconds**, with a **two-second visible interval followed by two seconds fully retracted** per place. The script-free SVG image test captures idle, visible, retracted and next-state stages with stable 1200×606 boundaries. Geometry checks confirm that every state and DC has an in-fill anchor, the pointer base is centered, its tip reaches the anchor and the bubble body fits the canvas. App checks confirm mouse tracking, click pinning and no automatic bubble after 75 seconds of idle time.

Both renderers use the same normalized, critically damped spring for the bubble and ordered photo stack. Front and rear photos have equal dimensions and parallel edges; rear photos have increasing blur and transparency. The README bubble uses a uniform 1.18 scale, including its type, pictures, spacing, corners and tail. Photos display at approximately 156×97, with approximately 21×11 offsets. The gray Visited: text displays at approximately 12.4px and one-line ellipsis; App text uses two-line clamping. The banner has a synchronized blinking typing caret, and static images omit it.

Production contains **25 visited states and Washington, D.C.**, with DC excluded from the state count. No original travel photographs have been supplied. Empty visited states receive three pastel sample illustrations without visible sample captions or watermarks; they remain marked as samples in the manifest. Real uploads replace them automatically. Photo processing tests use separate synthetic fixtures.

Output validation passed for 22 files, including resource resolution, executable SVG checks, private paths and image metadata. Reference comparison normalizes the supplied images to 1200×404 and independently rescales the enlarged banner, introduction and card regions to their original reference boxes and masks changing statistics, dates, map colors and fixture photos. Mean RGB differences were **12.614/255 for P1** and **15.372/255 for P2**, under the broad layout/palette threshold of 18/255. This is a regression measurement, not a pixel-perfect reconstruction claim.

Screenshots: [P1 fixture](screenshots/p1-fixture.png), [P2 fixture](screenshots/p2-fixture.png), [travel page](screenshots/travel-desktop.png), [mobile page](screenshots/travel-mobile.png). [Ordered stack animation](screenshots/ordered-stack.gif) shows the four-second cycle. Fixture screenshots contain synthetic test images.

## Public browser checks

`node scripts/check-live.mjs` checks the actual GitHub README picture in light, dark and reduced-motion modes, animation stages through GitHub’s image renderer, natural image dimensions, the whole-image Pages link, live visits, fresh statistics, App idle behavior and SVG Content-Type. Set `README_VERSION` to the deployed revision to refresh the GitHub page used for validation.

The public checks use an unauthenticated Chromium session. Safari and Firefox have not been separately exercised.

GitHub Actions [37481150943](https://github.com/mikamikasuki/mikamikasuki/actions/runs/37481150943) passed the full verification suite and deployed revision `d87b78b`.
