import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail, ChefHat } from 'lucide-react';
import { auth, db } from '../../lib/firebase';
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
      // Special logic for the simple 'waiter' / 'waiter1234' login
      if (email.toLowerCase() === 'waiter' && password === 'waiter1234') {
        let user;
        try {
          // Attempt to sign in with a dedicated account
          const userCredential = await signInWithEmailAndPassword(auth, 'waiter@cappuccino7.com', 'waiter1234');
          user = userCredential.user;
        } catch (authErr) {
          // If the account doesn't exist, use anonymous sign-in for the "magic" mode
          const userCredential = await signInAnonymously(auth);
          user = userCredential.user;
          console.warn('Using anonymous session for magic waiter mode.');

          // Synchronously create/update the user profile to have waiter permissions
          // This allows the Firestore rules to recognize them as a waiter
          try {
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
                createdAt: serverTimestamp()
              });
            } else {
              await updateDoc(userDocRef, {
                isWaiter: true
              });
            }
          } catch (profileErr) {
            console.error('Failed to set waiter profile permissions:', profileErr);
            // We'll still try to navigate, but DB might still block if this failed
          }
        }
        
        // Save a session flag for the guard to allow this specific session
        localStorage.setItem('waiter_session_active', 'true');
        toast.success('Waiter mode activated');
        navigate('/waiter/dashboard');
        return;
      }

      // Standard email login
      const loginEmail = email.includes('@') ? email : `${email}@cappuccino7.com`;
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
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
      console.error('Login error:', err);
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center -mt-20 px-6">
      <div className="card w-full max-w-md !p-10 space-y-8 bg-white border-2 border-amber-100 shadow-2xl rounded-[3rem]">
        <div className="text-center space-y-4">
          <div className="w-36 h-36 bg-amber-50 rounded-full overflow-hidden shadow-2xl p-1 mx-auto rotate-3 border-2 border-stone-50 flex items-center justify-center">
             <ChefHat size={64} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic text-stone-900 tracking-tighter">Waiter Dashboard</h1>
            <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Order Management Console</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <UserIcon size={12} /> Waiter Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-400 transition-all outline-none font-medium"
              placeholder="waiter"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Lock size={12} /> Access Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-amber-400 transition-all outline-none font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {loading ? 'Entering...' : 'Log In as Waiter'} <ChefHat size={20} />
          </button>
        </form>

        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100/50">
          <h4 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-2">Notice for Waiters</h4>
          <p className="text-[10px] text-amber-800/70 font-bold leading-relaxed">
            Ensure you are connected to the store network for real-time synchronization. Your activity is logged.
          </p>
        </div>

        <p className="text-center text-stone-300 text-[10px] font-bold uppercase tracking-[0.2em] pt-4">
          Strictly for authorized waitstaff
        </p>
      </div>
    </div>
  );
}
