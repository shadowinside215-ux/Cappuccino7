import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order } from '../types';
import { Clock, CheckCircle2, ChevronRight, Package, Truck, Coffee, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'pending': return <Clock className="text-amber-500" size={24} />;
    case 'accepted': return <CheckCircle2 className="text-blue-500" size={24} />;
    case 'preparing': return <Coffee className="text-brown-500 animate-pulse" size={24} />;
    case 'ready': return <Package className="text-green-500" size={24} />;
    case 'delivered': return <Truck className="text-gray-400" size={24} />;
    default: return <Clock className="text-gray-400" size={24} />;
  }
};

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const isGuest = auth.currentUser?.isAnonymous;

  useEffect(() => {
    if (!auth.currentUser || isGuest) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    return unsubscribe;
  }, [isGuest]);

  if (loading) return <div className="text-center py-20 flex items-center justify-center gap-2">
    <div className="w-5 h-5 border-2 border-bento-primary border-t-transparent rounded-full animate-spin" />
    <span>Loading your orders...</span>
  </div>;

  if (isGuest) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 px-6 text-center">
        <div className="p-8 bg-stone-50 rounded-[40px] text-stone-300 shadow-xl shadow-stone-900/5">
          <Truck size={64} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tight">Order History</h1>
          <p className="text-stone-500 font-medium max-w-sm">
            You're currently browsing as a guest. <br />
            Sign in to keep track of your previous orders!
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/login'}
          className="w-full max-w-xs bg-bento-primary text-white py-5 px-8 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-bento-primary/20 active:scale-95 transition-all"
        >
          Sign In to Access History
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <h1 className="text-4xl font-bold text-bento-primary italic tracking-tight">Cappuccino7 Orders</h1>

      {orders.length === 0 ? (
        <div className="card !py-20 text-center border-dashed">
          <p className="text-stone-400 font-medium italic">You haven't explored our menu yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="card group hover:scale-[1.01]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-bento-ink">Order #{order.id.slice(-6).toUpperCase()}</h3>
                    <span className="status-pill">{order.status}</span>
                  </div>
                  <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">
                    {order.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="bg-stone-50 px-5 py-3 rounded-2xl border border-stone-100 min-w-[120px] text-center">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 leading-none">{t('total_paid')}</p>
                  <p className="text-2xl font-black text-bento-primary leading-none">{order.total} DH</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="bg-[#FDFBF9] dark:bg-stone-900/50 p-5 rounded-2xl border border-stone-100 dark:border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck size={18} className="text-bento-accent" />
                    <p className="text-xs font-bold uppercase tracking-widest text-stone-500">{t('delivery_point')}</p>
                  </div>
                  <p className="text-sm font-medium text-bento-ink leading-relaxed line-clamp-2">
                    {order.address}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-6 border-t border-stone-100 overflow-x-auto no-scrollbar py-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-stone-50 ring-1 ring-stone-100 px-3 py-1.5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-bento-primary text-white text-[10px] flex items-center justify-center font-bold">
                      {item.quantity}
                    </div>
                    <span className="text-xs font-bold text-bento-primary">{t(`products.${item.name}`, item.name)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
