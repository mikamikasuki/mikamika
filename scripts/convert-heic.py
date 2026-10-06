import sys

from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()
with Image.open(sys.argv[1]) as image:
    image.convert('RGB').save(sys.argv[2], format='JPEG', quality=95)
