# Moyu Master

## Project

- Native JavaScript and Canvas 2D office game; no runtime dependencies.
- `src/engine.js` owns simulation, `src/render.js` owns rendering, and `src/app.js` owns UI and local saves.

## Verification

- Run `npm test`, `npm run build`, and `npm run test:art` for relevant changes.
- Build the static release with `npm run build:site`; only `dist/` may be uploaded.

## Deployment

- Use the PDE frontend-cloud workflow with Kuaishou SSO via `appwrite-cf login-ks`.
- Use `https://npm.corp.kuaishou.com/` for deployment CLI packages.
- Never publish credentials, `config/`, `.git/`, history experiments, or unrelated `DramaClip/` files.
- Preserve existing user work. Do not push or publish additional changes without user authorization.
- After a successful deployment, record the actual URLs and verification outcome in `CHANGELOG.md` and append deployment context to `README.md`.
- Browser verification is optional when the host CLI is unavailable; never install or upgrade the browser CLI to enable tests.

## Published Site

- Project ID: `moyulijin15`, platform site ID: `29425`.
- Site: https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- Initial immutable version: `ddc50699`, published game revision `0a79894`.
- Access is public to signed-in Kuaishou users, not anonymous internet users.
- Build and review `dist/` before every deploy. Reuse the platform-generated `.static-site-deploy.json`; never upload that configuration.
- Browser smoke checks live in `tests/browser/`. Run them on the game and dance preview pages, checking `passed=true` and resource/console results.
- The hosting platform injects security and telemetry SDKs. Their localhost WebSocket warnings are platform behavior, not game-origin networking; do not attempt to probe those services.

## Latest Deployment

- Deployed 2026-11-12 17:49 GMT+8: immutable version `55c383f9`, runtime source commit `9b4319f` on `lj_step`.
- Immutable URL: https://moyulijin15-55c383f9.frontend-cloud.corp.kuaishou.com/
- Independent disco rendering lives in `src/disco.js`; the manifest selects `assets/generated/player-dance-eight-beat-clean/frames.png`.
- Fade timing follows game simulation: 0.8-second dance warmup and 1-second stop; preserve foot anchors, pause behavior and inspection rules.
- Deployed main/demo smoke checks and disco pixel/state checks passed; 109 JS tests and 7 art tests passed. Only 28 allowlisted runtime files were uploaded.

## Deployment 2026-11-17 15:08 GMT+8

- Frontend-cloud version `06da4e39`, source `4c5aa8a` on `li_step`; latest site https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-06da4e39.frontend-cloud.corp.kuaishou.com/ . GitHub Pages was not updated.
- Uploaded 42 allowlisted runtime files from `dist/`. Includes typing art, actual game monitor, boss/supervisor caught cinematics and responsive dialogue; preserve independent cinematic clock, warning/fine and gameplay pause.
- 248 JS tests, 13 art tests, build and both published game/dance smoke checks passed. Fifteen caught/typing release hashes matched; platform fingerprint WebSocket warnings only. Release check: `tests/browser/scripts/caught-release-check.js`.

## Deployment 2026-11-18 15:58 GMT+8

- Version `48b3f95f`, game source `c200895` on `li_step`; latest https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-48b3f95f.frontend-cloud.corp.kuaishou.com/ . Access still requires Kuaishou login; GitHub Pages unchanged.
- Published 46 allowlisted runtime files, including two-shot first-person phone catch artwork and portrait UI for all caught activities on all viewports. Preserve cinematic pause, skip-to-response and warning/fine behavior.
- 250 JS tests, 14 art checks, build and local caught layout/runtime checks passed. Published main/dance smoke checks passed; all 44 non-HTML runtime hashes matched. Hosting injects SDKs into the two HTML files; use page smoke checks for those instead of raw hashes. Batch release requests in groups of four; transient network-change failures resolved on recheck.

## Deployment 2026-11-23 15:09 GMT+8

- Version `b9487922`, game source `5bf3a02` on `lj_step` (merged `b73a3ff`: dance-catch cinematic + caught-dialog layout-stability fix for all three caught activities); latest https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-b9487922.frontend-cloud.corp.kuaishou.com/ . Access still requires Kuaishou login; GitHub Pages unchanged.
- Published 44 allowlisted runtime files from `dist/`. Live site now includes the dance-catch cinematic and the 0px-shift dialog layout fix (verified across 48 scenarios before this deploy).
- 252 JS tests, 15 art checks, build and static release manifest passed. Published main smoke check passed (`passed=true`); all 44 non-HTML runtime hashes matched the deployed `dist/` (release-check baseline in `tests/browser/scripts/caught-release-check.js` refreshed to this build's hashes). HTML pages verified via page smoke check, not raw hash, due to platform-injected SDKs.

## Deployment 2026-11-23 evening GMT+8

- Version `74a5bebf`, source `fbe9afa` on `finial_ui`; latest https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-74a5bebf.frontend-cloud.corp.kuaishou.com/ . Published 72 allowlisted files; approved home cover, level grid and UI icon artwork are live. The newly generated pause proposal is not implemented or deployed.
- Source previously passed 253 JS tests, 15 art checks and five-viewport UI interaction checks; release rebuilt and reviewed before deploy. Authenticated HTTP checks matched all 70 non-HTML SHA-256 hashes; both HTML pages returned 200 with game markup. Native browser opening timed out on both routes, so published blank-page/runtime smoke verification remains uncompleted. Do not report HTTP checks as browser smoke success.
- Site access still requires Kuaishou SSO. CLI deployment auth was valid; browser/HTTP site access is a separate SSO session. No GitHub Pages update. Release hash baseline in `tests/browser/scripts/caught-release-check.js` matches this deployment.

## Deployment 2026-11-23 21:51 GMT+8 update batch

- Version `e4e57cad`, source `01ce31c` on `finial_ui`; latest https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-e4e57cad.frontend-cloud.corp.kuaishou.com/ . Published 72 reviewed runtime files from `dist/`, including the approved pause UI and independent pause overlay to avoid narrow landscape containment.
- 253 JS tests and 15 art checks previously passed; release rebuilt and reviewed for this deployment. All 70 non-HTML SHA256 hashes matched; both HTML pages returned 200 with game markup. Published game and dance browser smoke checks passed (`passed=true`, art ready, resources 200); console queries returned no errors. Full pause multi-viewport verification remains incomplete.
- Kuaishou SSO required; GitHub Pages unchanged. Release hash baseline now matches this deployment.

## Deployment 2026-11-24 16:46 GMT+8 update batch

- Version `83c7f133`, runtime source `6d664ae` on `finial_ui`; latest https://moyulijin15.frontend-cloud.corp.kuaishou.com/ and immutable https://moyulijin15-83c7f133.frontend-cloud.corp.kuaishou.com/ . Published 72 reviewed runtime files from `dist/`.
- Approved clean guide UI is live in home instructions and the in-game handbook: three core tips, four expandable advanced sections, fixed header/footer, readable HTML text and independently scrolling content. Preserve all rule facts, gameplay pause and return behavior.
- 253 JS tests and 15 art checks previously passed; release rebuilt and reviewed this turn. All 70 non-HTML SHA256 hashes matched; both HTML pages returned 200 with game markup. Published main/dance browser smoke checks passed (`passed=true`, art ready, resources 200). Six published guide viewports passed expand/collapse, readable text, fixed footer, return and HUD-freeze checks.
- Kuaishou SSO required; GitHub Pages unchanged. Release hash baseline matches this deployment.
