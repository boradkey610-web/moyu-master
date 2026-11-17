import json
from pathlib import Path
import unittest
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/generated/player-typing-v2'


class TypingArtTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.meta = json.loads((OUT / 'preview.json').read_text())
        cls.atlas = np.array(Image.open(OUT / 'frames.png'))
        cls.motion = np.array(Image.open(OUT / 'motion-mask.png')) > 0

    def test_layout_and_nonclipping(self):
        self.assertEqual(self.atlas.shape, (512, 2304, 4))
        for i in range(6):
            frame = self.atlas[:, i * 384:(i + 1) * 384]
            self.assertEqual(int(frame[:3, :, 3].max()), 0)
            self.assertEqual(int(frame[-3:, :, 3].max()), 0)
            self.assertEqual(int(frame[:, :3, 3].max()), 0)
            self.assertEqual(int(frame[:, -3:, 3].max()), 0)

    def test_head_body_and_feet_are_pixel_identical(self):
        first = self.atlas[:, :384]
        for i in range(1, 6):
            frame = self.atlas[:, i * 384:(i + 1) * 384]
            np.testing.assert_array_equal(first[~self.motion], frame[~self.motion])
            self.assertGreater(int(np.any(first[self.motion] != frame[self.motion], axis=1).sum()), 100)

    def test_no_enclosed_white_pockets_above_hips(self):
        for i in range(6):
            frame = self.atlas[:290, i * 384:(i + 1) * 384]
            white = (frame[:, :, :3].min(2) > 230) & (np.ptp(frame[:, :, :3], axis=2) < 25) & (frame[:, :, 3] > 128)
            _, _, stats, _ = cv2.connectedComponentsWithStats(white.astype('uint8'), 8)
            self.assertFalse(any(area > 20 for area in stats[1:, cv2.CC_STAT_AREA]))

    def test_loop_and_preview_model(self):
        self.assertEqual(self.meta['model'], 'GPT-Image-2')
        self.assertEqual(self.meta['duration'], 1)
        sequence = self.meta['sequence']
        for i, value in enumerate(sequence):
            self.assertEqual(abs(value - sequence[(i + 1) % len(sequence)]), 1)


if __name__ == '__main__':
    unittest.main()
