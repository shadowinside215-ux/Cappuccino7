import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, doc, runTransaction, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order, UserProfile } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  User, 
  Coffee, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Award,
  Gift
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function VerifyTicket({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [clientLoyalty, setClientLoyalty] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cashier or waiter check
  const isStaff = userProfile?.isAdmin || (localStorage.getItem('staffSession') !== null) || (localStorage.getItem('waiter_session_active') !== null);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('QR invalide ou expiré.');
        setLoading(false);
        return;
      }

      try {
        const q = query(collection(db, 'orders'), where('verificationToken', '==', token), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          setError('QR invalide ou expiré.');
          setLoading(false);
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data() as Order;
        
        if (data.status === 'cancelled') {
           setError('QR invalide ou expiré.');
           setLoading(false);
           return;
        }

        setOrder({ id: docSnap.id, ...data });

        // Get user loyalty points
        if (data.userId) {
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          if (userDoc.exists()) {
            setClientLoyalty(userDoc.data().itemLoyalty || {});
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Verification error:", err);
        setError('QR invalide ou expiré.');
        setLoading(false);
      }
    }
    
    verify();
  }, [token]);

  const handleRedeemReward = async (productId: string, itemIndex: number, originalItem: any) => {
    if (!order || !order.userId) return;
    if (!isStaff) {
      toast.error("Seul le personnel peut utiliser les récompenses.");
      return;
    }
    
    if (confirm("Êtes-vous sûr de vouloir utiliser la récompense de fidélité pour cet article ? Cela coûtera 0 DH.")) {
      setIsProcessing(true);
      try {
        const userRef = doc(db, 'users', order.userId);
        const orderRef = doc(db, 'orders', order.id);
        const redemptionRef = doc(collection(db, 'redemptions'));
        
        await runTransaction(db, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          if (!userDoc.exists()) throw new Error("Client introuvable.");
          
          const orderDoc = await transaction.get(orderRef);
          if (!orderDoc.exists()) throw new Error("Commande introuvable.");
          
          const itemLoyalty = userDoc.data().itemLoyalty || {};
          const currentPoints = itemLoyalty[productId] || 0;
          
          if (currentPoints < 11) {
             throw new Error("Pas assez de points de fidélité.");
          }
          
          const orderData = orderDoc.data() as Order;
          const items = [...orderData.items];
          const item = items[itemIndex];
          
          if (item.price === 0 || item.name.includes('(Loyalty Reward)')) {
              throw new Error("Cet article est déjà gratuit.");
          }
          
          if (item.quantity > 1) {
              item.quantity -= 1;
              items.push({
                 ...item,
                 productId: item.productId + '-reward',
                 name: item.name + ' (Loyalty Reward)',
                 price: 0,
                 quantity: 1
              });
          } else {
              item.price = 0;
              item.name = item.name + ' (Loyalty Reward)';
          }
          
          const newTotal = Math.max(0, orderData.total - originalItem.price);
          
          transaction.update(userRef, {
            [`itemLoyalty.${productId}`]: currentPoints - 11
          });
          
          transaction.update(orderRef, {
            items: items,
            total: newTotal
          });

          // Record the redemption
          transaction.set(redemptionRef, {
             redeemedBy: userProfile?.uid || auth.currentUser?.uid || 'Cashier/Waiter',
             redeemedAt: serverTimestamp(),
             productId: productId,
             productName: originalItem.name,
             originalPrice: originalItem.price,
             orderId: order.id,
             userId: order.userId
          });
        });
        
        toast.success("Récompense appliquée ! L'article est maintenant à 0 DH.");
        
        // Update local state
        const updatedOrder = await getDoc(doc(db, 'orders', order.id));
        setOrder({ id: updatedOrder.id, ...updatedOrder.data() } as Order);
        
        const updatedUser = await getDoc(doc(db, 'users', order.userId));
        setClientLoyalty(updatedUser.data()?.itemLoyalty || {});
        
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "Erreur lors de l'application de la récompense");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c0a09]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-400 font-black uppercase tracking-widest text-xs">Authenticating Ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0a09]">
        <div className="w-full max-w-md bg-stone-900 rounded-[2.5rem] p-10 text-center border border-red-500/20">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tight mb-2">Invalid Ticket</h1>
          <p className="text-stone-400 font-medium mb-8">QR invalide ou expiré.</p>
          <button 
            onClick={() => navigate(-1)}
            className="w-full bg-stone-800 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-stone-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0a09] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto pt-4">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 p-4 -ml-4 flex items-center gap-2 text-stone-500 hover:text-white transition-colors relative z-50 cursor-pointer"
        >
          <ArrowLeft size={20} />
          <span className="font-black uppercase text-[10px] tracking-widest">Back</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-900 border border-amber-400/30 rounded-[3rem] overflow-hidden shadow-2xl relative"
        >
          {/* Header Status */}
          <div className="bg-amber-400 p-8 text-stone-900 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-4">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-black italic uppercase tracking-tight">Verified Authentic</h1>
            <p className="font-bold text-stone-900/60 uppercase text-[10px] tracking-widest">Cappuccino7 Digital Guarantee</p>
          </div>

          <div className="p-8 sm:p-12 space-y-10">
            {/* Main Info */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Client Name</p>
                <div className="flex items-center gap-2">
                  <User size={16} className="text-amber-400" />
                  <p className="text-lg font-black text-white">{order.customerName}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Table / Area</p>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-400" />
                  <p className="text-lg font-black text-white">{order.fullTableLabel || 'Takeaway'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Points Earned</p>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  <p className="text-lg font-black text-white">+{order.pointsEarned} PTS</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Payment Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${order.isPaid ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <p className="text-lg font-black text-white italic uppercase tracking-tight">
                    {order.isPaid ? 'Paid' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Content Summary */}
            <div className="space-y-4 pt-6 border-t border-stone-800">
              <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Order Items Summary</p>
              
              <div className="space-y-4">
                {order.items.map((item, i) => {
                  const isEligible = isStaff && (clientLoyalty[item.productId] || 0) >= 11 && !item.name.includes('(Loyalty Reward)') && item.price > 0;
                  
                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 bg-stone-800 text-amber-400 rounded-md flex items-center justify-center text-[10px] font-black border border-amber-400/10">
                            {item.quantity}
                          </span>
                          <span className="font-bold text-stone-400">{t(`products.${item.name}`, item.name) as string}</span>
                        </div>
                        <span className="font-black text-white">{item.price * item.quantity} DH</span>
                      </div>
                      
                      {isEligible && (
                        <div className="pl-8 flex">
                          <button 
                            disabled={isProcessing}
                            onClick={() => handleRedeemReward(item.productId, i, item)}
                            className="bg-amber-400 hover:bg-amber-500 text-stone-900 py-1.5 px-4 rounded-lg font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Gift size={12} />
                            Redeem Reward (11 PTS)
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex justify-between items-center bg-amber-400/5 p-4 rounded-2xl border border-amber-400/10 mt-6">
                <p className="text-sm font-black text-stone-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-2xl font-black text-amber-400 italic">{order.total.toFixed(2)} DH</p>
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-stone-800 text-center space-y-4">
              <div className="inline-block px-6 py-2 bg-amber-400/10 border border-amber-400/20 rounded-full">
                <p className="text-amber-400 font-black uppercase text-[10px] tracking-widest">
                  This order belongs to: {order.customerName}
                </p>
              </div>
              <p className="text-[9px] text-stone-600 max-w-[200px] mx-auto leading-relaxed">
                Authentication proof generated by Cappuccino7 Security Systems.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-stone-900 border-t border-stone-800 text-center">
            <p className="text-[8px] font-black text-stone-700 uppercase tracking-[0.5em]">
              AUTHENTIC SERVICE • QUALITY GUARANTEED
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
