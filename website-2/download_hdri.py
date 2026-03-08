import urllib.request
import os

downloads = {
    'public/textures/night_env.hdr': 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr'
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
