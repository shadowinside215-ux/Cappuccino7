import fs from 'fs';
let content = fs.readFileSync('src/lib/stats.ts', 'utf8');

content = content.replace(
  /isPaid: true,\n\s*paymentConfirmedAt: serverTimestamp\(\), paidAt: serverTimestamp\(\)/,
  "isPaid: true,\n      status: 'Paid',\n      paymentConfirmedAt: serverTimestamp(), paidAt: serverTimestamp()"
);

fs.writeFileSync('src/lib/stats.ts', content);
