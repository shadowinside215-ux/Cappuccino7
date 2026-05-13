import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, ShieldCheck, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { auth, db } from '../../lib/firebase';
import { signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const staffAccounts = [
  { username: "admin", password: "admin7000", role: "admin", displayName: "Admin" },
  { username: "cashier", password: "cashier3000", role: "cashier", displayName: "Cashier" },
  { username: "kitchen", password: "kitchen7000", role: "kitchen", displayName: "Kitchen" },
  { username: "barman", password: "barman5000", role: "barman", displayName: "Barman" },
  { username: "delivery", password: "delivery7000", role: "driver", displayName: "Delivery" }
];

export default function DriverLogin() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      const account = staffAccounts.find(acc => acc.username === cleanUsername && acc.password === cleanPassword && acc.role === 'driver');

      if (account) {
        // Prepare session
        const staffSession = {
          role: account.role,
          displayName: account.displayName,
          username: account.username,
          authenticatedAt: new Date().toISOString()
        };

        // Save local session
        localStorage.setItem('staffSession', JSON.stringify(staffSession));
        localStorage.setItem('driver_auth', 'true');

        // Background Firebase Auth
        try {
          const userCredential = await signInAnonymously(auth);
          const user = userCredential.user;
          await updateProfile(user, { displayName: account.displayName });
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: account.displayName,
            role: account.role,
            isStaff: true,
            isDriver: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (firebaseErr) {
          console.warn("Firebase background auth failed", firebaseErr);
        }

        toast.success('Driver access granted');
        navigate('/driver/dashboard');
        return;
      }

      toast.error('Invalid username or password');
    } catch (err) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 group/login relative flex items-center justify-center p-6 bg-stone-900">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558981403-c5f91cbba527?auto=format&fit=crop&q=80" 
          alt="Driver backdrop" 
          className="w-full h-full object-cover opacity-20 grayscale brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-at-b from-stone-900/40 via-stone-900/80 to-stone-900" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-white/50 to-amber-400" />
          
          <div className="flex flex-col items-center gap-8 mb-12">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.1 }}
              className="w-24 h-24 bg-amber-400 rounded-3xl flex items-center justify-center shadow-[0_20px_50px_rgba(251,191,36,0.3)]"
            >
              <Truck size={44} className="text-stone-900" />
            </motion.div>
            <div className="text-center space-y-3">
              <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                {t('driver_login')}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-1 bg-amber-400 rounded-full" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Fleet Management</p>
                <div className="h-1 w-1 bg-amber-400 rounded-full" />
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                   Username
                </label>
                <div className="relative group/input">
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-white/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                   Password
                </label>
                <div className="relative group/input">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-14 text-white font-bold outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-stone-900 font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_40px_rgba(251,191,36,0.2)] uppercase text-xs tracking-widest"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : t('enter_dashboard', 'Enter Dashboard')}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-3 text-white/40">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Secure Terminal Enforced</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
