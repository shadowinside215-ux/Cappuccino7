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
    content = content.replace(/onClick=\{\(\) => \{/g, "onClick={async () => {");
    fs.writeFileSync(path, content);
  }
}
