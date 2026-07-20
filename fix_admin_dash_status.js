import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /order\.status === 'completed'/g,
  "order.status === 'Completed'"
);
content = content.replace(
  /order\.status === 'delivered' \? 'bg-green-50 text-green-600'/g,
  "(order.status === 'delivered' || order.status === 'Completed') ? 'bg-green-50 text-green-600'"
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
