import fs from 'fs';

const dashboards = [
  'src/pages/staff/KitchenDashboard.tsx',
  'src/pages/staff/BarmanDashboard.tsx',
  'src/pages/waiter/WaiterDashboard.tsx'
];

dashboards.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /order\.createdAt\?\.toDate \? order\.createdAt\.toDate\(\)\.toLocaleTimeString\('fr-FR', \{ timeZone: 'Africa\/Casablanca' \}\) : 'NOW'/g,
      "order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') + ' ' + order.createdAt.toDate().toLocaleTimeString('fr-FR', { timeZone: 'Africa/Casablanca' }) : 'NOW'"
    );
    fs.writeFileSync(file, content);
  }
});
