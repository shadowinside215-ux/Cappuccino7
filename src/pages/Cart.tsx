import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OrderItem, OrderStatus, UserProfile } from '../types';
import { Minus, Plus, Trash2, MapPin, Truck, ShoppingBag, Navigation2, AlertCircle, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';

export default function Cart({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const { settings: brand } = useBrandSettings();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dine-in'>('dine-in');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  // Defaulting to dine-in and hiding others for now
  useEffect(() => {
    setDeliveryType('dine-in');
  }, []);
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
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

  useEffect(() => {
    // Try to recover location from session if pre-authorized
    const savedLoc = sessionStorage.getItem('current_location');
    if (savedLoc) {
      try {
        setLocation(JSON.parse(savedLoc));
        console.log("Recovered location from session prompt");
      } catch (e) {
        console.error("Failed to parse session location", e);
      }
    }
  }, []);

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const captureGPS = (retryOnTimeout = true): Promise<{ lat: number, lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      setIsLocating(true);
      setLocatingError(null);

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          setIsLocating(false);
          resolve(coords);
        },
        async (error) => {
          if (error.code === error.TIMEOUT && retryOnTimeout) {
            console.log("GPS Timeout, retrying once...");
            try {
              const result = await captureGPS(false);
              resolve(result);
            } catch (err) {
              setIsLocating(false);
              setLocatingError("timeout");
              reject(err);
            }
          } else {
            setIsLocating(false);
            if (error.code === error.PERMISSION_DENIED) {
              setLocatingError("denied");
            } else {
              setLocatingError("failed");
            }
            reject(error);
          }
        },
        options
      );
    });
  };

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

    // Logic for delivery requirements
    let finalLocation = location;
    if (deliveryType === 'delivery') {
      if (!address.trim()) {
        toast.error(t('location_required'));
        return;
      }

      if (!finalLocation) {
        setLoading(true);
        toast.loading("Capturing high-accuracy GPS...", { id: 'geo' });
        try {
          finalLocation = await captureGPS();
          toast.success(t('location_captured'), { id: 'geo' });
        } catch (err) {
          toast.dismiss('geo');
          // We allow fallback if address is provided, but we warned them
          console.warn("GPS capture failed, continuing with manual address if present", err);
        } finally {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    try {
      const pointsEarned = totalItems;
      const isGuest = auth.currentUser.isAnonymous;

      // Fetch metadata for all items first to determine categories
      const itemsWithMetadata = await Promise.all(items.map(async (item) => {
        try {
          const productDoc = await getDoc(doc(db, 'products', item.productId));
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const catDoc = await getDoc(doc(db, 'categories', productData.categoryId));
            return {
              ...item,
              categoryName: catDoc.exists() ? catDoc.data().name : 'Menu',
              subSection: productData.subSection || ''
            };
          }
        } catch (e) {
          console.error("Error fetching item metadata", e);
        }
        return { ...item, categoryName: 'Menu', subSection: '' };
      }));

      // Calculate preparation time based on item categories
      // 10 mins for: drinks, juices, ice_cream, coffee, etc.
      // 30 mins for: everything else (dishes, breakfast, brunch, crepes)
      const fastTimedCategories = [
        'drinks', 'juices', 'juice', 'ice_cream', 'ice cream', 'coffee', 'infusions', 'iced_latte', 
        'jus', 'café', 'glaces', 'the', 'thé', 'tea', 'infusion', 'boisson', 'jus d\'orange'
      ];
      
      const hasSlowItem = itemsWithMetadata.some(item => {
        const cat = (item.categoryName || '').toLowerCase();
        const itemName = (item.name || '').toLowerCase();
        // Check both category and name for "juice"
        const isFast = fastTimedCategories.some(fastCat => 
          cat.includes(fastCat) || itemName.includes(fastCat)
        );
        return !isFast;
      });

      const prepTimeMinutes = 30; // Standard 30 minutes as requested
      const now = new Date();
      const estimatedReadyAt = new Date(now.getTime() + prepTimeMinutes * 60000);

      const orderData = {
        userId: auth.currentUser.uid,
        customerName: userProfile?.name || auth.currentUser.displayName || (isGuest ? 'Guest' : 'Customer'),
        customerPhone: phone || userProfile?.phone || '',
        items: itemsWithMetadata,
        total: total,
        status: 'pending' as OrderStatus,
        deliveryType,
        prepTime: prepTimeMinutes,
        estimatedReadyAt: estimatedReadyAt,
        address: address || (deliveryType === 'dine-in' ? 'Palace Taha (Eat-in)' : (deliveryType === 'pickup' ? 'Store Pickup' : '')),
        deliveryNotes,
        ...(finalLocation ? {
          location: {
            lat: finalLocation.lat,
            lng: finalLocation.lng
          }
        } : {}),
        pointsEarned: pointsEarned,
        createdAt: serverTimestamp()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update Daily Revenue on confirmation (MAD Today Revenue)
      const today = new Date().toISOString().split('T')[0];
      const revRef = doc(db, 'dailyRevenue', today);
      try {
        await setDoc(revRef, {
          amount: increment(total),
          orderCount: increment(1),
          lastUpdated: serverTimestamp()
        }, { merge: true });
      } catch (revErr) {
        console.warn("Daily revenue update failed:", revErr);
        // We don't fail the whole order if revenue update fails
      }
      
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
      localStorage.setItem('review_trigger_order_completed', Date.now().toString());
      window.dispatchEvent(new Event('order_completed'));
      setItems([]);
      
      if (isGuest) {
        toast.success('Order placed! Create an account to save your points ☕', {
          duration: 6000,
          icon: '✨'
        });
      } else {
        toast.success('Order placed successfully!');
      }
      
      // Small delay to allow ReviewPopup to trigger before navigation
      setTimeout(() => {
        navigate('/orders');
      }, 500);
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
        {brand.cartBgUrl && (
          <div className="fixed inset-0 z-0">
            <OptimizedImage 
              priority
              src={brand.cartBgUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover" 
              alt=""
              showOverlay={true}
              overlayClassName="bg-stone-950/60 backdrop-blur-[2px]"
            />
          </div>
        )}
        
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
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      {brand.cartBgUrl && (
        <div className="fixed inset-0 z-0">
          <OptimizedImage 
            priority
            src={brand.cartBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
            showOverlay={true}
            overlayClassName="bg-stone-950/60 backdrop-blur-[2px]"
          />
        </div>
      )}

      <div className="relative z-10 space-y-10">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="text-5xl md:text-7xl font-black text-bento-primary italic tracking-tighter uppercase drop-shadow-lg"
        >
          {t('cart')}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <AnimatePresence mode="popLayout">
                  {items.map((item, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.1, type: "spring", bounce: 0.3 }}
                      key={item.productId} 
                      className="flex items-center gap-4 sm:gap-6 group"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                        <OptimizedImage 
                          src={item.image} 
                          fallbackSrc="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=200"
                          className="w-full h-full object-cover rounded-2xl border border-white/10 group-hover:scale-105 transition-transform"
                          alt={item.name}
                          showOverlay={false}
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 text-stone-900 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-stone-900">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-lg sm:text-xl text-white leading-tight uppercase tracking-tight">
                          {t(`products.${item.name}`, item.name)}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-white/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Premium Selection</span>
                          {userProfile && !userProfile.isAnonymous && (
                            <span className="text-[9px] sm:text-[10px] font-black bg-white/10 text-amber-400 px-2 py-0.5 rounded-lg uppercase tracking-tighter ring-1 ring-white/10">
                              Lvl {userProfile.itemLoyalty?.[item.productId] || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <p className="font-black text-2xl text-white">{(item.price * item.quantity)} DH</p>
                        <div className="flex items-center gap-4 bg-white/10 rounded-full px-4 py-2 ring-1 ring-white/10 backdrop-blur-md">
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
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-8 bg-black/20 backdrop-blur-2xl border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6"
              >
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">{t('total_paid')}</p>
                  <motion.p 
                    key={total}
                    initial={{ scale: 1.1, color: "#fbbf24" }}
                    animate={{ scale: 1, color: "#fff" }}
                    className="text-5xl font-black text-white tracking-tighter tabular-nums"
                  >
                    {total} DH
                  </motion.p>
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
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6 hidden"
            >
              <div>
                <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4 mb-4">
                  {t('delivery_options')}
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-4 p-2 bg-white/5 rounded-[2.5rem] ring-1 ring-white/10">
                  <button
                    onClick={() => setDeliveryType('dine-in')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${
                      deliveryType === 'dine-in' 
                        ? 'bg-amber-400 text-stone-900 shadow-xl' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Coffee size={18} />
                    {t('dine_in', { defaultValue: 'Dine-in' })}
                  </button>
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${
                      deliveryType === 'pickup' 
                        ? 'bg-white text-stone-900 shadow-xl' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <ShoppingBag size={18} />
                    {t('pickup')}
                  </button>
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest transition-all ${
                      deliveryType === 'delivery' 
                        ? 'bg-white text-stone-900 shadow-xl' 
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Truck size={18} />
                    {t('delivery')}
                  </button>
                </div>
              </div>

              {deliveryType === 'delivery' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-6 overflow-hidden"
                >
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">
                      {t('phone_number')} ({t('optional')})
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+212 6xx xxxx"
                      className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl py-5 px-8 shadow-2xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/20 text-white font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">
                      {t('delivery_point')}
                    </label>
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder={t('search_placeholder')}
                          className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl py-5 px-8 shadow-2xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/20 text-white font-bold outline-none"
                        />
                        {location && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1.5 rounded-xl border border-green-500/30">
                            <Navigation2 size={12} className="fill-green-400" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">GPS Live</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => captureGPS()}
                        disabled={isLocating}
                        className={`p-5 rounded-3xl shadow-2xl transition-all active:scale-95 ${
                          isLocating ? 'bg-amber-400 animate-pulse' : 'bg-white'
                        } text-stone-900 group relative`}
                      >
                        <MapPin size={24} className={isLocating ? 'animate-bounce' : ''} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {locatingError === 'denied' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mx-4"
                        >
                          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] font-bold text-red-100/80 leading-relaxed uppercase tracking-wide">
                            {t('location_required')}
                          </p>
                        </motion.div>
                      )}
                      {locatingError === 'failed' && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl mx-4"
                        >
                          <div className="flex items-center gap-3">
                            <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
                            <p className="text-[10px] font-bold text-amber-100/80 uppercase tracking-wide">
                              {t('gps_error')}
                            </p>
                          </div>
                          <button 
                            onClick={() => captureGPS()}
                            className="text-[10px] font-black text-amber-400 underline uppercase tracking-widest"
                          >
                            {t('retry_location')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">
                      {t('delivery_notes')}
                    </label>
                    <textarea
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder={t('delivery_notes_placeholder')}
                      rows={3}
                      className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl py-5 px-8 shadow-2xl focus:ring-2 focus:ring-white/20 transition-all placeholder:text-white/20 text-white font-bold outline-none resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="sticky top-8 space-y-6"
            >
              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-white text-stone-900 py-8 rounded-[3rem] font-black text-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 uppercase tracking-tight group overflow-hidden relative"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? '...' : t('confirm_order')}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
              <p className="text-center text-white/30 text-[10px] font-black uppercase tracking-widest px-8 leading-relaxed">
                Premium artisan selection <br /> verified by <span className="text-bento-primary font-bold">Cappuccino7</span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
