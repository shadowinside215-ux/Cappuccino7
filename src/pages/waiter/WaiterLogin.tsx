import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail, ChefHat, ArrowRight, Loader2, Signal, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleAuthError } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';
import toast from 'react-hot-toast';

const staffAccounts = [
  { username: "admin", password: "admin7000", role: "admin", displayName: "Admin" },
  { username: "cashier", password: "cashier3000", role: "cashier", displayName: "Cashier" },
  { username: "kitchen", password: "kitchen7000", role: "kitchen", displayName: "Kitchen" },
  { username: "barman", password: "barman5000", role: "barman", displayName: "Barman" },
  { username: "waiter", password: "waiter1", role: "waiter", waiterId: "waiter1", displayName: "Waiter 1" },
  { username: "waiter", password: "waiter2", role: "waiter", waiterId: "waiter2", displayName: "Waiter 2" },
  { username: "waiter", password: "waiter3", role: "waiter", waiterId: "waiter3", displayName: "Waiter 3" },
  { username: "waiter", password: "waiter4", role: "waiter", waiterId: "waiter4", displayName: "Waiter 4" }
];

export default function WaiterLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      const account = staffAccounts.find(acc => 
        acc.username === cleanUsername && 
        acc.password === (acc.role === 'waiter' ? password.trim() : cleanPassword)
      );

      if (account) {
        // Prepare session
        const staffSession = {
          role: account.role,
          displayName: account.displayName,
          waiterId: (account as any).waiterId || null,
          username: account.username,
          authenticatedAt: new Date().toISOString()
        };

        // Save local session
        localStorage.setItem('staffSession', JSON.stringify(staffSession));
        
        // Waiter specific legacy flags
        if (account.role === 'waiter') {
          localStorage.setItem('waiter_session_active', 'true');
        }

        // Background Firebase Auth to satisfy Firestore rules
        try {
          const userCredential = await signInAnonymously(auth);
          const user = userCredential.user;
          await updateProfile(user, { displayName: account.displayName });
          
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: account.displayName,
            role: account.role,
            isStaff: true,
            isWaiter: account.role === 'waiter',
            isKitchen: account.role === 'kitchen',
            isBarman: account.role === 'barman',
            isCashier: account.role === 'cashier',
            isDriver: account.role === 'driver',
            isAdmin: account.role === 'admin',
            waiterId: (account as any).waiterId || null,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (firebaseErr) {
          console.warn("Firebase background auth failed - proceeding with local session", firebaseErr);
        }

        toast.success(`${account.displayName} Activated`);
        
        // Routing logic
        switch (account.role) {
          case 'admin': navigate('/admin'); break;
          case 'cashier': navigate('/cashier/dashboard'); break;
          case 'kitchen': navigate('/kitchen/dashboard'); break;
          case 'barman': navigate('/barman/dashboard'); break;
          case 'waiter': navigate('/waiter/dashboard'); break;
          default: navigate('/login');
        }
        return;
      }

      toast.error('Invalid username or password');
    } catch (err: any) {
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20 p-6 relative overflow-hidden bg-stone-50">
      <div className="absolute inset-0 z-0 opacity-10">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-400 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-900 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card !p-12 space-y-10 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3.5rem] border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-stone-900 to-amber-400" />
          
          <div className="text-center space-y-6">
            <button 
              onClick={() => navigate('/login')}
              className="absolute top-8 left-8 text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowRight size={16} className="rotate-180" /> Back
            </button>
            <motion.div 
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-32 h-32 bg-amber-50 rounded-[2.5rem] overflow-hidden shadow-2xl p-1 mx-auto border-2 border-stone-50 flex items-center justify-center relative group"
            >
               <ChefHat size={56} className="text-amber-500 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black italic text-stone-900 tracking-tighter uppercase leading-none">Console</h1>
              <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mt-3">Staff Authority</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                <UserIcon size={12} /> Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-stone-900"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Lock size={12} /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 pl-8 pr-14 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-stone-900"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 text-stone-900 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-amber-500/40 hover:bg-amber-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In Staff'} 
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="bg-amber-50/50 p-6 rounded-[2rem] border border-amber-100/50 flex items-start gap-4">
             <div className="bg-amber-100 p-2 rounded-xl mt-1">
                <Signal size={14} className="text-amber-600 animate-pulse" />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1 leading-none">Live Network</h4>
                <p className="text-[10px] text-amber-800/60 font-bold leading-tight">
                  Real-time sync active. Activity is logged via Palace Taha terminal.
                </p>
             </div>
          </div>

          <p className="text-center text-stone-300 text-[10px] font-bold uppercase tracking-[0.3em]">
            Restricted Staff Area
          </p>
        </div>
      </motion.div>
    </div>
  );
}
