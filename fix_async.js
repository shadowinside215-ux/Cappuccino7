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
    content = content.replace(/onClick=\{\(\) => \{\s*try \{\s*await signOutApp/g, "onClick={async () => {\n                try {\n                  await signOutApp");
    fs.writeFileSync(path, content);
  }
}
