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
  Search,
  Gift,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { OrderTimer } from '../../components/OrderTimer';


const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

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
          const audio = new Audio(NOTIFICATION_SOUND);
          audio.play().catch(e => console.log('Audio blocked', e));
          toast('New Order!', { icon: '🔔' });
        }

        // Check for specific staff state changes
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const newData = change.doc.data() as Order;
            const oldOrder = orders.find(o => o.id === change.doc.id);
            
            if (oldOrder) {
              // Kitchen Notification for Waiter
              if (newData.kitchenStatus !== oldOrder.kitchenStatus && (newData.kitchenStatus === 'ready' || newData.kitchenStatus === 'completed')) {
                toast.success(`${t('kitchen_ready', 'Kitchen Order Ready!')} - ${newData.customerName}`, {
                  icon: '🍳',
                  duration: 8000,
                  position: 'top-right',
                  style: { background: '#2563eb', color: '#fff', fontWeight: 'bold' }
                });
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.play().catch(() => {});
              }
              
              // Barman Notification for Waiter
              if (newData.barmanStatus !== oldOrder.barmanStatus && (newData.barmanStatus === 'ready' || newData.barmanStatus === 'completed')) {
                toast.success(`${t('barman_ready', 'Drinks Ready!')} - ${newData.customerName}`, {
                  icon: '☕',
                  duration: 8000,
                  position: 'top-right',
                  style: { background: '#d97706', color: '#fff', fontWeight: 'bold' }
                });
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.play().catch(() => {});
              }
            }
          }
        });

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

  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      let elapsedMins = 0;
      if (newStatus === 'ready' || newStatus === 'preparing') {
        const now = new Date();
        let createdDate: Date | null = null;
        if (order.createdAt) {
          if (typeof (order.createdAt as any).toDate === 'function') {
            createdDate = (order.createdAt as any).toDate();
          } else {
            createdDate = new Date(order.createdAt as any);
          }
        }
        
        if (createdDate && !isNaN(createdDate.getTime())) {
          const diffMs = now.getTime() - createdDate.getTime();
          elapsedMins = Math.round(diffMs / 60000);
          if (elapsedMins < 1 && diffMs > 0) elapsedMins = 1; // Minimum 1 min if just started
        }
      }

      if (newStatus === 'preparing') {
        updateData.preparingAt = serverTimestamp();
      } else if (newStatus === 'ready') {
        updateData.readyAt = serverTimestamp();
        updateData.readyInMinutes = elapsedMins;
      }

      await updateDoc(orderRef, updateData);
      
      if (newStatus === 'ready') {
        toast('Client notified: Order Ready!', { icon: '📢' });
      } else {
        toast.success(`Order status updated: ${newStatus}`);
      }
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
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
      
      toast.success(t('order_completed_toast', 'Order completed and delivered!'));
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
              {t('waiter_console')}
            </h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
              Palace Taha • {t('active_terminal')}
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
                {t('orders')} ({orders.length})
              </button>
              <button 
                onClick={() => setActiveTab('clients')}
                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === 'clients' ? 'bg-stone-900 text-white' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <Users size={14} />
                {t('clients_list', 'Clients')} ({clients.length})
              </button>
           </div>

           <button 
             onClick={() => {
               localStorage.removeItem('waiter_session_active');
               auth.signOut();
             }}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100"
           >
             {t('exit')}
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
                {t('no_active_orders')}
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
                    <div className="mb-6">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('client_name', 'Customer')}</p>
                        {(() => {
                          const client = clients.find(c => c.uid === order.userId);
                          const hasReward = client?.itemLoyalty && Object.entries(client.itemLoyalty).some(([_, count]) => (count as number) >= 11);
                          if (hasReward) {
                            return (
                              <div className="flex items-center gap-1.5 bg-amber-400 text-stone-900 px-3 py-1 rounded-full animate-bounce shadow-lg">
                                <Gift size={12} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('reward_ready')}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <h3 className="text-2xl font-black text-stone-900 uppercase italic">{order.customerName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          order.deliveryType === 'pickup' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {order.deliveryType === 'pickup' ? t('takeaway') : t('dine_in', 'Dine In')}
                        </span>
                        <p className="text-[10px] font-bold text-stone-300">{t('ordered_at')}: {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'Just now'}</p>
                      </div>
                    </div>

                    <div className="bg-stone-50 rounded-[2rem] p-6 space-y-4 mb-6">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="flex flex-col">
                              <span className="font-bold text-stone-700">{item.quantity}x {t(`products.${item.name}`, item.name)}</span>
                              {item.customization && (
                                <span className="text-[10px] font-black uppercase text-amber-500 italic">
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
                              {(item as any).categoryName && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">
                                  {t(`categories.${(item as any).categoryName}`, (item as any).categoryName)} {(item as any).subSection ? `• ${(item as any).subSection.replace('_', ' ')}` : ''}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-stone-400">{item.price * item.quantity} MAD</span>
                          </div>
                        ))}
                        <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{t('total', 'Total')}</span>
                          <span className="text-lg font-black text-stone-900">{order.total} MAD</span>
                       </div>
                    </div>

                    {order.deliveryNotes && (
                      <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 italic">
                        <MessageSquare size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-stone-700 leading-relaxed">
                          {order.deliveryNotes}
                        </p>
                      </div>
                    )}

                    <div className="mb-6 px-2">
                      <OrderTimer 
                        createdAt={order.createdAt} 
                        prepTime={order.prepTime} 
                        status={order.status} 
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {order.kitchenStatus && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          order.kitchenStatus === 'completed' ? 'bg-green-50 border-green-100 text-green-600' :
                          order.kitchenStatus === 'ready' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                          order.kitchenStatus === 'preparing' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                          'bg-stone-50 border-stone-100 text-stone-400'
                        }`}>
                          <ChefHat size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">K: {order.kitchenStatus}</span>
                        </div>
                      )}
                      {order.barmanStatus && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                          order.barmanStatus === 'completed' ? 'bg-green-50 border-green-100 text-green-600' :
                          order.barmanStatus === 'ready' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                          order.barmanStatus === 'preparing' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                          'bg-stone-50 border-stone-100 text-stone-400'
                        }`}>
                          <Coffee size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">B: {order.barmanStatus}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-stone-50">
                       <button onClick={() => updateStatus(order, 'preparing')} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-50 hover:bg-amber-50 group transition-colors">
                         <Soup size={18} className="text-stone-400 group-hover:text-amber-500" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">{t('preparing')}</span>
                       </button>
                       <button onClick={() => updateStatus(order, 'ready')} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-50 hover:bg-green-50 group transition-colors">
                         <CheckCircle2 size={18} className="text-stone-400 group-hover:text-green-500" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">{t('mark_ready', 'Ready')}</span>
                       </button>
                       <button onClick={() => completeOrder(order)} className="flex flex-col items-center gap-2 py-4 rounded-3xl bg-stone-900 text-white hover:bg-black">
                         <CheckCheck size={18} className="text-amber-400" />
                         <span className="text-[8px] font-black uppercase tracking-tighter">{t('complete')}</span>
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
                 placeholder={t('search_clients_placeholder')}
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
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('client')}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('status')}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('loyalty_points', 'Points')}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('contact')}</th>
                        <th className="px-8 py-6 text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('type')}</th>
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
                                      <span className="text-xs">{t('active_order_label')}</span>
                                    </div>
                                    <OrderTimer 
                                      createdAt={activeOrder.createdAt} 
                                      prepTime={activeOrder.prepTime} 
                                      status={activeOrder.status} 
                                    />
                                  </div>
                                );
                              }
                              return <span className="text-xs text-stone-400">{t('no_active_orders_label')}</span>;
                            })()}
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex flex-col gap-1">
                               <div className="text-sm font-black text-stone-900">{client.points} {t('pts_short')}</div>
                               {client.itemLoyalty && Object.entries(client.itemLoyalty).some(([_, count]) => (count as number) >= 11) && (
                                 <div className="flex items-center gap-1.5 bg-amber-400 text-stone-900 px-2 py-0.5 rounded-lg w-fit shadow-lg shadow-amber-400/20 ring-2 ring-white/20">
                                   <Gift size={10} />
                                   <span className="text-[8px] font-black uppercase tracking-tight">12 - {t('get_free_order')}</span>
                                 </div>
                               )}
                            </div>
                         </td>
                         <td className="px-8 py-6 text-sm font-bold text-stone-500">{client.email}</td>
                         <td className="px-8 py-6">
                            <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              client.isAdmin ? 'bg-stone-900 text-white' : 
                              client.isWaiter ? 'bg-amber-400 text-stone-900' : 'bg-stone-100 text-stone-500'
                            }`}>
                               {client.isAdmin ? t('admin_role') : client.isWaiter ? t('waiter_role') : t('customer_role')}
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
