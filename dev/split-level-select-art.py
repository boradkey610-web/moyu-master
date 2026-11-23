"""Extract illustrations from the approved GPT-Image-2 selection proposal.

Card titles, level numbers, targets and buttons are rendered by the game.
Keep the source design untouched; only derived PNGs ship in the release.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'dev/level-select-design-v1/tmp/ref_20261123_194423_0.png').convert('RGB')
out = ROOT / 'assets/generated/level-select-v1'
out.mkdir(parents=True, exist_ok=True)
boxes = [(80, 290, 544, 634), (610, 290, 1074, 634),
         (80, 865, 544, 1180), (610, 865, 1074, 1180),
         (80, 1405, 544, 1718), (610, 1405, 1074, 1685)]
for index, box in enumerate(boxes, 1):
    art = source.crop(box)
    # The number badge occupies empty wall at the upper left. Replace it with
    # sampled wall texture so the real, accessible badge can be drawn in HTML.
    wall = source.crop((190, 300, 208, 344)).resize((98, 72)).filter(ImageFilter.GaussianBlur(1))
    art.paste(wall, (0, 0))
    art.save(out / f'level-{index}.png', optimize=True)
    print(f'level-{index}', art.size)

clock = source.crop((978, 49, 1135, 207)).convert('RGBA')
mask = Image.new('L', clock.size)
ImageDraw.Draw(mask).ellipse((2, 2, 155, 156), fill=255)
clock.putalpha(mask)
clock.save(out / 'wall-clock.png', optimize=True)
source.crop((11, 300, 47, 420)).resize((72, 240)).save(out / 'texture.png', optimize=True)
