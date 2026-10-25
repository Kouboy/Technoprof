"""Verify the actual visible border, not just screenshot equality between builds."""
from pathlib import Path
import json
from PIL import Image

folder = Path(__file__).resolve().parent / 'checkpoints/window'
for browser in ['chromium', 'firefox', 'touch']:
    image = Image.open(folder / (browser + '-frame-page.png')).convert('RGB')
    region = json.loads((folder / (browser + '-frame-box.json')).read_text())
    box, viewport = region['frameBox'], region['viewport']
    width, height = box['width'], box['height']
    def pixel(x, y):
        return image.getpixel((int((box['x']+(x+.5)*width/320)*image.width/viewport['width']),int((box['y']+(y+.5)*height/240)*image.height/viewport['height'])))
    assert abs(width / height - 4 / 3) < 0.01
    for x, y, expected in [(10, 1, (117,128,128)), (4,30,(36,51,59)), (315,30,(56,73,76)), (10,177,(82,96,100))]:
        actual = pixel(x,y)
        assert actual == expected, (browser, (x,y), actual, expected)
    for y in [10, 30, 70, 90, 130, 150]:
        assert pixel(4,y) == (36,51,59), (browser,y,'left border over scenery')
    print(f'PASS {browser}: actual retained frame pixels at {width}x{height}')
