const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('assets')) fs.mkdirSync('assets');

const svgCode = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#9c661c" />
  
  <!-- Centered White Heart at the top of the Tulip/Rosette -->
  <path d="M512,246 C512,246 457,196 457,161 C457,131 482,111 512,141 C542,111 567,131 567,161 C567,196 512,246 512,246 Z" fill="white" />
  
  <!-- Left Side Symmetrical Leaves of the Latte Art Rosette -->
  <path d="M497,256 C463,256 443,288 471,328 C481,318 497,298 497,256 Z" fill="white" />
  <path d="M492,301 C433,306 408,348 458,398 C472,384 492,352 492,301 Z" fill="white" />
  <path d="M487,351 C399,358 369,421 434,476 C455,453 487,411 487,351 Z" fill="white" />
  <path d="M482,406 C367,417 332,491 407,556 C433,524 482,467 482,406 Z" fill="white" />

  <!-- Right Side Symmetrical Leaves of the Latte Art Rosette -->
  <path d="M527,256 C561,256 581,288 553,328 C543,318 527,298 527,256 Z" fill="white" />
  <path d="M532,301 C591,306 616,348 566,398 C552,384 532,352 532,301 Z" fill="white" />
  <path d="M537,351 C625,358 655,421 590,476 C569,453 537,411 537,351 Z" fill="white" />
  <path d="M542,406 C657,417 692,491 617,556 C591,524 542,467 542,406 Z" fill="white" />

  <!-- Side Flanking Crescent Wings wrapping from the upper outer areas down and around -->
  <path d="M300,240 C234,342 234,484 340,584 C360,599 380,614 405,624" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
  <path d="M724,240 C790,342 790,484 684,584 C664,599 644,614 619,624" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />

  <!-- Bottom Concentric Arcs mimicking the latte art layers -->
  <path d="M352,530 A180,180 0 0,0 672,530" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
  <path d="M392,565 A140,140 0 0,0 632,565" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
  <path d="M432,600 A100,100 0 0,0 592,600" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />

  <!-- Typography matching high-res pasted logo -->
  <text x="512" y="785" font-family="Georgia, 'Times New Roman', Times, serif" font-size="122" font-weight="700" fill="white" text-anchor="middle" letter-spacing="3">CAPPUCCINO7</text>
  <text x="512" y="875" font-family="'Inter', -apple-system, sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle" letter-spacing="14">MAHAJ SALA</text>
</svg>
`;

const splashCode = `
<svg width="2732" height="2732" viewBox="0 0 2732 2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#9c661c" />
  <g transform="translate(854, 854)">
    <!-- Centered White Heart at the top of the Tulip/Rosette -->
    <path d="M512,246 C512,246 457,196 457,161 C457,131 482,111 512,141 C542,111 567,131 567,161 C567,196 512,246 512,246 Z" fill="white" />
    
    <!-- Left Side Symmetrical Leaves of the Latte Art Rosette -->
    <path d="M497,256 C463,256 443,288 471,328 C481,318 497,298 497,256 Z" fill="white" />
    <path d="M492,301 C433,306 408,348 458,398 C472,384 492,352 492,301 Z" fill="white" />
    <path d="M487,351 C399,358 369,421 434,476 C455,453 487,411 487,351 Z" fill="white" />
    <path d="M482,406 C367,417 332,491 407,556 C433,524 482,467 482,406 Z" fill="white" />

    <!-- Right Side Symmetrical Leaves of the Latte Art Rosette -->
    <path d="M527,256 C561,256 581,288 553,328 C543,318 527,298 527,256 Z" fill="white" />
    <path d="M532,301 C591,306 616,348 566,398 C552,384 532,352 532,301 Z" fill="white" />
    <path d="M537,351 C625,358 655,421 590,476 C569,453 537,411 537,351 Z" fill="white" />
    <path d="M542,406 C657,417 692,491 617,556 C591,524 542,467 542,406 Z" fill="white" />

    <!-- Side Flanking Crescent Wings wrapping from the upper outer areas down and around -->
    <path d="M300,240 C234,342 234,484 340,584 C360,599 380,614 405,624" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
    <path d="M724,240 C790,342 790,484 684,584 C664,599 644,614 619,624" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />

    <!-- Bottom Concentric Arcs mimicking the latte art layers -->
    <path d="M352,530 A180,180 0 0,0 672,530" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
    <path d="M392,565 A140,140 0 0,0 632,565" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />
    <path d="M432,600 A100,100 0 0,0 592,600" fill="none" stroke="white" stroke-width="20" stroke-linecap="round" />

    <!-- Typography matching high-res pasted logo -->
    <text x="512" y="785" font-family="Georgia, 'Times New Roman', Times, serif" font-size="122" font-weight="700" fill="white" text-anchor="middle" letter-spacing="3">CAPPUCCINO7</text>
    <text x="512" y="875" font-family="'Inter', -apple-system, sans-serif" font-size="64" font-weight="700" fill="white" text-anchor="middle" letter-spacing="14">MAHAJ SALA</text>
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
