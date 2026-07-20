import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

content = content.replace(
  /const completedOrders = orders\.filter\(o => o\.status === 'delivered'\)\.slice\(0, 15\);/,
  "const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'Completed' || o.status === 'Paid' || o.isPaid).slice(0, 15);"
);

fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
