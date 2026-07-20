import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /export type OrderStatus = 'pending' \| 'accepted' \| 'preparing' \| 'ready' \| 'delivering' \| 'delivered' \| 'cancelled';/,
  "export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled' | 'Waiting' | 'Taken' | 'Completed' | 'Paid';"
);

fs.writeFileSync('src/types.ts', content);
