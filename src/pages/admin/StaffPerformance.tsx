import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { ChefHat, UserCheck, ArrowLeft, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { signOutApp } from '../../lib/googleAuth';
import { format, isToday } from 'date-fns';

export default function StaffPerformance() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Only load completed/paid orders to track history
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Order))
          .filter(o => o.status === 'Completed' || o.status === 'Paid' || o.isPaid || o.status === 'delivered')
      );
      setLoading(false);
    }, (error) => {
      console.warn("Staff performance listener error:", error.message);
    });
    return () => unsubscribe();
  }, []);

  const getMs = (timestamp: any) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate().getTime();
    return new Date(timestamp).getTime();
  };

  const formatTimestamp = (timestamp: any) => {
    const ms = getMs(timestamp);
    if (!ms) return 'N/A';
    return format(new Date(ms), 'HH:mm:ss');
  };

  const formatDuration = (startMs: number | null, endMs: number | null) => {
    if (!startMs || !endMs) return 'N/A';
    const diffMs = endMs - startMs;
    if (diffMs < 0) return '0 min 00 sec';
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    if (minutes === 0) return `${seconds} sec`;
    return `${minutes} min ${seconds < 10 ? '0' : ''}${seconds} sec`;
  };

  const getDurationMs = (startMs: number | null, endMs: number | null) => {
    if (!startMs || !endMs) return null;
    const diff = endMs - startMs;
    return diff >= 0 ? diff : null;
  };

  // Performance calculations
  let mostActiveWaiter = 'N/A';
  let fastestWaiter = 'N/A';
  let fastestKitchen = 'N/A';
  let avgKitchenMs = 0;
  let avgWaiterMs = 0;
  let maxKitchenMs = 0;
  let maxWaiterMs = 0;
  let totalRevenueToday = 0;

  const waiterCounts: Record<string, number> = {};
  const waiterTimes: Record<string, number[]> = {};
  const kitchenTimes: Record<string, number[]> = {};

  let totalKitchenTimes: number[] = [];
  let totalWaiterTimes: number[] = [];

  orders.forEach(o => {
    // Waiter count
    if (o.waiterName) {
      waiterCounts[o.waiterName] = (waiterCounts[o.waiterName] || 0) + 1;
    }
    
    // Revenue today
    const createdMs = getMs(o.createdAt);
    if (createdMs && isToday(new Date(createdMs)) && o.isPaid && o.paymentMethod !== 'reward') {
      totalRevenueToday += (o.total || 0);
    }

    // Timestamps
    const tStart = getMs(o.kitchenStartedAt) || getMs(o.barmanStartedAt) || getMs(o.preparingAt);
    const tReady = getMs(o.kitchenReadyAt) || getMs(o.barmanReadyAt) || getMs(o.readyAt);
    const tCompleted = getMs(o.deliveredAt) || getMs(o.completedAt);

    // Durations
    const kitchenMs = getDurationMs(tStart, tReady);
    const waiterMs = getDurationMs(tReady, tCompleted);

    if (kitchenMs !== null) {
      totalKitchenTimes.push(kitchenMs);
      if (kitchenMs > maxKitchenMs) maxKitchenMs = kitchenMs;
      const kName = o.vendeur || 'Kitchen Staff';
      if (!kitchenTimes[kName]) kitchenTimes[kName] = [];
      kitchenTimes[kName].push(kitchenMs);
    }

    if (waiterMs !== null) {
      totalWaiterTimes.push(waiterMs);
      if (waiterMs > maxWaiterMs) maxWaiterMs = waiterMs;
      if (o.waiterName) {
        if (!waiterTimes[o.waiterName]) waiterTimes[o.waiterName] = [];
        waiterTimes[o.waiterName].push(waiterMs);
      }
    }
  });

  // Calculate Most Active Waiter
  let maxOrders = 0;
  for (const [w, c] of Object.entries(waiterCounts)) {
    if (c > maxOrders) { maxOrders = c; mostActiveWaiter = w; }
  }

  // Calculate Averages
  if (totalKitchenTimes.length > 0) {
    avgKitchenMs = totalKitchenTimes.reduce((a, b) => a + b, 0) / totalKitchenTimes.length;
  }
  if (totalWaiterTimes.length > 0) {
    avgWaiterMs = totalWaiterTimes.reduce((a, b) => a + b, 0) / totalWaiterTimes.length;
  }

  // Fastest Waiter (lowest average time)
  let minAvgWaiterMs = Infinity;
  for (const [w, times] of Object.entries(waiterTimes)) {
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < minAvgWaiterMs) { minAvgWaiterMs = avg; fastestWaiter = w; }
    }
  }

  // Fastest Kitchen Staff
  let minAvgKitchenMs = Infinity;
  for (const [k, times] of Object.entries(kitchenTimes)) {
    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < minAvgKitchenMs) { minAvgKitchenMs = avg; fastestKitchen = k; }
    }
  }

  const formatMsDuration = (ms: number) => {
    if (ms === 0 || ms === Infinity) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  if (loading) return <div className="text-center py-20 uppercase font-black tracking-widest text-stone-400">Loading Performance Data...</div>;

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between w-full">
<div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-bento-card-bg text-bento-ink rounded-full hover:bg-stone-200 transition-colors border border-bento-card-border">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-bento-ink uppercase italic tracking-tighter">Order History</h1>
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Staff Performance & Timestamps</p>
        </div>
      </div>
      <button 
        onClick={async () => {
          try {
            await signOutApp();
            navigate('/login');
          } catch(e) {
      console.error(e);
    }
        }}
        className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center justify-center"
      >
        <LogOut size={24} />
      </button>
      </div>
      
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Most Active Waiter</p>
          <p className="text-lg font-black text-bento-ink truncate">{mostActiveWaiter}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Fastest Waiter</p>
          <p className="text-lg font-black text-blue-600 truncate">{fastestWaiter}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Fastest Kitchen</p>
          <p className="text-lg font-black text-amber-600 truncate">{fastestKitchen}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Today's Revenue</p>
          <p className="text-lg font-black text-green-600">{totalRevenueToday.toFixed(2)} MAD</p>
        </div>

        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Avg Kitchen Prep</p>
          <p className="text-lg font-black text-amber-600">{formatMsDuration(avgKitchenMs)}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Avg Waiter Service</p>
          <p className="text-lg font-black text-blue-600">{formatMsDuration(avgWaiterMs)}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Longest Prep</p>
          <p className="text-lg font-black text-red-500">{formatMsDuration(maxKitchenMs)}</p>
        </div>
        <div className="bg-bento-card-bg p-4 rounded-3xl border border-bento-card-border flex flex-col justify-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-1">Total Completed</p>
          <p className="text-lg font-black text-bento-ink">{orders.length}</p>
        </div>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const tCreated = getMs(order.createdAt);
          const tStart = getMs(order.kitchenStartedAt) || getMs(order.barmanStartedAt) || getMs(order.preparingAt);
          const tReady = getMs(order.kitchenReadyAt) || getMs(order.barmanReadyAt) || getMs(order.readyAt);
          const tCompleted = getMs(order.deliveredAt) || getMs(order.completedAt) || getMs(order.kitchenCompletedAt) || getMs(order.barmanCompletedAt);
          const tPaid = getMs(order.paymentConfirmedAt) || getMs(order.paidAt);

          return (
            <div key={order.id} className="bg-bento-card-bg p-5 rounded-[2rem] border border-bento-card-border flex flex-col">
              <div className="flex flex-wrap justify-between items-start mb-4 pb-4 border-b border-bento-card-border/50">
                <div>
                  <h4 className="font-black text-bento-ink uppercase tracking-tighter text-xl">{order.customerName || 'Guest'}</h4>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-0.5">
                    Order #{order.id.slice(-6).toUpperCase()}
                    {order.tableNumber && ` • Table: ${order.fullTableLabel || order.tableNumber} ${order.tableArea ? `(${order.tableArea})` : ''}`}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <span className="px-2 py-1 bg-green-500/10 text-green-600 font-black uppercase tracking-widest text-[9px] rounded-lg">Completed</span>
                  <p className="text-sm font-black text-bento-ink mt-1">{order.total?.toFixed(2)} MAD</p>
                  <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">{order.paymentMethod || 'Unknown'}</p>
                </div>
              </div>

              
                <div className="w-full mt-3 pt-3 border-t border-dashed border-stone-200">
                  <p className="text-[10px] font-black uppercase text-stone-400 mb-1 tracking-widest">Items Served:</p>
                  <div className="flex flex-wrap gap-1">
                    {(order.items || []).map((item, i) => (
                      <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md text-[10px] font-bold">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                </div>

              {/* Staff Assignments */}
              <div className="flex flex-wrap gap-6 mb-4 pb-4 border-b border-bento-card-border/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg"><UserCheck size={14} /></div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Waiter</p>
                    <p className="text-[10px] font-black text-bento-ink uppercase truncate max-w-[100px]">{order.waiterName || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 text-amber-600 rounded-lg"><ChefHat size={14} /></div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Kitchen/Bar</p>
                    <p className="text-[10px] font-black text-bento-ink uppercase truncate max-w-[100px]">{order.vendeur || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-500/10 text-green-600 rounded-lg"><Banknote size={14} /></div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-stone-500">Cashier</p>
                    <p className="text-[10px] font-black text-bento-ink uppercase truncate max-w-[100px]">{(order as any).cashierName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps & Durations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 border-b border-bento-card-border/50 pb-1">Exact Timestamps</p>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between"><span className="text-stone-500">Created:</span> <span className="font-bold text-bento-ink">{formatTimestamp(tCreated)}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Prep Started:</span> <span className="font-bold text-bento-ink">{formatTimestamp(tStart)}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Ready:</span> <span className="font-bold text-bento-ink">{formatTimestamp(tReady)}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Completed:</span> <span className="font-bold text-bento-ink">{formatTimestamp(tCompleted)}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Paid:</span> <span className="font-bold text-bento-ink">{formatTimestamp(tPaid)}</span></div>
                  </div>
                </div>
                
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2 border-b border-bento-card-border/50 pb-1">Durations</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Kitchen Prep</span>
                      <span className="font-black text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">{formatDuration(tStart, tReady)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Waiter Service</span>
                      <span className="font-black text-blue-700 bg-blue-500/10 px-2 py-0.5 rounded text-[11px]">{formatDuration(tReady, tCompleted)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-stone-600 tracking-widest">Total Time</span>
                      <span className="font-black text-bento-ink bg-stone-500/10 px-2 py-0.5 rounded text-[11px]">{formatDuration(tCreated, tCompleted)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-12 opacity-50">
            <p className="text-xs font-black uppercase tracking-widest">No order history available</p>
          </div>
        )}
      </div>
    </div>
  );
}
