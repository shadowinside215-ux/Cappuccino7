import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

// Update border style for delivered orders
content = content.replace(
  /order\.status === 'ready' \? 'ring-4 ring-green-400 border-green-400' : 'border-stone-100'/g,
  "order.status === 'ready' ? 'ring-4 ring-green-400 border-green-400' : order.status === 'delivered' ? 'border-2 border-dashed border-amber-300 opacity-80' : 'border-stone-100'"
);

// Disable complete button logic
content = content.replace(
  /disabled=\{order\.status !== 'ready' && order\.kitchenStatus !== 'ready' && order\.barmanStatus !== 'ready'\}/g,
  "disabled={order.status === 'delivered' || (order.status !== 'ready' && order.kitchenStatus !== 'ready' && order.barmanStatus !== 'ready')}"
);

// If delivered, change the button text to "Waiting for Payment"
content = content.replace(
  /<span className="text-\[10px\] font-black uppercase tracking-widest leading-none">\{t\('complete'\)\}<\/span>/g,
  `<span className="text-[10px] font-black uppercase tracking-widest leading-none">{order.status === 'delivered' ? t('waiting_for_payment', 'Waiting for Payment') : t('complete')}</span>`
);

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
