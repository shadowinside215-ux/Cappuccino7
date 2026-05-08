import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, query, collection, where } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import './i18n';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
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
import AdminStats from './pages/admin/AdminStats';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import WaiterLogin from './pages/waiter/WaiterLogin';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import KitchenLogin from './pages/staff/KitchenLogin';
import KitchenDashboard from './pages/staff/KitchenDashboard';
import BarmanLogin from './pages/staff/BarmanLogin';
import BarmanDashboard from './pages/staff/BarmanDashboard';
import BrandSettings from './pages/admin/BrandSettings';
import Settings from './pages/Settings';
import Onboarding from './components/Onboarding';
import OptimizedImage from './components/ui/OptimizedImage';
import ReviewPopup from './components/ReviewPopup';

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

const WaiterGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const [isWaiterDocument, setIsWaiterDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkWaiter = async () => {
      // Priority 1: Check localStorage for magic login session
      if (localStorage.getItem('waiter_session_active') === 'true') {
        setIsWaiterDocument(true);
        return;
      }

      // Priority 2: Check profile flags
      if (userProfile?.isWaiter || userProfile?.isAdmin) {
        setIsWaiterDocument(true);
        return;
      }
      
      // Priority 3: Check dedicated waiters collection
      if (userProfile?.uid) {
        const waiterDoc = await getDoc(doc(db, 'waiters', userProfile.uid));
        setIsWaiterDocument(waiterDoc.exists());
      } else {
        setIsWaiterDocument(false);
      }
    };
    checkWaiter();
  }, [userProfile]);

  if (isWaiterDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg">Checking permissions...</div>;

  if (isWaiterDocument || userProfile?.isWaiter) {
    return <>{children}</>;
  }

  return <Navigate to="/waiter/login" />;
};

const KitchenGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const [isKitchenDocument, setIsKitchenDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkKitchen = async () => {
      if (localStorage.getItem('kitchen_session_active') === 'true') {
        setIsKitchenDocument(true);
        return;
      }
      if (userProfile?.isKitchen || userProfile?.isAdmin) {
        setIsKitchenDocument(true);
        return;
      }
      if (userProfile?.uid) {
        const kitchenDoc = await getDoc(doc(db, 'kitchen', userProfile.uid));
        setIsKitchenDocument(kitchenDoc.exists());
      } else {
        setIsKitchenDocument(false);
      }
    };
    checkKitchen();
  }, [userProfile]);

  if (isKitchenDocument === null) return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-white">Authenticating Kitchen...</div>;
  if (isKitchenDocument || userProfile?.isKitchen) return <>{children}</>;
  return <Navigate to="/kitchen/login" />;
};

const BarmanGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const [isBarmanDocument, setIsBarmanDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkBarman = async () => {
      if (localStorage.getItem('barman_session_active') === 'true') {
        setIsBarmanDocument(true);
        return;
      }
      if (userProfile?.isBarman || userProfile?.isAdmin) {
        setIsBarmanDocument(true);
        return;
      }
      if (userProfile?.uid) {
        const barmanDoc = await getDoc(doc(db, 'barman', userProfile.uid));
        setIsBarmanDocument(barmanDoc.exists());
      } else {
        setIsBarmanDocument(false);
      }
    };
    checkBarman();
  }, [userProfile]);

  if (isBarmanDocument === null) return <div className="min-h-screen flex items-center justify-center bg-[#1A0F0A] text-amber-50">Authenticating Barman...</div>;
  if (isBarmanDocument || userProfile?.isBarman) return <>{children}</>;
  return <Navigate to="/barman/login" />;
};

function Navbar({ userProfile }: { userProfile: UserProfile | null }) {
  const location = useLocation();
  const { t } = useTranslation();

  const isWaiter = userProfile?.isWaiter || localStorage.getItem('waiter_session_active') === 'true';

  if (location.pathname === '/login' || isWaiter) return null;

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
  const navigate = useNavigate();
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

  const isWaiterInStorage = localStorage.getItem('waiter_session_active') === 'true';
  const isKitchenInStorage = localStorage.getItem('kitchen_session_active') === 'true';
  const isBarmanInStorage = localStorage.getItem('barman_session_active') === 'true';
  const isStaff = userProfile?.isWaiter || userProfile?.isKitchen || userProfile?.isBarman || isWaiterInStorage || isKitchenInStorage || isBarmanInStorage;
  const isWaiter = userProfile?.isWaiter || isWaiterInStorage;
  const isLoginPage = location.pathname === '/login' || location.pathname === '/admin/login' || location.pathname === '/waiter/login' || location.pathname === '/kitchen/login' || location.pathname === '/barman/login';

  useEffect(() => {
    // If not logged in, or is staff, or profile is still loading, don't listen
    if (!userProfile?.uid || isStaff) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userProfile.uid),
      where('status', '==', 'ready')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // For anonymous users, we check if they just placed an order to avoid unnecessary noise
      const docs = snapshot.docs;
      if (docs.length === 0) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || (change.type === 'modified' && change.doc.data().status === 'ready')) {
          toast.success(`🎉 Your order is ready!`, {
            duration: 10000,
            icon: '☕',
            position: 'top-center'
          });
          
          // Play a notification sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio blocked', e));
        }
      });
    }, (error) => {
      // Be silent for anonymous users unless it's a critical connectivity error
      if (!auth.currentUser?.isAnonymous) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      } else {
        console.warn("Client notification listener suppressed:", error.message);
      }
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';
  const isAdmin = userProfile?.isAdmin || isCreator;

  // If user is a waiter, they should only be able to see the waiter dashboard
  useEffect(() => {
    if (isWaiterInStorage && !location.pathname.startsWith('/waiter') && location.pathname !== '/login') {
      navigate('/waiter/dashboard');
    }
    if (isKitchenInStorage && !location.pathname.startsWith('/kitchen') && location.pathname !== '/login') {
      navigate('/kitchen/dashboard');
    }
    if (isBarmanInStorage && !location.pathname.startsWith('/barman') && location.pathname !== '/login') {
      navigate('/barman/dashboard');
    }
  }, [isWaiterInStorage, isKitchenInStorage, isBarmanInStorage, location.pathname, navigate]);

  const isIncompleteProfile = userProfile && 
     !userProfile.isAnonymous && 
     (!userProfile.name || userProfile.name === 'Guest User' || userProfile.name === '');

  return (
    <div className={`min-h-screen bg-bento-bg ${!isWaiter ? 'pb-24 sm:pb-0 sm:pt-20' : ''}`}>
      <Toaster position="top-center" />
      
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-bento-bg">
          <div className="animate-spin text-bento-primary">
            <Coffee size={40} />
          </div>
        </div>
      ) : (
        <>
          {userProfile && !isWaiter && (
            <Onboarding 
              userProfile={userProfile} 
              isOpen={!!isIncompleteProfile} 
              onComplete={() => {}} // Profile will update via onSnapshot in App.tsx
            />
          )}
          
          {/* Universal Header - Responsive */}
          {!isWaiter && !isLoginPage && (
            <header className="fixed top-0 left-0 right-0 z-[60] py-6 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center bg-stone-950/40 backdrop-blur-3xl border border-white/5 px-6 py-4 rounded-[2rem] shadow-2xl">
            <Link to="/" className="flex items-center gap-4" onClick={() => setIsMenuOpen(false)}>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                <OptimizedImage 
                  priority
                  src={brand.logoUrl} 
                  alt="Logo" 
                  showOverlay={false}
                  containerClassName="w-full h-full flex items-center justify-center"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl sm:text-2xl font-black italic text-white tracking-tighter uppercase drop-shadow-lg">{t('app_name')}</span>
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
                <Link to="/settings" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/settings' ? 'text-white font-bold' : 'text-white/40 hover:text-white'}`}>
                  <SettingsIcon size={18} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t('settings', { defaultValue: 'Settings' })}</span>
                  {location.pathname === '/settings' && (
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
              {userProfile && (
                <div className="hidden lg:flex gap-3">
                  {userProfile.coffeeCount !== undefined && (
                    <div className="bg-amber-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-amber-100">
                      <Coffee size={14} className="text-amber-700" />
                      <span className="text-[10px] font-black text-amber-900 leading-none">{userProfile.coffeeCount}/10</span>
                    </div>
                  )}
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
      )}

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
              <Link to="/" className="flex items-center gap-4" onClick={() => setIsMenuOpen(false)}>
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center p-0">
                  <OptimizedImage 
                    src={brand.logoUrl} 
                    alt="Logo" 
                    showOverlay={false}
                    containerClassName="w-full h-full flex items-center justify-center"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-2xl font-black italic text-white uppercase tracking-tighter">{t('app_name')}</span>
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
                  <p className="text-xl font-black">{t('loyalty_club')}</p>
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
      <ReviewPopup />
      <main className={`max-w-4xl mx-auto px-6 py-10 pt-24 lg:pt-10 ${isStaff || isLoginPage ? '!max-w-none !p-0 !pt-0' : ''}`}>
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
              <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} userProfile={userProfile} />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard userProfile={userProfile}><AdminDashboard /></AdminGuard>} />
              <Route path="/admin/stats" element={<AdminGuard userProfile={userProfile}><AdminStats /></AdminGuard>} />
              <Route path="/admin/menu" element={<AdminGuard userProfile={userProfile}><AdminMenu /></AdminGuard>} />
              <Route path="/admin/orders" element={<AdminGuard userProfile={userProfile}><AdminOrders /></AdminGuard>} />
              <Route path="/admin/brand" element={<AdminGuard userProfile={userProfile}><BrandSettings /></AdminGuard>} />

      {/* Waiter Routes */}
      <Route path="/waiter/login" element={<WaiterLogin />} />
      <Route path="/waiter/dashboard" element={<WaiterGuard userProfile={userProfile}><WaiterDashboard /></WaiterGuard>} />

      {/* Kitchen Routes */}
      <Route path="/kitchen/login" element={<KitchenLogin />} />
      <Route path="/kitchen/dashboard" element={<KitchenGuard userProfile={userProfile}><KitchenDashboard /></KitchenGuard>} />

      {/* Barman Routes */}
      <Route path="/barman/login" element={<BarmanLogin />} />
      <Route path="/barman/dashboard" element={<BarmanGuard userProfile={userProfile}><BarmanDashboard /></BarmanGuard>} />
    </Routes>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Persistent Access Footers */}
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/waiter') && (
        <footer className="max-w-4xl mx-auto px-6 pb-32 sm:pb-12 text-center opacity-30 hover:opacity-100 transition-opacity space-y-4">
          <div className="flex justify-center gap-8 flex-wrap">
            <Link 
              to="/admin/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-bento-primary"
            >
              {t('admin_access')}
            </Link>
            <Link 
              to="/waiter/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-amber-500"
            >
              {t('waiter_access')}
            </Link>
            <Link 
              to="/kitchen/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-blue-500"
            >
              {t('kitchen_access', 'Kitchen')}
            </Link>
            <Link 
              to="/barman/login" 
              className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400 hover:text-orange-500"
            >
              {t('barman_access', 'Barman')}
            </Link>
          </div>
        </footer>
      )}
    </>
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

      if (u) {
        // Use onSnapshot to handle the race condition between Login profile creation and App initialization
        unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          setLoading(false);
          // If profile fetch fails (e.g. no permissions yet during creation), don't show scary error for now
          // unless it's a real user
          if (!u.isAnonymous) {
            handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
          }
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
