import { translateCustomization } from '../../utils/translations';
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus, UserProfile } from '../../types';
import { Clock, CheckCircle2, Coffee, Package, Truck, AlertCircle, ExternalLink, MessageCircle, MapPin, ShoppingBag, Award, Gift, ChefHat, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { OrderTimer } from '../../components/OrderTimer';
import { AdminHistoryTab } from '../../components/AdminHistoryTab';
import { OrderTimestamps } from '../../components/OrderTimestamps';

const STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];


export default function AdminOrders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      console.error("Admin orders listener error:", error);
      setLoading(false);
    });

    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });

    return () => {
      unsubscribe();
      unsubUsers();
    };
  }, []);

  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus === 'preparing' && !order.preparingAt) {
        updateData.preparingAt = serverTimestamp();
        updateData.kitchenStartedAt = serverTimestamp();
        updateData.barmanStartedAt = serverTimestamp();
      } else if (newStatus === 'ready' && !order.readyAt) {
        updateData.readyAt = serverTimestamp();
        updateData.kitchenReadyAt = serverTimestamp();
        updateData.barmanReadyAt = serverTimestamp();
        
        // Calculate ready time from creation
        if (order.createdAt) {
          let start: Date | null = null;
          if (typeof (order.createdAt as any).toDate === 'function') {
            start = (order.createdAt as any).toDate();
          } else {
            start = new Date(order.createdAt as any);
          }
          
          if (start && !isNaN(start.getTime())) {
            const elapsedMins = Math.max(1, Math.round((new Date().getTime() - start.getTime()) / 60000));
            updateData.readyInMinutes = elapsedMins;
            toast.success(`Order was ready in ${elapsedMins} minutes!`);
          }
        }
      } else if (newStatus === 'delivered' && !order.deliveredAt) {
        updateData.deliveredAt = serverTimestamp();
        updateData.completedAt = serverTimestamp();
        
        // Calculate delivery time
        if (order.createdAt) {
          let start: Date | null = null;
          if (typeof (order.createdAt as any).toDate === 'function') {
            start = (order.createdAt as any).toDate();
          } else {
            start = new Date(order.createdAt as any);
          }
          
          if (start && !isNaN(start.getTime())) {
            const diffInMinutes = Math.round((new Date().getTime() - start.getTime()) / 60000);
            updateData.deliveredInMinutes = diffInMinutes;
          }
        }
      }
      
      await updateDoc(doc(db, 'orders', order.id), updateData);
      
      toast.success(`${t('order_set_to') as string} ${newStatus}`);
    } catch (err) {
      toast.error(t('failed_status_update') as string);
    }
  };

  if (loading) return <div className="text-center py-20 tracking-tighter uppercase font-black italic text-stone-400">{t('monitoring_orders') as string}</div>;

  const activeOrders = orders.filter(o => !o.isPaid && o.status !== 'Paid' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'Completed' || o.status === 'Paid' || o.isPaid) &&
    (!searchQuery || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.waiterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.fullTableLabel || o.tableNumber)?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ).slice(0, 15);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-brown-950 uppercase italic tracking-tighter">{t('live_orders') as string} & History</h1>
        <div className="flex bg-stone-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('live')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'live' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Live Tracking
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'history' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            POS History Log
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <AdminHistoryTab orders={orders} />
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
              <AlertCircle size={14} /> {activeOrders.length} {t('waiting_label') as string}
            </div>
          )}
          {activeOrders.length === 0 ? null : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-[#FDF8F3] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-sm border-2 border-stone-100/50 hover:border-brown-100 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-bold text-brown-950 uppercase italic leading-none">{order.customerName || 'Walk-in'}</h3>
                          <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <OrderTimestamps order={order} compact={true} />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <p className="text-gray-500 text-sm flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100 italic">
                        <ShoppingBag size={14} className="text-brown-600" />
                        <span className="font-black uppercase text-[10px] tracking-wider">
                          {order.deliveryType === 'dine-in' ? (t('dine_in', 'Dine In') as string) : (t('takeaway') as string)}
                        </span>
                      </p>
                      <OrderTimer 
                        createdAt={order.createdAt} 
                        prepTime={order.prepTime} 
                        status={order.status} 
                        expectedReadyAt={order.expectedReadyAt} readyAt={order.readyAt} completedAt={order.completedAt}
                      />
                    </div>

                    <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-brown-50/50 px-3 py-2 rounded-xl flex justify-between items-center border border-brown-100/50">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-brown-600 text-white flex items-center justify-center text-[10px] font-black">{item.quantity}x</span>
                            <div>
                              <span className="text-xs font-bold text-brown-900">{item.name}</span>
                              {item.customization && (
                                <p className="text-[9px] font-black uppercase text-amber-500 italic mt-0.5">{item.customization}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-black text-brown-400">{(item.price * item.quantity).toFixed(2)} DH</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col items-end gap-2 mb-4">
                      <p className="text-3xl font-black text-brown-950 leading-none">{order.total.toFixed(0)} DH</p>
                    </div>

                    <div className="grid grid-cols-2 sm:flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order, status)}
                          className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                            order.status === status ? (status === 'preparing' ? 'bg-orange-500 border-orange-500 text-white' : status === 'ready' ? 'bg-green-500 border-green-500 text-white' : status === 'delivered' ? 'bg-blue-500 border-blue-500 text-white' : status === 'cancelled' ? 'bg-red-500 border-red-500 text-white' : 'bg-brown-600 border-brown-600 text-white') + ' shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-brown-200'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
