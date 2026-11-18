import unittest
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


class CaughtArtTests(unittest.TestCase):
    def test_speaking_changes_only_the_mouth(self):
        for name, box in [('boss', (280, 195, 350, 240)), ('supervisor', (280, 160, 350, 210))]:
            with Image.open(ROOT / f'assets/generated/caught-game-v1/{name}-speech-frames.png') as atlas:
                self.assertEqual(atlas.size, (1200, 540))
                closed = np.array(atlas.crop((0, 0, 600, 540)))
                opened = np.array(atlas.crop((600, 0, 1200, 540)))
            changed = np.any(closed != opened, axis=2)
            self.assertTrue(changed.any())
            left, top, right, bottom = box
            changed[top:bottom, left:right] = False
            self.assertFalse(changed.any(), f'{name}: speech must not move body, glasses or folder')

    def test_runtime_character_atlases_are_transparent_and_have_three_poses(self):
        for name in ['boss', 'supervisor', 'player']:
            with Image.open(ROOT / f'assets/generated/caught-game-v1/{name}-frames.png') as atlas:
                self.assertEqual(atlas.mode, 'RGBA')
                self.assertEqual(atlas.size, (1800, 540))
                self.assertEqual(atlas.getchannel('A').getextrema(), (0, 255))
                self.assertEqual(len({atlas.crop((i * 600, 0, (i + 1) * 600, 540)).tobytes() for i in range(3)}), 3)

    def test_phone_speech_keeps_camera_body_and_phone_pixel_identical(self):
        for name, box in [('boss', (320, 278, 389, 303)), ('supervisor', (311, 282, 377, 310))]:
            with Image.open(ROOT / f'assets/generated/caught-phone-game-v1/{name}-speech.png') as atlas:
                self.assertEqual(atlas.size, (1364, 768))
                closed = np.array(atlas.crop((0, 0, 682, 768)))
                opened = np.array(atlas.crop((682, 0, 1364, 768)))
            changed = np.any(closed != opened, axis=2)
            self.assertTrue(changed.any())
            left, top, right, bottom = box
            changed[top:bottom, left:right] = False
            self.assertFalse(changed.any(), name + ': phone, head and body cannot jump during dialogue')


if __name__ == '__main__':
    unittest.main()
