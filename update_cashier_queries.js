import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

content = content.replace(
  /where\('status', 'in', \['pending', 'accepted', 'preparing', 'ready'\]\)/g,
  "where('status', 'in', ['pending', 'Waiting', 'accepted', 'Taken', 'preparing', 'ready'])"
);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
