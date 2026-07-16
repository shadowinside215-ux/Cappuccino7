const fs = require('fs');

function patchCashier() {
  let file = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');
  file = file.replace(/where\('type', '==', 'loyalty_reward'\)/, "where('type', 'in', ['loyalty_reward', 'reward_redemption'])");
  fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', file);
}
patchCashier();
