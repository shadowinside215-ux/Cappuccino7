import fs from 'fs';
let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

content = content.replace(
  /order\.status === 'delivered' \|\| order\.status === 'cancelled'/g,
  "order.status === 'delivered' || order.status === 'Completed' || order.status === 'Paid' || order.status === 'cancelled'"
);

content = content.replace(
  /order\.status === 'ready' \|\| order\.status === 'delivered'/g,
  "order.status === 'ready' || order.status === 'delivered' || order.status === 'Completed' || order.status === 'Paid'"
);

fs.writeFileSync('src/pages/Orders.tsx', content);
