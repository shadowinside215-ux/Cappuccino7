const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('assets')) fs.mkdirSync('assets');

const svgCode = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#a6661a" />
  <path d="M512,230 C490,180 470,160 512,110 C554,160 534,180 512,230 Z" fill="white" />
  <path d="M262,512 A250,250 0 0,0 762,512" fill="none" stroke="white" stroke-width="30" />
  <path d="M312,512 A200,200 0 0,0 712,512" fill="none" stroke="white" stroke-width="25" />
  <path d="M362,512 C412,650 512,650 512,512 C512,650 612,650 662,512" fill="white" />
  
  <text x="512" y="780" font-family="sans-serif" font-size="110" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="3">CAPPUCCINO7</text>
  <text x="512" y="880" font-family="sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="5">MAHAJ SALA</text>
</svg>
`;

const splashCode = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#a6661a" />
  <g transform="translate(854, 854)">
    <path d="M512,230 C490,180 470,160 512,110 C554,160 534,180 512,230 Z" fill="white" />
    <path d="M262,512 A250,250 0 0,0 762,512" fill="none" stroke="white" stroke-width="30" />
    <path d="M312,512 A200,200 0 0,0 712,512" fill="none" stroke="white" stroke-width="25" />
    <path d="M362,512 C412,650 512,650 512,512 C512,650 612,650 662,512" fill="white" />
    <text x="512" y="780" font-family="sans-serif" font-size="110" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="3">CAPPUCCINO7</text>
    <text x="512" y="880" font-family="sans-serif" font-size="70" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="5">MAHAJ SALA</text>
  </g>
</svg>
`;

sharp(Buffer.from(svgCode))
  .png()
  .toFile('assets/icon.png')
  .then(() => sharp(Buffer.from(splashCode)).png().toFile('assets/splash.png'))
  .then(() => sharp(Buffer.from(svgCode)).resize(512, 512).png().toFile('public/pwa-512x512.png'))
  .then(() => sharp(Buffer.from(svgCode)).resize(192, 192).png().toFile('public/pwa-192x192.png'))
  .then(() => console.log('Images generated'))
  .catch(console.error);
