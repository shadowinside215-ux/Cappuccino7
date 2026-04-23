import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Product } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LogOut, Award, Coffee, Gift, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

export default function Profile({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loyaltyProducts, setLoyaltyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const isGuest = auth.currentUser?.isAnonymous;

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 px-6 text-center">
        <div className="p-8 bg-amber-50 rounded-[40px] text-amber-600 shadow-xl shadow-amber-900/5">
          <Award size={64} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black text-stone-900 uppercase italic tracking-tight">Join the Club!</h1>
          <p className="text-stone-500 font-medium max-w-sm">
            Log in to start earning rewards ☕ <br />
            Every coffee counts towards a free one!
          </p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="w-full max-w-xs bg-bento-primary text-white py-5 px-8 rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-bento-primary/20 active:scale-95 transition-all"
        >
          Sign In or Create Account
        </button>
        <button 
          onClick={handleLogout}
          className="text-stone-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-500 transition-colors"
        >
          End Guest Session
        </button>
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
    <div className="space-y-8 pb-32">
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold text-bento-primary">{t('my_account')}</h1>
        <button 
          onClick={handleLogout}
          className="p-2 text-stone-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="card md:col-span-1 flex flex-col items-center justify-center py-10 !bg-white">
          <div className="w-20 h-20 bg-bento-primary rounded-[2rem] flex items-center justify-center text-white text-2xl font-black mb-6 shadow-xl shadow-bento-primary/10">
            {userProfile.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-black text-bento-ink mb-1">{userProfile.name}</h2>
          <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mb-8">{t('premium_customer')}</p>
          
          <div className="w-full pt-8 border-t border-stone-50 flex justify-around">
            <div className="text-center">
              <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1">{t('total_points')}</p>
              <p className="text-xl font-black text-bento-primary">{userProfile.points}</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1">{t('status')}</p>
              <p className="text-xl font-black text-bento-accent">Gold</p>
            </div>
          </div>
        </div>

        {/* Global Coffee Loyalty (legacy or main highlight) */}
        <div className="card md:col-span-2 accent-card !bg-amber-900 overflow-hidden relative">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Coffee size={24} className="text-amber-200" />
              </div>
              <h3 className="text-xl font-bold">Cappuccino7 Coffee Club</h3>
            </div>
            <div className="flex items-end gap-6">
              <p className="text-6xl font-black">{userProfile.coffeeCount || 0}</p>
              <div className="mb-2">
                <p className="text-xs opacity-70 font-medium">{t('total_artisan')}</p>
                <div className="flex gap-1 mt-2">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < ((userProfile.coffeeCount || 0) % 5) ? 'bg-amber-400' : 'bg-white/20'}`} />
                   ))}
                </div>
              </div>
            </div>
          </div>
          <Coffee size={120} className="absolute -right-8 -bottom-8 opacity-5 -rotate-12" />
        </div>
      </div>

      {/* Item-Specific Loyalty Rewards */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-black text-stone-300 uppercase tracking-[0.4em] pl-1">{t('specific_rewards')}</h2>
          <div className="h-px bg-stone-100 flex-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-stone-400 gap-2">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">{t('auth_loyalty')}</span>
          </div>
        ) : loyaltyProducts.length === 0 ? (
          <div className="card !py-16 text-center border-dashed">
            <p className="text-stone-400 font-bold italic mb-2 text-sm">{t('loyalty_info')}</p>
            <p className="text-[10px] text-stone-300 uppercase tracking-widest">{t('loyalty_start')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loyaltyProducts.map(product => {
              const count = userProfile.itemLoyalty?.[product.id] || 0;
              const progress = count % 11;
              const rewardReady = count >= 11;

              return (
                <div key={product.id} className="card !p-6 flex items-center gap-6 group hover:border-bento-primary/10 transition-all">
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden flex-shrink-0 ring-4 ring-stone-50">
                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-bento-ink truncate">
                      {t(`products.${product.name}`, product.name)}
                    </h4>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">
                      {rewardReady ? `🎁 ${t('reward_earned')}` : `${count}/11 ${t('units_collected')}`}
                    </p>
                    
                    <div className="mt-3 flex gap-1">
                      {[...Array(11)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 h-1.5 rounded-full transition-all ${
                            i < (rewardReady && progress === 0 ? 11 : count) 
                            ? 'bg-bento-primary' 
                            : 'bg-stone-100'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                  {rewardReady && (
                    <div className="p-3 bg-bento-accent rounded-2xl text-bento-primary animate-pulse">
                      <Gift size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {userProfile.isAdmin && (
        <div className="pt-8">
          <button 
            onClick={() => navigate('/admin')}
            className="w-full card border-2 border-bento-primary bg-stone-50 items-center justify-center !py-6 group hover:bg-bento-primary transition-all duration-300"
          >
            <div className="flex items-center gap-3 group-hover:text-white transition-colors">
              <LogOut className="rotate-180" size={24} />
              <h4 className="font-bold uppercase tracking-widest text-sm">Dashboard Console</h4>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
