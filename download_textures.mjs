import https from 'https';
import fs from 'fs';
import path from 'path';

const urls = [
    'https://www.solarsystemscope.com/textures/download/2k_earth_daymap.jpg',
    'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
    'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
    'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
    'https://www.solarsystemscope.com/textures/download/2k_moon.jpg',
    'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg'
];

const destDir = path.join(process.cwd(), 'website-2', 'public', 'textures');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

urls.forEach(url => {
    const filename = path.basename(url);
    const destPath = path.join(destDir, filename);

    https.get(url, (res) => {
        if (res.statusCode !== 200) {
            console.error(`Failed to download ${url}: ${res.statusCode}`);
            return;
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        console.error(`Error downloading ${url}:`, err.message);
    });
});
