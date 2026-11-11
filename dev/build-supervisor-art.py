#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["pillow==12.2.0", "numpy>=2,<3", "scipy>=1.14", "opencv-python-headless>=4.10"]
# ///
"""Build independent, head-anchored supervisor sprites and matte review images.

Inputs are three-pose strips, ordered idle/contact A/contact B. Never paste over
the shared character atlases. Original model outputs remain untouched.
"""
import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path

import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
CELL = (384, 480)
BODY_HEIGHT = 420
DIRECTIONS = ('right', 'front', 'back', 'left')


def head_center(image):
    alpha = np.asarray(image.getchannel('A'))
    ys, xs = np.nonzero(alpha[:max(1, round(image.height * .23))] > 128)
    if not len(xs):
        raise ValueError('Empty head mask')
    return float(xs.mean())


def normalize(image):
    box = image.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if not box:
        raise ValueError('Empty foreground')
    crop = image.crop(box)
    if crop.width / crop.height > .9:
        raise ValueError('Unexpected sprite proportions; check strip cell boundaries')
    scale = BODY_HEIGHT / crop.height
    resized = crop.resize((round(crop.width * scale), BODY_HEIGHT), Image.Resampling.LANCZOS)
    x = round(CELL[0] / 2 - head_center(resized))
    if x < 4 or x + resized.width > CELL[0] - 4:
        raise ValueError('Sprite would clip horizontally')
    result = Image.new('RGBA', CELL)
    result.alpha_composite(resized, (x, 50))
    return result


def clean_mask(image, config):
    rgb = np.asarray(image.convert('RGB'))
    # Infer the local paper color rather than classifying the ivory blouse as
    # background. GrabCut refines an enclosed silhouette with a narrow trimap.
    border = np.concatenate([rgb[:5].reshape(-1, 3), rgb[-5:].reshape(-1, 3),
                             rgb[:, :5].reshape(-1, 3), rgb[:, -5:].reshape(-1, 3)])
    background = np.median(border, axis=0)
    distance = np.max(np.abs(rgb.astype(float) - background), axis=2)
    candidate = ndimage.binary_fill_holes(distance > 28)
    labels, count = ndimage.label(candidate)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    if not count or sizes.max() < 100:
        raise ValueError('No foreground silhouette')
    candidate = labels == sizes.argmax()
    inside = ndimage.binary_erosion(candidate, iterations=3)
    outside = ~ndimage.binary_dilation(candidate, iterations=3)
    trimap = np.full(candidate.shape, cv2.GC_PR_BGD, dtype=np.uint8)
    trimap[candidate] = cv2.GC_PR_FGD
    trimap[inside] = cv2.GC_FGD
    trimap[(distance < 6) & candidate] = cv2.GC_PR_BGD
    trimap[outside] = cv2.GC_BGD
    cv2.setRNGSeed(18)
    cv2.grabCut(rgb.copy(), trimap, None, np.zeros((1, 65)), np.zeros((1, 65)), 3, cv2.GC_INIT_WITH_MASK)
    silhouette = (trimap == cv2.GC_FGD) | (trimap == cv2.GC_PR_FGD)
    core = ndimage.binary_erosion(silhouette, iterations=2)
    # Solve C = alpha*F + (1-alpha)*B at the contour, then remove the white
    # contribution from RGB. Blurring alpha alone leaves a bright matte fringe.
    _, indices = ndimage.distance_transform_edt(~core, return_indices=True)
    nearest_foreground = rgb[tuple(indices)].astype(float)
    foreground_delta = background - nearest_foreground
    alpha = np.sum((background - rgb.astype(float)) * foreground_delta, axis=2)
    alpha /= np.maximum(np.sum(foreground_delta ** 2, axis=2), 1)
    alpha = np.clip(alpha, 0, 1)
    alpha[core] = 1
    alpha[~ndimage.binary_dilation(silhouette, iterations=2)] = 0
    foreground = (rgb.astype(float) - (1 - alpha[:, :, None]) * background) / np.maximum(alpha[:, :, None], .01)
    if not config['decontaminateWhite']:
        foreground = rgb
    pixels = np.dstack([np.clip(foreground, 0, 255).astype(np.uint8), np.round(alpha * 255).astype(np.uint8)])
    # Discard tiny detached segmentation debris, never blur the silhouette.
    labels, count = ndimage.label(pixels[:, :, 3] > 8)
    if count:
        sizes = np.bincount(labels.ravel())
        sizes[0] = 0
        keep = sizes >= max(20, sizes.max() * .0005)
        keep[0] = False
        pixels[~keep[labels], 3] = 0
    pixels[pixels[:, :, 3] < 4] = 0
    return Image.fromarray(pixels)


def pack(rows):
    atlas = Image.new('RGBA', (len(rows[0]) * CELL[0], len(rows) * CELL[1]))
    for y, row in enumerate(rows):
        for x, sprite in enumerate(row):
            atlas.alpha_composite(sprite, (x * CELL[0], y * CELL[1]))
    return atlas


def stabilize(rows, alternate):
    # Preserve hands, folder, head and torso pixel-for-pixel. Only the lower
    # skirt/legs are permitted to vary, preventing model-generated hand swaps.
    seam = 50 + round(BODY_HEIGHT * .65)
    for row, direction in zip(rows, DIRECTIONS):
        if direction in alternate:
            row[2] = alternate[direction]
        else:
            # Front/back boots keep their orientation under a lower-body-only
            # reflection; never reflect a side pose or any folder/hand pixels.
            row[2] = row[1].copy()
            pixels = np.asarray(row[1])
            green = (pixels[:, :, 1].astype(float) > pixels[:, :, 0] * 1.05) & (pixels[:, :, 1].astype(float) > pixels[:, :, 2] * 1.02) & (pixels[:, :, 3] > 128)
            green[:seam] = False
            start = 50 + round(BODY_HEIGHT * .70)
            counts = green.sum(axis=1)
            gaps = [y for y in range(start, 50 + round(BODY_HEIGHT * .87)) if np.all(counts[y:y + 3] < 8)]
            if not gaps:
                raise ValueError('Cannot locate skirt hem')
            leg_seam = gaps[0]
            xs = np.nonzero(green[max(seam, leg_seam - 8):leg_seam])[1]
            center = (int(xs.min()) + int(xs.max())) / 2
            skirt_mask = np.zeros((CELL[1], CELL[0]), dtype=np.uint8)
            for y in range(seam, leg_seam):
                skirt_x = np.flatnonzero(green[y])
                if len(skirt_x):
                    skirt_mask[y, max(0, skirt_x.min() - 1):min(CELL[0], skirt_x.max() + 2)] = 255
            skirt = row[1].copy()
            skirt.putalpha(Image.fromarray(np.minimum(np.asarray(skirt.getchannel('A')), skirt_mask)))
            legs_image = np.array(row[1])
            legs_image[skirt_mask > 0] = 0
            legs = Image.fromarray(legs_image).crop((0, seam, CELL[0], CELL[1]))
            row[2].paste(Image.new('RGBA', legs.size), (0, seam))
            row[2].paste(legs.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (round(2 * center - (CELL[0] - 1)), seam))
            row[2].alpha_composite(skirt)
        for phase in (1, 2):
            # Match skirt contours at the join, tapering the correction below
            # the hem. A rectangular paste alone creates a visible ledge.
            reference = np.asarray(row[0].getchannel('A'))
            current = np.asarray(row[phase].getchannel('A'))
            tx = np.nonzero(reference[seam:seam + 3] > 128)[1]
            sx = np.nonzero(current[seam:seam + 3] > 128)[1]
            scale = (tx.max() - tx.min()) / max(1, sx.max() - sx.min())
            source_center = (sx.min() + sx.max()) / 2
            target_center = (tx.min() + tx.max()) / 2
            grid_y, grid_x = np.indices((CELL[1], CELL[0]), dtype=np.float32)
            weight = np.clip(1 - (grid_y - seam) / 70, 0, 1)
            row_scale = 1 + (scale - 1) * weight
            offset = (target_center - source_center) * weight
            map_x = (grid_x - source_center - offset) / row_scale + source_center
            warped = cv2.remap(np.asarray(row[phase]), map_x.astype(np.float32), grid_y,
                               cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
            row[phase] = Image.fromarray(warped)
            # Fade the cloth shading below the immutable upper-body region.
            base = np.asarray(row[0]).astype(float)
            blend = warped.astype(float)
            weight = np.clip((np.arange(CELL[1]) - seam) / 18, 0, 1)[:, None, None]
            shared = (base[:, :, 3:4] > 240) & (blend[:, :, 3:4] > 240)
            mixed = base * (1 - weight) + blend * weight
            row[phase] = Image.fromarray(np.where(shared, mixed, blend).astype(np.uint8))
            row[phase].paste(row[0].crop((0, 0, CELL[0], seam)), (0, 0))
    return rows


def previews(rows, directory):
    for color, name in [('#23282d', 'dark'), ('#efe3ca', 'warm'), ('#ffffff', 'white')]:
        board = Image.new('RGB', (CELL[0] * 3, (CELL[1] + 32) * 4), color)
        draw = ImageDraw.Draw(board)
        for y, (direction, row) in enumerate(zip(DIRECTIONS, rows)):
            for x, sprite in enumerate(row):
                dx, dy = x * CELL[0], y * (CELL[1] + 32)
                draw.text((dx + 16, dy + 8), direction + ' / ' + ('idle', 'contact A', 'contact B')[x], fill='#b48850')
                board.paste(sprite, (dx, dy + 32), sprite)
        board.save(directory / f'supervisor-review-{name}.png')
    # Real idle/contact sequence on both a dark and a game-like floor.
    animation = []
    for phase in (1, 0, 2, 0):
        frame = Image.new('RGB', (CELL[0] * 4, CELL[1] * 2), '#23282d')
        draw = ImageDraw.Draw(frame)
        draw.rectangle((0, CELL[1], frame.width, frame.height), fill='#efe3ca')
        for x, row in enumerate(rows):
            for y in range(2):
                frame.paste(row[phase], (x * CELL[0], y * CELL[1]), row[phase])
        animation.append(frame)
    animation[0].save(directory / 'supervisor-walk-review.gif', save_all=True,
                      append_images=animation[1:], duration=160, loop=0, disposal=2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for direction in DIRECTIONS:
        parser.add_argument('--' + direction, type=Path, required=True)
    parser.add_argument('--right-contact-b', type=Path, required=True)
    parser.add_argument('--left-contact-b', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'assets/generated/supervisor-v2')
    args = parser.parse_args()
    config = json.loads((ROOT / 'config/image-generation.json').read_text())
    rows = []
    records = []
    for direction in DIRECTIONS:
        path = getattr(args, direction)
        source = Image.open(path).convert('RGB')
        row = []
        for column in range(3):
            box = (round(source.width * column / 3), 0,
                   round(source.width * (column + 1) / 3), source.height)
            cell = source.crop(box)
            row.append(normalize(clean_mask(cell, config['matting'])))
            print(f'matted={direction}:{column}', flush=True)
        rows.append(row)
        records.append({'direction': direction, 'source': str(path),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    alternate = {}
    for direction in ('right', 'left'):
        path = getattr(args, direction + '_contact_b')
        alternate[direction] = normalize(clean_mask(Image.open(path), config['matting']))
        records.append({'direction': direction + '-contact-b', 'source': str(path),
                        'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    stabilize(rows, alternate)
    output = args.output_dir
    if output.exists():
        raise FileExistsError(f'Use a new output directory to preserve history: {output}')
    output.mkdir(parents=True)
    pack(rows).save(output / 'poses.png')
    pack([[r[0]] for r in rows]).save(output / 'idle.png')
    pack([[r[1], r[0], r[2], r[0]] for r in rows]).save(output / 'supervisor.png')
    pack([[rows[1][1]], [rows[1][2]]]).save(output / 'front-steps.png')
    pack([[rows[2][1]], [rows[2][2]]]).save(output / 'back-steps.png')
    pack([[rows[0][1], rows[3][1]], [rows[0][2], rows[3][2]]]).save(output / 'side-steps.png')
    previews(rows, output)
    (output / 'provenance.json').write_text(json.dumps({
        'createdAt': datetime.now().isoformat(), 'model': config['model'],
        'matting': config['matting'], 'sources': records,
        'cell': CELL, 'bodyHeight': BODY_HEIGHT,
        'continuity': 'Idle head, torso, hands and folder reused in all phases; front/back lower-leg phase reflected only below skirt',
        'layout': {'rows': DIRECTIONS, 'columns': ['idle', 'contact A', 'contact B']},
    }, indent=2) + '\n')
    print(f'output={output}')


if __name__ == '__main__':
    main()
