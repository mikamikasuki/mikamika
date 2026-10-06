# Validation

Local command: `npm run verify` on Node.js 22.15.0, Chromium installed by Playwright.

The final local run covers content/photo normalization, safety, cache invalidation, statistics pagination/year caching/error handling and the shared timeline. Browser checks cover hover delay/cancellation, bubble entry tolerance, pinning, state switching, keyboard focus, album/lightbox/hash restoration, reduced motion, the editor YAML export, image-context animation, production empty-content behavior and 1200/900/760/430/375px themes/layouts.

The `<img>` test takes screenshots at 1.8, 4.2, 6.5, 10.8, 12.5 and 17.5 seconds. It checks changed bubble-region pixels, return to idle and unchanged outer bounds. Deterministic P1/P2 images come from renderScene(timeMs), not random wait timing. In-fill browser geometry checks verify all fifty anchors, including AK/HI insets and RI. Production validation checks referenced files, all fifty states, unavailable-versus-zero data, forbidden executable SVG constructs, private-path/token patterns and EXIF stripping.

Reference comparison crops GitHub chrome, normalizes both references to 1200×404, masks changing values/dates/map colors/fixture photos and measures the remaining RGB difference. It is a broad layout/palette regression check with a mean difference threshold of 18/255, not a claim of pixel-perfect reconstruction. Five labels, two-column streak card, root overlay bounds and local clip separation are also directly checked. The independent visual inspection found the primary banner/cards/bubble geometry consistent with the references.

The repository has no confirmed production travel records or original photographs. All bubble screenshots use the labeled synthetic fixture. Production has 0 visited states, no album photos and no empty bubble. Uploading genuine photos or explicitly configuring visits supplies that content.

Test screenshots: [P1 fixture](screenshots/p1-fixture.png), [P2 fixture](screenshots/p2-fixture.png). These images document test conditions and are not deployed as profile content. The compatibility page exercises the GitHub image path separately from Pages.

The small probe was checked on the actual target repository README: 320×180 natural dimensions, image loaded, visible embedded PNG/clipping/blur, and 29,937 changed channel bytes between two snapshots 800ms apart. Full-scene and production GitHub/Pages checks are recorded after deployment below.

Final local result: **22 unit tests passed, 14 browser tests passed**; production validation passed (16 output files, 0 visits/0 photos). Reference masked mean RGB differences: P1 **6.082/255**, P2 **8.064/255**. Production animated SVGs are approximately 0.40 MiB per theme; the six-state fixture is approximately 0.65 MiB. No raster animation fallback was required by the Chromium/GitHub probe.
