import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

content = content.replace(
  /order\.createdAt\?\.toDate\(\)\.toLocaleTimeString\('fr-FR', \{ hour: '2-digit', minute: '2-digit', timeZone: 'Africa\/Casablanca' \}\)/g,
  "order.createdAt?.toDate().toLocaleDateString('en-GB') + ' ' + order.createdAt?.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })"
);

content = content.replace(
  /order\.deliveredAt\.toDate\(\)\.toLocaleTimeString\('fr-FR', \{ hour: '2-digit', minute: '2-digit', timeZone: 'Africa\/Casablanca' \}\)/g,
  "order.deliveredAt.toDate().toLocaleDateString('en-GB') + ' ' + order.deliveredAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })"
);

fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);

// Also check AdminDashboard.tsx just in case
if (fs.existsSync('src/pages/admin/AdminDashboard.tsx')) {
  let adminDash = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
  adminDash = adminDash.replace(
    /toLocaleTimeString\('fr-FR'/g,
    "toLocaleDateString('en-GB') + ' ' + $&" 
  );
  // Wait, the regex replacement above is a bit risky. Let's just do it manually if needed.
}
