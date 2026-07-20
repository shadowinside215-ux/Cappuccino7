import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const regex = /<button\s+onClick=\{\(\) => navigate\('\/admin\/performance'\)\}[\s\S]*?<\/button>/;
content = content.replace(regex, "");

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
