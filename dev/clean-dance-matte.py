"""Remove enclosed white backdrop pockets without erasing drawn highlights."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/generated/player-dance-eight-beat-v4/frames.png'
OUTPUT = ROOT / 'assets/generated/player-dance-eight-beat-clean'


def clean(image):
    pixels = np.array(image.convert('RGBA'))
    removed = []
    for frame in range(28):
        left, top = frame % 7 * 384, frame // 7 * 480
        cell = pixels[top:top + 480, left:left + 384]
        rgb = cell[:, :, :3]
        low, chroma = rgb.min(2), np.ptp(rgb, axis=2)
        white = (low > 230) & (chroma < 25) & (cell[:, :, 3] > 128)
        count, labels, stats, _ = cv2.connectedComponentsWithStats(white.astype('uint8'), 8)
        seeds = np.zeros(white.shape, dtype=bool)
        for label in range(1, count):
            x, y, width, height, area = stats[label]
            # The enclosed backdrop is a large pocket between hand and cheek.
            # Eyes, shoe highlights and cuffs must remain untouched.
            if area > 300 and 75 <= x <= 180 and 140 <= y <= 245:
                seeds |= labels == label
        if not seeds.any():
            continue
        near_white = (low > 200) & (chroma < 30) & (cell[:, :, 3] > 0)
        _, regions = cv2.connectedComponents(near_white.astype('uint8'), 8)
        mask = np.isin(regions, np.unique(regions[seeds])) & near_white
        cell[mask, 3] = 0
        removed.append({'frame': frame, 'pixels': int(mask.sum())})
    return Image.fromarray(pixels), removed


def main():
    image, removed = clean(Image.open(SOURCE))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    image.save(OUTPUT / 'frames.png')
    contact = Image.new('RGB', (1344, 960), '#14252b')
    for frame in range(28):
        x, y = frame % 7 * 384, frame // 7 * 480
        small = image.crop((x, y, x + 384, y + 480)).resize((192, 240), Image.Resampling.LANCZOS)
        contact.paste(small, (frame % 7 * 192, frame // 7 * 240), small)
    contact.save(OUTPUT / 'dark-contact-sheet.png')
    print({'output': str(OUTPUT), 'cleaned': removed})


if __name__ == '__main__':
    main()
