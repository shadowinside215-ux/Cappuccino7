import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/StaffPerformance.tsx', 'utf8');

const additionalStats = `
  const waiterCounts: Record<string, number> = {};
  orders.forEach(o => {
    if (o.waiterName) {
      waiterCounts[o.waiterName] = (waiterCounts[o.waiterName] || 0) + 1;
    }
  });
  let mostActiveWaiter = 'N/A';
  let maxOrders = 0;
  for (const [waiter, count] of Object.entries(waiterCounts)) {
    if (count > maxOrders) {
      maxOrders = count;
      mostActiveWaiter = waiter;
    }
  }

  // Find most sold products
  const productCounts: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach(item => {
      productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
    });
  });
  let mostSoldProduct = 'N/A';
  let maxSold = 0;
  for (const [prod, count] of Object.entries(productCounts)) {
    if (count > maxSold) {
      maxSold = count;
      mostSoldProduct = prod;
    }
  }
`;

content = content.replace(
  /if \(loading\) return/,
  additionalStats + "\n  if (loading) return"
);

const uiStats = `
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Most Active Waiter</p>
            <p className="text-xl font-black text-stone-900 uppercase italic tracking-tighter mt-1">{mostActiveWaiter} ({maxOrders} orders)</p>
          </div>
          <UserCheck size={32} className="text-blue-500 opacity-20" />
        </div>
        <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Most Sold Product</p>
            <p className="text-xl font-black text-stone-900 uppercase italic tracking-tighter mt-1">{mostSoldProduct} ({maxSold} sold)</p>
          </div>
          <ChefHat size={32} className="text-amber-500 opacity-20" />
        </div>
      </div>
`;

content = content.replace(
  /<div className="space-y-6">/,
  uiStats + '\n      <div className="space-y-6">'
);

fs.writeFileSync('src/pages/admin/StaffPerformance.tsx', content);
