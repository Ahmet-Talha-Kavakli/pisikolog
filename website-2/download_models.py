import urllib.request
import os

os.makedirs('public/models', exist_ok=True)
os.makedirs('public/textures', exist_ok=True)

downloads = {
    'public/models/neighborhood.glb': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/LittlestTokyo.glb',
    'public/textures/night_env.hdr': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr'
}

for path, url in downloads.items():
    print(f'Downloading {path}...')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(path, 'wb') as out_file:
            out_file.write(response.read())
        print(f'Done {path}')
    except Exception as e:
        print(f'Error downloading {path}: {e}')
