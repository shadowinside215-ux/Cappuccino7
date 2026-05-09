import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User as UserIcon, ArrowRight, Loader2, Signal } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { signInWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function BarmanLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (username.toLowerCase() === 'barman' && password === 'barman5000') {
        let user;
        try {
          const userCredential = await signInWithEmailAndPassword(auth, 'barman@cappuccino7.com', 'barman5000');
          user = userCredential.user;
        } catch (authErr) {
          const userCredential = await signInAnonymously(auth);
          user = userCredential.user;
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              name: 'Barman Staff',
              email: 'barman@internal',
              points: 0,
              coffeeCount: 0,
              itemLoyalty: {},
              isAdmin: false,
              isBarman: true,
              isKitchen: false,
              isWaiter: false,
              createdAt: serverTimestamp()
            });
          } else {
            await updateDoc(userDocRef, { 
              isBarman: true,
              isKitchen: false,
              isWaiter: false
            });
          }
          await setDoc(doc(db, 'barman', user.uid), { active: true, updatedAt: serverTimestamp() }, { merge: true });
        }
        
        localStorage.setItem('barman_session_active', 'true');
        toast.success('Barman mode activated');
        navigate('/barman/dashboard');
        return;
      }

      toast.error('Invalid barman credentials');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code?.startsWith('auth/')) {
        toast.error('Authentication failed');
      } else {
        handleFirestoreError(err, OperationType.WRITE, 'barman profile setup');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20 p-6 relative overflow-hidden bg-[#1A0F0A]">
      <div className="absolute inset-0 z-0 opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600 rounded-full blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-stone-900 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card !p-12 space-y-10 bg-[#25160E] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] rounded-[3.5rem] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-600 via-stone-800 to-amber-600" />
          
          <div className="text-center space-y-6">
            <button 
              onClick={() => navigate('/login')}
              className="absolute top-8 left-8 text-amber-500/40 hover:text-amber-400 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowRight size={16} className="rotate-180" /> Back
            </button>
            <motion.div 
              whileHover={{ rotate: -5, scale: 1.05 }}
              className="w-32 h-32 bg-[#2D1B12] rounded-[2.5rem] overflow-hidden shadow-2xl p-1 mx-auto border-2 border-[#3D2519] flex items-center justify-center relative group"
            >
               <Coffee size={56} className="text-amber-500 group-hover:scale-110 transition-transform" />
               <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black italic text-amber-50 tracking-tighter uppercase leading-none">Barman</h1>
              <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mt-3">Bar Authority</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest ml-4 flex items-center gap-2">
                <UserIcon size={12} /> Bar ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1A0F0A] border border-[#3D2519] rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-amber-50 placeholder:text-stone-600"
                placeholder="Barman username"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest ml-4 flex items-center gap-2">
                <Lock size={12} /> Bar Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A0F0A] border border-[#3D2519] rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none font-bold text-amber-50 placeholder:text-stone-600"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-[#1A0F0A] py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-amber-900/40 hover:bg-amber-500 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Activate Bar'} 
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="bg-amber-500/5 p-6 rounded-[2rem] border border-amber-500/10 flex items-start gap-4">
             <div className="bg-amber-500/20 p-2 rounded-xl mt-1">
                <Signal size={14} className="text-amber-500 animate-pulse" />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 leading-none">Stream Logic</h4>
                <p className="text-[10px] text-amber-50/40 font-bold leading-tight">
                  Barman drink relay terminal online and syncing.
                </p>
             </div>
          </div>

          <p className="text-center text-amber-900/40 text-[10px] font-bold uppercase tracking-[0.3em]">
            Restricted Bar Area
          </p>
        </div>
      </motion.div>
    </div>
  );
}
