import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, setDoc, increment, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, OrderStatus, UserProfile, WaiterRequest, WaiterOrderStatus } from '../../types';
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
  MessageSquare,
  Bell,
  Navigation,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { OrderTimer } from '../../components/OrderTimer';


const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

export default function WaiterDashboard() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<WaiterRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'requests' | 'ready'>('orders');
  const [waiterProfile, setWaiterProfile] = useState<UserProfile | null>(null);
  const profileRef = React.useRef<UserProfile | null>(null);
  const prevOrdersRef = React.useRef<Order[]>([]);

  useEffect(() => {
    profileRef.current = waiterProfile;
  }, [waiterProfile]);

  useEffect(() => {
    let unsubscribeOrders: (() => void) | null = null;
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribeProfile: (() => void) | null = null;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      // Clean up previous listeners if auth state changes
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribeProfile) unsubscribeProfile();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch waiter profile
      unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setWaiterProfile(docSnap.data() as UserProfile);
        }
      });

      // Orders subscription
      const qOrders = query(
        collection(db, 'orders'),
        orderBy('createdAt', 'asc')
      );

      unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        // Waiter Profile for zone filtering
        const userDoc = snapshot.docs.find(d => d.id === user.uid); // This is wrong, profile is in users collection
        // Already handled profile in separate listener.

        setOrders(data);
        
        const lastOrderCount = parseInt(sessionStorage.getItem('last_order_count') || '0');
        const activeOrders = data.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

        if (activeOrders.length > lastOrderCount) {
          // Play sound and toast only if it's in the waiter's zone
          // Need to check if profile is loaded
        }

        // Check for specific staff state changes
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const newData = change.doc.data() as Order;
            const oldOrder = prevOrdersRef.current.find(o => o.id === change.doc.id);
            
            // Check if order belongs to waiter's zone
            const currentProfile = profileRef.current;
            const isMyZone = currentProfile?.assignedZone ? newData.tableZone === currentProfile.assignedZone : true;

            if (oldOrder && isMyZone) {
              // Client Modified Order Notification
              if (newData.isModified && !oldOrder.isModified) {
                toast.error(`${t('order_modified_alert', 'Order Modified by Client!')} - ${newData.fullTableLabel || newData.customerName}`, {
                  icon: '📝',
                  duration: 10000,
                  position: 'top-center',
                  style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
                });
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.play().catch(() => {});
              }

              // Client Cancelled Order Notification
              if (newData.status === 'cancelled' && oldOrder.status !== 'cancelled') {
                toast.error(`${t('order_cancelled_alert', 'Order CANCELLED by Client!')} - ${newData.fullTableLabel || newData.customerName}`, {
                  icon: '❌',
                  duration: 12000,
                  position: 'top-center',
                  style: { background: '#ef4444', color: '#fff', fontWeight: 'bold' }
                });
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.play().catch(() => {});
              }

              // Kitchen/Bar Notification: Order Ready
              const kitchenJustReady = newData.kitchenStatus === 'ready' && oldOrder.kitchenStatus !== 'ready';
              const barmanJustReady = newData.barmanStatus === 'ready' && oldOrder.barmanStatus !== 'ready';

              if (kitchenJustReady || barmanJustReady) {
                const targetSystem = kitchenJustReady ? (t('kitchen') as string) : (t('barman') as string);
                toast.success(`${targetSystem} ${t('is_ready_alert', 'is Ready!') as string} - ${newData.fullTableLabel || newData.customerName}`, {
                  icon: '✨',
                  duration: 8000,
                  position: 'top-right',
                  style: { background: '#10b981', color: '#fff', fontWeight: 'bold' }
                });
                const audio = new Audio(NOTIFICATION_SOUND);
                audio.play().catch(() => {});
              }
            }
          }
        });

        prevOrdersRef.current = data;
        sessionStorage.setItem('last_order_count', activeOrders.length.toString());
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
        setLoading(false);
      });

      // Waiter Requests subscription (Notifications for call waiter)
      const qRequests = query(
        collection(db, 'waiterRequests'),
        where('status', 'in', ['new', 'accepted']),
        orderBy('timestamp', 'desc')
      );

      let isInitialLoad = true;
      unsubscribeRequests = onSnapshot(qRequests, (snapshot) => {
        const reqData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WaiterRequest));
        setRequests(reqData);

        if (isInitialLoad) {
          isInitialLoad = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const req = { id: change.doc.id, ...change.doc.data() } as WaiterRequest;
            
            // Filter by zone
            const currentProfile = profileRef.current;
            const isMyZone = currentProfile?.assignedZone ? req.tableZone === currentProfile.assignedZone : true;

            // Only notify if it's assigned to this waiter or unassigned AND in my zone
            if (isMyZone && (!req.waiterId || req.waiterId === auth.currentUser?.uid)) {
              toast.error(
                `${t('waiter_called_toast', 'Customer Calling!')} - ${req.fullTableLabel || req.clientName}`,
                {
                  icon: '🔔',
                  duration: 15000,
                  position: 'top-center',
                  style: { 
                    background: '#1a1a1a', 
                    color: '#fbbf24', 
                    fontWeight: '900',
                    border: '5px solid #fbbf24',
                    fontSize: '20px',
                    padding: '24px'
                  }
                }
              );
              const audio = new Audio(NOTIFICATION_SOUND);
              audio.play().catch(e => console.error("Audio error", e));
            }
          }
        });
      }, (error) => {
        console.error("Waiter requests listener error:", error);
      });
    });

    return () => {
      unsubAuth();
      if (unsubscribeOrders) unsubscribeOrders();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, []);

  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', order.id);
      const updateData: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      // Also update waiterStatus if it's a waiter's action
      const waiterStatuses: Record<OrderStatus, WaiterOrderStatus> = {
        'pending': 'New',
        'accepted': 'Accepted',
        'preparing': 'Preparing',
        'ready': 'Ready',
        'delivered': 'Served',
        'cancelled': 'Served',
        'delivering': 'Preparing'
      };
      updateData.waiterStatus = waiterStatuses[newStatus];

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

  const acceptOrder = async (order: Order) => {
    if (!auth.currentUser) return;
    
    try {
      const orderRef = doc(db, 'orders', order.id);
      const waiterName = auth.currentUser.displayName || 'Waiter';
      const waiterId = auth.currentUser.uid;

      // Using transaction to ensure first-come, first-served
      await updateDoc(orderRef, {
        waiterId: waiterId,
        waiterName: waiterName,
        waiterStatus: 'Accepted',
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      toast.success(t('order_accepted', 'Order accepted and assigned to you') as string);
    } catch (err: any) {
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        toast.error(t('order_already_taken', 'This order was already taken by another waiter') as string);
      } else {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    }
  };

  const acceptRequest = async (req: WaiterRequest) => {
    if (!auth.currentUser) return;
    try {
      const waiterName = auth.currentUser.displayName || 'Waiter';
      const waiterId = auth.currentUser.uid;
      const reqRef = doc(db, 'waiterRequests', req.id);

      await updateDoc(reqRef, {
        waiterId: waiterId,
        waiterName: waiterName,
        status: 'accepted'
      });
      toast.success(t('request_accepted', 'Request accepted') as string);
    } catch (err: any) {
      if (err.message?.includes('permission-denied') || err.code === 'permission-denied') {
        toast.error(t('request_already_taken', 'This request was already taken by another waiter') as string);
      } else {
        handleFirestoreError(err, OperationType.UPDATE, `waiterRequests/${req.id}`);
      }
    }
  };

  const completeRequest = async (req: WaiterRequest) => {
    try {
      const reqRef = doc(db, 'waiterRequests', req.id);
      await updateDoc(reqRef, {
        status: 'completed'
      });
      toast.success(t('request_completed', 'Request completed') as string);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `waiterRequests/${req.id}`);
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
      
      toast.success(t('order_completed_toast', 'Order completed and delivered!') as string);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.status !== 'delivered' && 
    o.status !== 'cancelled' && 
    (!waiterProfile?.assignedZone || o.tableZone === waiterProfile.assignedZone)
  );

  const filteredRequests = requests.filter(r => 
    !waiterProfile?.assignedZone || r.tableZone === waiterProfile.assignedZone
  );

  const readyToServeOrders = orders.filter(o => 
    (o.kitchenStatus === 'ready' || o.barmanStatus === 'ready') && 
    o.status !== 'delivered' && 
    o.status !== 'cancelled' &&
    (!waiterProfile?.assignedZone || o.tableZone === waiterProfile.assignedZone)
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
              {t('waiter_console') as string}
            </h1>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">
              Palace Taha • {waiterProfile?.assignedZone ? `Zone ${waiterProfile.assignedZone} (${waiterProfile.assignedZone === 'A' ? 'Inside' : 'Outside'})` : t('active_terminal') as string}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-stone-100 p-1.5 rounded-2xl border border-stone-200">
             <button 
               onClick={() => setActiveTab('orders')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
             >
               {t('orders', 'Orders') as string} ({filteredOrders.length})
             </button>
             <button 
               onClick={() => setActiveTab('ready')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'ready' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
             >
               {t('ready_to_serve', 'Ready') as string} ({readyToServeOrders.length})
               {readyToServeOrders.length > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">
                   {readyToServeOrders.length}
                 </span>
               )}
             </button>
             <button 
               onClick={() => setActiveTab('requests')}
               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'requests' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
             >
               {t('requests_tab', 'Calls') as string}
               {filteredRequests.filter(r => r.status === 'new').length > 0 && (
                 <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">
                   {filteredRequests.filter(r => r.status === 'new').length}
                 </span>
               )}
             </button>
           </div>
           
           <button 
             onClick={() => {
               localStorage.removeItem('waiter_session_active');
               auth.signOut();
             }}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100"
           >
             {t('exit') as string}
           </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'orders' ? (
          <motion.div 
            key="orders-grid"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-8"
          >
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center text-stone-300 uppercase font-black italic">
                  <Coffee size={64} className="mb-4 opacity-20" />
                  {t('no_active_orders')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
                  {filteredOrders.map((order) => (
                    <motion.div
                      layout
                      key={order.id}
                      className={`bg-white rounded-[3rem] p-8 shadow-xl border relative overflow-hidden ${
                        order.status === 'ready' ? 'ring-4 ring-green-400 border-green-400' : 'border-stone-100'
                      }`}
                    >
                      <div className="mb-6">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('client_name', 'Customer') as string}</p>
                              {order.isModified && (
                                <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-pulse">
                                  Modified
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-black text-stone-900 uppercase italic">{order.customerName}</h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {order.deliveryType === 'dine-in' ? (
                            <div className="flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-2xl shadow-lg border-2 border-amber-400/50">
                              <Navigation size={14} className="text-amber-400" />
                              <span className="text-sm font-black italic uppercase tracking-tighter">
                                {order.fullTableLabel} ({order.tableArea})
                              </span>
                            </div>
                          ) : (
                            <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${
                              order.deliveryType === 'pickup' ? 'bg-amber-100/50 text-amber-700 border-amber-200' : 'bg-stone-100 text-stone-700 border-stone-200'
                            }`}>
                              {order.deliveryType === 'pickup' ? t('takeaway') : order.deliveryType}
                            </span>
                          )}
                          <p className="text-[10px] font-bold text-stone-400 ml-auto whitespace-nowrap">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString() : 'Just now'}
                          </p>
                        </div>

                        {order.waiterId ? (
                          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all ${
                            order.waiterId === auth.currentUser?.uid 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : 'bg-stone-50 text-stone-500 border-stone-100'
                          }`}>
                            <UserCheck size={14} className={order.waiterId === auth.currentUser?.uid ? 'text-amber-500' : ''} />
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                              {order.waiterId === auth.currentUser?.uid 
                                ? t('you_are_handling_this', 'You are handling this order')
                                : `${t('assigned_to', 'Assigned to')}: ${order.waiterName || 'Staff'}`
                              }
                            </span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => acceptOrder(order)}
                            className="mt-4 w-full py-4 bg-amber-400 text-stone-900 rounded-2xl font-black uppercase text-[11px] tracking-[0.25em] shadow-xl shadow-amber-400/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                          >
                            <Navigation size={16} className="rotate-45" />
                            {t('take_order', 'Take Order') as string}
                          </button>
                        )}
                      </div>

                      <div className="bg-stone-50 rounded-[2rem] p-6 space-y-4 mb-6">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start text-sm">
                              <div className="flex flex-col">
                                <span className="font-bold text-stone-700">{item.quantity}x {t(`products.${item.name}`, item.name) as string}</span>
                                {item.customization && (
                                  <span className="text-[10px] font-black uppercase text-amber-500 italic">
                                    {item.customization.includes('|') ? (
                                      <>
                                        {t(`products.${item.customization.split('|')[0].trim()}`, item.customization.split('|')[0].trim()) as string}
                                        {' • '}
                                        {t(item.customization.split('|')[1].trim().toLowerCase().replace(/ /g, '_')) as string}
                                      </>
                                    ) : (
                                      item.customization
                                    )}
                                  </span>
                                )}
                                {(item as any).categoryName && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">
                                    {t(`categories.${(item as any).categoryName}`, (item as any).categoryName) as string} {(item as any).subSection ? `• ${(item as any).subSection.replace('_', ' ')}` : ''}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-stone-400">{item.price * item.quantity} MAD</span>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{t('total', 'Total') as string}</span>
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
                          expectedReadyAt={order.expectedReadyAt}
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

                      <div className="mt-6 pt-6 border-t border-stone-100">
                         <button 
                           onClick={() => completeOrder(order)} 
                           className="w-full flex flex-col items-center gap-2 py-5 rounded-3xl bg-stone-950 text-white hover:bg-black shadow-xl shadow-stone-900/20 active:scale-95 transition-all"
                         >
                           <CheckCheck size={20} className="text-amber-400" />
                           <span className="text-[10px] font-black uppercase tracking-widest leading-none">{t('complete')}</span>
                           <span className="text-[8px] font-bold text-stone-500 uppercase tracking-tighter">{t('mark_as_served_for_cashier', 'Mark as Served & Send to Cashier')}</span>
                         </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
          </motion.div>
        ) : activeTab === 'ready' ? (
          <motion.div 
            key="ready-grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
              {readyToServeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center text-stone-300 uppercase font-black italic">
                  <CheckCircle2 size={64} className="mb-4 opacity-20" />
                  {t('nothing_ready_to_serve', 'Nothing ready to serve')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {readyToServeOrders.map((order) => (
                    <motion.div
                      layout
                      key={order.id}
                      className="bg-white rounded-[2.5rem] p-8 border-4 border-green-500 shadow-2xl relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">{t('ready_now', 'Ready Now') as string}</p>
                          <h3 className="text-2xl font-black text-stone-900 uppercase italic">{order.customerName}</h3>
                          <div className="mt-2 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-2xl shadow-lg">
                            <Navigation size={14} className="text-white" />
                            <span className="text-sm font-black italic uppercase tracking-tighter">
                              {order.fullTableLabel} ({order.tableArea})
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                           {order.kitchenStatus === 'ready' && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
                               <ChefHat size={12} />
                               <span className="text-[8px] font-black uppercase">{t('kitchen')}</span>
                             </div>
                           )}
                           {order.barmanStatus === 'ready' && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                               <Coffee size={12} />
                               <span className="text-[8px] font-black uppercase">{t('barman')}</span>
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="bg-stone-50 rounded-2xl p-4 mb-6">
                         {order.items.filter(i => {
                            if (order.kitchenStatus === 'ready' && order.barmanStatus === 'ready') return true;
                            if (order.kitchenStatus === 'ready') return i.system === 'kitchen' || i.system === 'both';
                            if (order.barmanStatus === 'ready') return i.system === 'barman';
                            return true;
                         }).map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-sm mb-1 last:mb-0">
                             <span className="font-bold text-stone-700">{item.quantity}x {item.name}</span>
                           </div>
                         ))}
                      </div>

                      <button 
                        onClick={() => completeOrder(order)}
                        className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-green-600 transition-all flex items-center justify-center gap-3"
                      >
                        <CheckCheck size={18} />
                        {t('mark_served', 'Mark Served') as string}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
          </motion.div>
        ) : (
          <motion.div 
            key="requests-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
             {filteredRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 text-center text-stone-300 uppercase font-black italic">
                  <Bell size={64} className="mb-4 opacity-20" />
                  {t('no_active_requests')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRequests.map((req) => (
                   <div key={req.id} className={`bg-white rounded-[2.5rem] p-6 border-2 transition-all ${req.status === 'new' ? 'border-amber-400 shadow-xl shadow-amber-400/5' : 'border-stone-100 opacity-60'}`}>
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.status === 'new' ? 'bg-amber-400 text-stone-900 animate-pulse' : 'bg-stone-100 text-stone-400'}`}>
                              <Bell size={24} />
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-stone-900 uppercase italic tracking-tight">{req.fullTableLabel || req.clientName}</h4>
                              <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5">{t('calling_waiter', 'Calling Waiter')}</p>
                           </div>
                        </div>
                     </div>

                     <div className="flex flex-col gap-3">
                        {req.status === 'new' ? (
                          <button 
                            onClick={() => acceptRequest(req)}
                            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg"
                          >
                            {t('accept_call', 'Accept Call')}
                          </button>
                        ) : (
                          <div className="space-y-3">
                             <div className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                                <UserCheck size={14} className="text-green-500" />
                                <span className="text-[9px] font-black uppercase text-stone-500">{t('handled_by', 'Handled by')}: {req.waiterName}</span>
                             </div>
                             {req.waiterId === auth.currentUser?.uid && (
                               <button 
                                 onClick={() => completeRequest(req)}
                                 className="w-full py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all shadow-lg"
                               >
                                 {t('mark_resolved', 'Mark Resolved')}
                               </button>
                             )}
                          </div>
                        )}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
