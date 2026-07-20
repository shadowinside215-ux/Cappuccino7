import fs from 'fs';
let content = fs.readFileSync('src/pages/Cart.tsx', 'utf8');

content = content.replace(
  /orderData\.status = 'pending' as OrderStatus;/g,
  "orderData.status = 'Waiting' as OrderStatus;"
);

fs.writeFileSync('src/pages/Cart.tsx', content);
