import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

// Update the query to only get unpaid orders
content = content.replace(
  /const qOrders = query\([\s\S]*?collection\(db, 'orders'\),\n\s*orderBy\('createdAt', 'asc'\)\n\s*\);/,
  `const qOrders = query(
        collection(db, 'orders'),
        where('isPaid', '==', false),
        orderBy('createdAt', 'asc')
      );`
);

// Update filteredOrders
content = content.replace(
  /const filteredOrders = orders\.filter\(o =>\s*o\.status !== 'delivered' &&\s*o\.status !== 'cancelled' &&\s*isMyZone\(o\.tableZone\)\s*\);/,
  `const filteredOrders = orders.filter(o => 
    !o.isPaid && 
    o.status !== 'cancelled' && 
    isMyZone(o.tableZone)
  );`
);

// We need to also check if we want to change activeOrders inside the onSnapshot (if it exists)
content = content.replace(
  /const activeOrders = data\.filter\(o => o\.status !== 'delivered' && o\.status !== 'cancelled'\);/g,
  `const activeOrders = data.filter(o => !o.isPaid && o.status !== 'cancelled');`
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
