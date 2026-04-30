import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OrderItem, OrderStatus, UserProfile } from '../types';
import { Minus, Plus, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export default function Cart({ userProfile }: { userProfile: UserProfile | null }) {
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
      toast.error('Please login or continue as guest to place an order');
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
      const pointsEarned = totalItems;
      const isGuest = auth.currentUser?.isAnonymous;

      const orderData = {
        userId: auth.currentUser?.uid,
        items: items,
        total: total,
        status: 'pending' as OrderStatus,
        address: address,
        pointsEarned: pointsEarned,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Update User Profile with new point system
      if (!isGuest && auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        // Prepare updates for each item loyalty
        const loyaltyUpdates: Record<string, any> = {
          points: increment(pointsEarned)
        };
        
        items.forEach(item => {
          // Use dot notation to increment inside the map
          loyaltyUpdates[`itemLoyalty.${item.productId}`] = increment(item.quantity);
        });
        
        await updateDoc(userRef, loyaltyUpdates);
      }

      localStorage.removeItem('cart');
      setItems([]);
      
      if (isGuest) {
        toast.success('Order placed! Create an account to save your points ☕', {
          duration: 6000,
          icon: '✨'
        });
      } else {
        toast.success('Order placed successfully!');
      }
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
        <div className="bg-bento-card-bg p-8 rounded-full mb-6 border border-stone-100 dark:border-white/5">
          <Trash2 size={48} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-brown-950 mb-2">{t('empty_cart')}</h2>
        <p className="text-gray-500 mb-8">{t('empty_cart_msg')}</p>
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
                <h3 className="font-bold text-lg text-bento-ink leading-tight">
                  {t(`products.${item.name}`, item.name)}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-stone-400 text-xs font-medium tracking-wide">Premium Selection</p>
                  {userProfile && !userProfile.isAnonymous && (
                    <span className="text-[10px] font-black bg-bento-accent/10 text-bento-primary px-2 py-0.5 rounded-lg uppercase tracking-tighter ring-1 ring-bento-accent/20">
                      Level {userProfile.itemLoyalty?.[item.productId] || 0}
                    </span>
                  )}
                </div>
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
        
        <div className="p-8 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">{t('total_paid')}</p>
            <p className="text-4xl font-bold text-bento-primary">{total} DH</p>
          </div>
          <div className="text-center sm:text-right">
            {auth.currentUser?.isAnonymous ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">{t('loyalty_perk')}</p>
                <p className="text-xs font-medium text-stone-400 max-w-[200px]">Sign in to save these {totalItems} points!</p>
              </div>
            ) : (
              <>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1">{t('loyalty_perk')}</p>
                <p className="text-lg font-bold text-bento-accent">+{totalItems} {t('reward_points')}</p>
              </>
            )}
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
            className="flex-1 bg-bento-card-bg border border-bento-card-border rounded-2xl py-4 px-6 shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600"
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
