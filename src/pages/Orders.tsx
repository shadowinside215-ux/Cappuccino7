import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order } from '../types';
import { Clock, CheckCircle2, Package, Truck, Coffee, Award, MapPin, Plus, ExternalLink, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';

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
  const { settings: brand } = useBrandSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
    <span>Loading...</span>
  </div>;

  if (isGuest) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-6 text-center -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <OptimizedImage 
            priority
            src={brand.ordersBgUrl || 'https://images.unsplash.com/photo-1544333346-6466f28ecb0c?q=80&w=1600'} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
          />
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] mb-6 ring-1 ring-white/20">
            <Truck size={48} className="text-white/40" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">Order History</h2>
          <p className="text-white/60 mb-8 font-medium max-w-xs">
            Sign in to track your artisan selections and loyalty points.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-bento-primary px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Access History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <OptimizedImage 
          priority
          src={brand.ordersBgUrl || 'https://images.unsplash.com/photo-1544333346-6466f28ecb0c?q=80&w=1600'} 
          containerClassName="w-full h-full"
          className="w-full h-full object-cover fixed top-0 left-0" 
          alt=""
        />
        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
      </div>

      <div className="relative z-10 space-y-10">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="text-5xl md:text-7xl font-black text-bento-primary italic tracking-tighter uppercase drop-shadow-lg"
        >
          {t('order_history')}
        </motion.h1>

        {orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border border-white/10"
          >
            <p className="text-white/40 font-black uppercase tracking-widest italic">{t('no_orders')}</p>
          </motion.div>
        ) : (
          <div className="space-y-8 max-w-4xl">
            {orders.map((order, idx) => (
              <motion.div 
                key={order.id} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, type: "spring", bounce: 0.2 }}
                className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/10 shadow-2xl group hover:bg-white/15 transition-all relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">#{order.id.slice(-6).toUpperCase()}</h3>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ring-1 ${
                        order.status === 'ready' || order.status === 'delivered' || order.status === 'completed' 
                        ? 'bg-green-500/20 text-green-400 ring-green-500/20' 
                        : 'bg-amber-500/20 text-amber-400 ring-amber-500/20 animate-pulse'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest font-mono">
                      {order.createdAt?.toDate().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} at {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center min-w-[140px] group-hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">{t('total_paid')}</p>
                    <p className="text-3xl font-black text-white leading-none tabular-nums mt-1">{order.total} DH</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-white">
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      {order.deliveryType === 'delivery' ? <Truck size={18} className="text-amber-400" /> : <Package size={18} className="text-amber-400" />}
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {order.deliveryType === 'delivery' ? t('delivery') : t('pickup')}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-bold leading-relaxed line-clamp-2 opacity-80 italic">
                          {order.address || 'Premium Lounge Pickup'}
                        </p>
                        {order.deliveryType === 'delivery' && order.location && (
                          <a 
                            href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 bg-white text-stone-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                          >
                            <ExternalLink size={12} />
                            {t('open_maps')}
                          </a>
                        )}
                      </div>

                      {order.deliveryNotes && (
                        <div className="pt-4 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-1.5">
                            <MessageCircle size={12} className="text-white/40" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{t('delivery_notes')}</p>
                          </div>
                          <p className="text-[10px] text-white/60 font-medium leading-relaxed italic">
                            "{order.deliveryNotes}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex flex-col justify-center hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3 text-amber-400 font-black text-xl mb-1">
                      <Award size={20} />
                      <span>+{order.pointsEarned || Math.floor(order.total / 10)} PTS</span>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{t('loyalty_perk')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-white/10 overflow-x-auto no-scrollbar py-2">
                  <AnimatePresence>
                    {order.items.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="flex-shrink-0 flex items-center gap-3 bg-white/5 ring-1 ring-white/10 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/10 cursor-default"
                      >
                        <div className="w-7 h-7 rounded-full bg-white text-stone-900 text-[11px] flex items-center justify-center font-black">
                          {item.quantity}
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{t(`products.${item.name}`, item.name)}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
