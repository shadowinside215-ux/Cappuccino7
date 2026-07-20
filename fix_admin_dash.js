import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Remove Most Ordered Item block
content = content.replace(
  /\{stats\.mostOrderedItem && \([\s\S]*?<\/div>\s*\)\s*\}/,
  ""
);

// Remove Performance block
content = content.replace(
  /\{stats\.performance && \([\s\S]*?<\/div>\s*\)\s*\}/,
  ""
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
