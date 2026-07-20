import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

content = content.replace(
  /formatInTimeZone\(order\.createdAt\.toDate\(\), 'Africa\/Casablanca', 'HH:mm:ss'\)/g,
  "formatInTimeZone(order.createdAt.toDate(), 'Africa/Casablanca', 'dd/MM/yyyy HH:mm:ss')"
);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
