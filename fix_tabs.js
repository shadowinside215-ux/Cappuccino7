import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

const missingTabs = `           <button 
             onClick={() => setView('pos')}
             className={\`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 \${view === 'pos' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}\`}
           >
             {t('pos_take_order')}
           </button>
           <button 
             onClick={() => setView('pending')}
             className={\`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative whitespace-nowrap \${view === 'pending' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}\`}
           >
             {t('pos_pending_payments')}
             {unpaidOrders.length > 0 && (
               <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full font-black">
                 {unpaidOrders.length}
               </span>
             )}
           </button>`;

content = content.replace(
  '<div className="flex-1 flex gap-2 md:gap-4 ml-2">',
  '<div className="flex-1 flex gap-2 md:gap-4 ml-2">\n' + missingTabs
);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
