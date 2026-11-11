"""Pixel-level checks complement renderer routing tests, not visual acceptance."""
import importlib.util
import json
from pathlib import Path
import unittest

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('build_art', ROOT / 'dev/build-supervisor-art.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class SupervisorArtTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.loads((ROOT / 'assets/manifest.json').read_text())
        self.directory = ROOT / Path(self.manifest['supervisor-female']['src']).parent

    def test_folder_and_head_stay_fixed_while_free_arm_swings(self):
        image = np.asarray(Image.open(self.directory / 'poses.png'))
        folder_boxes = [(155, 250, 208, 300), (128, 235, 153, 295),
                        (220, 230, 250, 295), (150, 240, 158, 265)]
        for row in range(4):
            idle = image[row * 480:(row + 1) * 480, :384]
            left, top, right, bottom = folder_boxes[row]
            for phase in (1, 2):
                pose = image[row * 480:(row + 1) * 480, phase * 384:(phase + 1) * 384]
                np.testing.assert_array_equal(idle[:140], pose[:140])
                held = idle[top:bottom, left:right]
                # The far arm may show through antialiased silhouette pixels;
                # the opaque held-arm/folder artwork itself must not move.
                opaque = held[:, :, 3] == 255
                self.assertGreater(np.count_nonzero(opaque), 100)
                np.testing.assert_array_equal(held[opaque], pose[top:bottom, left:right][opaque])
            a = image[row * 480 + 150:row * 480 + 323, 384:768]
            b = image[row * 480 + 150:row * 480 + 323, 768:1152]
            self.assertGreater(np.count_nonzero(np.any(a != b, axis=2)), 300,
                               'Free arm must change between contact phases')

    def test_contact_phases_have_distinct_lower_bodies(self):
        image = np.asarray(Image.open(self.directory / 'poses.png'))
        for row in range(4):
            a = image[row * 480 + 323:(row + 1) * 480, 384:768]
            b = image[row * 480 + 323:(row + 1) * 480, 768:1152]
            self.assertGreater(np.count_nonzero(np.any(a != b, axis=2)), 500)

    def test_transparent_padding_and_no_frame_clipping(self):
        for name, meta in self.manifest.items():
            if 'supervisor-female' not in name:
                continue
            image = Image.open(ROOT / meta['src'])
            self.assertEqual(image.mode, 'RGBA')
            for row in meta['frames']:
                for f in row:
                    alpha = np.asarray(image.getchannel('A').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))
                    self.assertEqual(int(alpha[:, :4].max()), 0)
                    self.assertEqual(int(alpha[:, -4:].max()), 0)
                    self.assertGreater(np.count_nonzero(alpha > 128), 1000)

    def test_matting_removes_white_contamination_not_only_alpha(self):
        source = Image.new('RGB', (512, 512), 'white')
        draw = ImageDraw.Draw(source)
        draw.ellipse((100, 40, 410, 480), fill=(40, 65, 45))
        source = source.resize((128, 128), Image.Resampling.LANCZOS)
        result = np.asarray(build.clean_mask(source, {'decontaminateWhite': True}))
        edge = (result[:, :, 3] > 20) & (result[:, :, 3] < 230)
        self.assertGreater(edge.sum(), 20)
        self.assertLess(float(result[:, :, :3][edge].mean()), 100)
        self.assertEqual(int(result[0, :, 3].max()), 0)


if __name__ == '__main__':
    unittest.main()
