import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /unsubRev\(\);/g,
  `unsubRev();
      if (typeof unsubToday !== 'undefined') unsubToday();
      if (typeof unsubMonth !== 'undefined') unsubMonth();`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
