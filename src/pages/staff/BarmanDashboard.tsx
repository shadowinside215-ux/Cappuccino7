import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Coffee, ShoppingBag, Timer, CheckCircle2, LogOut, CupSoda as Cup, Snowflake, AlertTriangle, ThermometerSun } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { Order } from '../../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export default function BarmanDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Barman only sees orders with barman items and where barmanStatus is not completed
    const q = query(
      collection(db, 'orders'),
      where('barmanStatus', 'in', ['pending', 'preparing', 'ready']),
      where('status', 'not-in', ['delivered', 'cancelled'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      let hasNewOrder = false;
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          hasNewOrder = true;
        }
      });

      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as Order);
      });

      // Sort by creation time
      ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setOrders(ordersData);
      setLoading(false);

      if (hasNewOrder && !loading) {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.play().catch(e => console.log('Audio blocked', e));
        toast.success(t('new_drink_order', 'New Drink Order!'), {
          icon: '☕',
          duration: 5000,
          position: 'top-right'
        });
      }
    });

    return () => unsubscribe();
  }, [loading, t]);

  const updateBarmanStatus = async (order: Order, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        barmanStatus: newStatus,
        ...(newStatus === 'preparing' ? { preparingAt: serverTimestamp() } : {}),
        ...(newStatus === 'ready' ? { readyAt: serverTimestamp() } : {})
      });
      
      toast.success(`${t('order_set_to')} ${newStatus}`);
    } catch (err) {
      toast.error(t('failed_status_update'));
    }
  };

  const logout = () => {
    localStorage.removeItem('barman_session_active');
    auth.signOut();
    navigate('/barman/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A0F0A] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Coffee size={48} className="text-amber-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A0F0A] text-amber-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 bg-[#25160E] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-amber-600 rounded-3xl shadow-lg shadow-amber-900/40">
            <Coffee size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">{t('barman_dashboard')}</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">{t('station_terminal')} • Palace Taha</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-[#1A0F0A] px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
             <ShoppingBag size={18} className="text-amber-500" />
             <span className="text-xl font-black">{orders.length}</span>
             <span className="text-[10px] font-black uppercase text-amber-900 tracking-widest">{t('active_orders')}</span>
          </div>
          <button 
            onClick={logout}
            className="p-4 bg-[#1A0F0A] text-amber-900 rounded-2xl hover:bg-[#2D1B12] hover:text-amber-500 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-amber-900/20">
           <Coffee size={80} className="mb-6 opacity-10" />
           <p className="text-2xl font-black uppercase italic tracking-widest opacity-20">{t('no_active_orders')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`bg-[#25160E] rounded-[3rem] p-8 border ${
                  order.barmanStatus === 'ready' ? 'border-amber-500/30 bg-amber-500/[0.02]' : 
                  order.barmanStatus === 'preparing' ? 'border-amber-600/30' : 'border-white/5'
                } relative overflow-hidden`}
              >
                {/* Timer Ribbon */}
                <div className="absolute top-0 right-0 left-0 h-1.5 flex text-[0px]">
                   <div className={`h-full transition-all duration-1000 ${
                     order.barmanStatus === 'ready' ? 'bg-green-500' : 
                     order.barmanStatus === 'preparing' ? 'bg-amber-500' : 'bg-orange-500'
                   }`} style={{ width: '100%' }} />
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">{t('client')}</p>
                    <h3 className="text-2xl font-black text-amber-50 leading-none uppercase italic truncate max-w-[150px]">{order.customerName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">{t('type')}</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.deliveryType === 'dine-in' ? 'bg-amber-500 text-[#1A0F0A]' : 'bg-orange-500 text-[#1A0F0A]'
                    }`}>
                      {order.deliveryType === 'dine-in' ? t('dine_in') : t('takeaway')}
                    </span>
                  </div>
                </div>

                {/* Items List - Only Barman Items */}
                <div className="space-y-4 mb-8 bg-[#1A0F0A]/50 p-6 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black text-amber-900/60 uppercase tracking-widest">{t('drink_orders')}</p>
                  {order.items.filter((i: any) => i.system === 'barman').map((item, idx) => {
                    const isIced = item.name.toLowerCase().includes('ice') || item.name.toLowerCase().includes('glacé');
                    const isHot = !isIced && (item.name.toLowerCase().includes('chaud') || item.name.toLowerCase().includes('hot') || item.categoryName?.toLowerCase().includes('hot'));

                    return (
                      <div key={idx} className="flex justify-between items-start group">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isIced ? <Snowflake size={14} className="text-blue-400" /> : isHot ? <ThermometerSun size={14} className="text-orange-500" /> : <Cup size={14} className="text-amber-600" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-amber-500 font-black text-lg">x{item.quantity}</span>
                              <p className="font-black text-amber-50 uppercase text-sm leading-tight">{t(`products.${item.name}`, item.name)}</p>
                            </div>
                            {item.customization && (
                              <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-tighter mt-1 italic leading-tight">
                                <span className="text-amber-700 font-black mr-2">[{t('sugar_pref')}]</span>
                                "{item.customization}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Info Bar */}
                <div className="flex items-center justify-between py-4 border-y border-white/5 mb-8">
                   <div className="flex items-center gap-2">
                     <Timer size={16} className="text-amber-900" />
                     <span className="text-[10px] font-black uppercase text-amber-900/60 tracking-widest text-center">EXACTLY 10 MIN</span>
                   </div>
                   <div className="text-[10px] font-black text-amber-900 uppercase">
                     {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'NOW'}
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateBarmanStatus(order, order.barmanStatus === 'pending' ? 'preparing' : 'ready')}
                    className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all ${
                      order.barmanStatus === 'preparing' 
                      ? 'bg-amber-500 text-[#1A0F0A] shadow-lg shadow-amber-500/20' 
                      : 'bg-[#1A0F0A] text-amber-900 hover:bg-[#2D1B12] hover:text-amber-500'
                    }`}
                  >
                    {order.barmanStatus === 'preparing' ? <CheckCircle2 size={24} /> : <Coffee size={24} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {order.barmanStatus === 'preparing' ? t('mark_ready_status') : t('mark_preparing')}
                    </span>
                  </button>

                  <button 
                    onClick={() => updateBarmanStatus(order, 'completed')}
                    disabled={order.barmanStatus !== 'ready'}
                    className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all ${
                      order.barmanStatus === 'ready'
                      ? 'bg-amber-600 text-[#1A0F0A] shadow-lg shadow-amber-900/40'
                      : 'bg-[#1A0F0A] text-amber-900/20 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t('mark_completed')}</span>
                  </button>
                </div>

                {/* Special Instructions */}
                {order.deliveryNotes && (
                  <div className="mt-6 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
                     <AlertTriangle size={14} className="text-amber-600 mt-0.5" />
                     <p className="text-[10px] font-bold text-amber-900/60 leading-tight italic truncate">"{order.deliveryNotes}"</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
