import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OrderItem, OrderStatus, UserProfile } from '../types';
import { Minus, Plus, Trash2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

import { useBrandSettings } from '../lib/brand';

export default function Cart({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const { settings: brand } = useBrandSettings();
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
      const isGuest = auth.currentUser.isAnonymous;

      const orderData = {
        userId: auth.currentUser.uid,
        customerName: auth.currentUser.displayName || (isGuest ? 'Guest' : 'Customer'),
        items: items,
        total: total,
        status: 'pending' as OrderStatus,
        address: address,
        pointsEarned: pointsEarned,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      // Update User Profile with new point system
      if (!isGuest) {
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-6 text-center -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={brand.cartBgUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600'} 
            className="w-full h-full object-cover" 
            alt=""
          />
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-full mb-6 ring-1 ring-white/20">
            <Trash2 size={48} className="text-white/40" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">{t('empty_cart')}</h2>
          <p className="text-white/60 mb-8 font-medium">{t('empty_cart_msg')}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-white text-bento-primary px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            {t('browse_menu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-4 sm:p-8 relative overflow-hidden flex flex-col gap-10">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src={brand.cartBgUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600'} 
          className="w-full h-full object-cover fixed top-0 left-0" 
          alt=""
        />
        <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
      </div>

      <div className="relative z-10 space-y-10">
        <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">{t('cart')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
              <div className="p-8 space-y-8">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-6 group">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-white font-black text-xl border border-white/10">
                      {item.quantity}x
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-xl text-white leading-tight uppercase tracking-tight">
                        {t(`products.${item.name}`, item.name)}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Premium Selection</span>
                        {userProfile && !userProfile.isAnonymous && (
                          <span className="text-[10px] font-black bg-white/10 text-amber-400 px-2 py-0.5 rounded-lg uppercase tracking-tighter ring-1 ring-white/10">
                            Lvl {userProfile.itemLoyalty?.[item.productId] || 0}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="font-black text-2xl text-white">{(item.price * item.quantity)} DH</p>
                      <div className="flex items-center gap-4 bg-white/5 rounded-full px-4 py-2 ring-1 ring-white/10 backdrop-blur-md">
                        <button 
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <Minus size={16} />
                        </button>
                        <button 
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="text-white/40 hover:text-white transition-colors"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-8 bg-black/20 backdrop-blur-2xl border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">{t('total_paid')}</p>
                  <p className="text-5xl font-black text-white tracking-tighter tabular-nums">{total} DH</p>
                </div>
                <div className="text-center sm:text-right bg-white/5 px-6 py-3 rounded-2xl ring-1 ring-white/10">
                  {auth.currentUser?.isAnonymous ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{t('loyalty_perk')}</p>
                      <p className="text-[10px] font-bold text-white/60">Sign in to save points!</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">{t('loyalty_perk')}</p>
                      <p className="text-xl font-black text-amber-400">+{totalItems} {t('reward_points')}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">
                {t('delivery_point')}
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="flex-1 bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] py-5 px-8 shadow-2xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/20 text-white font-bold"
                />
                <button
                  onClick={getLocation}
                  className="bg-white text-bento-primary p-5 rounded-[2rem] shadow-2xl hover:bg-stone-100 transition-all active:scale-95"
                >
                  <MapPin size={24} />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-white text-bento-primary py-8 rounded-[3rem] font-black text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tight"
              >
                {loading ? '...' : t('confirm_order')}
              </button>
              <p className="text-center text-white/30 text-[10px] font-black uppercase tracking-widest px-8">
                Secure checkout encrypted and verified by Cappuccino7
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
