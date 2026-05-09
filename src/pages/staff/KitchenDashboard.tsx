import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ChefHat, ShoppingBag, Timer, CheckCircle2, ChevronRight, LogOut, Soup, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Kitchen only sees orders with kitchen items and where kitchenStatus is not completed
    const q = query(
      collection(db, 'orders'),
      where('kitchenStatus', 'in', ['pending', 'preparing', 'ready'])
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
        const data = doc.data() as Order;
        // Client-side filter for status to avoid 'in' and 'not-in' conflict
        if (data.status !== 'delivered' && data.status !== 'cancelled') {
          ordersData.push({ id: doc.id, ...data });
        }
      });

      // Sort by creation time
      ordersData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setOrders(ordersData);
      setLoading(false);

      if (hasNewOrder && initialLoadDone) {
        const audio = new Audio(NOTIFICATION_SOUND);
        audio.play().catch(e => console.log('Audio blocked', e));
        toast.success(t('new_food_order', 'NEW KITCHEN ORDER!'), {
          icon: '🍳',
          duration: 10000,
          position: 'top-center',
          style: {
            background: '#2563eb',
            color: '#fff',
            fontWeight: '900',
            fontSize: '14px',
            padding: '24px',
            borderRadius: '24px',
            textTransform: 'uppercase'
          }
        });
      }

      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders (kitchen filter)');
      toast.error(t('permission_denied_orders', 'Permission denied Accessing orders'));
    });

    return () => unsubscribe();
  }, [initialLoadDone, t, auth.currentUser]);

  const updateKitchenStatus = async (order: Order, newStatus: string) => {
    try {
      const newKitchenStatus = newStatus;
      const orderRef = doc(db, 'orders', order.id);
      
      const updates: any = {
        kitchenStatus: newKitchenStatus,
        ...(newKitchenStatus === 'preparing' ? { preparingAt: serverTimestamp() } : {}),
        ...(newKitchenStatus === 'ready' ? { readyAt: serverTimestamp() } : {})
      };

      // Check if both are ready to update global status
      if (newKitchenStatus === 'ready' && (order.barmanStatus === 'ready' || order.barmanStatus === 'completed' || !order.barmanStatus)) {
        updates.status = 'ready';
      } else if (newKitchenStatus === 'completed' && (order.barmanStatus === 'completed' || !order.barmanStatus)) {
        updates.status = 'ready';
      }

      await updateDoc(orderRef, updates);
      
      toast.success(`${t('order_set_to')} ${newStatus}`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      toast.error(t('failed_status_update'));
    }
  };

  const logout = () => {
    localStorage.removeItem('kitchen_session_active');
    auth.signOut();
    navigate('/kitchen/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <ChefHat size={48} className="text-blue-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 bg-stone-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-blue-500 rounded-3xl shadow-lg shadow-blue-500/20">
            <ChefHat size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase">{t('kitchen_dashboard')}</h1>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">{t('station_terminal')} • Palace Taha</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-stone-800 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
             <ShoppingBag size={18} className="text-blue-400" />
             <span className="text-xl font-black">{orders.length}</span>
             <span className="text-[10px] font-black uppercase text-stone-500 tracking-widest">{t('active_orders')}</span>
          </div>
          <button 
            onClick={logout}
            className="p-4 bg-stone-800 text-stone-400 rounded-2xl hover:bg-stone-700 hover:text-white transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 text-stone-700">
           <ChefHat size={80} className="mb-6 opacity-10" />
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
                className={`bg-stone-900 rounded-[3rem] p-8 border ${
                  order.kitchenStatus === 'ready' ? 'border-green-500/30 bg-green-500/[0.02]' : 
                  order.kitchenStatus === 'preparing' ? 'border-blue-500/30' : 'border-white/5'
                } relative overflow-hidden`}
              >
                {/* Timer Ribbon */}
                <div className="absolute top-0 right-0 left-0 h-1.5 flex text-[0px]">
                   <div className={`h-full transition-all duration-1000 ${
                     order.kitchenStatus === 'ready' ? 'bg-green-500' : 
                     order.kitchenStatus === 'preparing' ? 'bg-blue-500' : 'bg-amber-500'
                   }`} style={{ width: '100%' }} />
                </div>

                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('client')}</p>
                    <h3 className="text-2xl font-black text-white leading-none uppercase italic truncate max-w-[150px]">{order.customerName}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1">{t('type')}</p>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      order.deliveryType === 'dine-in' ? 'bg-amber-500 text-stone-950' : 'bg-blue-500 text-stone-950'
                    }`}>
                      {order.deliveryType === 'dine-in' ? t('dine_in') : t('takeaway')}
                    </span>
                  </div>
                </div>

                {/* Items List - Only Kitchen Items */}
                <div className="space-y-4 mb-8 bg-stone-950/50 p-6 rounded-[2rem] border border-white/5">
                  <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">{t('food_orders')}</p>
                  {order.items.filter((i: any) => i.system === 'kitchen').map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start group">
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 font-black text-lg">x{item.quantity}</span>
                        <div>
                          <p className="font-black text-white uppercase text-sm leading-tight">{t(`products.${item.name}`, item.name)}</p>
                          {item.customization && (
                            <p className="text-[10px] font-bold text-amber-500/60 uppercase tracking-tighter mt-0.5 italic">
                              "{item.customization}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info Bar */}
                <div className="flex items-center justify-between py-4 border-y border-white/5 mb-8">
                   <div className="flex items-center gap-2">
                     <Timer size={16} className="text-stone-500" />
                     <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">30 MIN LIMIT</span>
                   </div>
                   <div className="text-[10px] font-black text-stone-500 uppercase">
                     {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'NOW'}
                   </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => updateKitchenStatus(order, order.kitchenStatus === 'pending' ? 'preparing' : 'ready')}
                    className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all ${
                      order.kitchenStatus === 'preparing' 
                      ? 'bg-green-500 text-stone-900 shadow-lg shadow-green-500/20' 
                      : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white'
                    }`}
                  >
                    {order.kitchenStatus === 'preparing' ? <CheckCircle2 size={24} /> : <Soup size={24} />}
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {order.kitchenStatus === 'preparing' ? t('mark_ready_status') : t('mark_preparing')}
                    </span>
                  </button>

                  <button 
                    onClick={() => updateKitchenStatus(order, 'completed')}
                    disabled={order.kitchenStatus !== 'ready'}
                    className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all ${
                      order.kitchenStatus === 'ready'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40'
                      : 'bg-stone-800 text-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{t('mark_completed')}</span>
                  </button>
                </div>

                {/* If there's persistent info like delivery notes */}
                {order.deliveryNotes && (
                  <div className="mt-6 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 flex items-start gap-3">
                     <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                     <p className="text-[10px] font-bold text-amber-200/60 leading-tight italic truncate">"{order.deliveryNotes}"</p>
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
