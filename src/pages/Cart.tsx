import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OrderItem, OrderStatus } from '../types';
import { Minus, Plus, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export default function Cart() {
  const { t } = useTranslation();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setItems(cart);
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const newItems = items.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!auth.currentUser) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!address) {
      toast.error('Please enter a delivery address');
      return;
    }

    setLoading(true);
    try {
      // Points earned = 1 point per menu item
      const pointsEarned = totalItems;

      const orderData = {
        userId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || 'Customer',
        items: items,
        total: total,
        status: 'pending' as OrderStatus,
        address: address,
        pointsEarned: pointsEarned,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      localStorage.removeItem('cart');
      setItems([]);
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      toast.loading("Fetching location...", { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setAddress(`${position.coords.latitude}, ${position.coords.longitude}`);
          toast.success("Location captured!", { id: 'geo' });
        },
        (error) => {
          toast.error("Could not get location", { id: 'geo' });
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <div className="bg-white p-8 rounded-full mb-6">
          <Trash2 size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-brown-950 mb-2">{t('empty_cart')}</h2>
        <p className="text-gray-500 mb-8">Ready to order some delicious items?</p>
        <button 
          onClick={() => navigate('/')}
          className="bg-bento-primary text-white px-8 py-3 rounded-2xl font-medium shadow-md shadow-bento-primary/20"
        >
          {t('browse_menu')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold text-bento-primary">{t('cart')}</h1>

      <div className="card !p-0 overflow-hidden">
        <div className="p-6 space-y-6">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-5 group">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-bento-primary font-bold group-hover:bg-bento-accent/10 transition-colors">
                {item.quantity}x
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-bento-ink leading-tight">{item.name}</h3>
                <p className="text-stone-400 text-sm font-medium tracking-wide">Premium Roast</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="font-bold text-bento-primary">{(item.price * item.quantity)} DH</p>
                <div className="flex items-center gap-3 bg-stone-50 rounded-full px-3 py-1 ring-1 ring-stone-100">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="text-stone-300 hover:text-bento-primary transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="text-stone-300 hover:text-bento-primary transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-8 bg-stone-50 border-t border-stone-100 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">Total Amount</p>
            <p className="text-4xl font-bold text-bento-primary">{total} DH</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">{t('loyalty_perk')}</p>
            <p className="text-lg font-bold text-bento-accent">+{totalItems} {t('reward_points')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-xs font-bold text-stone-400 uppercase tracking-[0.2em] ml-1">
          {t('delivery_point')}
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t('search_placeholder')}
            className="flex-1 bg-white border border-bento-card-border rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300"
          />
          <button
            onClick={getLocation}
            className="card !p-4 border-2 border-transparent bg-bento-primary text-white hover:bg-bento-ink shadow-lg shadow-bento-primary/10"
          >
            <MapPin size={24} />
          </button>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-bento-primary text-white py-6 rounded-[2rem] font-bold text-xl shadow-2xl shadow-bento-primary/20 hover:bg-bento-ink transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? '...' : `${t('confirm_order')} • ${total} DH`}
      </button>
    </div>
  );
}
