import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { useTranslation } from 'react-i18next';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Navigation, 
  Package, 
  ChevronRight, 
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  Search,
  Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthReady, setIsAuthReady] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Live clock update every second
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Watch for Firebase Auth state
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthReady(true);
      } else {
        setIsAuthReady(false);
        // If they are on the driver dashboard but not signed in to Firebase,
        // we might want to prompt them to sign in as their admin/driver user.
      }
    });

    // Check custom driver auth
    if (localStorage.getItem('driver_auth') !== 'true') {
      navigate('/driver/login');
      return;
    }

    return () => {
      clearInterval(clockTimer);
      authUnsubscribe();
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthReady) return;

    // Real-time listener for delivery orders - SORT BY ASC (Oldest first)
    const q = query(
      collection(db, 'orders'),
      where('deliveryType', '==', 'delivery'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Order))
        .filter(order => order.status !== 'delivered');
      setOrders(activeOrders);
      setLoading(false);
    }, (error) => {
      console.error("Driver snapshot error:", error);
      if (error.message.includes('permission')) {
        toast.error("Permission Denied: Ensure you are logged in as an Admin/Driver account");
      } else {
        toast.error("Real-time updates failed");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthReady]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isAuthReady === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950 p-6">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 max-w-sm w-full text-center">
           <div className="w-16 h-16 bg-amber-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Truck size={32} className="text-amber-400" />
           </div>
           <h2 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">Identify Required</h2>
           <p className="text-white/40 text-xs mb-8">Please sign in as an authorized partner to access live delivery data.</p>
           <button 
             onClick={() => navigate('/login')}
             className="w-full bg-white text-stone-900 py-4 rounded-xl font-black uppercase text-xs tracking-widest"
           >
             Sign in with Google
           </button>
        </div>
      </div>
    );
  }

  if (loading || isAuthReady === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 p-4 pb-20">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-2xl">
              <Truck size={24} className="text-stone-900" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {t('driver_dashboard')}
              </h1>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                {orders.length} {t('active_deliveries')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-right hidden sm:flex items-center gap-3">
              <div className="flex flex-col">
                <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                  <span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
                  Salé Time
                </p>
                <p className="text-lg font-black text-white font-mono leading-none">
                  {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Timer size={20} className="text-white/20" />
            </div>
            <button 
              onClick={() => {
                localStorage.removeItem('driver_auth');
                navigate('/driver/login');
              }}
              className="p-3 bg-white/5 rounded-xl border border-white/10 text-white/40 hover:text-white transition-colors"
            >
              <Navigation size={20} className="rotate-45" />
            </button>
          </div>
        </header>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text"
            placeholder="Search orders or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-white/20"
          />
        </div>

        {/* Order List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, idx) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -100 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
              >
                {/* Order Top Ribbon */}
                <div className="flex items-center justify-between p-6 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                      Live Delivery Task
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/20 bg-white/5 px-2 py-1 rounded-md">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                </div>

                {/* Main Content */}
                <div className="p-6 pt-2 space-y-6">
                  {/* Priority Indicator for first order */}
                  {idx === 0 && (
                    <div className="inline-flex items-center gap-2 bg-amber-400 text-stone-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                      <Timer size={10} />
                      Next Delivery (First Order)
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1 italic">
                        {order.customerName}
                      </h2>
                      <div className="flex items-center gap-4 text-white/40">
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg">
                          <Clock size={12} className="text-amber-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">
                            Ordered: {new Date(order.createdAt?.toMillis() || Date.now()).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package size={12} />
                          <span className="text-[10px] font-bold">
                            {order.items.reduce((sum, item) => sum + item.quantity, 0)} {t('items_count')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <a href={`tel:${order.customerPhone}`} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-amber-400 hover:bg-amber-400 hover:text-stone-900 transition-all shadow-xl">
                        <Phone size={20} />
                      </a>
                      {order.customerPhone && (
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest tabular-nums">
                          {order.customerPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location & Tracking */}
                  <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-amber-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin size={24} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">
                          {t('customer_location')}
                        </p>
                        <p className="text-sm font-bold text-white mb-2 leading-snug">
                          {order.address}
                        </p>
                        {order.deliveryNotes && (
                          <div className="flex items-start gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                            <MessageCircle size={14} className="text-white/20 mt-0.5" />
                            <p className="text-[10px] text-white/60 font-medium italic italic leading-relaxed">
                              "{order.deliveryNotes}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {order.location && (
                      <a 
                        href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-3 w-full bg-white text-stone-900 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        <Navigation size={16} className="fill-stone-900" />
                        Track in Google Maps
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* Items Summary */}
                  <div className="flex flex-wrap gap-2">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/60 px-3 py-1.5 rounded-lg border border-white/5">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-[9px] font-black uppercase tracking-widest bg-white/5 text-white/40 px-3 py-1.5 rounded-lg border border-white/5">
                        +{order.items.length - 3} More
                      </span>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex gap-3">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'accepted')}
                        className="flex-1 bg-amber-400 text-stone-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                      >
                        Accept Order
                        <ChevronRight size={16} />
                      </button>
                    )}
                    {order.status === 'accepted' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'delivering')}
                        className="flex-1 bg-amber-400 text-stone-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                      >
                        Start Delivery
                        <Truck size={16} />
                      </button>
                    )}
                    {order.status === 'delivering' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'delivered')}
                        className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                      >
                        Mark Delivered
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredOrders.length === 0 && !loading && (
            <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
              <Truck size={48} className="text-white/10 mx-auto mb-4" />
              <p className="text-white/40 font-black uppercase text-xs tracking-widest">
                No active delivery tasks
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
