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
