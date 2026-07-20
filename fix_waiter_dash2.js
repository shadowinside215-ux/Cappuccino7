import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

content = content.replace(
  /const waiterStatuses: Record<OrderStatus, WaiterOrderStatus> = \{[\s\S]*?\};/,
  `const waiterStatuses: Record<OrderStatus, WaiterOrderStatus> = {
        'pending': 'New',
        'Waiting': 'New',
        'accepted': 'Accepted',
        'Taken': 'Accepted',
        'preparing': 'Preparing',
        'ready': 'Ready',
        'delivered': 'Served',
        'Completed': 'Served',
        'Paid': 'Served',
        'cancelled': 'Served',
        'delivering': 'Preparing'
      };`
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
