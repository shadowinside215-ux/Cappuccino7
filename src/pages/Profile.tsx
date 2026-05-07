import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Product } from '../types';
import { collection, query, where, getDocs, updateDoc, doc, setDoc } from 'firebase/firestore';
import { LogOut, Award, Coffee, Gift, ShoppingBag, Loader2, Star, LayoutDashboard, MapPin, ChevronRight, Settings as SettingsIcon, Phone } from 'lucide-react';
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
    await auth.signOut();
    toast.success('Session ended');
    navigate('/login');
  };

  if (isGuest) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-6 text-center -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 relative overflow-hidden">
        {brand.profileBgUrl && (
          <div className="fixed inset-0 z-0">
            <OptimizedImage 
              priority
              src={brand.profileBgUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover" 
              alt=""
              showOverlay={true}
              overlayClassName="bg-stone-950/60 backdrop-blur-[2px]"
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] mb-6 ring-1 ring-white/20">
            <Award size={64} strokeWidth={2.5} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">{t('join_club')}</h2>
          <p className="text-white/60 mb-8 font-medium max-w-sm">
            {t('loyalty_promo_desc')}
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-bento-primary px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            {t('sign_in_or_create')}
          </button>
          <button 
            onClick={handleLogout}
            className="mt-6 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
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
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-4 sm:p-8 relative flex flex-col gap-10">
      {/* Immersive Background */}
      {brand.profileBgUrl && (
        <div className="fixed inset-0 z-0">
          <OptimizedImage 
            priority
            src={brand.profileBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt=""
            showOverlay={true}
            overlayClassName="bg-stone-950/60 backdrop-blur-[2px]"
          />
        </div>
      )}

      <div className="relative z-10 space-y-12 max-w-5xl mx-auto">
        <div className="flex justify-between items-start">
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl"
          >
            {t('my_account')}
          </motion.h1>
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleLogout}
            className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500/80 transition-all border border-white/10 shadow-xl active:scale-90"
          >
            <LogOut size={24} />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-[40px] rounded-[3rem] flex flex-col items-center justify-center py-12 border border-white/10 shadow-2xl text-white relative overflow-hidden"
          >
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="w-32 h-32 bg-white text-stone-900 rounded-[2.5rem] flex items-center justify-center text-5xl font-black mb-8 shadow-2xl overflow-hidden p-1 border-4 border-white/10"
            >
              {userProfile.name.charAt(0).toUpperCase()}
            </motion.div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="w-full px-8 space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-white/40 ml-2">{t('full_name')}</label>
                  <input 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-white/40 ml-2">{t('phone_number')}</label>
                  <input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('optional')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-white text-stone-900 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('save')}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-white/10 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-3xl font-black uppercase tracking-tight italic mb-1">{userProfile.name}</h2>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={12} className="text-white/40" />
                  <p className="text-[10px] text-white/60 font-bold">{userProfile.phone || t('no_phone_added')}</p>
                </div>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-6">{t('premium_customer')}</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mb-8 text-[9px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/20 transition-all font-bold"
                >
                  {t('edit_profile')}
                </button>
              </>
            )}
            
            <div className="w-full pt-10 border-t border-white/5 flex justify-around">
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('membership')}</p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl font-black text-white tracking-tighter"
                >
                  PREMIUM
                </motion.p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('status')}</p>
                <p className="text-4xl font-black text-amber-400 tracking-tighter">GOLD</p>
              </div>
            </div>
          </motion.div>

          {/* Global Coffee Loyalty */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-stone-900/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden relative flex flex-col justify-between text-white group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-white/5 rounded-2xl ring-1 ring-white/10">
                  <Coffee size={28} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Coffee Club</h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Exclusive Membership Rewards</p>
                </div>
              </div>
              <div className="flex items-end gap-8">
                <motion.p 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
                  className="text-[10rem] font-black leading-none tracking-tighter tabular-nums drop-shadow-2xl"
                >
                  {userProfile.coffeeCount || 0}
                </motion.p>
                <div className="mb-6 space-y-4">
                  <p className="text-sm font-bold opacity-60 leading-tight max-w-[120px] italic">{t('total_artisan')}</p>
                  <div className="flex gap-2">
                     {[...Array(5)].map((_, i) => (
                       <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + (i * 0.1) }}
                        key={i} 
                        className={`w-3 h-3 rounded-full ${i < ((userProfile.coffeeCount || 0) % 5) ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'bg-white/10 ring-1 ring-white/10'}`} 
                       />
                     ))}
                  </div>
                </div>
              </div>
            </div>
            <Coffee size={240} className="absolute -right-20 -bottom-20 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </motion.div>
        </div>

        {/* Item-Specific Loyalty Rewards */}
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.5em] pl-2">{t('specific_rewards')}</h2>
            <div className="h-px bg-white/5 flex-1" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-white/40 gap-3">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-sm font-black uppercase tracking-widest">{t('auth_loyalty')}</span>
            </div>
          ) : loyaltyProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-white/10"
            >
              <p className="text-white/40 font-black uppercase tracking-[0.2em] italic mb-2 text-xs">{t('loyalty_info')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {loyaltyProducts.map((product, idx) => {
                  const count = userProfile.itemLoyalty?.[product.id] || 0;
                  const rewardReady = count >= 11;

                  return (
                    <motion.div 
                      key={product.id} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:bg-white/10 transition-all border border-white/5 relative overflow-hidden shadow-xl"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] overflow-hidden flex-shrink-0 ring-4 ring-white/10 shadow-2xl">
                          <OptimizedImage 
                            src={product.image} 
                            alt="" 
                            containerClassName="w-full h-full"
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-xl text-white truncate uppercase tracking-tight italic">
                            {t(`products.${product.name}`, product.name)}
                          </h4>
                          <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${rewardReady ? 'text-amber-400' : 'text-white/40'}`}>
                            {rewardReady ? t('ready_to_redeem') : t('goal_lvl', { count })}
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
                                ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                                : 'bg-white/5'
                              }`} 
                            />
                          ))}
                        </div>
                        <p className="text-right text-[9px] font-black text-white/20 uppercase tracking-widest italic font-mono">Artisan Stamp Card</p>
                      </div>

                      {rewardReady && (
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute top-4 right-4 bg-amber-400 text-stone-900 p-3 rounded-2xl shadow-2xl"
                        >
                          <Gift size={20} />
                        </motion.div>
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
              className="w-full bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] flex items-center justify-center gap-4 group hover:bg-white text-white hover:text-stone-900 transition-all border border-white/10 shadow-2xl"
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
