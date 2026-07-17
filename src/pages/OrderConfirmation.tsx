import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';
import DigitalTicket from '../components/DigitalTicket';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'orders', id));
        if (docSnap.exists()) {
          const data = docSnap.data();
          const orderData = { id: docSnap.id, ...data } as Order;
          
          setOrder(orderData);

          // Fallback: If verification token is missing for some reason, generate it now
          if (!orderData.verificationToken) {
            console.log('Generating missing verification token for order:', id);
            
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            const newToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('') + Date.now().toString(16);

            try {
              await updateDoc(doc(db, 'orders', id), {
                verificationToken: newToken,
                updatedAt: serverTimestamp()
              });
              setOrder({ ...orderData, verificationToken: newToken });
            } catch (err) {
              console.error('Failed to update missing token:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="animate-spin text-[#d4af37]" size={48} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-6 text-center">
        <h1 className="text-4xl font-black mb-4 uppercase italic">Order Not Found</h1>
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] pb-20">
      {/* Background */}
      {brand.ordersBgUrl && (
        <div className="fixed inset-0 z-0 opacity-40">
          <OptimizedImage 
            size="hero"
            src={brand.ordersBgUrl} 
            className="w-full h-full object-cover" 
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/60 to-[#0a0a0a]" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-6 md:p-12">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <button 
                onClick={() => navigate('/orders')}
                className="flex items-center gap-2 p-4 -ml-4 text-white/40 hover:text-white transition-colors group cursor-pointer touch-manipulation relative z-50"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('back_to_orders', 'Back to History')}</span>
              </button>
              
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-3 text-[#d4af37]">
                  <Sparkles size={24} />
                  <span className="text-sm font-black uppercase tracking-[0.4em]">Confirmed</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">
                  Thank You
                </h1>
                <p className="text-white/40 text-sm font-medium max-w-sm">
                  Your premium experience is currently being prepared. You can track your order using this digital ticket.
                </p>
              </motion.div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#d4af37]">Wait Time</span>
              <span className="text-4xl font-black text-white tabular-nums">~{order.prepTime} MIN</span>
            </div>
          </div>

          {/* Ticket Section */}
          <div className="flex justify-center">
            <DigitalTicket order={order} />
          </div>
        </div>
      </div>
    </div>
  );
}
