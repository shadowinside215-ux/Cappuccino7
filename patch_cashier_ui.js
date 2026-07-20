import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

content = content.replace(
  /o\.status === 'delivered' \|\| o\.status === 'ready'/g,
  "(o.status === 'delivered' || o.status === 'Completed' || o.status === 'ready')"
);
content = content.replace(
  /o\.status !== 'delivered' && o\.status !== 'ready'/g,
  "(o.status !== 'delivered' && o.status !== 'Completed' && o.status !== 'ready')"
);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
