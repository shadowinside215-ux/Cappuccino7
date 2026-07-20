import fs from 'fs';
let content = fs.readFileSync('src/pages/staff/KitchenDashboard.tsx', 'utf8');

content = content.replace(
  /<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\s*\{\/\* If there's persistent info like delivery notes \*\/\}/,
  `{activeTab === 'history' && (
                  <div className="mt-4 p-4 bg-stone-100 rounded-2xl flex items-center justify-between text-stone-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">Prep Time</span>
                    <span className="text-sm font-bold">
                      {order.kitchenReadyAt && order.kitchenStartedAt ? 
                        Math.round((order.kitchenReadyAt.toDate().getTime() - order.kitchenStartedAt.toDate().getTime()) / 60000) + ' min' 
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {activeTab === 'active' && (
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => updateKitchenStatus(order, order.kitchenStatus === 'pending' ? 'preparing' : 'ready')}
                      className={\`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all \${
                        order.kitchenStatus === 'preparing' 
                        ? 'bg-green-500 text-stone-950 shadow-lg shadow-green-500/20' 
                        : 'bg-stone-500/10 text-stone-500 hover:bg-stone-500/20 hover:text-bento-ink'
                      }\`}
                    >
                      {order.kitchenStatus === 'preparing' ? <CheckCircle2 size={24} /> : <Soup size={24} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {order.kitchenStatus === 'preparing' ? t('mark_ready_status') : t('mark_preparing')}
                      </span>
                    </button>
                  </div>
                )}
                {/* If there's persistent info like delivery notes */}`
);

fs.writeFileSync('src/pages/staff/KitchenDashboard.tsx', content);
