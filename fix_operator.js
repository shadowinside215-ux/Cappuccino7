import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

const regex = /<button[\s\S]*?onClick=\{\(\) => setShowVendeurGrid\(true\)\}[\s\S]*?<\/button>/;
content = content.replace(regex, "");

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
