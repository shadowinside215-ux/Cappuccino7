import { translateCustomization } from '../utils/translations';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Share2, 
  Clock, 
  Table, 
  User, 
  Star, 
  Repeat,
  X,
  CreditCard,
  Award,
  Coffee,
  Croissant,
  Utensils
} from 'lucide-react';
import { Order } from '../types';
import { useTranslation } from 'react-i18next';
import { useBrandSettings } from '../lib/brand';
import { PUBLIC_APP_URL } from '../config';
import { OrderTimestamps } from './OrderTimestamps';
import toast from 'react-hot-toast';

// Custom Pancake Icon
const Pancake = ({ size = 24, className = "", style = {} }: { size?: number, className?: string, style?: any }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
    style={style}
  >
    <path d="M4 11c0 2 4 4 8 4s8-2 8-4" />
    <path d="M4 15c0 2 4 4 8 4s8-2 8-4" />
    <path d="M2 7a10 4 0 1 0 20 0 10 4 0 1 0-20 0z" />
    <path d="M12 3v3" />
  </svg>
);

interface DigitalTicketProps {
  order: Order;
  onClose?: () => void;
  showActions?: boolean;
}

export default function DigitalTicket({ order, onClose, showActions = true }: DigitalTicketProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings: brand } = useBrandSettings();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    setExporting(true);
    const toastId = toast.loading('Generating premium PDF...');
    
    try {
      // Find and fix logo in the live node temporarily for CORS if needed
      const logo = ticketRef.current.querySelector('img');
      if (logo && !logo.getAttribute('crossOrigin')) {
        logo.setAttribute('crossOrigin', 'anonymous');
      }

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2, // High resolution for clear text
        backgroundColor: '#fdfbf7',
        logging: false,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const exportEl = clonedDoc.getElementById('digital-ticket-card');
          if (exportEl) {
            // Remove animations from all child nodes
            const allNodes = exportEl.querySelectorAll('*');
            allNodes.forEach(node => {
              const el = node as HTMLElement;
              el.style.animation = 'none';
              el.style.transition = 'none';
              el.style.transform = 'none';
              el.style.boxShadow = 'none';
            });
            
            // Fix text overlapping by removing some relative/absolute weirdness if any, 
            // but just keeping it faithful to DOM is best.
            
            const elements = exportEl.getElementsByTagName('*');
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i] as HTMLElement;
              const style = window.getComputedStyle(el);
              
              if (style.color && style.color.includes('okl')) el.style.color = '#2c1810';
              if (style.backgroundColor && style.backgroundColor.includes('okl')) el.style.backgroundColor = 'transparent';
              
              el.style.boxShadow = 'none';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Calculate aspect ratio correctly to fit standard ticket size
      const pdfWidth = 400;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Cappuccino7_Ticket_${order.id.slice(-6).toUpperCase()}.pdf`);
      toast.success('Ticket downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to generate PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const shareTicket = async () => {
    const ticketUrl = order.verificationToken 
      ? `https://cappuccino7-alpha.vercel.app/verify?t=${order.verificationToken}`
      : `https://cappuccino7-alpha.vercel.app/track/${order.id}`;

    const text = `Check out my order at Cappuccino7! Total: ${order.total} DH. View my digital ticket here: ${ticketUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Cappuccino7 Order #${order.id.slice(-6).toUpperCase()}`,
          text: text,
          url: ticketUrl
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.log('Error sharing:', error);
          // Fallback if share fails
          copyToClipboard(text);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copied! Share it on WhatsApp or Instagram.');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const saveImage = async () => {
    if (!ticketRef.current) return;
    setExporting(true);
    const toastId = toast.loading('Saving ticket image...');
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#fdfbf7',
        useCORS: true
      });
      
      const link = document.createElement('a');
      link.download = `Cappuccino7_Ticket_${order.id.slice(-6).toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image saved!', { id: toastId });
    } catch (error) {
      toast.error('Failed to save image', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 max-w-full overflow-hidden">
      {/* Ticket Container */}
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-transparent relative"
      >
        <div 
          ref={ticketRef}
          id="digital-ticket-card"
          style={{ 
            fontFamily: "'Inter', sans-serif",
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
            backgroundColor: '#fdfbf7',
            color: '#2c1810'
          }}
          className="ticket-root p-8 rounded-[2.5rem] relative overflow-hidden"
        >
          {/* Decorative Lil Icons */}
          <div className="absolute top-10 right-4 opacity-5 rotate-12 scale-150">
            <Coffee size={100} strokeWidth={1} />
          </div>
          <div className="absolute bottom-40 left-4 opacity-5 -rotate-12 scale-150">
            <Pancake size={100} />
          </div>
          <div className="absolute top-1/2 right-1/4 opacity-[0.03] rotate-45">
            <Utensils size={150} strokeWidth={1} />
          </div>

          {/* Top Texture/Pattern */}
          <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: '#d4af37' }} />
          <div className="absolute top-2 left-0 w-full h-1" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }} />
          
          {/* Header */}
          <div className="flex flex-col items-center mb-8 border-b-2 border-dashed pb-8 relative z-10" style={{ borderColor: 'rgba(44,24,16,0.1)' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
                <Coffee size={24} style={{ color: '#d4af37' }} />
              </div>
              <div className="w-px h-8" style={{ backgroundColor: 'rgba(44,24,16,0.1)' }} />
              <img 
                src={brand.logoUrl} 
                alt="Cappuccino7" 
                className="h-10 object-contain"
              />
              <div className="w-px h-8" style={{ backgroundColor: 'rgba(44,24,16,0.1)' }} />
              <div className="p-3 rounded-2xl" style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
                <Pancake size={24} style={{ color: '#d4af37' }} />
              </div>
            </div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] mb-1" style={{ color: '#d4af37' }}>
              Digital Experience
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold opacity-50 uppercase tracking-widest">
              <span>{new Date(order.createdAt?.toDate()).toLocaleDateString('fr-FR', { timeZone: 'Africa/Casablanca' })}</span>
              <span>•</span>
              <span>{new Date(order.createdAt?.toDate()).toLocaleTimeString('fr-FR', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Table/Order Info Grid */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(44,24,16,0.05)' }}>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Table Info</p>
              <p className="text-lg font-black tracking-tighter">{order.fullTableLabel || 'Takeaway'}</p>
            </div>
          </div>

          {/* Items List */}
          <div className="mb-8 min-h-[100px]">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 px-2">Order Summary</p>
            <div className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4 px-2 group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black opacity-30">{item.quantity}x</span>
                      <p className="text-sm font-black uppercase tracking-tight">{t(`products.${item.name}`, item.name) as string}</p>
                    </div>
                    {item.customization && (
                      <p className="text-[10px] font-bold opacity-40 italic ml-6 leading-tight">
                        + {translateCustomization(item.customization, t)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-black">{(item.price * item.quantity).toFixed(2)} DH</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="border-t-2 border-dashed pt-6 mb-8 space-y-2" style={{ borderColor: 'rgba(44,24,16,0.1)' }}>
            <div className="flex justify-between items-center text-sm font-bold opacity-60">
              <p>{t('subtotal', 'Subtotal')}</p>
              <p>{order.total.toFixed(2)} DH</p>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{t('total_amount', 'Total Amount')}</p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: order.isPaid ? '#22c55e' : '#f59e0b' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {order.isPaid ? t('paid', 'Paid') : t('payment_pending', 'Payment Pending')}
                  </p>
                </div>
              </div>
              <p className="text-4xl font-black tracking-tighter tabular-nums" style={{ color: '#2c1810' }}>
                {order.total.toFixed(2)} <span className="text-lg font-bold opacity-40">DH</span>
              </p>
            </div>
          </div>

          <div className="mb-8">
            <OrderTimestamps order={order} compact={true} />
          </div>
          {/* Branding & Loyalty */}
          <div 
            style={{ 
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              backgroundColor: '#2c1810',
              color: '#fdfbf7'
            }}
            className="p-6 rounded-3xl mb-8 flex items-center justify-between relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                  <Star size={16} style={{ color: '#d4af37', fill: '#d4af37' }} />
                </div>
                <p className="text-2xl font-black tracking-tighter">
                  +{order.pointsEarned || 1} PTS
                </p>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Loyalty points added</p>
            </div>
            <div className="h-10 w-px mx-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div className="flex-1">
              <p className="text-[10px] font-black leading-tight uppercase tracking-widest opacity-70">
                Building your rewards! One step closer to free items ☕
              </p>
            </div>
          </div>
          
          {/* Decorative Bottom */}
          <div className="flex flex-col items-center gap-4 relative z-10 mt-4 border-t pt-6" style={{ borderColor: 'rgba(44,24,16,0.05)' }}>
            <div className="flex gap-4">
              <Coffee size={16} style={{ color: 'rgba(212,175,55,0.3)' }} />
              <Pancake size={16} style={{ color: 'rgba(212,175,55,0.3)' }} />
              <Utensils size={16} style={{ color: 'rgba(212,175,55,0.3)' }} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
              AUTHENTIC EXPERIENCE
            </p>
          </div>

          <div className="absolute bottom-0 left-0 w-full flex justify-center gap-1 px-4 mb-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="h-1 w-1 rounded-full" style={{ backgroundColor: 'rgba(44,24,16,0.1)' }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      {showActions && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-md grid grid-cols-2 gap-3"
        >
          <button 
            onClick={downloadPDF}
            className="flex flex-col items-center gap-2 p-6 bg-white/10 hover:bg-white/20 rounded-[2rem] border border-white/10 transition-all group"
          >
            <Download size={24} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Save PDF</span>
          </button>
          <button 
            onClick={shareTicket}
            className="flex flex-col items-center gap-2 p-6 bg-white/10 hover:bg-white/20 rounded-[2rem] border border-white/10 transition-all group"
          >
            <Share2 size={24} className="text-[#d4af37] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest text-white">Share Now</span>
          </button>
        </motion.div>
      )}

      {/* Footer Secondary Actions */}
      {showActions && (
        <div className="w-full max-w-md flex flex-col gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group"
          >
            <Repeat size={16} className="text-[#d4af37]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">New Order</span>
          </button>
        </div>
      )}
    </div>
  );
}
