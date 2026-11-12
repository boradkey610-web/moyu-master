# CHANGELOG

## 2026-11-12 17:49 GMT+8 - 55c383f9

- Site: https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- Immutable version: https://moyulijin15-55c383f9.frontend-cloud.corp.kuaishou.com/
- Source game revision: `9b4319f` on `lj_step`.
- Release: independent illustrated disco background, mirror ball, crossed cyan/amber beams, floating notes, 1.3x dancer and cleaned enclosed white matte pockets. Office-to-disco fade follows the 0.8-second warmup; return follows the 1-second stop period. Inspection simulation is unchanged; inspector positions are hidden by the disco, with a fixed threat warning retained.
- Upload: 28 allowlisted runtime files from `dist/`; no credentials, generation configuration, historical experiments or unrelated files.
- Access: existing site permissions retained for signed-in Kuaishou users; not anonymous public internet access.
- Regression: `/` and `/dev/dance-review.html` both returned `passed=true` after artwork loaded; all checked JS/CSS/manifest resources returned HTTP 200, no blank page and no game-module console errors.
- Dance browser checks: full background replacement, exact half-opacity crossfade, office restoration, pause freeze, caught recovery and 28 distinct animation frames all passed on the deployed site.
- Verification: 109 JavaScript tests and 7 artwork tests passed; static build, diff checks and credential scan passed. Platform-injected security/telemetry requests remain separate from game networking.

## 2026-11-12 10:57 GMT+8 - ddc50699

- Site: https://moyulijin15.frontend-cloud.corp.kuaishou.com/
- Immutable version: https://moyulijin15-ddc50699.frontend-cloud.corp.kuaishou.com/
- Source game revision: `0a79894`.
- Release: eight-beat dance, full-scene ambient darkness, soft tapered spotlight, floating notes and chair tuck animation. Uploaded 27 allowlisted runtime files only.
- Access: all signed-in Kuaishou users; no anonymous public internet access. Updated in the site access-control console.
- Regression: passed on `/` and `/dev/dance-review.html`; loaded artwork is ready, JS/CSS/manifest requests return HTTP 200, no blank page, and level selection opens.
- Safety: no game forms or external business-data requests. The hosting platform injects SSO/security/telemetry SDKs; its localhost WebSocket warnings did not block game rendering.
- Verification: 101 JavaScript tests passed; static-release build and diff checks passed.
- Management: https://myflicker.corp.kuaishou.com/web-artifacts/detail?id=29425&tab=AccessControl
