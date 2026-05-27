const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('assets')) fs.mkdirSync('assets');
if (!fs.existsSync('public')) fs.mkdirSync('public');

async function generate() {
  try {
    const buffer = fs.readFileSync('temp.png');

    console.log('Generating assets from temp.png...');
    
    // assets/icon.png for Capacitor splash/icon generation
    await sharp(buffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 156, g: 102, b: 28, alpha: 1 } }) // Padded if needed
      .png()
      .toFile('assets/icon.png');

    // assets/splash.png for Capacitor splash
    await sharp(buffer)
      .resize(2732, 2732, { fit: 'contain', background: { r: 156, g: 102, b: 28, alpha: 1 } })
      .png()
      .toFile('assets/splash.png');

    // public icons for PWA and favicon
    await sharp(buffer)
      .resize(512, 512, { fit: 'contain', background: { r: 156, g: 102, b: 28, alpha: 1 } })
      .png()
      .toFile('public/pwa-512x512.png');

    await sharp(buffer)
      .resize(192, 192, { fit: 'contain', background: { r: 156, g: 102, b: 28, alpha: 1 } })
      .png()
      .toFile('public/pwa-192x192.png');

    await sharp(buffer)
      .resize(64, 64, { fit: 'contain', background: { r: 156, g: 102, b: 28, alpha: 1 } })
      .png()
      .toFile('public/favicon.ico');

    console.log('Successfully generated all icons from user logo. ✅');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
