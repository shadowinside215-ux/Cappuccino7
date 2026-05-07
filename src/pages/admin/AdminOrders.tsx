import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus, UserProfile } from '../../types';
import { awardOrderPoints } from '../../services/orderService';
import { Clock, CheckCircle2, Coffee, Package, Truck, AlertCircle, ExternalLink, MessageCircle, MapPin, ShoppingBag, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered'];

// Import the OrderTimer logic (we'll define it locally since it's used in WaiterDashboard but they aren't in a common folder yet)
function OrderTimer({ createdAt, preparingAt, prepTime, status }: { createdAt: any, preparingAt?: any, prepTime: number, status: OrderStatus }) {
  const [elapsed, setElapsed] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const calculateTimes = () => {
      const now = Date.now();
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
          setTimeLeft(30 * 60);
        } else {
          const targetDate = new Date(startTime.getTime() + 30 * 60000);
          let diff = Math.floor((targetDate.getTime() - now) / 1000);
          
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
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${isPreparing ? (timeLeft !== null && timeLeft < 0 ? 'bg-red-500 text-white' : 'bg-stone-900 text-white') : 'bg-amber-100 text-amber-700'}`}>
       <Clock size={12} className={isPreparing && timeLeft !== null && timeLeft < 0 ? 'animate-pulse' : 'text-amber-400'} />
       <span>{isPreparing ? (timeLeft !== null ? `${timeLeft < 0 ? '-' : ''}${formatSecs(timeLeft)} LEFT` : '--:--') : `${formatSecs(elapsed)} WAITING`}</span>
    </div>
  );
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
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
    return unsubscribe;
  }, []);

  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updatedAt: serverTimestamp()
      };
      
      if (newStatus === 'preparing' && !order.preparingAt) {
        updateData.preparingAt = serverTimestamp();
      } else if (newStatus === 'ready' && !order.readyAt) {
        updateData.readyAt = serverTimestamp();
      } else if (newStatus === 'delivered' && !order.deliveredAt) {
        updateData.deliveredAt = serverTimestamp();
        
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
      
      // If delivered, award points
      if (newStatus === 'delivered' && order.status !== 'delivered') {
        await awardOrderPoints(order);
      }
      
      toast.success(`Order set to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-20">Monitoring live orders...</div>;

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered').slice(0, 15);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brown-950">Live Orders</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <AlertCircle size={14} /> {activeOrders.length} Waiting
        </div>
      </div>

      <div className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-[#FDF8F3] rounded-3xl border-2 border-dashed border-stone-200">
            <p className="text-gray-400 font-medium">No active orders right now.</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div key={order.id} className="bg-[#FDF8F3] rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-8 shadow-sm border-2 border-stone-100/50 hover:border-brown-100 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-brown-950">{order.customerName}</h3>
                    <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <p className="text-gray-500 text-sm flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      {order.deliveryType === 'delivery' ? <Truck size={14} className="text-amber-600" /> : <ShoppingBag size={14} className="text-brown-600" />}
                      <span className="font-bold uppercase text-[10px] tracking-wider">{order.deliveryType || 'Standard'}</span>
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                      <MapPin size={14} className="text-gray-400" /> {order.address}
                    </p>
                    <OrderTimer 
                      createdAt={order.createdAt} 
                      preparingAt={order.preparingAt} 
                      prepTime={order.prepTime} 
                      status={order.status} 
                    />
                    {order.location && (
                      <a 
                        href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
                      >
                        <ExternalLink size={12} />
                        Maps
                      </a>
                    )}
                  </div>

                  {order.deliveryNotes && (
                    <div className="mb-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle size={14} className="text-amber-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Special Instructions</span>
                      </div>
                      <p className="text-sm font-medium text-amber-900 italic">"{order.deliveryNotes}"</p>
                    </div>
                  )}

                  <div className="space-y-3 mt-6">
                    <p className="text-[10px] font-black text-brown-300 uppercase tracking-widest pl-1">Order Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-brown-50/50 px-4 py-3 rounded-2xl flex justify-between items-center border border-brown-100/50">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-brown-600 text-white flex items-center justify-center text-[10px] font-black">{item.quantity}x</span>
                            <div>
                              <span className="text-xs font-bold text-brown-900">{item.name}</span>
                              {(item as any).categoryName && (
                                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 mt-0.5">
                                  {t(`categories.${(item as any).categoryName}`, (item as any).categoryName)} 
                                  {(item as any).subSection ? ` • ${(item as any).subSection.replace('_', ' ')}` : ''}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-brown-400">{item.price * item.quantity} DH</p>
                             <p className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">
                               {item.quantity} pts loyalty
                             </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end md:w-56">
                  <p className="text-4xl font-black text-brown-950 mb-1 leading-none">{order.total.toFixed(0)} DH</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2">
                    <Clock size={12} />
                    {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-50 flex overflow-x-auto gap-3 no-scrollbar">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(order, status)}
                    className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border-2 ${
                      order.status === status
                      ? 'bg-brown-600 border-brown-600 text-white shadow-lg shadow-brown-100 scale-105'
                      : 'bg-[#FDF8F3] border-gray-100 text-gray-400 hover:border-brown-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {completedOrders.length > 0 && (
        <div className="space-y-6 pt-12 border-t-2 border-stone-100">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-2xl font-black text-stone-900 uppercase italic tracking-tighter">Performance Analysis</h2>
            <div className="px-4 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-200">
               Live Tracking
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedOrders.map((order) => (
              <div key={order.id} className="bg-[#FDF8F3] p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between group hover:shadow-md transition-all">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-stone-900 uppercase italic leading-none">{order.customerName}</h4>
                    <span className="text-[9px] font-bold text-stone-300">#{order.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <p className="text-[10px] font-bold text-stone-400 mb-4">
                    {order.deliveredAt?.toDate ? `Delivered at ${order.deliveredAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Delivered'}
                  </p>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-stone-50 p-2 rounded-xl border border-stone-100">
                        <span className="font-black text-stone-900">{item.quantity}x {item.name}</span>
                        <span className="text-stone-400">{item.price * item.quantity} DH</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                  <div className="space-y-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                      (order.deliveredInMinutes || 0) <= order.prepTime ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      <Clock size={12} />
                      <span className="text-[10px] font-black">{order.deliveredInMinutes || '?'} MINS TOTAL</span>
                    </div>
                    {order.preparingAt && order.readyAt && (
                      <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest pl-1">
                        Prep: {Math.round((order.readyAt.toDate().getTime() - order.preparingAt.toDate().getTime()) / 60000)} min
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                       <Award size={12} />
                       <span className="text-[10px] font-black uppercase tracking-widest">
                         {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items Loyalty
                       </span>
                    </div>
                    <p className="text-[8px] font-black text-stone-300 uppercase tracking-widest">Target: 30 min</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
