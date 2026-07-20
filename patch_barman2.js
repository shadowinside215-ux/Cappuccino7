import fs from 'fs';
let content = fs.readFileSync('src/pages/staff/BarmanDashboard.tsx', 'utf8');

content = content.replace(
  /\{\/\* Action Buttons \*\/\}[\s\S]*?<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\n\s*\{\/\* If there's persistent info like delivery notes \*\/\}/,
  `{/* Action Buttons */}
                {activeTab === 'history' && (
                  <div className="mt-4 p-4 bg-stone-100 rounded-2xl flex items-center justify-between text-stone-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">Prep Time</span>
                    <span className="text-sm font-bold">
                      {order.barmanReadyAt && order.barmanStartedAt ? 
                        Math.round((order.barmanReadyAt.toDate().getTime() - order.barmanStartedAt.toDate().getTime()) / 60000) + ' min' 
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {activeTab === 'active' && (
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => updateBarmanStatus(order, order.barmanStatus === 'pending' ? 'preparing' : 'ready')}
                      className={\`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all \${
                        order.barmanStatus === 'preparing' 
                        ? 'bg-amber-500 text-stone-900 shadow-lg shadow-amber-500/20' 
                        : 'bg-stone-500/10 text-stone-500 hover:bg-stone-500/20 hover:text-bento-ink'
                      }\`}
                    >
                      {order.barmanStatus === 'preparing' ? <CheckCircle2 size={24} /> : <Coffee size={24} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {order.barmanStatus === 'preparing' ? t('mark_ready_status') : t('mark_preparing')}
                      </span>
                    </button>
                  </div>
                )}
                {/* If there's persistent info like delivery notes */}`
);

fs.writeFileSync('src/pages/staff/BarmanDashboard.tsx', content);
