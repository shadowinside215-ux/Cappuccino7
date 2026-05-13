import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleAuthError, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, collection, getDocs } from 'firebase/firestore';
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

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com' && !auth.currentUser.isAnonymous) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        setIsFirebaseAuthed(true);
        toast.success(`Authenticated as ${result.user.email}`);
      }
    } catch (err: any) {
      const message = handleAuthError(err);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isFirebaseAuthed && (auth.currentUser === null || auth.currentUser.isAnonymous)) {
      toast.error('Please verify your email identity first');
      return;
    }

    if (!auth.currentUser?.email) {
      toast.error('No verified email found. Please sign in with Google');
      return;
    }

    setLoading(true);

    try {
      const email = auth.currentUser?.email?.toLowerCase();
      const adminEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      
      // Auto-seed staff configs if they don't exist
      const staffRef = collection(db, 'staffConfigs');
      const staffSnap = await getDocs(staffRef);
      if (staffSnap.empty) {
        const defaults = [
          { id: 'waiter', username: 'waiter', password: 'waiter1234', displayName: 'Waiter' },
          { id: 'kitchen', username: 'kitchen', password: 'kitchen7000', displayName: 'Kitchen' },
          { id: 'barman', username: 'barman', password: 'barman5000', displayName: 'Barman' },
          { id: 'cashier', username: 'cashier', password: 'cashier3000', displayName: 'Cashier' },
        ];
        for (const config of defaults) {
          await setDoc(doc(db, 'staffConfigs', config.id), config);
        }
      }

      // 1. Check if user has permission (Google login email match OR anonymous with correct credentials)
      let hasPermission = false;
      let uid = auth.currentUser?.uid;

      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
        hasPermission = adminDoc.exists() || email === adminEmail.toLowerCase();
      }

      if (hasPermission && uid) {
        // ...Existing registration logic...
        const adminRef = doc(db, 'admins', uid);
        await setDoc(adminRef, {
          email: auth.currentUser?.email || 'admin@internal',
          registeredAt: serverTimestamp(),
          role: 'super_admin'
        }, { merge: true });

        await setDoc(doc(db, 'users', uid), {
          isAdmin: true,
          updatedAt: serverTimestamp()
        }, { merge: true });

        sessionStorage.setItem('admin_mode', 'true');
        toast.success('Admin access granted');
        navigate('/admin');
        return;
      }
      
      toast.error('Unauthorized access');
    } catch (err: any) {
      console.error("Admin verification error:", err);
      toast.error('Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanUsername = username.trim().toLowerCase();
      const cleanPassword = password.trim();

      const account = staffAccounts.find(acc => acc.username === cleanUsername && acc.password === cleanPassword && acc.role === 'admin');

      if (account) {
        // Save session locally
        const staffSession = {
          role: account.role,
          displayName: account.displayName,
          username: account.username,
          authenticatedAt: new Date().toISOString()
        };
        localStorage.setItem('staffSession', JSON.stringify(staffSession));

        try {
          const userCredential = await signInAnonymously(auth);
          const user = userCredential.user;

          await updateProfile(user, { displayName: account.displayName });

          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: account.displayName,
            isAdmin: true,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (firebaseErr) {
          console.warn("Firebase background auth failed - proceeding with local session", firebaseErr);
        }

        sessionStorage.setItem('admin_mode', 'true');
        toast.success('Admin Mode Activated');
        navigate('/admin');
      } else {
        toast.error('Invalid username or password');
      }
    } catch (err) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-stone-900">
      {/* Full Screen Background Image */}
      {brand.loginBgUrl && (
        <div className="fixed inset-0 z-0">
          <OptimizedImage 
            src={brand.loginBgUrl} 
            alt="Login Background" 
            className="w-full h-full object-cover"
            showOverlay={true}
            overlayClassName="bg-stone-950/60 backdrop-blur-[2px]"
          />
        </div>
      )}

      {!brand.loginBgUrl && (
        <div className="fixed inset-0 z-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-bento-primary rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-400 rounded-full blur-[120px]" />
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card !p-12 space-y-8 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3.5rem] border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bento-primary via-amber-400 to-bento-primary" />
          
          <div className="text-center space-y-4">
            <button 
              onClick={() => navigate('/login')}
              className="absolute top-8 left-8 text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
            >
              <ArrowRight size={16} className="rotate-180" /> Back
            </button>
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-24 h-24 bg-white rounded-[2rem] overflow-hidden shadow-2xl p-2 mx-auto border-2 border-stone-50 relative group"
            >
               {brand.logoUrl && (
                 <OptimizedImage 
                   src={brand.logoUrl} 
                   alt="Management Logo" 
                   className="w-full h-full object-contain rounded-[1.5rem]"
                   showOverlay={false}
                 />
               )}
            </motion.div>
            <div>
              <h1 className="text-3xl font-black italic text-bento-primary tracking-tighter uppercase leading-none">Console</h1>
              <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mt-2">Admin Authority</p>
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleTraditionalLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <UserIcon size={12} /> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-bento-primary/20 transition-all outline-none font-bold text-stone-900"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                  <Lock size={12} /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-6 pr-12 focus:ring-2 focus:ring-bento-primary/20 transition-all outline-none font-bold text-stone-900"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-stone-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
                {!loading && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest"><span className="bg-white px-4 text-stone-300">or</span></div>
            </div>

            {(!auth.currentUser || auth.currentUser.isAnonymous) ? (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white border-2 border-stone-100 text-stone-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-stone-50 transition-all"
              >
                <Mail size={16} className="text-amber-500" />
                Google Authentication
              </button>
            ) : (
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-bento-primary/5 text-bento-primary border-2 border-bento-primary/10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-bento-primary/10 transition-all"
              >
                <ShieldCheck size={16} />
                Continue with {auth.currentUser.email}
              </button>
            )}
          </div>

          <p className="text-center text-stone-300 text-[9px] font-bold uppercase tracking-[0.3em]">
            Restricted Admin Area
          </p>
        </div>
      </motion.div>
    </div>
  );
}
