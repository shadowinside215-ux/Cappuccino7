import fs from 'fs';
let content = fs.readFileSync('src/components/OrderTimer.tsx', 'utf8');

const oldDecl = `  const isCompletedStatus = ['ready', 'delivered', 'Completed', 'Paid', 'cancelled'].includes(status);
  const isOrderActive = !isCompletedStatus;`;

content = content.replace(oldDecl, "");

const insert = `  const durationMins = prepTime || (variant === 'admin' ? 30 : 10);
  const isCompletedStatus = ['ready', 'delivered', 'Completed', 'Paid', 'cancelled'].includes(status);
  const isOrderActive = !isCompletedStatus;`;

content = content.replace(/  const durationMins = prepTime \|\| \(variant === 'admin' \? 30 : 10\);/, insert);

fs.writeFileSync('src/components/OrderTimer.tsx', content);
