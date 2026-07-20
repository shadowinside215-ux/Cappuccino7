import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/StaffPerformance.tsx', 'utf8');

content = content.replace(
  /filter\(o => o\.status === 'delivered'\)/g,
  "filter(o => o.status === 'delivered' || o.status === 'Completed' || o.status === 'Paid' || o.isPaid)"
);

fs.writeFileSync('src/pages/admin/StaffPerformance.tsx', content);
