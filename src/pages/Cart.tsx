import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OrderItem, OrderStatus, UserProfile } from '../types';
import { Minus, Plus, Trash2, MapPin, Truck, ShoppingBag, Navigation2, AlertCircle, Coffee, Package } from 'lucide-react';
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
  const [tableArea, setTableArea] = useState<'Inside' | 'Outside'>('Inside');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const editId = localStorage.getItem('editingOrderId');
    if (editId) {
      setEditingOrderId(editId);
    }
  }, []);

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

    setLoading(true);
    try {
      // Basic time limit validation for updates
      if (editingOrderId) {
        const orderSnap = await getDoc(doc(db, 'orders', editingOrderId));
        if (orderSnap.exists()) {
          const order = orderSnap.data();
          const createdAt = order.createdAt?.toDate().getTime();
          if (createdAt && (Date.now() - createdAt) > 5 * 60 * 1000) {
            toast.error(t('edit_time_exceeded', 'Edit window (5 minutes) has passed. Order can no longer be modified.'));
            localStorage.removeItem('editingOrderId');
            localStorage.removeItem('editingOrderOriginalItems');
            setLoading(false);
            return;
          }
        }
      }

      const tableZone = tableArea === 'Inside' ? 'A' : 'B';
      const fullTableLabel = `${tableZone}${tableNumber}`;
      
      const pointsEarned = totalItems;
      const isGuest = auth.currentUser.isAnonymous;

      // Category detection
      const foodKeywords = ['food', 'dishes', 'breakfast', 'pizza', 'burger', 'sandwich', 'salad', 'crepe', 'waffle', 'pancake', 'pasta', 'meal', 'petit déjeuner', 'omelette', 'omlette', 'tacos', 'panini', 'oeuf', 'egg', 'dish', 'viande', 'plat', 'steak', 'chicken', 'poulet', 'fish', 'poisson', 'rice', 'riz', 'soup', 'soupe', 'taco', 'burrito', 'noodle', 'wrap', 'bento', 'box'];
      const drinkKeywords = ['drink', 'juice', 'coffee', 'smoothie', 'mojito', 'milkshake', 'ice tea', 'frappuccino', 'jus', 'café', 'boisson', 'thé', 'iced', 'frappé', 'espresso', 'latte', 'cappuccino', 'soda', 'coke', 'fanta', 'sprite', 'water', 'eau', 'shake', 'tea', 'lemonade', 'limonade', 'beverage', 'cocktail', 'mocktail', 'fizz', 'brew'];

      const itemsWithMetadata = [];
      for (const item of items) {
        try {
          const productDoc = await getDoc(doc(db, 'products', item.productId));
          if (productDoc.exists()) {
            const productData = productDoc.data();
            const catDoc = await getDoc(doc(db, 'categories', productData.categoryId));
            const categoryName = catDoc.exists() ? catDoc.data().name : 'Menu';
            const lowerCat = categoryName.toLowerCase();
            const lowerName = item.name.toLowerCase();

            const isFoodByKW = foodKeywords.some(kw => lowerName.includes(kw) || lowerCat.includes(kw));
            const isDrinkByKW = drinkKeywords.some(kw => lowerName.includes(kw) || lowerCat.includes(kw));

            let system: 'kitchen' | 'barman' = 'barman';
            let itemPrepTime = 10;
            if (isFoodByKW || lowerCat.includes('breakfast')) {
              system = 'kitchen';
              itemPrepTime = 30;
            } else if (isDrinkByKW) {
              system = 'barman';
              itemPrepTime = 10;
            }

            itemsWithMetadata.push({
              ...item,
              categoryName,
              subSection: productData.subSection || '',
              system,
              prepTime: itemPrepTime
            });
          } else {
            itemsWithMetadata.push({ ...item, categoryName: 'Menu', system: 'barman', prepTime: 10 });
          }
        } catch (e) {
          itemsWithMetadata.push({ ...item, categoryName: 'Menu', system: 'barman', prepTime: 10 });
        }
      }

      const hasKitchenItems = itemsWithMetadata.some(item => item.system === 'kitchen');
      const prepTimeMinutes = hasKitchenItems ? 30 : 10;
      const expectedReadyAt = new Date(Date.now() + prepTimeMinutes * 60000);

      const orderData: any = {
        userId: auth.currentUser.uid,
        customerName: userProfile?.name || auth.currentUser.displayName || (isGuest ? t('guest', 'Guest') : t('customer', 'Customer')),
        customerPhone: phone || userProfile?.phone || '',
        items: itemsWithMetadata,
        total: total,
        kitchenStatus: hasKitchenItems ? 'pending' : 'completed',
        barmanStatus: itemsWithMetadata.some(item => item.system === 'barman') ? 'pending' : 'completed',
        deliveryType,
        tableZone: deliveryType === 'dine-in' ? tableZone : null,
        tableArea: deliveryType === 'dine-in' ? tableArea : null,
        tableNumber: deliveryType === 'dine-in' ? tableNumber : null,
        fullTableLabel: deliveryType === 'dine-in' ? fullTableLabel : null,
        prepTime: prepTimeMinutes,
        expectedReadyAt: expectedReadyAt,
        address: address || (deliveryType === 'dine-in' ? `Table ${fullTableLabel}` : (deliveryType === 'pickup' ? 'Store Pickup' : '')),
        deliveryNotes,
        updatedAt: serverTimestamp()
      };

      if (editingOrderId) {
        orderData.isModified = true;
        // Check if items actually changed
        const originalItemsStr = localStorage.getItem('editingOrderOriginalItems');
        const currentItemsStr = JSON.stringify(items);
        if (originalItemsStr === currentItemsStr) {
          toast.success(t('no_changes_detected', 'No changes detected. Order remains the same.'));
        } else {
          await updateDoc(doc(db, 'orders', editingOrderId), orderData);
          toast.success(t('order_updated', 'Order updated successfully! Waiter notified.'));
        }
        localStorage.removeItem('editingOrderId');
        localStorage.removeItem('editingOrderOriginalItems');
      } else {
        orderData.status = 'pending' as OrderStatus;
        orderData.createdAt = serverTimestamp();
        orderData.isPaid = false;
        orderData.waiterStatus = deliveryType === 'dine-in' ? 'New' : undefined;
        await addDoc(collection(db, 'orders'), orderData);
        toast.success(isGuest ? 'Order placed! Create an account to save your points ☕' : 'Order placed successfully!');
      }
      
      localStorage.removeItem('cart');
      window.dispatchEvent(new Event('cartUpdated'));
      setItems([]);
      
      setTimeout(() => navigate('/orders'), 500);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    localStorage.removeItem('editingOrderId');
    localStorage.removeItem('editingOrderOriginalItems');
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('cartUpdated'));
    setItems([]);
    toast.success(t('edit_cancelled', 'Edit mode cancelled. Original order remains active.'));
    navigate('/orders');
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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center space-y-8 px-6 text-center relative overflow-hidden">
        {brand.cartBgUrl && (
          <div className="fixed inset-0 z-0 h-screen w-screen">
            <OptimizedImage 
              priority
              src={brand.cartBgUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover" 
              alt=""
              showOverlay={true}
              overlayClassName="bg-bento-bg/60 backdrop-blur-[2px]"
            />
          </div>
        )}
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-bento-card-bg/20 backdrop-blur-xl rounded-full mb-6 ring-1 ring-bento-card-border">
            <Trash2 size={48} className="text-bento-ink/40" />
          </div>
          <h2 className="text-3xl font-black text-bento-ink mb-2 uppercase italic tracking-tight">{t('empty_cart')}</h2>
          <p className="text-bento-ink/60 mb-8 font-medium">{t('empty_cart_msg')}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-bento-primary text-bento-bg px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            {t('browse_menu')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      {brand.cartBgUrl && (
        <div className="fixed inset-0 z-0 h-screen w-screen">
          <OptimizedImage 
            priority
            src={brand.cartBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
            showOverlay={true}
            overlayClassName="bg-bento-bg/60 backdrop-blur-[2px]"
          />
        </div>
      )}

      <div className="relative z-10 space-y-10">
        <motion.h1 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="text-5xl md:text-7xl font-black text-bento-ink italic tracking-tighter uppercase drop-shadow-lg flex items-center gap-4"
        >
          {t('cart')}
          {editingOrderId && (
            <span className="text-xl bg-amber-400 text-stone-900 px-6 py-2 rounded-2xl italic tracking-tight font-black animate-pulse">
              EDITING ORDER #{editingOrderId.slice(-6).toUpperCase()}
            </span>
          )}
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {editingOrderId && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-amber-400/10 border border-amber-400/20 p-6 rounded-[2rem] flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 text-amber-500">
                  <AlertCircle size={20} />
                  <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                    You are editing an existing order. Your original order remains active until you click "Update Order".
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <button 
                    onClick={() => navigate('/')}
                    className="bg-amber-400 text-stone-900 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    Add Items
                  </button>
                  <button 
                    onClick={cancelEdit}
                    className="bg-transparent text-amber-400 border border-amber-400/50 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-amber-500/10 transition-all"
                  >
                    Cancel Edit
                  </button>
                </div>
              </motion.div>
            )}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bento-card-bg/20 backdrop-blur-xl rounded-[2.5rem] border border-bento-card-border overflow-hidden shadow-2xl"
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
                          className="w-full h-full object-cover rounded-2xl border border-bento-card-border group-hover:scale-105 transition-transform"
                          alt={item.name}
                          showOverlay={false}
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 text-stone-900 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg ring-2 ring-stone-900">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-lg sm:text-xl text-bento-ink leading-tight uppercase tracking-tight">
                          {t(`products.${item.name}`, item.name)}
                        </h3>
                        {item.customization && (
                          <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest bg-amber-500/10 w-fit px-3 py-1 rounded-lg border border-amber-500/20">
                            {item.customization}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-bento-ink/40 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Premium Selection</span>
                          {userProfile && !userProfile.isAnonymous && (
                            <span className="text-[9px] sm:text-[10px] font-black bg-bento-ink/10 text-amber-400 px-2 py-0.5 rounded-lg uppercase tracking-tighter ring-1 ring-bento-card-border">
                              Lvl {userProfile.itemLoyalty?.[item.productId] || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <p className="font-black text-2xl text-bento-ink">{(item.price * item.quantity)} DH</p>
                        <div className="flex items-center gap-4 bg-bento-ink/10 rounded-full px-4 py-2 ring-1 ring-bento-card-border backdrop-blur-md">
                          <button 
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="text-bento-ink/40 hover:text-bento-ink transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="text-bento-ink/40 hover:text-bento-ink transition-colors"
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
                className="p-8 bg-bento-card-bg/20 backdrop-blur-2xl border-t border-bento-card-border flex flex-col sm:flex-row justify-between items-center gap-6"
              >
                <div>
                  <p className="text-[10px] font-black text-bento-ink/40 uppercase tracking-[0.3em] mb-1">{t('total_paid')}</p>
                  <motion.p 
                    key={total}
                    initial={{ scale: 1.1, color: "#fbbf24" }}
                    animate={{ scale: 1, color: "var(--bento-ink)" }}
                    className="text-5xl font-black text-bento-ink tracking-tighter tabular-nums"
                  >
                    {total} DH
                  </motion.p>
                </div>
                <div className="flex justify-between items-center bg-bento-card-bg/30 px-6 py-3 rounded-2xl ring-1 ring-bento-card-border">
                  {auth.currentUser?.isAnonymous ? (
                    <div className="space-y-1 text-bento-ink">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{t('loyalty_perk')}</p>
                      <p className="text-[10px] font-bold text-bento-ink/60">Sign in to save points!</p>
                    </div>
                  ) : (
                    <div className="text-bento-ink sm:text-right">
                      <p className="text-[10px] font-black text-bento-ink/40 uppercase tracking-[0.3em] mb-1">{t('loyalty_perk')}</p>
                      <p className="text-xl font-black text-amber-500">+{totalItems} {t('reward_points')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Delivery/Pickup Select */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-bento-card-bg/20 backdrop-blur-3xl rounded-[2.5rem] p-4 border border-bento-card-border mb-8"
            >
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setDeliveryType('dine-in')}
                  className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${deliveryType === 'dine-in' ? 'bg-amber-400 text-stone-900 shadow-xl' : 'bg-bento-ink/10 text-bento-ink/50 hover:text-bento-ink hover:bg-bento-ink/20'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Coffee size={16} />
                    {t('dine_in', 'Dine In')}
                  </div>
                </button>
                <button 
                  onClick={() => {
                    setDeliveryType('pickup');
                    setTableNumber('');
                  }}
                  className={`py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${deliveryType === 'pickup' ? 'bg-amber-400 text-stone-900 shadow-xl' : 'bg-bento-ink/10 text-bento-ink/50 hover:text-bento-ink hover:bg-bento-ink/20'}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Package size={16} />
                    {t('takeaway')}
                  </div>
                </button>
              </div>

              {deliveryType === 'dine-in' && (
                <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setTableArea('Inside');
                        setTableNumber('');
                      }}
                      className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border ${tableArea === 'Inside' ? 'bg-bento-ink text-bento-bg border-bento-ink' : 'border-bento-card-border text-bento-ink/60'}`}
                    >
                      {t('inside', 'Inside')}
                    </button>
                    <button 
                      onClick={() => {
                        setTableArea('Outside');
                        setTableNumber('');
                      }}
                      className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border ${tableArea === 'Outside' ? 'bg-bento-ink text-bento-bg border-bento-ink' : 'border-bento-card-border text-bento-ink/60'}`}
                    >
                      {t('outside', 'Outside')}
                    </button>
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-[200px] overflow-y-auto p-2 custom-scrollbar">
                    {Array.from({ length: tableArea === 'Inside' ? 23 : 27 }).map((_, i) => {
                      const num = (i + 1).toString();
                      return (
                        <button
                          key={num}
                          onClick={() => setTableNumber(num)}
                          className={`aspect-square flex items-center justify-center rounded-xl font-black text-xs transition-all border ${tableNumber === num ? 'bg-amber-400 text-stone-900 border-amber-400 scale-110 shadow-lg' : 'bg-stone-800/80 text-stone-400 border-stone-700 border-dashed'}`}
                        >
                          {tableArea === 'Inside' ? 'A' : 'B'}{num}
                        </button>
                      );
                    })}
                  </div>
                  
                  {tableNumber && (
                    <p className="text-center text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                      {t('selected_table', 'Selected Table')}: {tableArea === 'Inside' ? 'A' : 'B'}{tableNumber}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-bento-ink/40 uppercase tracking-[0.3em] ml-4">
                      {t('phone_number')} ({t('optional')})
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+212 6xx xxxx"
                      className="w-full bg-bento-card-bg/20 backdrop-blur-xl border border-bento-card-border rounded-3xl py-5 px-8 shadow-2xl focus:ring-2 focus:ring-bento-card-border transition-all placeholder:text-bento-ink/20 text-bento-ink font-bold outline-none"
                    />
                  </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-bento-ink/40 uppercase tracking-[0.3em] ml-4">
                  {t('additional_notes')}
                </label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder={deliveryType === 'dine-in' ? t('table_note_placeholder') : t('allergy_note_placeholder')}
                  rows={3}
                  className="w-full bg-bento-card-bg/20 backdrop-blur-xl border border-bento-card-border rounded-3xl py-5 px-8 shadow-2xl focus:ring-2 focus:ring-bento-card-border transition-all placeholder:text-bento-ink/20 text-bento-ink font-bold outline-none resize-none"
                />
              </div>
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
                className="w-full bg-bento-primary text-bento-bg py-8 rounded-[3rem] font-black text-2xl shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 uppercase tracking-tight group overflow-hidden relative"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? '...' : (editingOrderId ? t('update_order', 'Update Order') : t('confirm_order'))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
              <p className="text-center text-bento-ink/30 text-[10px] font-black uppercase tracking-widest px-8 leading-relaxed">
                {t('premium_selection')} <br /> {t('verified_by')} <span className="text-bento-primary font-bold">Cappuccino7</span>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
