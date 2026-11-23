# Paper UI assets

Approved source: `dev/ui-redesign-v1/sheet-v3.png`, generated with GPT-Image-2.
Rebuild the transparent PNGs with `python3 dev/split-ui-assets.py`.

The phone is the joke activity's main subject. Dance uses a silver-teal ball
on indigo. Meeting uses a table with two participants. Help uses a raised hand
for colleague support. Toggle on/off are separate PNGs.

`src/ui-assets.js` defines the runtime allowlist and loading. SVG wrappers keep
existing assist/result clones working; generated images replace their drawing.
Labels, button handlers, keyboard access and gameplay states stay in the app.
