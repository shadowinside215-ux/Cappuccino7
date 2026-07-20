import fs from 'fs';
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// The code looks like it was partially removed. I will replace the captureLocation function entirely.
content = content.replace(
  /const captureLocation = \(\) => \{[\s\S]*?\{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 \}\n    \);\n  \};/,
  `const captureLocation = () => { toast.error("GPS disabled"); };`
);

// If the regex above doesn't match because of the corrupted state, I will just find the block and replace it manually.
fs.writeFileSync('src/pages/Home.tsx', content);
