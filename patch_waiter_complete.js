import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

content = content.replace(
  /updates\.status = 'delivered';/g,
  "updates.status = 'Completed';"
);
content = content.replace(
  /if \(updates\.status === 'delivered'\) \{/g,
  "if (updates.status === 'Completed') {"
);

// We need to also check the display button logic:
// disabled={order.status === 'delivered' ...} -> disabled={order.status === 'Completed' ...}
content = content.replace(
  /order\.status === 'delivered'/g,
  "order.status === 'Completed'"
);
// Make sure "delivered" strings are correctly replaced for "Completed"
content = content.replace(
  /o\.status !== 'delivered'/g,
  "o.status !== 'Completed'"
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
