import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, User as UserIcon, ArrowRight, Loader2, Signal, Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, handleAuthError } from '../../lib/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function CashierLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanId = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      // Fetch specific staff config by doc ID
      const staffDoc = await getDoc(doc(db, 'staffConfigs', cleanId));
      const staffData = staffDoc.exists() ? staffDoc.data() as any : null;

      if (staffData && staffData.password === cleanPassword && staffData.id === 'cashier') {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          name: staffData.displayName || 'POS Cashier',
          email: 'cashier@internal',
          isAdmin: false,
          isCashier: true,
          updatedAt: serverTimestamp()
        }, { merge: true });

        await setDoc(doc(db, 'cashiers', user.uid), {
          active: true,
          updatedAt: serverTimestamp()
        }, { merge: true });

        toast.success('POS System Activated');
        navigate('/cashier/dashboard');
        return;
      }

      // Standard login
      const loginEmail = cleanId.includes('@') ? cleanId : `${cleanId}@cappuccino7.com`;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, cleanPassword);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      if (userData?.isCashier || userData?.isAdmin) {
        toast.success('Cashier access granted');
        navigate('/cashier/dashboard');
      } else {
        toast.error('Unauthorized access');
        await auth.signOut();
      }
    } catch (err: any) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#0A0A0A]">
      {/* Coffee themed background effects */}
      <div className="absolute inset-0 z-0 overflow-hidden">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-amber-900/20 rounded-full blur-[150px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-stone-900 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-stone-900/60 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-600" />
          
          <div className="text-center mb-10">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-24 h-24 bg-stone-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10"
            >
              <Calculator size={48} className="text-amber-500" />
            </motion.div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">POS Terminal</h1>
            <p className="text-amber-600/60 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Authorization Required</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <UserIcon size={12} /> Station ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-800/50 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-white placeholder:text-stone-600"
                placeholder="Enter station ID"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Lock size={12} /> Security Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-800/50 border border-white/5 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-white placeholder:text-stone-600"
                placeholder="Enter security key"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-stone-950 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-amber-900/20 hover:bg-amber-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Activate Terminal'} 
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-8">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Network Secure</span>
             </div>
             <Calculator size={16} className="text-stone-700" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
