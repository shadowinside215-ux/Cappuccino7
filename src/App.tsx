import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import './i18n';
import { auth, db } from './lib/firebase';
import { Coffee, ShoppingCart, User as UserIcon, ListOrdered, LayoutDashboard, Award, Languages, MoreVertical, X, Home as HomeIcon, Settings as SettingsIcon } from 'lucide-react';
import { useBrandSettings } from './lib/brand';
import { UserProfile } from './types';

// Pages
import Home from './pages/Home';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import BrandSettings from './pages/admin/BrandSettings';
import Settings from './pages/Settings';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import Onboarding from './components/Onboarding';

const AdminGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const [isAdminDocument, setIsAdminDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminMode = sessionStorage.getItem('admin_mode') === 'true';
      const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';
      
      if (isAdminMode || isCreator) {
        setIsAdminDocument(true);
        return;
      }
      
      if (userProfile?.uid) {
        const adminDoc = await getDoc(doc(db, 'admins', userProfile.uid));
        setIsAdminDocument(adminDoc.exists());
      } else {
        setIsAdminDocument(false);
      }
    };
    checkAdmin();
  }, [userProfile]);

  if (isAdminDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg">Checking permissions...</div>;

  if (isAdminDocument || userProfile?.isAdmin) {
    return <>{children}</>;
  }

  return <Navigate to="/admin/login" />;
};

function Navbar({ userProfile }: { userProfile: UserProfile | null }) {
  const location = useLocation();
  const { t } = useTranslation();

  if (location.pathname === '/login') return null;

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-[60] lg:hidden">
      <div className="max-w-md mx-auto bg-stone-950/80 backdrop-blur-3xl border border-white/10 px-4 py-3 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex justify-around items-center relative">
        <Link to="/" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/' ? 'text-white scale-110' : 'text-white/40'}`}>
          <Coffee size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('menu')}</span>
          {location.pathname === '/' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
        <Link to="/cart" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/cart' ? 'text-white scale-110' : 'text-white/40'}`}>
          <ShoppingCart size={22} strokeWidth={location.pathname === '/cart' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('cart')}</span>
          {location.pathname === '/cart' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
        {auth.currentUser && !auth.currentUser.isAnonymous && (
          <Link to="/orders" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/orders' ? 'text-white scale-110' : 'text-white/40'}`}>
            <ListOrdered size={22} strokeWidth={location.pathname === '/orders' ? 2.5 : 2} />
            <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('orders')}</span>
            {location.pathname === '/orders' && (
              <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </Link>
        )}
        <Link to="/profile" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/profile' ? 'text-white scale-110' : 'text-white/40'}`}>
          <UserIcon size={22} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('profile')}</span>
          {location.pathname === '/profile' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-white/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
      </div>
    </nav>
  );
}

function AppContent({ user, userProfile, loading, theme, setTheme }: { 
  user: User | null, 
  userProfile: UserProfile | null, 
  loading: boolean,
  theme: 'light' | 'dark',
  setTheme: (theme: 'light' | 'dark') => void
}) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings: brand } = useBrandSettings();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    setIsMenuOpen(false);
  };

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bento-bg">
        <div className="animate-spin text-bento-primary">
          <Coffee size={40} />
        </div>
      </div>
    );
  }
  
  const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';
   const isAdmin = userProfile?.isAdmin || isCreator;
 
   const isIncompleteProfile = userProfile && 
     !userProfile.isAnonymous && 
     (!userProfile.name || userProfile.name === 'Guest User' || userProfile.name === '');
 
   return (
     <div className="min-h-screen bg-bento-bg pb-24 sm:pb-0 sm:pt-20">
       <Toaster position="top-center" />
       
       {userProfile && (
         <Onboarding 
           userProfile={userProfile} 
           isOpen={!!isIncompleteProfile} 
           onComplete={() => {}} // Profile will update via onSnapshot in App.tsx
         />
       )}
       
       {/* Universal Header - Responsive */}
      <header className="fixed top-0 left-0 right-0 z-[60] py-6 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-stone-950/40 backdrop-blur-3xl border border-white/5 px-6 py-4 rounded-[2rem] shadow-2xl">
          <Link to="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg bg-white p-0.5">
              <img 
                src={brand.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg font-black italic text-bento-primary tracking-tighter uppercase">{t('app_name')}</span>
          </Link>

          <div className="flex items-center gap-6">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2 pr-6">
              <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}>
                <Coffee size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('menu')}</span>
                {location.pathname === '/' && (
                  <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-white/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </Link>
              <Link to="/cart" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/cart' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}>
                <ShoppingCart size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('cart')}</span>
                {location.pathname === '/cart' && (
                  <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-white/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </Link>
              <Link to="/orders" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/orders' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}>
                <ListOrdered size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('orders')}</span>
                {location.pathname === '/orders' && (
                  <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-white/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </Link>
              <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/profile' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}>
                <UserIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('profile')}</span>
                {location.pathname === '/profile' && (
                  <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-white/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                )}
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${location.pathname.startsWith('/admin') ? 'bg-amber-400 text-stone-900 font-bold' : 'text-white/40 hover:text-white'}`}>
                  <LayoutDashboard size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('admin')}</span>
                </Link>
              )}
            </div>

            {/* Points Summary for logged in users */}
            {userProfile ? (
              <div className="hidden lg:flex gap-3">
                {userProfile.coffeeCount !== undefined && (
                  <div className="bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-amber-100">
                    <Coffee size={14} className="text-amber-700" />
                    <span className="text-[10px] font-black text-amber-900 leading-none">{userProfile.coffeeCount}/10</span>
                  </div>
                )}
                <div className="bg-bento-card-bg px-3 py-1.5 rounded-xl flex items-center gap-2 border border-stone-100 dark:border-white/5">
                  <Award size={14} className="text-bento-accent" />
                  <span className="text-[10px] font-black text-bento-primary leading-none">{userProfile.points} {t('reward_points')}</span>
                </div>
              </div>
            ) : (
              <Link 
                to="/login"
                className="hidden lg:flex items-center gap-2 bg-amber-50 text-amber-900 px-4 py-2 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors"
              >
                <Award size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Login for Rewards</span>
              </Link>
            )}

            {/* Desktop Language Switcher - Compact */}
            <div className="hidden lg:flex gap-1">
              {['en', 'fr', 'ar'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => changeLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                    i18n.language === lang 
                    ? 'bg-bento-primary text-white border-bento-primary shadow-sm' 
                    : 'bg-bento-card-bg text-stone-400 border-stone-100 dark:border-white/5 hover:border-bento-primary/30'
                  }`}
                >
                  {lang === 'ar' ? 'عربي' : lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Mobile Menu Toggle (3 Dots) */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-bento-primary bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors lg:hidden"
            >
              {isMenuOpen ? <X size={24} /> : <MoreVertical size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed inset-0 z-[70] bg-bento-bg flex flex-col p-8 lg:hidden overflow-y-auto pt-24"
          >
            <div className="flex justify-between items-center mb-12">
              <Link to="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border border-stone-100 p-0.5 bg-white">
                  <img 
                    src={brand.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <span className="text-lg font-black italic text-bento-primary uppercase tracking-tighter">{t('app_name')}</span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-stone-50 rounded-2xl">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-2 flex-grow">
              <Link onClick={() => setIsMenuOpen(false)} to="/" className="flex items-center gap-4 p-5 rounded-2xl bg-stone-50 dark:bg-stone-900 text-bento-primary font-bold text-lg">
                <HomeIcon /> <span>{t('menu')}</span>
              </Link>
              <Link onClick={() => setIsMenuOpen(false)} to="/cart" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-900 text-bento-primary font-bold text-lg">
                <ShoppingCart /> <span>{t('cart')}</span>
              </Link>
              {user && !user.isAnonymous && (
                <Link onClick={() => setIsMenuOpen(false)} to="/orders" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-900 text-bento-primary font-bold text-lg">
                  <ListOrdered /> <span>{t('orders')}</span>
                </Link>
              )}
              <Link onClick={() => setIsMenuOpen(false)} to="/profile" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-900 text-bento-primary font-bold text-lg">
                <UserIcon /> <span>{t('profile')}</span>
              </Link>
              <Link onClick={() => setIsMenuOpen(false)} to="/settings" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-900 text-bento-primary font-bold text-lg">
                <SettingsIcon /> <span>{t('settings', { defaultValue: 'Settings' })}</span>
              </Link>
              {isAdmin && (
                <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-900 text-bento-primary font-bold text-lg">
                  <LayoutDashboard /> <span>{t('admin')}</span>
                </Link>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-stone-100">
              <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-4">Choose Language</p>
              <div className="grid grid-cols-3 gap-3">
                {['en', 'fr', 'ar'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center gap-2 border ${
                      i18n.language === lang 
                      ? 'bg-bento-primary text-white border-bento-primary shadow-lg' 
                      : 'bg-stone-50 text-stone-400 border-stone-100'
                    }`}
                  >
                    <Languages size={18} />
                    {lang === 'ar' ? 'عربي' : lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {userProfile && (
              <div className="mt-8 p-6 bg-bento-primary rounded-[32px] text-white flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Your Rewards</p>
                  <p className="text-xl font-black">{userProfile.points} Points</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Award size={24} className="text-bento-accent" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar userProfile={userProfile} />
      <main className={`max-w-4xl mx-auto px-6 py-10 pt-24 lg:pt-10`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 30,
              opacity: { duration: 0.2 }
            }}
          >
            <Routes location={location}>
              <Route path="/" element={user ? <Home userProfile={userProfile} /> : <Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/cart" element={<Cart userProfile={userProfile} />} />
              <Route path="/profile" element={user ? <Profile userProfile={userProfile} /> : <Navigate to="/login" />} />
              <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
              <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard userProfile={userProfile}><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/menu" element={<AdminGuard userProfile={userProfile}><AdminMenu /></AdminGuard>} />
              <Route path="/admin/orders" element={<AdminGuard userProfile={userProfile}><AdminOrders /></AdminGuard>} />
              <Route path="/admin/brand" element={<AdminGuard userProfile={userProfile}><BrandSettings /></AdminGuard>} />

              {/* Driver Routes */}
              <Route path="/driver/login" element={<DriverLogin />} />
              <Route path="/driver/dashboard" element={<DriverDashboard />} />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Access Footers */}
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/driver') && (
        <footer className="max-w-4xl mx-auto px-6 pb-32 sm:pb-12 text-center opacity-30 hover:opacity-100 transition-opacity space-y-4">
          <div className="flex justify-center gap-8">
            <Link 
              to="/admin/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-bento-primary"
            >
              {t('admin_access')}
            </Link>
            <Link 
              to="/driver/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-amber-500"
            >
              {t('driver_login')}
            </Link>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (u && !u.isAnonymous) {
        // Use onSnapshot to handle the race condition between Login profile creation and App initialization
        unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile sync error:", error);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <BrowserRouter>
      <AppContent user={user} userProfile={userProfile} loading={loading} theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  );
}
