#!/usr/bin/env python3
"""Cut sequential AI drawings, align waist/feet, and interpolate a GIF study."""
import argparse
import importlib.util
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('preview', ROOT / 'dev/preview-player-dance.py')
PREVIEW = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PREVIEW)
CELL = (384, 480)


def align(cells):
    bounds = [im.getchannel('A').getbbox() for im in cells]
    anchors, scales = [], []
    for image in cells:
        pixels = np.asarray(image)
        hsv = cv2.cvtColor(pixels[:, :, :3], cv2.COLOR_RGB2HSV)
        yellow = ((hsv[:, :, 0] >= 12) & (hsv[:, :, 0] <= 36) &
                  (hsv[:, :, 1] > 120) & (pixels[:, :, 3] > 200))
        yy, xx = np.nonzero(yellow)
        if len(xx) < 100:
            raise ValueError('Missing yellow shirt in a frame')
        waist = float(np.median(xx[yy >= np.percentile(yy, 83)]))
        # Hat top gives body height without counting the raised pointing hand.
        cap = ((hsv[:, :, 1] < 95) & (hsv[:, :, 2] < 150) &
               (pixels[:, :, 3] > 180))
        cap[np.arange(image.height) >= np.percentile(yy, 83), :] = False
        count, labels, stats, centroids = cv2.connectedComponentsWithStats(cap.astype(np.uint8), 8)
        if count < 2:
            raise ValueError('Cannot locate black fedora')
        label = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
        cap_top = stats[label, cv2.CC_STAT_TOP]
        box = image.getchannel('A').getbbox()
        anchors.append(waist)
        scales.append(360 / (box[3] - cap_top))
    fit = min(1., 414 / max(s * (b[3] - b[1]) for s, b in zip(scales, bounds)))
    frames = []
    for image, box, waist, scale in zip(cells, bounds, anchors, scales):
        scale *= fit
        # Align the waistband, not the bounding box which expands with arms.
        resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
        x, y = round(192 - waist * scale), round(466 - box[3] * scale)
        frame = Image.new('RGBA', CELL)
        frame.alpha_composite(resized, (x, y))
        alpha = np.asarray(frame.getchannel('A'))
        if alpha[:, :3].max() or alpha[:, -3:].max() or alpha[:3].max():
            raise ValueError('Character clips after alignment')
        frames.append(frame)
    return frames


def cut(sheet, columns, rows):
    return [PREVIEW.ART.clean_mask(sheet.crop((round(column * sheet.width / columns), round(row * sheet.height / rows),
                round((column + 1) * sheet.width / columns), round((row + 1) * sheet.height / rows))),
                {'decontaminateWhite': True}) for row in range(rows) for column in range(columns)]


def interpolate(a, b, count):
    pa, pb = np.asarray(a).astype(np.float32) / 255, np.asarray(b).astype(np.float32) / 255
    white_a = pa[:, :, :3] * pa[:, :, 3:] + 1 - pa[:, :, 3:]
    white_b = pb[:, :, :3] * pb[:, :, 3:] + 1 - pb[:, :, 3:]
    gray_a = cv2.cvtColor(np.uint8(white_a * 255), cv2.COLOR_RGB2GRAY)
    gray_b = cv2.cvtColor(np.uint8(white_b * 255), cv2.COLOR_RGB2GRAY)
    flow = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    forward = flow.calc(gray_a, gray_b, None)
    backward = flow.calc(gray_b, gray_a, None)
    yy, xx = np.mgrid[:CELL[1], :CELL[0]].astype(np.float32)
    grid = np.stack([xx, yy], axis=2)
    # Premultiplied alpha prevents a pale halo in warped transparent edges.
    pa[:, :, :3] *= pa[:, :, 3:]
    pb[:, :, :3] *= pb[:, :, 3:]
    for step in range(count):
        if step == 0:
            yield a
            continue
        t = step / count
        ma = grid - forward * t
        mb = grid - backward * (1 - t)
        wa = cv2.remap(pa, ma[:, :, 0], ma[:, :, 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        wb = cv2.remap(pb, mb[:, :, 0], mb[:, :, 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
        # Prefer one warped silhouette rather than crossfading two bodies.
        # Blend texture only where both warped silhouettes already overlap.
        primary, secondary = (wa, wb) if t < .5 else (wb, wa)
        overlap = (wa[:, :, 3] > .5) & (wb[:, :, 3] > .5)
        result = primary.copy()
        result[overlap] = (wa * (1 - t) + wb * t)[overlap]
        result[:, :, :3] /= np.maximum(result[:, :, 3:], .001)
        yield Image.fromarray(np.uint8(np.clip(result, 0, 1) * 255))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--columns', type=int, default=6)
    parser.add_argument('--rows', type=int, default=4)
    parser.add_argument('--transitions', type=Path)
    parser.add_argument('--output', type=Path, default=ROOT / 'assets/generated/player-dance-eight-beat-v1')
    args = parser.parse_args()
    sheet = Image.open(args.source)
    cells = cut(sheet, args.columns, args.rows)
    if args.transitions:
        extra = cut(Image.open(args.transitions), 4, 2)
        # Seven drawings for each two-beat section, including actual arm returns.
        cells = (cells[:5] + cells[4:5] + extra[:1] + extra[1:4] + cells[8:11] + extra[4:5] +
                 extra[5:] + cells[14:18] + cells[18:24] + cells[:1])
        args.columns, args.rows = 7, 4
    frames = align(cells)
    args.output.mkdir(parents=True, exist_ok=False)
    sheet.save(args.output / 'source-sheet.png')
    if args.transitions:
        Image.open(args.transitions).save(args.output / 'source-transitions.png')
    atlas = Image.new('RGBA', (CELL[0] * args.columns, CELL[1] * args.rows))
    contact = Image.new('RGB', (192 * args.columns, 240 * args.rows), '#eee2cc')
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((index % args.columns) * CELL[0], (index // args.columns) * CELL[1]))
        small = frame.resize((192, 240), Image.Resampling.LANCZOS)
        contact.paste(small, ((index % args.columns) * 192, (index // args.columns) * 240), small)
    atlas.save(args.output / 'frames.png')
    contact.save(args.output / 'contact-sheet.png')
    smooth = [f for index, frame in enumerate(frames)
              for f in interpolate(frame, frames[(index + 1) % len(frames)], 3)]
    previews = []
    for index, frame in enumerate(smooth):
        canvas = Image.new('RGBA', (720, 560), '#f6ecdb')
        draw = ImageDraw.Draw(canvas)
        draw.rectangle((0, 447, 720, 560), fill='#e8dbc2')
        draw.text((24, 18), 'MJ / EIGHT-BEAT DANCE', fill='#564b3e')
        draw.text((24, 38), 'BRIM > POINT > GLIDE > RETURN', fill='#81715a')
        beat = min(8, 1 + index * 8 // len(smooth))
        for x, scale in ((230, .85), (566, 98 / 414)):
            PREVIEW.spotlight(canvas, x, 464, 350 * scale / .85, .8 if beat == 4 else .65)
            body = frame.resize((round(CELL[0] * scale), round(CELL[1] * scale)), Image.Resampling.LANCZOS)
            canvas.alpha_composite(body, (round(x - 192 * scale), round(464 - 466 * scale)))
        draw = ImageDraw.Draw(canvas)
        draw.text((192, 505), f'BEAT {beat} / 8', fill='#564b3e')
        draw.text((516, 505), 'GAME SIZE', fill='#564b3e')
        previews.append(canvas.convert('RGB'))
    durations = [round((i + 1) * 400 / len(previews)) * 10 - round(i * 400 / len(previews)) * 10
                 for i in range(len(previews))]
    previews[0].save(args.output / 'dance-eight-beat.gif', save_all=True, append_images=previews[1:],
                     duration=durations, loop=0, disposal=2)
    samples = Image.new('RGB', (720, 840), '#f6ecdb')
    for panel, index in enumerate((17, 19, 22, 39, 43, 47)):
        samples.paste(previews[index].crop((60, 70, 420, 490)).resize((240, 420)),
                      ((panel % 3) * 240, (panel // 3) * 420))
    samples.save(args.output / 'transition-check.png')
    # Also preserve the unwarped drawing sequence for honest quality comparison.
    native = [previews[i * 3] for i in range(len(frames))]
    native_durations = [round((i + 1) * 400 / len(native)) * 10 - round(i * 400 / len(native)) * 10
                        for i in range(len(native))]
    native[0].save(args.output / 'dance-drawn-frames.gif', save_all=True, append_images=native[1:],
                   duration=native_durations, loop=0, disposal=2)
    (args.output / 'preview.json').write_text(json.dumps({
        'model': 'GPT-Image-2', 'drawnFrames': len(frames), 'previewFrames': len(smooth),
        'durationMs': sum(durations), 'interpolation': 'bidirectional DIS optical-flow',
        'recommendedPreview': 'dance-drawn-frames.gif',
        'interpolationStatus': 'experimental; facial deformation can occur, not production-ready',
        'status': 'review-only, not active game assets'}, indent=2) + '\n')
    print(args.output / 'dance-drawn-frames.gif')


if __name__ == '__main__':
    main()
