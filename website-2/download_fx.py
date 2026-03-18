import urllib.request
import os

os.makedirs('public/models', exist_ok=True)
os.makedirs('public/textures/lensflare', exist_ok=True)

downloads = {
    'public/models/mind.glb': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb',
    'public/textures/lensflare/lensflare0.png': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare0.png',
    'public/textures/lensflare/lensflare3.png': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/lensflare/lensflare3.png'
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
