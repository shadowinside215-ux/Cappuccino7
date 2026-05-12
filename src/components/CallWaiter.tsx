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
        waiterId: null,
        waiterName: null
      });
      toast.success(t('waiter_called', 'Waiter called! Someone will be with you shortly.'));
    } catch (err) {
      toast.error(t('failed_to_call_waiter', 'Failed to call waiter'));
    } finally {
      setLoading(false);
    }
  };

  if (!activeDineInOrder) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {activeRequest && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-bento-card-bg/90 backdrop-blur-3xl border border-bento-card-border p-4 rounded-3xl shadow-2xl flex items-center gap-4 pointer-events-auto min-w-[240px]"
          >
            <div className={`p-3 rounded-2xl ${activeRequest.status === 'accepted' ? 'bg-amber-400 text-stone-900' : 'bg-bento-ink/10 text-bento-ink animate-pulse'}`}>
              {activeRequest.status === 'accepted' ? <User size={20} /> : <Bell size={20} />}
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">
                {activeRequest.status === 'accepted' ? t('waiter_on_way', 'Waiter on the way!') : t('request_sent', 'Request Sent')}
              </p>
              <p className="text-xs font-bold text-bento-ink">
                {activeRequest.status === 'accepted' ? t('waiter_assigned', { name: activeRequest.waiterName }) : t('waiting_for_waiter', 'Waiting for assistance...')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCallWaiter}
        disabled={loading || activeRequest !== null}
        className={`pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all border-4 border-bento-bg ${
          activeRequest 
            ? 'bg-stone-500/50 grayscale cursor-not-allowed' 
            : 'bg-amber-400 text-stone-900 hover:rotate-12'
        }`}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Bell size={28} className={activeRequest ? 'opacity-40' : ''} />}
      </motion.button>
    </div>
  );
}
