#!/usr/bin/env python3
"""Restore free-arm swing without moving the folder or regenerating identity."""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

import importlib.util

SPEC = importlib.util.spec_from_file_location('build_art', Path(__file__).with_name('build-supervisor-art.py'))
BUILD = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(BUILD)
ROOT = Path(__file__).resolve().parents[1]
CELL = BUILD.CELL

# Traced along the original sleeve seam. The folder arm is never selected.
ARMS = {
    'front': {'polygon': [(224, 158), (237, 161), (247, 200), (254, 260), (255, 294), (243, 302), (234, 291), (233, 258), (229, 212), (221, 181)], 'pivot': (229, 168), 'angles': (-17, 17)},
    'back': {'polygon': [(152, 145), (161, 158), (164, 190), (155, 225), (153, 265), (155, 293), (143, 302), (134, 290), (137, 251), (140, 209), (144, 164)], 'pivot': (153, 157), 'angles': (17, -17)},
    'left': {'polygon': [(207, 160), (219, 170), (226, 205), (231, 250), (230, 293), (219, 307), (205, 298), (206, 270), (203, 226), (197, 190)], 'pivot': (209, 173), 'angles': (-25, 25)},
}


def arm_layer(idle, polygon):
    mask = Image.new('L', CELL)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    arm = idle.copy()
    arm.putalpha(Image.fromarray(np.minimum(np.asarray(idle.getchannel('A')), np.asarray(mask))))
    return arm, mask


def remove_arm(image, mask, direction):
    pixels = np.array(image)
    mask = mask.copy()
    # Include cuff/hand antialiasing beyond the traced inner sleeve boundary.
    ImageDraw.Draw(mask).polygon({
        'front': [(233, 235), (264, 235), (264, 320), (232, 320)],
        'back': [(126, 229), (156, 229), (156, 319), (126, 319)],
        'left': [(205, 227), (244, 227), (244, 324), (205, 324)],
    }[direction], fill=255)
    selected = (np.asarray(mask) > 0) & (pixels[:, :, 3] > 0)
    pixels[selected] = 0
    # Fill only the narrow seam inside the jacket; removed exterior stays clear.
    torso = Image.new('L', CELL)
    points = {'front': [(212, 170), (234, 194), (233, 268), (230, 318), (211, 318)],
              'back': [(161, 163), (149, 203), (148, 267), (151, 319), (176, 319)],
              'left': [(188, 169), (216, 181), (226, 239), (226, 324), (187, 324)]}[direction]
    ImageDraw.Draw(torso).polygon(points, fill=255)
    repair = (selected & (np.asarray(torso) > 0)).astype(np.uint8) * 255
    # Inpaint against the remaining foreground only. Transparent RGB=0 must
    # not bleed black into the reconstructed jacket side.
    original = np.asarray(image)
    valid = (original[:, :, 3] > 128) & ~selected
    _, nearest = BUILD.ndimage.distance_transform_edt(~valid, return_indices=True)
    rgb_source = original[:, :, :3].copy()
    rgb_source[~valid] = original[tuple(nearest)][~valid, :3]
    rgb = cv2.inpaint(rgb_source, repair, 5, cv2.INPAINT_TELEA)
    pixels[repair > 0, :3] = rgb[repair > 0]
    pixels[repair > 0, 3] = 255
    return Image.fromarray(pixels)


def animate(rows):
    checks = []
    for index, direction in enumerate(BUILD.DIRECTIONS):
        idle = rows[index][0]
        if direction == 'right':
            # The free left arm is on the far side in this view. Reuse the
            # same sleeve artwork, placed behind the torso, not the held arm.
            arm, _ = arm_layer(rows[3][0], ARMS['left']['polygon'])
            arm = arm.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            shifted = Image.new('RGBA', CELL)
            shifted.alpha_composite(arm, (37, -5))
            arm, pivot, angles = shifted, (212, 168), (25, -25)
            mask = None
        else:
            details = ARMS[direction]
            arm, mask = arm_layer(idle, details['polygon'])
            pivot, angles = details['pivot'], details['angles']
        for phase, angle in zip((1, 2), angles):
            moved = arm.rotate(angle, Image.Resampling.BICUBIC, center=pivot)
            if direction == 'right':
                result = moved.copy()
                result.alpha_composite(rows[index][phase])
            else:
                result = remove_arm(rows[index][phase], mask, direction)
                result.alpha_composite(moved)
            rows[index][phase] = result
        checks.append({'direction': direction, 'pivot': pivot, 'angles': angles})
    return checks


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=ROOT / 'assets/generated/supervisor-v5')
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/generated/supervisor-v7')
    args = parser.parse_args()
    sheet = Image.open(args.source / 'poses.png').convert('RGBA')
    rows = [[sheet.crop((x * 384, y * 480, (x + 1) * 384, (y + 1) * 480)) for x in range(3)] for y in range(4)]
    checks = animate(rows)
    args.output.mkdir(parents=True, exist_ok=False)
    BUILD.pack(rows).save(args.output / 'poses.png')
    BUILD.pack([[r[0]] for r in rows]).save(args.output / 'idle.png')
    BUILD.pack([[r[1], r[0], r[2], r[0]] for r in rows]).save(args.output / 'supervisor.png')
    BUILD.pack([[rows[1][1]], [rows[1][2]]]).save(args.output / 'front-steps.png')
    BUILD.pack([[rows[2][1]], [rows[2][2]]]).save(args.output / 'back-steps.png')
    BUILD.pack([[rows[0][1], rows[3][1]], [rows[0][2], rows[3][2]]]).save(args.output / 'side-steps.png')
    BUILD.previews(rows, args.output)
    provenance = json.loads((args.source / 'provenance.json').read_text())
    provenance['armAnimation'] = checks
    provenance['continuity'] = 'Folder arm and head remain fixed; anatomical left arm swings around shoulder, behind torso in right profile.'
    (args.output / 'provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(args.output)


if __name__ == '__main__':
    main()
