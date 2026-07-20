import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');
content = content.replace(
  /const activeOrders = orders\.filter\(o => o\.status !== 'delivered' && o\.status !== 'cancelled'\);/,
  "const activeOrders = orders.filter(o => !o.isPaid && o.status !== 'Paid' && o.status !== 'cancelled');"
);
fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);

let history = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');
history = history.replace(
  /const historyOrders = orders\.filter\(o => \s*\(o\.status === 'delivered' \|\| o\.status === 'Completed' \|\| o\.status === 'Paid' \|\| o\.isPaid\) &&/,
  "const historyOrders = orders.filter(o => (o.isPaid || o.status === 'Paid') &&"
);
fs.writeFileSync('src/components/AdminHistoryTab.tsx', history);

