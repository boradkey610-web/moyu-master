# CHANGELOG

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
