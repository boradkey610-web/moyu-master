import importlib.util
from pathlib import Path
import unittest
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('matte', ROOT / 'dev/clean-dance-matte.py')
MATTE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MATTE)


class DanceMatteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = Image.open(MATTE.SOURCE).convert('RGBA')
        cls.cleaned, cls.removed = MATTE.clean(cls.original)

    def test_geometry_and_colors_preserved(self):
        a, b = np.array(self.original), np.array(self.cleaned)
        self.assertEqual(self.cleaned.size, (2688, 1920))
        np.testing.assert_array_equal(a[:, :, :3], b[:, :, :3])
        changed = a[:, :, 3] != b[:, :, 3]
        self.assertTrue(changed.any())
        self.assertTrue((b[changed, 3] == 0).all())
        self.assertEqual(len(self.removed), 17)

    def test_large_white_pockets_removed_small_highlights_preserved(self):
        a, b = np.array(self.original), np.array(self.cleaned)
        for frame in range(28):
            x, y = frame % 7 * 384, frame // 7 * 480
            before, after = a[y:y + 480, x:x + 384], b[y:y + 480, x:x + 384]
            white = (before[:, :, :3].min(2) > 230) & (np.ptp(before[:, :, :3], axis=2) < 25) & (before[:, :, 3] > 128)
            count, labels, stats, _ = cv2.connectedComponentsWithStats(white.astype('uint8'), 8)
            for label in range(1, count):
                mask = labels == label
                if stats[label, cv2.CC_STAT_AREA] <= 300:
                    np.testing.assert_array_equal(before[mask], after[mask])
                else:
                    self.assertTrue((after[mask, 3] == 0).all())

    def test_repeat_cleanup_is_idempotent_and_output_matches(self):
        again, removed = MATTE.clean(self.cleaned)
        self.assertEqual(removed, [])
        np.testing.assert_array_equal(np.array(again), np.array(self.cleaned))
        with Image.open(MATTE.OUTPUT / 'frames.png') as output:
            np.testing.assert_array_equal(np.array(output), np.array(self.cleaned))


if __name__ == '__main__':
    unittest.main()
