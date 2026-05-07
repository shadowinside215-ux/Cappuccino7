import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, ShieldCheck, Lock, User as UserIcon, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com') {
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
      console.error(err);
      toast.error('Identity verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFirebaseAuthed && auth.currentUser === null) {
      toast.error('Please verify your email identity first');
      return;
    }

    setLoading(true);

    // Specific business requirement credentials
    if (username === 'admin' && password === 'admin2000') {
      // Store a temporary session flag for admin mode
      sessionStorage.setItem('admin_mode', 'true');
      toast.success('Admin access granted');
      navigate('/admin');
    } else {
      toast.error('Invalid administrative credentials');
    }
    setLoading(false);
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
        <div className="card !p-12 space-y-10 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3.5rem] border border-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-bento-primary via-amber-400 to-bento-primary" />
          
          <div className="text-center space-y-6">
            <motion.div 
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="w-32 h-32 bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-2 mx-auto border-2 border-stone-50 relative group"
            >
               {brand.logoUrl && (
                 <OptimizedImage 
                   src={brand.logoUrl} 
                   alt="Management Logo" 
                   className="w-full h-full object-contain rounded-[2rem]"
                   showOverlay={false}
                 />
               )}
               <div className="absolute inset-0 bg-bento-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black italic text-bento-primary tracking-tighter uppercase leading-none">Console</h1>
              <p className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px] mt-3">Admin Authority</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isFirebaseAuthed && !auth.currentUser ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                  <p className="text-center text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Identity Check</p>
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-stone-900 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-stone-200 active:scale-95 disabled:opacity-50 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Mail size={18} className="text-amber-400" />}
                    {loading ? 'Verifying...' : 'Sign in to confirm'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleLogin} 
                className="space-y-8"
              >
                <div className="flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100">
                  <div className="bg-green-500 rounded-full p-1">
                    <ShieldCheck size={12} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest truncate">{auth.currentUser?.email}</span>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                    <UserIcon size={12} /> ID
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-bento-primary/20 transition-all outline-none font-bold text-stone-900"
                    placeholder="Admin username"
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
                    className="w-full bg-stone-50 border border-stone-100 rounded-[2rem] py-5 px-8 focus:ring-2 focus:ring-bento-primary/20 transition-all outline-none font-bold text-stone-900"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bento-primary text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-bento-primary/40 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  Enter Console <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-stone-300 text-[10px] font-bold uppercase tracking-[0.3em]">
            Restricted Admin Area
          </p>
        </div>
      </motion.div>
    </div>
  );
}
