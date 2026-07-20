import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');
content = content.replace(
  /addOrderToStats\(docRef\.id, totalPrice, \{ skipCheck: true \}\)/,
  "addOrderToStats(docRef.id, totalPrice, { skipCheck: true, paymentMethod })"
);
fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
