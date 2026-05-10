import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail, ChefHat, ArrowRight, Loader2, Signal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleAuthError } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function WaiterLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Special logic for the simple 'waiter' / 'waiter1234' login
      if (cleanEmail === 'waiter' && cleanPassword === 'waiter1234') {
        let user;
        
        // Use anonymous sign-in for the "magic" mode to avoid credential conflicts
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;

        // Synchronously create/update the user profile to have waiter permissions
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: 'System Waiter',
            email: 'waiter@internal',
            points: 0,
            coffeeCount: 0,
            itemLoyalty: {},
            isAdmin: false,
            isWaiter: true,
            isKitchen: false,
            isBarman: false,
            createdAt: serverTimestamp()
          });
        }

        // ALSO sync to 'waiters' collection for fast exists() check in rules
        await setDoc(doc(db, 'waiters', user.uid), {
          active: true,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        // Save a session flag for the guard to allow this specific session
        localStorage.setItem('waiter_session_active', 'true');
        toast.success('Waiter mode activated');
        navigate('/waiter/dashboard');
        return;
      }

      // Standard email login
      const loginEmail = cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@cappuccino7.com`;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, cleanPassword);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.isWaiter || userData?.isAdmin) {
        toast.success('Waiter access granted');
        navigate('/waiter/dashboard');
      } else {
        toast.error('Unauthorized access');
        await auth.signOut();
      }
    } catch (err: any) {
      const message = handleAuthError(err);
      toast.error(message);
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
                <UserIcon size={12} /> ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-stone-900"
                placeholder="Waiter username"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Lock size={12} /> Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-stone-900"
                placeholder="••••••••"
                required
              />
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
