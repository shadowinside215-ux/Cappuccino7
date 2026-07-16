import React, { useState, useEffect } from 'react';
import { signOutApp } from '../lib/googleAuth';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Product } from '../types';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { LogOut, Award, Coffee, Gift, ShoppingBag, Loader2, Star, LayoutDashboard, MapPin, ChevronRight, Settings as SettingsIcon, Phone, ListOrdered } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';

export default function Profile({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();
  const [loyaltyProducts, setLoyaltyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.name || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const isGuest = auth.currentUser?.isAnonymous;

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userProfile.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        phone: phone.trim()
      });
      
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (err: any) {
      console.error('Update Profile Error:', err);
      toast.error(`Update failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!userProfile?.itemLoyalty) return;
      const productIds = Object.keys(userProfile.itemLoyalty).filter(id => (userProfile.itemLoyalty[id] || 0) > 0);
      if (productIds.length === 0) return;

      setLoading(true);
      try {
        const q = query(collection(db, 'products'));
        const snap = await getDocs(q);
        const allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        const relevant = allProducts.filter(p => productIds.includes(p.id));
        setLoyaltyProducts(relevant);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [userProfile?.itemLoyalty]);

  const handleLogout = async () => {
    // Clear staff markers immediately
    localStorage.removeItem('waiter_session_active');
    localStorage.removeItem('kitchen_session_active');
    localStorage.removeItem('barman_session_active');
    localStorage.removeItem('cashier_session_active');
    localStorage.removeItem('driver_auth');
    localStorage.removeItem('staffSession');
    sessionStorage.removeItem('admin_mode');
    
    try {
      await signOutApp();
    } catch (e) {
      console.warn(e);
    }
    
    navigate('/login', { replace: true });
  };

  if (isGuest) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center space-y-8 px-6 text-center relative overflow-hidden">
        {brand.profileBgUrl && (
          <div className="fixed inset-0 z-0 h-screen w-screen">
            <OptimizedImage 
              priority
              size="hero"
              src={brand.profileBgUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover" 
              alt=""
              showOverlay={true}
              overlayClassName="bg-bento-bg/60 backdrop-blur-[2px]"
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-bento-card-bg/20 backdrop-blur-xl rounded-[2.5rem] mb-6 ring-1 ring-bento-card-border">
            <Award size={64} strokeWidth={2.5} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-black text-bento-ink mb-2 uppercase italic tracking-tight">{t('join_club')}</h2>
          <p className="text-bento-ink/40 mb-8 font-medium max-w-sm">
            {t('loyalty_promo_desc')}
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-bento-primary text-bento-bg px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            {t('sign_in_or_create')}
          </button>
          <button 
            onClick={handleLogout}
            className="mt-6 text-bento-ink/40 font-bold uppercase text-[10px] tracking-widest hover:text-bento-ink transition-colors"
          >
            {t('end_guest_session')}
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
         <Loader2 className="animate-spin text-bento-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      {brand.profileBgUrl && (
        <div className="fixed inset-0 z-0 h-screen w-screen">
          <OptimizedImage 
            priority
            size="hero"
            src={brand.profileBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
            showOverlay={true}
            overlayClassName="bg-bento-bg/60 backdrop-blur-[2px]"
          />
        </div>
      )}

      <div className="relative z-10 space-y-12 max-w-5xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between items-center gap-6 w-full">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="text-6xl md:text-8xl font-black text-bento-ink italic tracking-tighter uppercase drop-shadow-2xl text-center md:text-left"
          >
            {t('profile')}
          </motion.h1>
          <div className="flex gap-4 items-center justify-center">
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate('/orders')}
              className="hidden sm:flex items-center gap-3 px-6 bg-[#d4af37] text-stone-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
            >
              <ListOrdered size={18} />
              {t('my_orders', 'My Orders')}
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => navigate('/settings')}
              className="p-4 bg-bento-card-bg/20 backdrop-blur-xl rounded-2xl text-bento-ink hover:bg-bento-card-bg/30 transition-all border border-bento-card-border shadow-xl active:scale-90"
            >
              <SettingsIcon size={24} />
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleLogout}
              className="p-4 bg-bento-card-bg/20 backdrop-blur-xl rounded-2xl text-bento-ink hover:bg-red-500/80 transition-all border border-bento-card-border shadow-xl active:scale-90"
            >
              <LogOut size={24} />
            </motion.button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {/* Profile Info Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-bento-card-bg/20 backdrop-blur-[40px] rounded-[3rem] flex flex-col items-center justify-center py-12 border border-bento-card-border shadow-2xl text-bento-ink relative overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-32 h-32 bg-bento-card-bg text-bento-ink rounded-[2.5rem] flex items-center justify-center text-5xl font-black mb-8 shadow-2xl overflow-hidden p-1 border-4 border-bento-card-border"
            >
              {userProfile.name.charAt(0).toUpperCase()}
            </motion.div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="w-full max-w-md px-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-bento-ink/40 ml-2">{t('full_name')}</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-bento-ink/5 border border-bento-card-border rounded-xl px-4 py-3 text-bento-ink font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-bento-ink/40 ml-2">{t('phone_number')}</label>
                  <input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('optional')}
                    className="w-full bg-bento-ink/5 border border-bento-card-border rounded-xl px-4 py-3 text-bento-ink font-bold outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-bento-primary text-bento-bg py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('save')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-bento-ink/10 text-bento-ink py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-3xl font-black uppercase tracking-tight italic mb-1">{userProfile.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={12} className="text-bento-ink/40" />
                  <p className="text-[10px] text-bento-ink/60 font-bold">{userProfile.phone || t('no_phone_added')}</p>
                </div>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mb-8 text-[9px] font-black uppercase tracking-widest bg-bento-ink/10 px-4 py-2 rounded-lg border border-bento-card-border hover:bg-bento-ink/20 transition-all font-bold"
                >
                  {t('edit_profile')}
                </button>
              </>
            )}
          </motion.div>

            {/* Rate Us Card */}
            {(brand.googleMapsLink || 'https://www.google.com/maps/search/?api=1&query=Cappuccino7+Sale+El+Jadida') && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => window.open(brand.googleMapsLink || 'https://www.google.com/maps/search/?api=1&query=Cappuccino7+Sale+El+Jadida', '_blank')}
                className="bg-amber-400 rounded-[3rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-stone-900 rounded-[2rem] flex items-center justify-center text-amber-400 shadow-xl group-hover:rotate-12 transition-transform">
                    <Star size={40} className="fill-amber-400" />
                  </div>
                  <div className="text-stone-900">
                    <h3 className="text-3xl font-black uppercase tracking-tight italic leading-tight">{t('love_food_q')}</h3>
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">{t('rate_google_maps')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-stone-900 text-white px-8 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest group-hover:px-10 transition-all">
                  {t('rate_us_now')}
                  <ChevronRight size={18} />
                </div>
              </motion.div>
            )}
          </div>



        
        {/* Item-Specific Loyalty Rewards */}
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black text-bento-ink/40 uppercase tracking-[0.5em] pl-2">{t('specific_rewards')}</h2>
            <div className="h-px bg-bento-card-border flex-1" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-bento-ink/40 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm font-black uppercase tracking-widest">{t('auth_loyalty')}</span>
            </div>
          ) : loyaltyProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-bento-card-bg/20 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-bento-card-border"
            >
              <p className="text-bento-ink/40 font-black uppercase tracking-[0.2em] italic mb-2 text-xs">{t('loyalty_info')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {loyaltyProducts.map((product, idx) => {
                  const count = userProfile.itemLoyalty?.[product.id] || 0;
                  const rewardReady = count >= 11;
                  const isGoldState = count === 11;

                  return (
                    <motion.div 
                      key={product.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className={`${isGoldState ? 'bg-amber-400' : 'bg-bento-card-bg/20 group hover:bg-bento-card-bg/30'} backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col gap-6 transition-all border ${isGoldState ? 'border-amber-500' : 'border-bento-card-border'} relative overflow-hidden shadow-xl`}
                    >
                      <div className="flex items-center gap-6">
                        <div className={`w-20 h-20 rounded-[2rem] overflow-hidden flex-shrink-0 ring-4 ${isGoldState ? 'ring-stone-900/10' : 'ring-bento-card-border'} shadow-2xl`}>
                          {product.hideImage ? (
                            <div className="w-full h-full bg-[#f6f3f0] dark:bg-stone-800 flex flex-col items-center justify-center text-stone-400 group-hover:scale-110 transition-transform duration-500">
                              <Coffee size={32} className="opacity-20" />
                            </div>
                          ) : (
                            <OptimizedImage 
                              src={product.image} 
                              size="medium"
                              alt="" 
                              containerClassName="w-full h-full"
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-black text-xl truncate uppercase tracking-tight italic ${isGoldState ? 'text-stone-900' : 'text-bento-ink'}`}>
                            {t(`products.${product.name}`, product.name)}
                          </h4>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isGoldState ? 'text-stone-950' : (rewardReady ? 'text-amber-500' : 'text-bento-ink/40')}`}>
                            {isGoldState ? t('get_free_order') : (rewardReady ? t('ready_to_redeem') : t('goal_lvl', { count }))}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex gap-1.5 h-2">
                          {[...Array(11)].map((_, i) => (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 + (i * 0.03) }}
                              key={i} 
                              className={`flex-1 rounded-full transition-all duration-500 ${
                                i < (rewardReady ? 11 : count % 11) 
                                ? (isGoldState ? 'bg-stone-900 shadow-[0_0_10px_rgba(0,0,0,0.2)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]') 
                                : (isGoldState ? 'bg-stone-900/10' : 'bg-bento-ink/10 ring-1 ring-bento-card-border/10')
                              }`} 
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[9px] font-black uppercase tracking-widest italic font-mono ${isGoldState ? 'text-stone-900' : 'text-bento-ink/20'}`}>{t('artisan_stamp_card')}</p>
                          {isGoldState && <span className="text-xl font-black text-stone-950">12</span>}
                        </div>
                      </div>

                      {rewardReady && (
                        <div className="absolute top-4 right-4 z-20">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(t('confirm_redeem', 'Redeem this reward now?'))) {
                                const { doc, updateDoc, increment, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                                const userRef = doc(db, 'users', userProfile.uid);
                                
                                await updateDoc(userRef, {
                                  [`itemLoyalty.${product.id}`]: increment(-11),
                                  [`availableRewards.${product.id}`]: increment(1)
                                });
                                
                                await addDoc(collection(db, 'waiterRequests'), {
                                  clientName: userProfile.name,
                                  clientId: userProfile.uid,
                                  status: 'new',
                                  timestamp: serverTimestamp(),
                                  type: 'reward_redemption',
                                  message: `${userProfile.name} has requested their reward for ${product.name}`,
                                  tableZone: 'General',
                                  fullTableLabel: userProfile.name,
                                  productId: product.id,
                                  productName: product.name
                                });
                                
                                toast.success(t('reward_redeemed', 'Reward voucher generated! Staff has been notified.'));
                              }
                            }}
                            className="bg-amber-400 text-stone-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                          >
                            <Gift size={14} /> {t('redeem_free_reward', 'Redeem Free Reward')}
                          </button>
                        </div>
                      )}
                      
                      {(userProfile.availableRewards?.[product.id] || 0) > 0 && (
                        <div className="absolute top-16 right-4 z-20 mt-2 bg-green-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
                           {userProfile.availableRewards[product.id]} {t('vouchers_available', 'Voucher(s) Available')}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>


        {userProfile.isAdmin && (
          <div className="pt-12">
            <button 
              onClick={() => navigate('/admin')}
              className="w-full bg-bento-card-bg/20 backdrop-blur-xl p-10 rounded-[3rem] flex items-center justify-center gap-4 group hover:bg-bento-primary text-bento-ink hover:text-bento-bg transition-all border border-bento-card-border shadow-2xl"
            >
              <LogOut className="rotate-180" size={32} />
              <h4 className="font-black uppercase tracking-[0.2em] text-lg italic">{t('admin_dashboard_console')}</h4>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
