import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, setDoc, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, OrderStatus, UserProfile } from '../../types';
import { awardOrderPoints } from '../../services/orderService';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Timer, 
  Coffee, 
  ArrowRight, 
  CheckCheck,
  AlertCircle,
  Soup,
  Plus,
  Users,
  ShoppingBag,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

// Dedicated Order Timer Component
function OrderTimer({ createdAt, preparingAt, prepTime, status }: { createdAt: any, preparingAt?: any, prepTime: number, status: OrderStatus }) {
  const [elapsed, setElapsed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const calculateTimes = () => {
      const now = Date.now();
      
      // 1. Calculate Elapsed Time since creation
      let createdDate: Date | null = null;
      if (createdAt) {
        if (typeof createdAt.toDate === 'function') {
          createdDate = createdAt.toDate();
        } else if (createdAt instanceof Date) {
          createdDate = createdAt;
        } else if (typeof createdAt === 'object' && createdAt.seconds) {
          createdDate = new Date(createdAt.seconds * 1000);
        } else {
          createdDate = new Date(createdAt);
        }
      }
      
      if (createdDate && !isNaN(createdDate.getTime())) {
        setElapsed(Math.floor((now - createdDate.getTime()) / 1000));
      }

      // 2. Calculate Time Left if preparing
      if (status === 'preparing') {
        let startTime: Date | null = null;
        if (preparingAt) {
          if (typeof preparingAt.toDate === 'function') {
            startTime = preparingAt.toDate();
          } else if (preparingAt instanceof Date) {
            startTime = preparingAt;
          } else if (typeof preparingAt === 'object' && preparingAt.seconds) {
            startTime = new Date(preparingAt.seconds * 1000);
          } else {
            startTime = new Date(preparingAt);
          }
        }
        
        if (!startTime || isNaN(startTime.getTime()) || startTime.getTime() < 1000000) {
          // Fallback if timestamp hasn't synced yet
          setTimeLeft(30 * 60);
        } else {
          const targetDate = new Date(startTime.getTime() + 30 * 60000); // Forced 30 minutes for consistency
          let diff = Math.floor((targetDate.getTime() - now) / 1000);
          
          // Cap reasonable drift and fix 91 min bug
          if (diff > 1800 || diff < -3600 || Math.abs(diff) > 86400) diff = 30 * 60;
          
          setTimeLeft(diff);
        }
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimes();
    const interval = setInterval(calculateTimes, 1000);
    return () => clearInterval(interval);
  }, [createdAt, preparingAt, prepTime, status]);

  const formatSecs = (totalSecs: number) => {
    const absSecs = Math.abs(totalSecs);
    const mins = Math.floor(absSecs / 60);
    const secs = absSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isPreparing = status === 'preparing';
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">
            {isPreparing ? 'Time Remaining' : 'Wait Time'}
          </span>
          <div className="flex items-center gap-2 text-stone-900">
            <Clock size={12} className="text-amber-500" />
            <span className="text-sm font-black tabular-nums">{isPreparing ? (timeLeft !== null ? formatSecs(timeLeft) : '--:--') : formatSecs(elapsed)}</span>
          </div>
        </div>
        
        {isPreparing && timeLeft !== null && (
          <div className="text-right">
             <span className={`text-lg font-black tabular-nums ${timeLeft < 0 ? 'text-red-500 animate-pulse' : 'text-stone-900'}`}>
               {timeLeft < 0 ? '-' : ''}{formatSecs(timeLeft)}
             </span>
          </div>
        )}
      </div>

      {isPreparing && (
        <div className="h-2 bg-stone-100 rounded-full overflow-hidden border border-stone-200">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, (1 - (timeLeft || 0) / ((prepTime || 30) * 60))) * 100)}%` }}
            className={`h-full ${timeLeft && timeLeft < 0 ? 'bg-red-500' : 'bg-green-500'}`}
          />
        </div>
      )}
    </div>
  );
}

export default function WaiterDashboard() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'clients'>('orders');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeClients: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clean up previous listeners if auth state changes
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeClients) unsubscribeClients();

      if (!user) {
        setLoading(false);
        return;
      }

      // Orders subscription
      const qOrders = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'asc')
      );

      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        const activeOrders = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
        setOrders(activeOrders);
        
        const lastOrderCount = parseInt(sessionStorage.getItem('last_order_count') || '0');
        if (activeOrders.length > lastOrderCount) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio blocked', e));
          toast('New Order!', { icon: '🔔' });
        }
        sessionStorage.setItem('last_order_count', activeOrders.length.toString());
        setLoading(false);
      }, (error) => {
        // Only report error if we still have a user
        if (auth.currentUser) {
          handleFirestoreError(error, OperationType.LIST, 'orders');
        }
        setLoading(false);
      });

      // Clients subscription
      const qClients = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      unsubscribeClients = onSnapshot(qClients, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setClients(data);
      }, (error) => {
        if (auth.currentUser) {
          console.error('Clients fetch error:', error);
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeClients) unsubscribeClients();
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      if (newStatus === 'preparing') {
        updateData.preparingAt = serverTimestamp();
      } else if (newStatus === 'ready') {
        updateData.readyAt = serverTimestamp();
      }

      await updateDoc(orderRef, updateData);
      toast.success(`Order status updated: ${newStatus}`);
      
      if (newStatus === 'ready') {
        // This is where we notify the client (via status change)
        toast('Client notified: Order Ready!', { icon: '📢' });
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const completeOrder = async (order: Order) => {
    try {
      const now = new Date();
      let createdDate: Date | null = null;
      if (order.createdAt) {
        if (typeof (order.createdAt as any).toDate === 'function') {
          createdDate = (order.createdAt as any).toDate();
        } else {
          createdDate = new Date(order.createdAt as any);
        }
      }
      
      const diffMs = (createdDate && !isNaN(createdDate.getTime())) ? now.getTime() - createdDate.getTime() : 0;
      const diffMins = Math.round(diffMs / 60000);

      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        deliveredInMinutes: diffMins,
        updatedAt: serverTimestamp()
      });
      
      // Award points
      await awardOrderPoints(order);
      
      toast.success(`Order delivered in ${diffMins} minutes!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10">
        <ChefHat size={64} className="text-amber-400 animate-bounce" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-6 sm:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <ChefHat size={24} className="text-stone-900" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase italic">
              Waiter Console
            </h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
              Palace Taha • Active Terminal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Tab Switcher */}
           <div className="flex p-1.5 bg-white rounded-[2rem] shadow-sm border border-stone-100">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'orders' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <ShoppingBag size={14} />
                Orders ({orders.length})
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'clients' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Users size={14} />
                Clients ({clients.length})
              </button>
           </div>

           <button 
             onClick={() => {
               localStorage.removeItem('waiter_session_active');
               auth.signOut();
             }}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100"
           >
             Exit
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 text-center text-stone-300 uppercase font-black italic">
                <Coffee size={64} className="mb-4 opacity-20" />
                No active orders
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                {orders.map((order) => (
                  <motion.div
                    layout
                    key={order.id}
                    className={`bg-white rounded-[3rem] p-8 shadow-xl border relative overflow-hidden ${
                      order.status === 'ready' ? 'ring-4 ring-green-400 border-green-400' : 'border-stone-100'
                    }`}
                  >
                    <div className={`absolute top-10 right-[-40px] rotate-45 w-40 text-center py-1.5 text-[9px] font-black uppercase tracking-widest ${
                      order.deliveryType === 'dine-in' ? 'bg-amber-400 text-stone-900' : 'bg-stone-900 text-white'
                    }`}>
                      {order.deliveryType}
                    </div>

                    <div className="mb-6">
                      <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">Customer</p>
                      <h3 className="text-2xl font-black text-stone-900 uppercase italic">{order.customerName}</h3>
                      <p className="text-[10px] font-bold text-stone-400 mt-1">Ordered at: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'Just now'}</p>
                    </div>

                    <div className="bg-stone-50 rounded-[2rem] p-6 space-y-4 mb-6">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-stone-700">{item.quantity}x {item.name}</span>
                              {(item as any).categoryName && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">
                                  {(item as any).categoryName} {(item as any).subSection ? `• ${(item as any).subSection.replace('_', ' ')}` : ''}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-stone-400">{item.price * item.quantity} MAD</span>
                          </div>
                        ))}
                       <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Total</span>
                          <span className="text-lg font-black text-stone-900">{order.total} MAD</span>
                       </div>
                    </div>

                    <div className="mb-6 px-2">
                      <OrderTimer 
                        createdAt={order.createdAt} 
                        preparingAt={order.preparingAt}
                        prepTime={order.prepTime} 
                        status={order.status} 
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-50">
                       <button onClick={() => updateStatus(order.id, 'preparing')} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-50 hover:bg-amber-50 group transition-colors">
                         <Soup size={18} className="text-stone-400 group-hover:text-amber-500" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">Preparing</span>
                       </button>
                       <button onClick={() => updateStatus(order.id, 'ready')} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-50 hover:bg-green-50 group transition-colors">
                         <CheckCircle2 size={18} className="text-stone-400 group-hover:text-green-500" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">Ready</span>
                       </button>
                       <button onClick={() => completeOrder(order)} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-900 text-white hover:bg-black">
                         <CheckCheck size={18} className="text-amber-400" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">Complete</span>
                       </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="clients-list"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex bg-white p-4 rounded-3xl shadow-sm border border-stone-100 max-w-xl">
               <Search className="text-stone-300 mr-3" />
               <input 
                 type="text" 
                 placeholder="Search clients by name or email..."
                 className="flex-1 bg-transparent outline-none text-sm font-bold"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="border-b border-stone-50">
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">Client</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">Points</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">Contact</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">Type</th>
                     </tr>
                   </thead>
                   <tbody>
                     {filteredClients.map((client) => (
                       <tr key={client.uid} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center font-black text-amber-600">
                                  {client.name.charAt(0).toUpperCase()}
                               </div>
                               <div>
                                  <p className="font-black text-stone-900 uppercase italic leading-none mb-1">{client.name}</p>
                                  <p className="text-[10px] font-bold text-stone-400">UID: {client.uid.substring(0, 8)}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            {(() => {
                              const activeOrder = orders.find(o => o.userId === client.uid && o.status !== 'delivered');
                              if (activeOrder) {
                                return (
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-amber-600 font-bold">
                                      <Timer size={14} className="animate-pulse" />
                                      <span className="text-xs">Active Order</span>
                                    </div>
                                    <OrderTimer 
                                      createdAt={activeOrder.createdAt} 
                                      preparingAt={activeOrder.preparingAt}
                                      prepTime={activeOrder.prepTime} 
                                      status={activeOrder.status} 
                                    />
                                  </div>
                                );
                              }
                              return <span className="text-xs text-stone-400">No active orders</span>;
                            })()}
                         </td>
                         <td className="px-8 py-6 text-sm font-black text-stone-900">{client.points} pts</td>
                         <td className="px-8 py-6 text-sm font-bold text-stone-500">{client.email}</td>
                         <td className="px-8 py-6">
                            <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              client.isAdmin ? 'bg-stone-900 text-white' : 
                              client.isWaiter ? 'bg-amber-400 text-stone-900' : 'bg-stone-100 text-stone-500'
                            }`}>
                               {client.isAdmin ? 'Admin' : client.isWaiter ? 'Waiter' : 'Customer'}
                            </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
