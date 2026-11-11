#!/usr/bin/env python3
"""Preview three approved-style pose concepts; not interpolated dance sprites."""
import argparse
import importlib.util
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('art', ROOT / 'dev/build-supervisor-art.py')
ART = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ART)


def spotlight(canvas, x, feet, height, strength):
    width, size = canvas.size
    yy, xx = np.mgrid[:size, :width]
    top = feet - height - 55
    cone_width = 8 + np.clip((yy - top) / (feet - top), 0, 1) * height * .31
    cone = np.clip(1 - np.abs(xx - x) / cone_width, 0, 1) ** 1.5
    cone *= ((yy >= top) & (yy <= feet)) * strength
    floor = np.exp(-((xx - x) / (height * .34)) ** 2 - ((yy - feet) / 13) ** 2) * strength * 1.5
    pixels = np.zeros((size, width, 4), dtype=np.uint8)
    pixels[:, :, :3] = (255, 213, 126)
    pixels[:, :, 3] = np.clip((cone + floor) * 80, 0, 110).astype(np.uint8)
    canvas.alpha_composite(Image.fromarray(pixels))
    draw = ImageDraw.Draw(canvas)
    draw.line((x, top - 17, x, top - 7), fill='#665849', width=3)
    draw.rounded_rectangle((x - 14, top - 9, x + 14, top + 3), radius=4, fill='#665849')
    draw.ellipse((x - 10, top - 1, x + 10, top + 5), fill='#ffe3a2')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/generated/player-dance-mj-preview-v1')
    args = parser.parse_args()
    source = Image.open(args.source)
    sprites = []
    for index in range(3):
        crop = source.crop((round(index * source.width / 3), 0,
                            round((index + 1) * source.width / 3), source.height))
        sprite = ART.clean_mask(crop, {'decontaminateWhite': True})
        sprites.append(sprite.crop(sprite.getchannel('A').getbbox()))
    args.output.mkdir(parents=True, exist_ok=False)
    for index, sprite in enumerate(sprites):
        sprite.save(args.output / f'pose-{index + 1}.png')
    frames = []
    for frame in range(48):
        index = 0 if frame < 12 else 1 if frame < 28 else 2
        beat = math.sin(frame * math.pi / 6)
        canvas = Image.new('RGBA', (720, 520), '#f6ecdb')
        draw = ImageDraw.Draw(canvas)
        draw.rectangle((0, 422, 720, 520), fill='#e8dbc2')
        draw.line((0, 422, 720, 422), fill='#b9a991', width=2)
        draw.text((24, 18), 'MJ DANCE / KEY-POSE PREVIEW', fill='#564b3e')
        draw.text((24, 40), 'Pose switches + motion study, not final in-between frames', fill='#81715a')
        for x, height, feet in ((230, 320, 435), (568, 98, 435)):
            spotlight(canvas, x, feet, height, .65 + beat * .1)
            sprite = sprites[index]
            # Fixed character scale across poses, including the raised finger.
            scale = height / sprites[0].height
            body = sprite.resize((round(sprite.width * scale), round(sprite.height * scale)), Image.Resampling.LANCZOS)
            if index != 2:
                body = body.rotate(beat * (1.8 if index == 0 else .7), Image.Resampling.BICUBIC, expand=True)
            slide = (-math.sin((frame - 28) / 19 * math.pi) * height * .10) if index == 2 else 0
            bob = abs(beat) * height * .009 if index == 0 else 0
            canvas.alpha_composite(body, (round(x - body.width / 2 + slide), round(feet - body.height - bob)))
        draw = ImageDraw.Draw(canvas)
        draw.text((180, 475), ('BRIM FREEZE', 'UPWARD POINT', 'GLIDE STUDY')[index], fill='#564b3e')
        draw.text((514, 475), 'IN-GAME SIZE: 98px', fill='#564b3e')
        frames.append(canvas.convert('RGB'))
    frames[0].save(args.output / 'dance-preview.gif', save_all=True, append_images=frames[1:],
                   duration=80, loop=0, disposal=2)
    frames[18].save(args.output / 'dance-preview.png')
    print(args.output / 'dance-preview.gif')


if __name__ == '__main__':
    main()
