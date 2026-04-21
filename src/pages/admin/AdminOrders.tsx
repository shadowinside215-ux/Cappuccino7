import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, OrderStatus } from '../../types';
import { Clock, CheckCircle2, Coffee, Package, Truck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES: OrderStatus[] = ['pending', 'accepted', 'preparing', 'ready', 'delivered'];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (order: Order, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: newStatus });
      
      // If delivered, award points and increment coffee count
      if (newStatus === 'delivered' && order.status !== 'delivered') {
        const userRef = doc(db, 'users', order.userId);
        
        // Logic for coffee loyalty rule
        const coffeeKeywords = ['coffee', 'cappuccino', 'latte', 'espresso', 'café', 'machiato', 'boisson chaude'];
        const coffeeCountInOrder = order.items.reduce((acc, item) => {
          const isCoffee = coffeeKeywords.some(kw => item.name.toLowerCase().includes(kw));
          return isCoffee ? acc + item.quantity : acc;
        }, 0);

        await updateDoc(userRef, {
          points: increment(order.pointsEarned),
          coffeeCount: increment(coffeeCountInOrder)
        });
        
        if (coffeeCountInOrder > 0) {
          toast.success(`Awarded ${coffeeCountInOrder} coffee points to ${order.customerName}!`);
        } else {
          toast.success(`Points awarded to ${order.customerName}!`);
        }
      }
      
      toast.success(`Order set to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="text-center py-20">Monitoring live orders...</div>;

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brown-950">Live Orders</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">
          <AlertCircle size={14} /> {activeOrders.length} Waiting
        </div>
      </div>

      <div className="space-y-6">
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <p className="text-gray-400 font-medium">No active orders right now.</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-transparent hover:border-brown-100 transition-all">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-brown-950">{order.customerName}</h3>
                    <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mb-4">
                    <Truck size={14} /> {order.address}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 px-4 py-2 rounded-xl flex items-center gap-2">
                        <span className="font-bold text-brown-600">{item.quantity}x</span>
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-end md:w-48">
                  <p className="text-3xl font-black text-brown-950 mb-1">{order.total.toFixed(0)} MAD</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
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
                      : 'bg-white border-gray-100 text-gray-400 hover:border-brown-200'
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

      {orders.filter(o => o.status === 'delivered').length > 0 && (
        <div className="pt-12">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mb-6 pl-1">Completed History</h2>
          <div className="space-y-3 opacity-60">
            {orders.filter(o => o.status === 'delivered').slice(0, 5).map(o => (
              <div key={o.id} className="bg-white/50 p-4 rounded-2xl flex justify-between items-center text-sm">
                <span className="font-bold">{o.customerName}</span>
                <span className="text-gray-400">delivered • {o.total.toFixed(0)} MAD</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
