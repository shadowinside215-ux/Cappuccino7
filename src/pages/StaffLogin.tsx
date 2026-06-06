import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Lock, User, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, handleAuthError, handleFirestoreError, OperationType } from '../lib/firebase';
import { useBrandSettings } from '../lib/brand';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function StaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect based on role
    const checkUser = async () => {
      if (auth.currentUser) {
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (docSnap.exists()) {
          const up = docSnap.data();
          if (up.role === 'admin' || up.isAdmin) navigate('/admin');
          else if (up.role === 'waiter' || up.isWaiter) navigate('/waiter/dashboard');
          else if (up.role === 'cashier' || up.isCashier) navigate('/cashier/dashboard');
          else if (up.role === 'kitchen' || up.isKitchen) navigate('/kitchen/dashboard');
          else if (up.role === 'barman' || up.isBarman) navigate('/barman/dashboard');
          else if (up.role === 'driver' || up.isDriver) navigate('/driver/dashboard');
          else {
            // Not a staff member
            await auth.signOut();
            toast.error('Unauthorized access. Client account detected.');
            navigate('/login');
          }
        }
      }
    };
    checkUser();
  }, [navigate]);

  const validateStrongPassword = (pass: string) => {
    if (pass.length < 10) return "Password must be at least 10 characters long.";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least one uppercase letter.";
    if (!/\d/.test(pass)) return "Password must contain at least one number.";
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pass)) return "Password must contain at least one symbol.";
    const weakPasswords = ['1234567890', 'admin', 'waiter', 'password'];
    if (weakPasswords.some(w => pass.toLowerCase().includes(w))) return "Password is too weak or uses common words.";
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!username || !password) {
        toast.error('Please enter both username and password.');
        setLoading(false);
        return;
      }

      const cleanUsername = username.trim().toLowerCase();
      const email = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@staff.cappuccino7.app`;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success(`Authenticated securely.`);
        // Redirection handled by useEffect or parent app
        
        const docSnap = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (docSnap.exists()) {
          const up = docSnap.data();

          if (['waiter', 'cashier', 'kitchen', 'barman'].includes(up.role)) {
            localStorage.setItem('device_staff_role', up.role);
          }

          if (up.role === 'admin' || up.isAdmin) navigate('/admin', { replace: true });
          else if (up.role === 'waiter' || up.isWaiter) navigate('/waiter/dashboard', { replace: true });
          else if (up.role === 'cashier' || up.isCashier) navigate('/cashier/dashboard', { replace: true });
          else if (up.role === 'kitchen' || up.isKitchen) navigate('/kitchen/dashboard', { replace: true });
          else if (up.role === 'barman' || up.isBarman) navigate('/barman/dashboard', { replace: true });
          else if (up.role === 'driver' || up.isDriver) navigate('/driver/dashboard', { replace: true });
          else {
            await auth.signOut();
            toast.error('Your account has no staff role assigned. Contact Administrator.');
            navigate('/login');
          }
        }
      } catch (authError: any) {
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
          // Attempt to create the user IF password meets criteria
          const pwdError = validateStrongPassword(password);
          if (pwdError) {
             toast.error(`Invalid credentials. If new account: ${pwdError}`);
             setLoading(false);
             return;
          }

          const result = await createUserWithEmailAndPassword(auth, email, password);
          const user = result.user;
          await updateProfile(user, { displayName: cleanUsername });

          const userPath = `users/${user.uid}`;
          try {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              name: cleanUsername,
              email: user.email,
              role: 'pending', // Requires admin approval
              createdAt: serverTimestamp()
            });
            toast.success('Staff account created! Please request an Admin to assign your role.');
            await auth.signOut();
            navigate('/');
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, userPath);
          }
        } else {
          toast.error(handleAuthError(authError));
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bento-bg relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-stone-900 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-6 shadow-amber-500/10 border border-stone-800">
            <Lock className="text-amber-400" size={32} />
          </div>
          <h1 className="text-3xl font-black text-amber-50 uppercase tracking-tighter italic">Secure System</h1>
          <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-2">{brand.name} Staff Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-stone-900/50 p-6 rounded-[2.5rem] border border-stone-800 backdrop-blur-md shadow-2xl space-y-4">
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 ml-1">Username / ID</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-950/50 border border-stone-800 text-amber-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 ring-amber-500/50 outline-none transition-all placeholder:text-stone-600"
                  placeholder="staff_id"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2 ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-950/50 border border-stone-800 text-amber-50 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold focus:ring-2 ring-amber-500/50 outline-none transition-all placeholder:text-stone-600"
                  placeholder="••••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                <>Authorize Access <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
            <button 
              onClick={() => navigate('/')} 
              className="mt-6 text-[10px] font-black tracking-widest uppercase text-stone-500 hover:text-stone-300 transition-colors"
            >
              Return to Public Site
            </button>
        </div>
      </motion.div>
    </div>
  );
}
