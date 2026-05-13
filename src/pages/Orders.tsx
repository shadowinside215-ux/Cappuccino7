import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order, OrderStatus, WaiterRequest } from '../types';
import { Clock, CheckCircle2, Package, Truck, Coffee, Award, MapPin, Plus, ExternalLink, MessageCircle, Timer, Bell, User, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { OrderTimer } from '../components/OrderTimer';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';
import toast from 'react-hot-toast';

const CallWaiterButton = ({ order }: { order: Order }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState<WaiterRequest | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen for active waiter requests for this specific order/client
    const q = query(
      collection(db, 'waiterRequests'),
      where('clientId', '==', auth.currentUser.uid),
      where('orderId', '==', order.id),
      where('status', '!=', 'completed')
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as WaiterRequest);
      } else {
        setRequest(null);
      }
    });
  }, [order.id]);

  const handleCall = async () => {
    if (!auth.currentUser) return;
    
    if (!order.waiterId) {
      toast(t('wait_for_waiter_assignment', 'Please wait for a waiter to take your order before calling.'), {
        icon: '⏳',
        duration: 4000,
        style: {
          borderRadius: '1.5rem',
          background: '#2D241E',
          color: '#fff',
          fontWeight: 'bold',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'waiterRequests'), {
        clientId: auth.currentUser.uid,
        orderId: order.id,
        clientName: auth.currentUser.displayName || t('guest'),
        tableZone: order.tableZone,
        tableArea: order.tableArea,
        tableNumber: order.tableNumber,
        fullTableLabel: order.fullTableLabel,
        timestamp: serverTimestamp(),
        status: 'new',
        waiterId: order.waiterId,
        waiterName: order.waiterName || null
      });
      toast.success(t('waiter_called', 'Assigned waiter called!'));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'waiterRequests');
    } finally {
      setLoading(false);
    }
  };

  if (order.status === 'delivered' || order.status === 'cancelled') return null;

  const isAssigned = !!order.waiterId;

  return (
    <div className="mt-8 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="flex-1">
        <AnimatePresence mode="wait">
          {request ? (
            <motion.div 
              key="status"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-4 bg-white/5 p-4 rounded-[2rem] border border-white/5"
            >
              <div className={`p-3 rounded-2xl ${request.status === 'accepted' ? 'bg-amber-400 text-stone-900 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'bg-white/10 text-amber-400 animate-pulse'}`}>
                {request.status === 'accepted' ? <User size={18} /> : <Bell size={18} />}
              </div>
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">
                  {request.status === 'accepted' ? t('waiter_on_way', 'Waiter on way') : t('waiter_called', 'Notification sent')}
                </p>
                <p className="text-xs font-bold text-white leading-none">
                  {request.status === 'accepted' ? t('waiter_assigned', { name: request.waiterName }) : t('waiting_for_waiter', 'Waiting for assistance...')}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] font-serif italic">
                {isAssigned ? t('assistance_ready', 'Assistance Available') : t('waiting_for_assignment', 'Assignment Pending')}
              </p>
              <p className="text-xs font-bold text-white/40 italic">
                {!isAssigned 
                  ? t('wait_for_waiter_to_take', 'Wait for a waiter to take your order...')
                  : t('need_help', 'Need assistance? Tap to call your waiter.')
                }
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={handleCall}
        disabled={loading || !!request}
        className={`w-full sm:w-auto px-10 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group ${
          request 
            ? 'bg-stone-950/80 text-white/20 cursor-not-allowed border border-white/5 shadow-inner' 
            : !isAssigned
              ? 'bg-stone-900 text-stone-600 border border-white/10 cursor-not-allowed grayscale'
              : 'bg-amber-400 text-stone-900 hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(251,191,36,0.2)]'
        }`}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Bell size={16} className={isAssigned && !request ? 'animate-bounce' : ''} />
        )}
        {t('call_waiter', 'Call Waiter')}
        {isAssigned && !request && <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />}
      </button>
    </div>
  );
};


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
  const { t, i18n } = useTranslation();
  const { settings: brand } = useBrandSettings();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isGuest = auth.currentUser?.isAnonymous;

  useEffect(() => {
    if (!auth.currentUser) {
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
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return unsubscribe;
  }, [auth.currentUser?.uid]);

  if (loading) return <div className="text-center py-20 flex items-center justify-center gap-2">
    <div className="w-5 h-5 border-2 border-bento-primary border-t-transparent rounded-full animate-spin" />
    <span>{t('loading')}</span>
  </div>;

  if (isGuest) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center space-y-8 px-6 text-center relative overflow-hidden">
        {brand.ordersBgUrl && (
          <div className="fixed inset-0 z-0 h-screen w-screen">
            <OptimizedImage 
              priority
              src={brand.ordersBgUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover" 
              alt=""
              showOverlay={false}
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-stone-900/40 backdrop-blur-xl rounded-[2.5rem] mb-6 ring-1 ring-white/10 group">
            <Clock size={48} className="text-white/20" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">{t('orders')}</h2>
          <p className="text-white/40 mb-8 font-medium max-w-xs leading-relaxed text-sm">
            {t('track_orders_msg')}
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="group flex items-center gap-3 bg-white text-stone-900 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-95 transition-all hover:bg-amber-500 hover:text-stone-900"
          >
            {t('login')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      {brand.ordersBgUrl && (
        <div className="fixed inset-0 z-0 h-screen w-screen">
          <OptimizedImage 
            priority
            src={brand.ordersBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
            showOverlay={false}
          />
        </div>
      )}

      <div className="relative z-10 space-y-10">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="text-5xl md:text-7xl font-black text-bento-primary italic tracking-tighter uppercase drop-shadow-lg"
        >
          {t('orders')}
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
                        order.status === 'ready' || order.status === 'delivered'
                        ? 'bg-green-500/20 text-green-400 ring-green-500/20' 
                        : 'bg-amber-500/20 text-amber-400 ring-amber-500/20 animate-pulse'
                      }`}>
                        {t(`status_detail.${order.status}`, order.status)}
                      </span>
                      <OrderTimer 
                        createdAt={order.createdAt} 
                        prepTime={order.prepTime} 
                        status={order.status} 
                        variant="client"
                      />
                    </div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest font-mono">
                      {order.createdAt?.toDate().toLocaleDateString(i18n.language, { month: 'long', day: 'numeric' })} {t('at', 'at')} {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 text-center min-w-[140px] group-hover:bg-white/10 transition-all">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 leading-none">{t('total_paid')}</p>
                    <p className="text-3xl font-black text-white leading-none tabular-nums mt-1">{order.total} DH</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 text-white">
                  <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      {order.deliveryType === 'delivery' ? <Truck size={18} className="text-amber-400" /> : <Package size={18} className="text-amber-400" />}
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
                        {order.deliveryType === 'delivery' ? t('delivery') : (order.deliveryType === 'dine-in' ? t('dine_in', 'Dine In') : t('pickup'))}
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
                  <div className="col-span-full bg-white/5 p-6 rounded-[2rem] border border-white/10 flex flex-col justify-center hover:bg-white/10 transition-all">
                    <div className="flex items-center gap-3 text-amber-400 font-black text-xl mb-1">
                      <Award size={20} />
                      <span>+{order.pointsEarned || Math.floor(order.total / 10)} PTS</span>
                    </div>
                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">{t('loyalty_perk')}</p>
                  </div>
                </div>

                {order.deliveryType === 'dine-in' && (
                  <CallWaiterButton order={order} />
                )}

                <div className="flex items-center gap-4 pt-8 border-t border-white/10 overflow-x-auto no-scrollbar py-2">
                  <AnimatePresence>
                    {order.items.map((item, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className="flex-shrink-0 flex flex-col gap-1 items-start bg-white/5 ring-1 ring-white/10 px-4 py-2 rounded-2xl backdrop-blur-md hover:bg-white/10 cursor-default"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-white text-stone-900 text-[10px] flex items-center justify-center font-black">
                            {item.quantity}
                          </div>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{t(`products.${item.name}`, item.name)}</span>
                        </div>
                        {item.customization && (
                          <span className="text-[8px] font-black uppercase text-amber-400 italic pl-9">
                            {item.customization.includes('|') ? (
                              <>
                                {t(`products.${item.customization.split('|')[0].trim()}`, item.customization.split('|')[0].trim())}
                                {' • '}
                                {t(item.customization.split('|')[1].trim().toLowerCase().replace(/ /g, '_'))}
                              </>
                            ) : (
                              item.customization
                            )}
                          </span>
                        )}
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
