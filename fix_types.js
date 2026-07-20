import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /isPaid\?: boolean;/,
  "isPaid?: boolean;\n  paidAt?: any;\n  paymentConfirmedAt?: any;"
);

fs.writeFileSync('src/types.ts', content);
