import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

content = content.replace(
  /const STATUS_MAP: Record<OrderStatus, WaiterOrderStatus> = \{[\s\S]*?\};/,
  `const STATUS_MAP: Record<OrderStatus, WaiterOrderStatus> = {
    pending: 'New',
    Waiting: 'New',
    accepted: 'Accepted',
    Taken: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready',
    delivered: 'Served',
    Completed: 'Served',
    Paid: 'Served',
    cancelled: 'Served',
    delivering: 'Preparing'
  };`
);

content = content.replace(
  /req\.status === 'accepted' \? 'border-amber-400/g,
  "(req.status === 'accepted' || req.status === 'Taken') ? 'border-amber-400"
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
