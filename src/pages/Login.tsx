import React, { useState } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db, handleAuthError, handleFirestoreError, OperationType } from '../lib/firebase';
import { useBrandSettings } from '../lib/brand';
import { useNavigate } from 'react-router-dom';
import { Coffee, Mail, Lock, User, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import OptimizedImage from '../components/ui/OptimizedImage';

type AuthMode = 'initial' | 'email-login' | 'email-signup';

export default function Login() {
  const { t } = useTranslation();
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
        const userPath = `users/${user.uid}`;
        try {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || 'Guest User',
            email: user.email,
            points: 0,
            coffeeCount: 0,
            itemLoyalty: {},
            isAdmin: false,
            isAnonymous: false,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, userPath);
        }
      }

      toast.success(t('welcome_back_msg', 'Welcome back!'));
      navigate('/');
    } catch (error: any) {
      const message = handleAuthError(error);
      
      if (error.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        const msg = `This domain (${domain}) is not authorized. Please add it to your Firebase Console under Auth > Settings > Authorized Domains.`;
        
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{msg}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(domain);
                toast.success('Domain copied!', { id: 'copy-success' });
              }}
              className="bg-bento-primary text-bento-bg text-[10px] py-1 px-3 rounded-lg font-bold uppercase tracking-widest self-start"
            >
              Copy Domain
            </button>
          </div>
        ), { duration: 10000, id: 'unauthorized-domain-toast' });
        return; 
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
      toast.success(t('browsing_as_guest', 'Browsing as guest'));
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(t('guest_access_failed', 'Guest access failed.'));
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
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;
        
        await updateProfile(user, { displayName: name });
        
        // Create profile
        const userPath = `users/${user.uid}`;
        try {
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
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, userPath);
        }
        
        toast.success('Account created successfully!');
      } else {
        // Standard email login
        // Check if it's a staff username mistakenly entered here
        const staffUsernames = ['admin', 'waiter', 'kitchen', 'barman', 'cashier'];
        if (staffUsernames.includes(email.toLowerCase().trim())) {
          toast.error(`'${email}' is a staff ID. Please use the specific access links at the bottom of the home page.`);
          setLoading(false);
          return;
        }

        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success('Welcome back!');
      }
      navigate('/');
    } catch (error: any) {
      const message = handleAuthError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen group/login relative flex items-center justify-center p-6 bg-bento-bg overflow-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        {brand.loginBgUrl && (
          <OptimizedImage 
            priority
            src={brand.loginBgUrl} 
            containerClassName="w-full h-full"
            className="w-full h-full object-cover" 
            alt="Background"
            referrerPolicy="no-referrer"
            showOverlay={false}
          />
        )}
        <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
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
              <div className="w-40 h-40 bg-bento-card-bg rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-1 border-4 border-bento-card-border group-hover/login:scale-110 transition-transform duration-700">
                <OptimizedImage 
                  src={brand.logoUrl} 
                  alt="Logo" 
                  containerClassName="w-full h-full"
                  className="w-full h-full object-contain rounded-2xl"
                  showOverlay={false}
                />
              </div>
              
              <div className="text-center space-y-4">
                <h1 className="text-3xl sm:text-5xl font-black text-amber-500 tracking-tighter italic drop-shadow-sm uppercase">Cappuccino7</h1>
                <p className="text-white/80 font-medium leading-relaxed max-w-[280px] mx-auto text-sm">
                  {t('premium_shared_moments')} <br />
                  {t('login_rewards_msg')}
                </p>
              </div>

              <div className="w-full space-y-4">
                <button
                  disabled={loading}
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-4 bg-bento-primary text-bento-bg py-5 px-6 rounded-[2rem] shadow-2xl hover:opacity-90 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                  {t('continue_google')}
                </button>

                <button
                  disabled={loading}
                  onClick={() => setMode('email-login')}
                  className="w-full flex items-center justify-center gap-4 bg-bento-card-bg backdrop-blur-xl border border-bento-card-border text-bento-ink py-5 px-6 rounded-[2rem] shadow-xl active:scale-95 transition-all font-black uppercase text-xs tracking-widest hover:bg-bento-card-bg/20"
                >
                  <Mail size={18} />
                  {t('email_login_btn')}
                </button>

                <button
                  disabled={loading}
                  onClick={handleGuestAccess}
                  className="w-full flex items-center justify-center gap-4 bg-transparent text-white/60 border border-white/20 py-5 px-6 rounded-[2rem] hover:bg-white/5 active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
                >
                  {t('continue_guest')}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8 bg-bento-card-bg/20 backdrop-blur-2xl p-8 rounded-[3rem] border border-bento-card-border shadow-2xl"
            >
              <button 
                onClick={() => setMode('initial')}
                className="flex items-center gap-2 text-bento-ink/40 hover:text-bento-ink transition-colors font-black uppercase text-[10px] tracking-widest"
              >
                <ChevronLeft size={16} /> {t('back_btn')}
              </button>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">
                  {mode === 'email-login' ? t('login') : t('join_us')}
                </h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                  {mode === 'email-login' ? t('enter_credentials') : t('create_your_account')}
                </p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-6">
                {mode === 'email-signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">{t('full_name_label')}</label>
                    <div className="relative">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 text-bento-ink/40" size={18} />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-16 pr-6 py-5 bg-bento-ink/5 border border-bento-card-border rounded-[2rem] focus:ring-2 focus:ring-bento-card-border outline-none transition-all text-bento-ink font-bold"
                      />
                    </div>
                  </div>
                )}

                {mode === 'email-signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">{t('phone_number_optional')}</label>
                    <div className="relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-bento-ink/40 font-black text-xs">📞</div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+212 6xx xxxx"
                        className="w-full pl-16 pr-6 py-5 bg-bento-ink/5 border border-bento-card-border rounded-[2rem] focus:ring-2 focus:ring-bento-card-border outline-none transition-all text-bento-ink font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">{t('email_address')}</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-bento-ink/40" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-16 pr-6 py-5 bg-bento-ink/5 border border-bento-card-border rounded-[2rem] focus:ring-2 focus:ring-bento-card-border outline-none transition-all text-bento-ink font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-bento-ink/40 ml-4">{t('password_label')}</label>
                  <div className="relative">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-bento-ink/40" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-16 pr-14 py-5 bg-bento-ink/5 border border-bento-card-border rounded-[2rem] focus:ring-2 focus:ring-bento-card-border outline-none transition-all text-bento-ink font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-bento-ink/20 hover:text-bento-ink/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bento-primary text-bento-bg py-6 px-6 rounded-[2.5rem] shadow-2xl active:scale-95 transition-all font-black uppercase text-sm tracking-widest disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? t('processing') : mode === 'email-login' ? t('sign_in_btn') : t('register_btn')}
                  <ArrowRight size={20} />
                </button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => setMode(mode === 'email-login' ? 'email-signup' : 'email-login')}
                  className="text-bento-ink/40 hover:text-bento-ink text-[10px] font-black uppercase tracking-widest transition-colors"
                >
                  {mode === 'email-login' ? t('new_here_create') : t('already_owner_sign_in')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
