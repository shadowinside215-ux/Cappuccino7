import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { useBrandSettings } from '../lib/brand';
import { useNavigate } from 'react-router-dom';
import { Coffee, Mail, Lock, User, ArrowRight, ChevronLeft, Utensils, Croissant, Cake, Pizza, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

type AuthMode = 'initial' | 'email-login' | 'email-signup';

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('initial');
  const [loading, setLoading] = useState(false);
  const { settings: brand } = useBrandSettings();
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'Guest User',
          email: user.email,
          points: 0,
          coffeeCount: 0,
          itemLoyalty: {},
          isAdmin: false,
          isAnonymous: false,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      console.error(error);
      let message = 'Google login failed.';
      
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        message = `This domain (${domain}) is not authorized. Please add it to your Firebase Console under Auth > Settings > Authorized Domains.`;
        
        // Custom toast with copy button for easier troubleshooting
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{message}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(domain);
                toast.success('Domain copied!', { id: 'copy-success' });
              }}
              className="bg-bento-primary text-white text-[10px] py-1 px-3 rounded-lg font-bold uppercase tracking-widest self-start"
            >
              Copy Domain
            </button>
          </div>
        ), { duration: 10000, id: 'unauthorized-domain-toast' });
        return; // Already showed custom toast
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Login popup was blocked. Please enable popups and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login window was closed before completion.';
      } else if (error.message) {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast.success('Browsing as guest');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Guest access failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (mode === 'email-signup') {
        if (!name) throw new Error('Please enter your name');
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name,
          email: user.email,
          points: 0,
          coffeeCount: 0,
          itemLoyalty: {},
          isAdmin: false,
          isAnonymous: false,
          createdAt: new Date().toISOString()
        });
        
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (error: any) {
      console.error(error);
      const message = error.code === 'auth/user-not-found' ? 'User not found.' :
                      error.code === 'auth/wrong-password' ? 'Invalid password.' :
                      error.code === 'auth/email-already-in-use' ? 'Email already in use.' :
                      error.message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6 max-w-md mx-auto relative">
      <AnimatePresence mode="wait">
        {mode === 'initial' ? (
          <motion.div 
            key="initial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-8 flex flex-col items-center"
          >
            <div className="w-28 h-28 bg-white rounded-full overflow-hidden shadow-2xl shadow-bento-primary/20 p-1 border-2 border-stone-50 relative group">
              <div className="absolute -top-2 -right-2 text-amber-500 rotate-12 transition-transform group-hover:scale-125 z-10">
                <Coffee size={24} />
              </div>
              <img 
                src={brand.logoUrl} 
                alt="Cappuccino7 Logo" 
                className="w-full h-full object-contain rounded-full"
                onError={(e) => {
                  // Fallback if the URL fails
                  e.currentTarget.src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80";
                }}
              />
            </div>
            
            <div className="text-center space-y-3 relative">
              <div className="absolute -top-6 -right-6 text-amber-500/10 rotate-12">
                <Utensils size={40} />
              </div>
              <h1 className="text-4xl font-black text-stone-900 tracking-tight italic uppercase">Cappuccino7</h1>
              <p className="text-stone-500 font-medium leading-relaxed">
                Premium coffee, shared moments. <br />
                Login to access your favorites.
              </p>
            </div>

            <div className="w-full space-y-3">
              <button
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-4 bg-white border border-stone-100 py-4 px-6 rounded-[24px] shadow-sm hover:shadow-md active:scale-95 transition-all font-black uppercase text-xs tracking-widest text-stone-700"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <button
                disabled={loading}
                onClick={() => setMode('email-login')}
                className="w-full flex items-center justify-center gap-4 bg-stone-900 text-white py-4 px-6 rounded-[24px] shadow-xl shadow-stone-200 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
              >
                <Mail size={18} />
                Login with Email
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                  <span className="bg-bento-bg px-4 text-stone-400 font-black">Or</span>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleGuestAccess}
                className="w-full flex items-center justify-center gap-4 bg-stone-100 text-stone-600 py-4 px-6 rounded-[24px] hover:bg-stone-200 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
              >
                Continue as Guest
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="email"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full space-y-6"
          >
            <button 
              onClick={() => setMode('initial')}
              className="flex items-center gap-2 text-stone-400 hover:text-bento-primary transition-colors font-black uppercase text-[10px] tracking-widest"
            >
              <ChevronLeft size={16} /> Back
            </button>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-stone-900 uppercase italic">
                {mode === 'email-login' ? 'Login' : 'Create Account'}
              </h2>
              <p className="text-stone-400 text-sm font-medium">
                {mode === 'email-login' ? 'Enter your credentials to continue.' : 'Create an account to track your orders.'}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'email-signup' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 ml-2">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      className="w-full pl-12 pr-4 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-bento-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 ml-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-bento-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-stone-400 ml-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-white border border-stone-100 rounded-2xl focus:ring-2 focus:ring-bento-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 flex items-center justify-center gap-3 bg-bento-primary text-white py-5 px-6 rounded-3xl shadow-xl shadow-bento-primary/20 active:scale-95 transition-all font-black uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {loading ? 'Processing...' : mode === 'email-login' ? 'Sign In' : 'Sign Up'}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="text-center pt-4">
              <button
                onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                className="text-stone-400 hover:text-bento-primary text-xs font-black uppercase tracking-widest"
              >
                {mode === 'email-login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
