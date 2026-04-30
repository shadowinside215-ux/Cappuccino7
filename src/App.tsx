import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import './i18n';
import { auth, db } from './lib/firebase';
import { Coffee, ShoppingCart, User as UserIcon, ListOrdered, LayoutDashboard, Award, Languages, MoreVertical, X, Home as HomeIcon, Settings as SettingsIcon, Utensils, Croissant, Cake, Pizza, Cookie } from 'lucide-react';
import { useBrandSettings } from './lib/brand';
import { UserProfile } from './types';
import { BackgroundIcons } from './components/BackgroundIcons';

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
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0D0B0A] border-t border-white/5 px-4 py-4 z-[50] lg:hidden">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        <Link to="/" className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/' ? 'text-[#D4A373]' : 'text-stone-500 hover:text-stone-300'}`}>
          <Coffee size={28} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t('menu')}</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center gap-1 transition-all relative ${location.pathname === '/cart' ? 'text-[#D4A373]' : 'text-stone-500 hover:text-stone-300'}`}>
          <ShoppingCart size={28} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t('cart')}</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 transition-all ${location.pathname === '/profile' ? 'text-[#D4A373]' : 'text-stone-500 hover:text-stone-300'}`}>
          <UserIcon size={28} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">{t('profile')}</span>
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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bento-bg relative overflow-hidden">
        <div className="absolute top-20 -left-10 text-stone-100 dark:text-white/5 -z-10 rotate-12">
          <Coffee size={240} strokeWidth={0.5} />
        </div>
        <div className="absolute bottom-20 -right-10 text-stone-100 dark:text-white/5 -z-10 -rotate-12">
          <Croissant size={200} strokeWidth={0.5} />
        </div>
        
        <div className="relative group">
          <div className="absolute inset-0 bg-bento-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
          <div className="animate-spin text-bento-primary relative">
            <Coffee size={48} strokeWidth={2.5} />
          </div>
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 animate-pulse">Brewing your experience</p>
      </div>
    );
  }
  
  const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';
  const isAdmin = userProfile?.isAdmin || isCreator;

  return (
    <div className="min-h-screen relative overflow-hidden isolate bg-bento-bg text-bento-ink transition-colors duration-1000">
      <BackgroundIcons />
      <div className="relative z-10 w-full min-h-screen flex flex-col no-scrollbar bg-transparent">
        <Toaster position="top-center" />
      
      {/* Universal Header - Responsive */}
      <header className="fixed top-0 left-0 right-0 bg-bento-card-bg/60 backdrop-blur-xl border-b border-stone-100 dark:border-white/5 z-[60] py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 relative" onClick={() => setIsMenuOpen(false)}>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-100 dark:border-white/5 shadow-sm bg-stone-50 dark:bg-stone-900">
              <img 
                src={brand.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl font-black italic text-bento-primary tracking-tighter uppercase">{t('app_name')}</span>
            <div className="absolute -top-2 -right-6 text-amber-500/20 rotate-12 animate-pulse hidden sm:block">
              <Coffee size={16} />
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-4 border-r border-stone-100 pr-6 mr-2">
              <Link to="/" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname === '/' ? 'bg-stone-50 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                <Coffee size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('menu')}</span>
              </Link>
              <Link to="/cart" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname === '/cart' ? 'bg-stone-50 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                <ShoppingCart size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('cart')}</span>
              </Link>
              <Link to="/orders" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname === '/orders' ? 'bg-stone-50 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                <ListOrdered size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('orders')}</span>
              </Link>
              <Link to="/profile" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname === '/profile' ? 'bg-stone-50 dark:bg-stone-900 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                <UserIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('profile')}</span>
              </Link>
              <Link to="/settings" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname === '/settings' ? 'bg-stone-50 dark:bg-stone-900 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                <SettingsIcon size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('settings', { defaultValue: 'Settings' })}</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${location.pathname.startsWith('/admin') ? 'bg-stone-50 text-bento-primary font-bold' : 'text-stone-400 hover:text-bento-primary'}`}>
                  <LayoutDashboard size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('admin')}</span>
                </Link>
              )}
            </div>


            {/* Points Summary for logged in users */}
            {userProfile && (
              <div className="hidden lg:flex gap-3">
                {userProfile.coffeeCount !== undefined && (
                  <div className="bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
                    <Coffee size={14} className="text-amber-700" />
                    <span className="text-[10px] font-black text-amber-900 dark:text-amber-200 leading-none">{userProfile.coffeeCount}/10</span>
                  </div>
                )}
                <div className="bg-bento-card-bg px-3 py-1.5 rounded-xl flex items-center gap-2 border border-stone-100 dark:border-white/5">
                  <Award size={14} className="text-bento-accent" />
                  <span className="text-[10px] font-black text-bento-primary leading-none">{userProfile.points} {t('reward_points')}</span>
                </div>
              </div>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto no-scrollbar"
          >
            <div className="min-h-screen flex flex-col p-8 pt-24 relative overflow-hidden">
            {/* Menu Decorative Background */}
            <div className="absolute top-40 -left-10 text-stone-100 dark:text-white/5 -z-10 rotate-12 opacity-50">
              <Coffee size={200} strokeWidth={0.5} />
            </div>
            <div className="absolute top-2/3 -right-20 text-stone-100 dark:text-white/5 -z-10 -rotate-12 opacity-50">
              <Pizza size={240} strokeWidth={0.5} />
            </div>
            <div className="absolute bottom-10 left-10 text-stone-100 dark:text-white/5 -z-10 rotate-45 opacity-30">
              <Utensils size={100} strokeWidth={0.5} />
            </div>
            <div className="flex justify-between items-center mb-12 relative">
              <div className="absolute -top-8 -left-8 text-amber-600/10 rotate-12">
                <Cake size={60} />
              </div>
              <div className="absolute top-0 right-10 text-stone-400/5 -rotate-12">
                <Pizza size={40} />
              </div>
              <Link to="/" className="flex items-center gap-3 z-10" onClick={() => setIsMenuOpen(false)}>
                <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border border-stone-100 p-0.5 bg-stone-50 dark:bg-stone-900">
                  <img 
                    src={brand.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <span className="text-xl font-black italic text-bento-primary uppercase tracking-tighter">{t('app_name')}</span>
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

            {/* Mobile Overlay Menu Footer */}
            <div className="mt-8 pt-8 space-y-4">
               {userProfile && (
                 <div className="p-6 bg-bento-primary rounded-[32px] text-white flex items-center justify-between">
                   <div>
                     <p className="text-[9px] font-bold text-white/50 uppercase tracking-[0.2em] mb-1">Your Rewards</p>
                     <p className="text-xl font-black">{userProfile.points} Points</p>
                   </div>
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <Award size={24} className="text-bento-accent" />
                   </div>
                 </div>
               )}
               <div className="bg-bento-primary/5 rounded-[32px] p-8 text-center border border-bento-primary/10">
                  <p className="text-sm font-bold text-bento-primary mb-1 italic">"The Best artisan coffee in town"</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest">Visit us in Salé, Palace Taha</p>
               </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

      <Navbar userProfile={userProfile} />
      <main className={`max-w-4xl mx-auto px-6 py-10 pt-24 lg:pt-10 no-scrollbar relative`}>
        {/* Context-aware floating icons for the main area */}
        <div className="absolute -top-4 -right-4 text-amber-500/10 rotate-12 pointer-events-none hidden lg:block">
          <Coffee size={120} strokeWidth={0.5} />
        </div>
        <div className="absolute -bottom-8 -left-8 text-stone-400/10 -rotate-12 pointer-events-none hidden lg:block">
          <Utensils size={100} strokeWidth={0.5} />
        </div>
        <div className="absolute top-1/2 -right-8 text-stone-300/5 rotate-45 pointer-events-none hidden xl:block">
          <Croissant size={80} strokeWidth={0.5} />
        </div>
        
        <Routes>
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
        </Routes>
      </main>

      {/* Persistent Admin Footer Access */}
      {!location.pathname.startsWith('/admin') && (
        <footer className="max-w-4xl mx-auto px-6 pb-32 sm:pb-12 text-center opacity-30 hover:opacity-100 transition-opacity">
          <Link 
            to="/admin/login" 
            className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-bento-primary"
          >
            {t('admin_access')}
          </Link>
        </footer>
      )}
      </div>
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
