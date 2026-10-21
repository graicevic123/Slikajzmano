"""
Prenese vse fotografije z Bloggerja v mapo slike/ in posodobi albums.js,
da stran uporablja lokalne slike namesto Bloggerjevih.

Zaženi v mapi strani:  python prenesi-slike.py
Potrebuješ Python 3. Prenos lahko prekineš in ponoviš; že prenesene slike preskoči.
"""
import json, os, re, sys, time, urllib.request

BLOGGER = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/'
SIZE = 's1600'

src = open('albums.js', encoding='utf-8').read()
header, data = src.split('window.ALBUMS = ', 1)
albums = json.loads(data.rstrip().rstrip(';'))

total = sum(len(a['f']) for a in albums)
done = failed = 0
for a in albums:
    folder = os.path.join('slike', a['s'])
    os.makedirs(folder, exist_ok=True)
    new = []
    for i, f in enumerate(a['f'], 1):
        if len(f) == 3:  # že lokalna
            new.append(f); done += 1; continue
        ext = os.path.splitext(f[1])[1].lower() or '.jpg'
        path = f"{folder}/{i:02d}{ext}"
        if not os.path.exists(path):
            url = f"{BLOGGER}{f[0]}/{SIZE}/{f[1]}"
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=60) as r, open(path, 'wb') as out:
                    out.write(r.read())
            except Exception as e:
                print(f"\nNapaka: {a['t']} #{i}: {e}")
                failed += 1
                new.append(f)
                continue
            time.sleep(0.1)
        new.append([path.replace(os.sep, '/'), f[2], f[3]])
        done += 1
        sys.stdout.write(f"\r{done}/{total}"); sys.stdout.flush()
    a['f'] = new

with open('albums.js', 'w', encoding='utf-8') as out:
    out.write(header + 'window.ALBUMS = ' + json.dumps(albums, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f"\nKončano: {done} slik, napak: {failed}. albums.js je posodobljen.")
