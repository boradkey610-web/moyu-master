"""Extract the approved home logo and scene; controls remain real HTML."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'dev/home-design-v1/tmp/ref_20261123_203344_0.png').convert('RGB')
out = ROOT / 'assets/generated/home-v1'
out.mkdir(parents=True, exist_ok=True)
logo = np.array(source.crop((70, 110, 1080, 441)))
gray = cv2.cvtColor(logo, cv2.COLOR_RGB2GRAY)
contours, _ = cv2.findContours((gray < 160).astype('uint8'), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
mask = np.zeros(gray.shape, dtype='uint8')
cv2.drawContours(mask, [max(contours, key=cv2.contourArea)], -1, 255, cv2.FILLED)
mask = cv2.GaussianBlur(mask, (3, 3), .5)
rgba = Image.fromarray(np.dstack((logo, mask)))
rgba.crop(rgba.getbbox()).save(out / 'logo.png', optimize=True)
source.crop((0, 508, 1152, 1608)).save(out / 'scene.png', optimize=True)
source.crop((12, 12, 100, 100)).save(out / 'texture.png', optimize=True)
