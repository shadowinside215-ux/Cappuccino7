import fs from 'fs';

const dashboards = [
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/waiter/WaiterDashboard.tsx',
  'src/pages/staff/KitchenDashboard.tsx',
  'src/pages/staff/BarmanDashboard.tsx',
  'src/pages/cashier/CashierDashboard.tsx'
];

for (const path of dashboards) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    // Just in case my previous regex didn't match all of them:
    content = content.replace(/onClick=\{\(\) => \{\s*try \{\s*await/g, "onClick={async () => {\n                try {\n                  await");
    fs.writeFileSync(path, content);
  }
}
