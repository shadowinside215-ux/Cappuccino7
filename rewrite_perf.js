import fs from 'fs';

const template = `
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { Clock, ChefHat, Coffee, UserCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StaffPerformance() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)).filter(o => o.status === 'delivered'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (ms: number | undefined) => {
    if (!ms || ms < 0) return 'N/A';
    return Math.round(ms / 60000) + ' min';
  };

  const getMs = (timestamp: any) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    return new Date(timestamp).getTime();
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown Date';
    const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit' });
  };

  if (loading) return <div className="text-center py-20 uppercase font-black tracking-widest text-stone-400">Loading Performance Data...</div>;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">Staff Performance</h1>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const tCreate = getMs(order.createdAt);
          const tKStart = getMs(order.kitchenStartedAt);
          const tKReady = getMs(order.kitchenReadyAt);
          const tBStart = getMs(order.barmanStartedAt);
          const tBReady = getMs(order.barmanReadyAt);
          const tKComplete = getMs(order.kitchenCompletedAt);
          const tBComplete = getMs(order.barmanCompletedAt);
          
          const kitchenPrep = tKStart && tKReady ? tKReady - tKStart : null;
          const barmanPrep = tBStart && tBReady ? tBReady - tBStart : null;
          
          let waiterService = null;
          let waiterServiceStr = 'N/A';
          if (tKReady && tKComplete) {
             const kServe = tKComplete - tKReady;
             if (tBReady && tBComplete) {
                const bServe = tBComplete - tBReady;
                waiterServiceStr = \`Food: \${formatTime(kServe)} | Drink: \${formatTime(bServe)}\`;
             } else {
                waiterServiceStr = formatTime(kServe);
             }
          } else if (tBReady && tBComplete) {
             const bServe = tBComplete - tBReady;
             waiterServiceStr = formatTime(bServe);
          }

          return (
            <div key={order.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-stone-50 pb-4">
                <div>
                  <h4 className="font-black text-stone-900 uppercase italic tracking-tighter text-xl">{order.customerName}</h4>
                  <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{formatDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-stone-400">Order #{order.id.slice(-4).toUpperCase()}</span>
                  {order.waiterName && <p className="text-[9px] font-bold text-blue-500 mt-1 uppercase tracking-widest">Waiter: {order.waiterName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {kitchenPrep !== null && (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><ChefHat size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest">Kitchen Prep</p>
                      <p className="text-lg font-black text-amber-700">{formatTime(kitchenPrep)}</p>
                    </div>
                  </div>
                )}
                
                {barmanPrep !== null && (
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><Coffee size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black text-purple-600/60 uppercase tracking-widest">Barman Prep</p>
                      <p className="text-lg font-black text-purple-700">{formatTime(barmanPrep)}</p>
                    </div>
                  </div>
                )}

                {(kitchenPrep !== null || barmanPrep !== null) && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><UserCheck size={20} /></div>
                    <div>
                      <p className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Waiter Service</p>
                      <p className="text-sm mt-1 font-black text-blue-700">{waiterServiceStr}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <p className="text-xs font-black uppercase tracking-widest">No completed orders yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/admin/StaffPerformance.tsx', template);
