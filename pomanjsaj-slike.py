"""
Stisne fotografije v mapi slike/, da je stran manjša od 1 GB (omejitev GitHub Pages).
PNG pretvori v JPG, daljšo stranico omeji na 1600 px in shrani s kakovostjo 82.
Na koncu posodobi albums.js, če se je kakšna končnica spremenila (.png -> .jpg).

Zaženi v mapi strani:
    python -m pip install pillow
    python pomanjsaj-slike.py
"""
import json, os, sys
from PIL import Image, ImageOps

MAX = 1600
QUALITY = 82

src = open('albums.js', encoding='utf-8').read()
header, data = src.split('window.ALBUMS = ', 1)
albums = json.loads(data.rstrip().rstrip(';'))

before = after = 0
n = 0
total = sum(len(a['f']) for a in albums)
for a in albums:
    for f in a['f']:
        if len(f) != 3:  # še na Bloggerju, preskoči
            continue
        path = f[0]
        if not os.path.exists(path):
            continue
        before += os.path.getsize(path)
        im = ImageOps.exif_transpose(Image.open(path))
        if im.mode not in ('RGB', 'L'):
            bg = Image.new('RGB', im.size, (0, 0, 0))
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA')
                bg.paste(im, mask=im.split()[-1])
            else:
                bg.paste(im.convert('RGB'))
            im = bg
        im.thumbnail((MAX, MAX), Image.LANCZOS)
        new_path = os.path.splitext(path)[0] + '.jpg'
        tmp = new_path + '.tmp'
        im.save(tmp, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        if os.path.exists(path) and path != new_path:
            os.remove(path)
        os.replace(tmp, new_path)
        after += os.path.getsize(new_path)
        f[0] = new_path.replace(os.sep, '/')
        f[1], f[2] = im.size
        n += 1
        sys.stdout.write(f"\r{n}/{total}"); sys.stdout.flush()

with open('albums.js', 'w', encoding='utf-8') as out:
    out.write(header + 'window.ALBUMS = ' + json.dumps(albums, ensure_ascii=False, separators=(',', ':')) + ';\n')

mb = lambda b: f"{b / 1024 / 1024:.0f} MB"
print(f"\nKončano: {n} slik, prej {mb(before)}, zdaj {mb(after)}. albums.js je posodobljen.")
