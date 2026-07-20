import fs from 'fs';
let content = fs.readFileSync('src/types.ts', 'utf8');

// The replacement was: "isPaid?: boolean;\n  paidAt?: any;\n  paymentConfirmedAt?: any;"
// Let's just undo that and put it properly.
// Or we can just use regex to remove duplicates.
content = content.replace(/  paidAt\?: any;\n  paymentConfirmedAt\?: any;\n/g, "");
// Add paidAt exactly once if it doesn't exist
if (!content.includes('paidAt?: any;')) {
  content = content.replace(/isPaid\?: boolean;/, "isPaid?: boolean;\n  paidAt?: any;");
}
fs.writeFileSync('src/types.ts', content);
