import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /snap\.docs\.forEach\(doc => \{\s*const order = doc\.data\(\);\s*\/\/ Items count\s*if \(order\.items && Array\.isArray\(order\.items\)\) \{/,
  `snap.docs.forEach(doc => {
          const order = doc.data();
          
          if (!(order.isPaid || order.status === 'Paid')) return; // STRICTLY ONLY PAID ORDERS

          // Items count
          if (order.items && Array.isArray(order.items)) {`
);

content = content.replace(
  /if \(order\.status === 'delivered' \|\| order\.status === 'Completed'\) \{/,
  "if (true) {"
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
