"""Extract approved GPT-Image-2 UI silhouettes into transparent runtime PNGs."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'dev/ui-redesign-v1/sheet-v3.png').convert('RGB')
out = ROOT / 'assets/generated/ui-paper-v1'
out.mkdir(parents=True, exist_ok=True)
# Separate the generated sheet at its actual dashed grid boundaries.
xs = [0, 558, 1022, 1523, 2048]
ys = [120, 707, 1280, 1940]
names = ['primary', 'secondary', 'toggle', 'coin', 'clock', 'square',
         'joke', 'game', 'dance', 'mirror', 'meeting', 'help']
for index, name in enumerate(names):
    row, col = divmod(index, 4)
    tile = np.array(source.crop((xs[col]+12, ys[row]+12, xs[col+1]-12, ys[row+1]-12)))
    gray = cv2.cvtColor(tile, cv2.COLOR_RGB2GRAY)
    contours, _ = cv2.findContours((gray < 165).astype('uint8'), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    selected = contours[:2] if name == 'toggle' else contours[:1]
    if name == 'toggle':
        for state, contour in zip(['on', 'off'], sorted(selected, key=lambda c: cv2.boundingRect(c)[0])):
            alpha = np.zeros(gray.shape, dtype='uint8')
            cv2.drawContours(alpha, [contour], -1, 255, cv2.FILLED)
            part = Image.fromarray(np.dstack((tile, alpha)))
            part = part.crop(part.getbbox())
            part.thumbnail((160, 160), Image.Resampling.LANCZOS)
            part.save(out / ('toggle-' + state + '.png'))
        continue
    mask = np.zeros(gray.shape, dtype='uint8')
    cv2.drawContours(mask, selected, -1, 255, cv2.FILLED)
    mask = cv2.GaussianBlur(cv2.dilate(mask, np.ones((3, 3), dtype='uint8')), (3, 3), .5)
    rgba = Image.fromarray(np.dstack((tile, mask)))
    bounds = rgba.getbbox()
    rgba = rgba.crop(bounds)
    rgba.thumbnail((384, 384), Image.Resampling.LANCZOS)
    rgba.save(out / (name + '.png'))
    print(name, rgba.size)
