import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Lock, User as UserIcon, ArrowRight, Loader2, Signal } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, handleAuthError, OperationType } from '../../lib/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function KitchenLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (cleanUsername === 'kitchen' && cleanPassword === 'kitchen7000') {
        let user;
        // Use anonymous sign-in for the "magic" mode to avoid credential conflicts
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            uid: user.uid,
            name: 'Kitchen Staff',
            email: 'kitchen@internal',
            points: 0,
            coffeeCount: 0,
            itemLoyalty: {},
            isAdmin: false,
            isKitchen: true,
            isBarman: false,
            isWaiter: false,
            createdAt: serverTimestamp()
          });
        }
        await setDoc(doc(db, 'kitchen', user.uid), { active: true, updatedAt: serverTimestamp() }, { merge: true });
        
        localStorage.setItem('kitchen_session_active', 'true');
        toast.success('Kitchen mode activated');
        navigate('/kitchen/dashboard');
        return;
      }

      toast.error('Invalid kitchen credentials');
    } catch (err: any) {
      const message = handleAuthError(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20 p-6 relative overflow-hidden bg-stone-950">
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-800 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card !p-12 space-y-10 bg-stone-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-stone-800 to-blue-500" />
          
          <div className="text-center space-y-6">
            <button 
              onClick={() => navigate('/login')}
              className="absolute top-8 left-8 text-stone-500 hover:text-white transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowRight size={16} className="rotate-180" /> Back
            </button>
            <motion.div 
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-32 h-32 bg-stone-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-1 mx-auto border-2 border-stone-700 flex items-center justify-center relative group"
            >
               <ChefHat size={56} className="text-blue-400 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black italic text-white tracking-tighter uppercase leading-none">Kitchen</h1>
              <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-[10px] mt-3">Culinary Authority</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <UserIcon size={12} /> Station ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-bold text-white placeholder:text-stone-600"
                placeholder="Kitchen username"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Lock size={12} /> Access Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-bold text-white placeholder:text-stone-600"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-500/40 hover:bg-blue-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Energize Station'} 
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10 flex items-start gap-4">
             <div className="bg-blue-500/20 p-2 rounded-xl mt-1">
                <Signal size={14} className="text-blue-400 animate-pulse" />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Feed Active</h4>
                <p className="text-[10px] text-stone-400 font-bold leading-tight">
                  Kitchen order relay terminal sync success.
                </p>
             </div>
          </div>

          <p className="text-center text-stone-600 text-[10px] font-bold uppercase tracking-[0.3em]">
            Restricted Kitchen Area
          </p>
        </div>
      </motion.div>
    </div>
  );
}
