import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
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
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function VerifyTicket({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const orderId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setError('Invalid verification link');
        setLoading(false);
        return;
      }

      try {
        console.log('Verifying ticket with token:', token, 'and ID:', orderId);
        
        // 1. Try fetching by ID first (more efficient and easier rules)
        if (orderId) {
          const { getDoc, doc } = await import('firebase/firestore');
          const docSnap = await getDoc(doc(db, 'orders', orderId));
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.verificationToken === token) {
              setOrder({ id: docSnap.id, ...data } as Order);
              setLoading(false);
              return;
            }
            console.warn('Token mismatch for order ID:', orderId);
          } else {
            console.warn('Doc not found by ID:', orderId);
          }
        }

        // 2. Fallback to query by token (for older QR codes or if ID missing)
        const q = query(
          collection(db, 'orders'), 
          where('verificationToken', '==', token),
          limit(1)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.warn('No order found matching token:', token);
          setError('Ticket not found or invalid');
        } else {
          setOrder({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Order);
        }
      } catch (err: any) {
        console.error('Verification error details:', err);
        if (err.code === 'permission-denied') {
          setError('Ticket verification access denied. Please contact staff.');
        } else {
          setError('Verification failed. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [token, orderId]);

  // Check if staff
  const isStaff = userProfile?.isAdmin || userProfile?.isWaiter || userProfile?.isCashier || userProfile?.isKitchen || userProfile?.isBarman;

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
          <p className="text-stone-400 font-medium mb-8">This ticket could not be verified. It might be fake or expired.</p>
          <button 
            onClick={() => navigate('/')}
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
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Order Reference</p>
                <p className="text-lg font-black text-white">#{order.id.slice(-6).toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Table / Area</p>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-amber-400" />
                  <p className="text-lg font-black text-white">{order.fullTableLabel || 'Takeaway'}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Points Earned</p>
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-400" />
                  <p className="text-lg font-black text-white">+{order.pointsEarned} PTS</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Date & Time</p>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-amber-400" />
                  <p className="text-sm font-bold text-white">
                    {order.createdAt?.toDate().toLocaleString() || 'N/A'}
                  </p>
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
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 bg-stone-800 text-amber-400 rounded-md flex items-center justify-center text-[10px] font-black border border-amber-400/10">
                        {item.quantity}
                      </span>
                      <span className="font-bold text-stone-400">{item.name}</span>
                    </div>
                    <span className="font-black text-white">{item.price * item.quantity} DH</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-between items-center bg-amber-400/5 p-4 rounded-2xl border border-amber-400/10 mt-6">
                <p className="text-sm font-black text-stone-400 uppercase tracking-widest">Total Amount</p>
                <p className="text-2xl font-black text-amber-400 italic">{order.total.toFixed(2)} DH</p>
              </div>
            </div>

            {/* Admin Extra Details */}
            {isStaff ? (
              <div className="mt-10 pt-10 border-t border-stone-800 space-y-6">
                <div className="text-center p-6 bg-amber-400/10 border border-amber-400/20 rounded-3xl">
                   <p className="text-amber-400 font-black italic uppercase tracking-tight">Verified Experience Owner</p>
                   <p className="text-[10px] text-amber-400/60 font-medium mt-1">
                     This order officially belongs to {order.customerName}
                   </p>
                </div>
              </div>
            ) : (
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
            )}
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
