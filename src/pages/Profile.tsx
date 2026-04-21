import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { LogOut, Award, User, Mail, Calendar, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile({ userProfile }: { userProfile: UserProfile | null }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!userProfile) return <div className="text-center py-20">Loading profile...</div>;

  const rewardThreshold = 100; // Hardcoded fallback or can be fetched from settings
  const progress = Math.min(100, (userProfile.points / rewardThreshold) * 100);

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
            <div className="flex items-center gap-3 mb-10">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Award className="text-bento-accent" size={28} />
              </div>
              <h3 className="text-2xl font-bold leading-tight">Cappuccino7 Rewards</h3>
            </div>
            
            <div className="space-y-6 mt-auto">
              <div>
                <p className="text-5xl font-bold mb-4">{userProfile.points} <span className="text-lg font-light opacity-60 italic">pts</span></p>
                <p className="text-sm opacity-80 mb-3">Progress to your next free coffee</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-xs opacity-70 italic">Every 100 points = 1 free beverage</p>
                <div className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-bento-accent text-bento-primary rounded-md">
                  Active
                </div>
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
