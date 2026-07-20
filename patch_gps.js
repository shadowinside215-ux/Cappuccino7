import fs from 'fs';
let metadata = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
metadata.requestFramePermissions = (metadata.requestFramePermissions || []).filter(p => p !== 'geolocation');
fs.writeFileSync('metadata.json', JSON.stringify(metadata, null, 2));

let home = fs.readFileSync('src/pages/Home.tsx', 'utf8');
home = home.replace(/const \[showGeoPrompt, setShowGeoPrompt\] = useState\([\s\S]*?\]\);/, 'const showGeoPrompt = false;\n  const setShowGeoPrompt = () => {};');
home = home.replace(/navigator\.geolocation\.getCurrentPosition\([\s\S]*?\);/g, '');
fs.writeFileSync('src/pages/Home.tsx', home);

let cart = fs.readFileSync('src/pages/Cart.tsx', 'utf8');
cart = cart.replace(/const captureGPS = async \(retryOnTimeout = true\) => \{[\s\S]*?return new Promise\(\(resolve, reject\) => \{[\s\S]*?navigator\.geolocation\.getCurrentPosition\([\s\S]*?\);[\s\S]*?\}\);\n  \};/, 'const captureGPS = async (retryOnTimeout = true) => { return Promise.resolve(null); };');
cart = cart.replace(/const captureLocation = \(\) => \{[\s\S]*?navigator\.geolocation\.getCurrentPosition\([\s\S]*?\);[\s\S]*?\};/, 'const captureLocation = () => { toast.error("GPS disabled"); };');
fs.writeFileSync('src/pages/Cart.tsx', cart);
