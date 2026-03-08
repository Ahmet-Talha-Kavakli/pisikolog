import urllib.request
import os

os.makedirs('public/textures', exist_ok=True)

textures = {
    'earth_day.jpg': 'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    'earth_night.jpg': 'https://www.solarsystemscope.com/textures/download/2k_earth_nightmap.jpg',
    'earth_clouds.jpg': 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg',
    'moon.jpg': 'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
    'saturn.jpg': 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
    'saturn_ring.png': 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png'
}

for name, url in textures.items():
    print(f'Downloading {name}...')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as response, open(f'public/textures/{name}', 'wb') as out_file:
            out_file.write(response.read())
        print(f'Done {name}')
    except Exception as e:
        print(f'Error downloading {name}: {e}')
