import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile, WaiterRequest, Order } from '../types';
import { Bell, User, CheckCircle2, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function CallWaiter({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const [activeDineInOrder, setActiveDineInOrder] = useState<Order | null>(null);
  const [activeRequest, setActiveRequest] = useState<WaiterRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Listen for active dine-in orders for this user
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', auth.currentUser.uid),
      where('deliveryType', '==', 'dine-in'),
      where('status', 'not-in', ['delivered', 'cancelled']),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const order = { id: snap.docs[0].id, ...snap.docs[0].data() } as Order;
        setActiveDineInOrder(order);
      } else {
        setActiveDineInOrder(null);
      }
    });
  }, []);

  useEffect(() => {
    if (!auth.currentUser || !activeDineInOrder) {
      setActiveRequest(null);
      return;
    }

    // Listen for active waiter requests for this table/order
    const q = query(
      collection(db, 'waiterRequests'),
      where('clientId', '==', auth.currentUser.uid),
      where('fullTableLabel', '==', activeDineInOrder.fullTableLabel),
      where('status', '!=', 'completed'),
      limit(1)
    );

    return onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setActiveRequest({ id: snap.docs[0].id, ...snap.docs[0].data() } as WaiterRequest);
      } else {
        setActiveRequest(null);
      }
    });
  }, [activeDineInOrder]);

  const handleCallWaiter = async () => {
    if (!auth.currentUser || !activeDineInOrder) return;
    
    // If order not taken yet, show notification and don't proceed
    if (!activeDineInOrder.waiterId) {
      toast(t('wait_for_waiter_to_take_order', 'Please wait for a waiter to take your order first'), {
        icon: '⏳',
        style: {
          background: '#444',
          color: '#fff',
        }
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'waiterRequests'), {
        clientId: auth.currentUser.uid,
        clientName: userProfile?.name || auth.currentUser.displayName || t('guest'),
        tableZone: activeDineInOrder.tableZone,
        tableArea: activeDineInOrder.tableArea,
        tableNumber: activeDineInOrder.tableNumber,
        fullTableLabel: activeDineInOrder.fullTableLabel,
        timestamp: serverTimestamp(),
        status: 'new',
        waiterId: activeDineInOrder.waiterId, // Assign to the waiter who took the order
        waiterName: activeDineInOrder.waiterName || null
      });
      toast.success(t('waiter_called', 'Waiter called! Someone will be with you shortly.'));
    } catch (err) {
      toast.error(t('failed_to_call_waiter', 'Failed to call waiter'));
    } finally {
      setLoading(false);
    }
  };

  if (!activeDineInOrder) return null;

  const isOrderTaken = !!activeDineInOrder.waiterId;
  const isRequestActive = !!activeRequest;

  return (
    <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {activeRequest && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-stone-900/90 dark:bg-stone-800/90 backdrop-blur-3xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[240px]"
          >
            <div className={`p-3 rounded-2xl ${activeRequest.status === 'accepted' ? 'bg-amber-400 text-stone-900' : 'bg-white/10 text-white animate-pulse'}`}>
              {activeRequest.status === 'accepted' ? <User size={20} /> : <Bell size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">
                {activeRequest.status === 'accepted' ? t('waiter_on_way', 'Waiter on the way!') : t('request_sent', 'Request Sent')}
              </p>
              <p className="text-xs font-bold text-white">
                {activeRequest.status === 'accepted' ? t('waiter_assigned', { name: activeRequest.waiterName }) : t('waiting_for_waiter', 'Waiting for assistance...')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={isOrderTaken && !isRequestActive ? { scale: 1.05 } : {}}
        whileTap={isOrderTaken && !isRequestActive ? { scale: 0.95 } : {}}
        onClick={handleCallWaiter}
        disabled={loading || isRequestActive}
        className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all border-4 ${
          !isOrderTaken || isRequestActive 
            ? 'bg-stone-800 text-stone-400 border-stone-900 opacity-80 cursor-not-allowed' 
            : 'bg-amber-400 text-stone-900 hover:rotate-12 border-amber-500/50'
        }`}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Bell size={28} className={!isOrderTaken || isRequestActive ? 'opacity-30' : ''} />}
      </motion.button>
    </div>
  );
}
