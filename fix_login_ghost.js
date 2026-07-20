import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*const checkRedirectResult = async \(\) => \{[\s\S]*?checkRedirectResult\(\);\s*\}, \[navigate\]\);/g;
content = content.replace(regex, '');

fs.writeFileSync('src/pages/Login.tsx', content);
