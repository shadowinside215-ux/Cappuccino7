import { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile, Product } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LogOut, Award, Coffee, Gift, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { useTranslation } from 'react-i18next';

import { useBrandSettings } from '../lib/brand';

export default function Profile({ userProfile }: { userProfile: UserProfile | null }) {
  const { t } = useTranslation();
  const { settings: brand } = useBrandSettings();
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8 px-6 text-center -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={brand.profileBgUrl || 'https://images.unsplash.com/photo-1544333346-6466f28ecb0c?q=80&w=1600'} 
            className="w-full h-full object-cover" 
            alt=""
          />
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="p-8 bg-white/10 backdrop-blur-xl rounded-[2.5rem] mb-6 ring-1 ring-white/20">
            <Award size={64} strokeWidth={2.5} className="text-amber-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tight">Join the Club!</h2>
          <p className="text-white/60 mb-8 font-medium max-w-sm">
            Sign in to start earning exclusive ☕ rewards! Every coffee counts towards your next free one.
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-bento-primary px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
          >
            Sign In or Create Account
          </button>
          <button 
            onClick={handleLogout}
            className="mt-6 text-white/40 font-bold uppercase text-[10px] tracking-widest hover:text-white transition-colors"
          >
            End Guest Session
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
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 p-4 sm:p-8 relative overflow-hidden flex flex-col gap-10">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src={brand.profileBgUrl || 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600'} 
          className="w-full h-full object-cover fixed top-0 left-0" 
          alt=""
        />
        <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent" />
      </div>

      <div className="relative z-10 space-y-10">
        <div className="flex justify-between items-start">
          <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase drop-shadow-2xl">{t('my_account')}</h1>
          <button 
            onClick={handleLogout}
            className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl text-white hover:bg-red-500 transition-colors border border-white/10 shadow-xl"
          >
            <LogOut size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <div className="bg-white/10 backdrop-blur-[40px] rounded-[3rem] flex flex-col items-center justify-center py-12 border border-white/10 shadow-2xl text-white">
            <div className="w-32 h-32 bg-white text-stone-900 rounded-[2.5rem] flex items-center justify-center text-5xl font-black mb-8 shadow-2xl overflow-hidden p-1 border-4 border-white/10">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight italic mb-1">{userProfile.name}</h2>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-10">{t('premium_customer')}</p>
            
            <div className="w-full pt-10 border-t border-white/5 flex justify-around">
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('total_points')}</p>
                <p className="text-4xl font-black text-white tracking-tighter">{userProfile.points}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{t('status')}</p>
                <p className="text-4xl font-black text-amber-400 tracking-tighter">GOLD</p>
              </div>
            </div>
          </div>

          {/* Global Coffee Loyalty */}
          <div className="lg:col-span-2 bg-amber-900/60 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 shadow-2xl overflow-hidden relative flex flex-col justify-between text-white group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-white/10 rounded-2xl ring-1 ring-white/10">
                  <Coffee size={28} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight italic">Coffee Club</h3>
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Exclusive Membership Rewards</p>
                </div>
              </div>
              <div className="flex items-end gap-8">
                <p className="text-[10rem] font-black leading-none tracking-tighter tabular-nums drop-shadow-2xl">{userProfile.coffeeCount || 0}</p>
                <div className="mb-6 space-y-4">
                  <p className="text-sm font-bold opacity-60 leading-tight max-w-[120px]">{t('total_artisan')}</p>
                  <div className="flex gap-2">
                     {[...Array(5)].map((_, i) => (
                       <div key={i} className={`w-3 h-3 rounded-full ${i < ((userProfile.coffeeCount || 0) % 5) ? 'bg-amber-400' : 'bg-white/10 ring-1 ring-white/10'}`} />
                     ))}
                  </div>
                </div>
              </div>
            </div>
            <Coffee size={240} className="absolute -right-20 -bottom-20 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
          </div>
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
            <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-16 text-center border border-white/10">
              <p className="text-white/40 font-black uppercase tracking-[0.2em] italic mb-2 text-xs">{t('loyalty_info')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loyaltyProducts.map(product => {
                const count = userProfile.itemLoyalty?.[product.id] || 0;
                const progress = count % 11;
                const rewardReady = count >= 11;

                return (
                  <div key={product.id} className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 flex flex-col gap-6 group hover:bg-white/10 transition-all border border-white/5 relative overflow-hidden">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-[2rem] overflow-hidden flex-shrink-0 ring-4 ring-white/10 shadow-2xl">
                        <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xl text-white truncate uppercase tracking-tight">
                          {t(`products.${product.name}`, product.name)}
                        </h4>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${rewardReady ? 'text-amber-400' : 'text-white/40'}`}>
                          {rewardReady ? `🎁 Ready to Redeem` : `LVL ${count} • Goal 11`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-1.5 h-2">
                        {[...Array(11)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 rounded-full transition-all duration-500 ${
                              i < (rewardReady ? 11 : count % 11) 
                              ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
                              : 'bg-white/5'
                            }`} 
                          />
                        ))}
                      </div>
                      <p className="text-right text-[9px] font-black text-white/20 uppercase tracking-widest">Digital Stamp Card</p>
                    </div>

                    {rewardReady && (
                      <div className="absolute top-4 right-4 bg-amber-400 text-stone-900 p-3 rounded-2xl shadow-2xl animate-bounce">
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
          <div className="pt-12">
            <button 
              onClick={() => navigate('/admin')}
              className="w-full bg-white/5 backdrop-blur-xl p-10 rounded-[3rem] flex items-center justify-center gap-4 group hover:bg-white text-white hover:text-stone-900 transition-all border border-white/10 shadow-2xl"
            >
              <LogOut className="rotate-180" size={32} />
              <h4 className="font-black uppercase tracking-[0.2em] text-lg italic">Admin Dashboard Console</h4>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
