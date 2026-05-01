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
import { Coffee, Mail, Lock, User, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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
          phone: phone,
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
    <div className="min-h-screen -mx-4 -mt-8 sm:-mx-8 sm:-mt-12 group/login relative flex items-center justify-center p-6">
      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={brand.loginBgUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600'} 
          className="w-full h-full object-cover fixed top-0 left-0" 
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {mode === 'initial' ? (
            <motion.div 
              key="initial"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-10 flex flex-col items-center"
            >
              <div className="w-32 h-32 bg-white rounded-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-1 border-4 border-white/10 group-hover/login:scale-110 transition-transform duration-700">
                <img 
                  src={brand.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              </div>
              
              <div className="text-center space-y-4">
                <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase drop-shadow-2xl">Cappuccino7</h1>
                <p className="text-white/60 font-medium leading-relaxed max-w-[280px] mx-auto text-sm">
                  Premium coffee, shared moments. <br />
                  Login to earn exclusive rewards.
                </p>
              </div>

              <div className="w-full space-y-4">
                <button
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-4 bg-white text-stone-900 py-5 px-6 rounded-[2rem] shadow-2xl hover:bg-stone-50 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>

                <button
                  disabled={loading}
                  onClick={() => setMode('email-login')}
                  className="w-full flex items-center justify-center gap-4 bg-white/10 backdrop-blur-xl border border-white/10 text-white py-5 px-6 rounded-[2rem] shadow-xl active:scale-95 transition-all font-black uppercase text-xs tracking-widest hover:bg-white/20"
                >
                  <Mail size={18} />
                  Login with Email
                </button>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
                    <span className="bg-transparent px-4 text-white/40 font-black">Or</span>
                  </div>
                </div>

                <button
                  disabled={loading}
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-4 bg-transparent text-white/60 border border-white/5 py-5 px-6 rounded-[2rem] hover:bg-white/5 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
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
              className="w-full space-y-8 bg-white/10 backdrop-blur-2xl p-8 rounded-[3rem] border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setMode('initial')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">
                  {mode === 'email-login' ? 'Login' : 'Join Us'}
                </h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  {mode === 'email-login' ? 'Enter credentials' : 'Create your account'}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {mode === 'email-signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                      />
                    </div>
                  </div>
                )}

                {mode === 'email-signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">Phone Number (Optional)</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 font-black text-xs">📞</div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+212 6xx xxxx"
                        className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hello@example.com"
                      className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 ml-4">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-16 pr-14 py-5 bg-white/5 border border-white/10 rounded-[2rem] focus:ring-2 focus:ring-white/20 outline-none transition-all text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-stone-900 py-6 px-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all font-black uppercase text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? 'Processing...' : mode === 'email-login' ? 'Sign In' : 'Register'}
                  <ArrowRight size={20} />
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                  className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {mode === 'email-login' ? "New Here? Create Account" : "Already an owner? Sign In"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
