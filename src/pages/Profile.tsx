import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { LogOut, Award, User, Mail, Calendar, LayoutDashboard, Coffee, Gift } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile({ userProfile }: { userProfile: UserProfile | null }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!userProfile) return <div className="text-center py-20">Loading profile...</div>;
 
  const coffeeCount = userProfile.coffeeCount || 0;
  const coffeeProgress = coffeeCount % 10;
  const coffeesUntilFree = 10 - coffeeProgress;
  const rewardAvailable = (coffeeCount >= 10);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex justify-between items-start">
        <h1 className="text-4xl font-bold text-bento-primary">My Account</h1>
        <button 
          onClick={handleLogout}
          className="p-2 text-stone-300 hover:text-red-500 transition-colors"
        >
          <LogOut size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="card text-center justify-center py-10">
          <div className="w-20 h-20 bg-bento-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto shadow-lg shadow-bento-accent/20">
            EG
          </div>
          <h2 className="text-3xl font-bold mb-1">{userProfile.name}</h2>
          <p className="text-stone-400 text-sm mb-8 uppercase tracking-widest font-semibold flex items-center justify-center gap-2">
            Premium Member
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-stone-100">
            <div className="text-left border-r border-stone-100 pr-4">
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-1">Caffeino Points</p>
              <p className="text-2xl font-bold text-bento-primary">{userProfile.points}</p>
            </div>
            <div className="text-left pl-4">
              <p className="text-[10px] font-bold text-stone-300 uppercase tracking-widest mb-1">Joined</p>
              <p className="text-lg font-bold">
                {new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Loyalty Bento Card */}
        <div className="card accent-card overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Coffee className="text-bento-accent" size={28} />
              </div>
              <h3 className="text-2xl font-bold leading-tight">Cappuccino7 Loyalty</h3>
            </div>
            
            <div className="space-y-6 mt-auto">
              <div>
                <div className="flex justify-between items-end mb-4">
                  <p className="text-5xl font-bold">
                    {coffeeCount} <span className="text-lg font-light opacity-60 italic whitespace-nowrap">cups</span>
                  </p>
                  {rewardAvailable && (
                    <div className="bg-green-400 text-bento-primary p-2 rounded-xl mb-1 flex items-center gap-2 animate-bounce">
                      <Gift size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Free Coffee!</span>
                    </div>
                  )}
                </div>
                
                <p className="text-sm opacity-80 mb-4 font-medium italic">
                  {rewardAvailable 
                    ? "Visit us to claim your 11th coffee free!" 
                    : `${coffeesUntilFree} more coffees to unlock your free reward`
                  }
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {[...Array(10)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                        i < (rewardAvailable && coffeeProgress === 0 ? 10 : coffeeProgress)
                        ? 'bg-white border-white scale-105 shadow-lg shadow-white/20 text-bento-primary translate-y-[-2px]' 
                        : 'border-white/10 text-white/20'
                      }`}
                    >
                      <Coffee size={18} fill={i < (rewardAvailable && coffeeProgress === 0 ? 10 : coffeeProgress) ? "currentColor" : "none"} />
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-black/10 p-4 rounded-2xl border border-white/5">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Automatic Reward System</p>
                <Award size={16} className="text-bento-accent" />
              </div>
            </div>
          </div>
          {/* Subtle graphic accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        </div>
      </div>

      {userProfile.isAdmin && (
        <div className="pt-8">
          <button 
            onClick={() => navigate('/admin')}
            className="w-full card border-2 border-bento-primary bg-stone-50 items-center justify-center !py-6 group hover:bg-bento-primary transition-all duration-300"
          >
            <div className="flex items-center gap-3 group-hover:text-white transition-colors">
              <LayoutDashboard size={24} />
              <h4 className="font-bold uppercase tracking-widest text-sm">Access Management Console</h4>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
