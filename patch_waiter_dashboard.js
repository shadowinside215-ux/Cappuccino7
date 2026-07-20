import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

// Filter:
// If the order has a waiterId, it must equal auth.currentUser?.uid.
// If it doesn't have a waiterId, anyone in the zone can see it.

const replacement = `  const filteredOrders = orders.filter(o => 
    !o.isPaid && 
    o.status !== 'cancelled' && 
    isMyZone(o.tableZone) &&
    (!o.waiterId || o.waiterId === auth.currentUser?.uid)
  );`;

content = content.replace(
  /const filteredOrders = orders\.filter\(o =>\s*!o\.isPaid &&\s*o\.status !== 'cancelled' &&\s*isMyZone\(o\.tableZone\)\s*\);/,
  replacement
);

const acceptOrderReplacement = `        waiterId: waiterId,
        waiterName: waiterName,
        waiterStatus: 'Accepted',
        status: 'Taken',
        timeAccepted: serverTimestamp(),
        updatedAt: serverTimestamp()`;

content = content.replace(
  /waiterId: waiterId,\s*waiterName: waiterName,\s*waiterStatus: 'Accepted',\s*status: 'accepted',\s*updatedAt: serverTimestamp\(\)/,
  acceptOrderReplacement
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
