import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/StaffPerformance.tsx', 'utf8');
content = content.replace(
  /order\.cashierName/g,
  "(order as any).cashierName"
);
fs.writeFileSync('src/pages/admin/StaffPerformance.tsx', content);
