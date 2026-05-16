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
import CashierLogin from './pages/cashier/CashierLogin';
import CashierDashboard from './pages/cashier/CashierDashboard';
import BrandSettings from './pages/admin/BrandSettings';
import StaffManagement from './pages/admin/StaffManagement';
import DriverLogin from './pages/driver/DriverLogin';
import DriverDashboard from './pages/driver/DriverDashboard';
import Settings from './pages/Settings';
import Onboarding from './components/Onboarding';
import OptimizedImage from './components/ui/OptimizedImage';
import ReviewPopup from './components/ReviewPopup';

const AdminGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [isAdminDocument, setIsAdminDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdminMode = sessionStorage.getItem('admin_mode') === 'true';
      const adminEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      const isCreator = auth.currentUser?.email?.toLowerCase() === adminEmail.toLowerCase();
      
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

  if (isAdminDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg">{t('checking_permissions')}</div>;

  if (isAdminDocument || userProfile?.isAdmin) {
    return <>{children}</>;
  }

  return <Navigate to="/admin/login" />;
};

const WaiterGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [isWaiterDocument, setIsWaiterDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkWaiter = async () => {
      if (localStorage.getItem('waiter_session_active') === 'true') {
        setIsWaiterDocument(true);
        return;
      }

      if (userProfile?.isWaiter || userProfile?.isAdmin) {
        setIsWaiterDocument(true);
        return;
      }
      
      if (userProfile?.uid) {
        const waiterDoc = await getDoc(doc(db, 'waiters', userProfile.uid));
        setIsWaiterDocument(waiterDoc.exists());
      } else {
        setIsWaiterDocument(false);
      }
    };
    checkWaiter();
  }, [userProfile]);

  if (isWaiterDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg">{t('checking_permissions')}</div>;

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

  if (isKitchenDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg text-bento-ink">Authenticating Kitchen...</div>;
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

  if (isBarmanDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg text-bento-ink">Authenticating Barman...</div>;
  if (isBarmanDocument || userProfile?.isBarman) return <>{children}</>;
  return <Navigate to="/barman/login" />;
};

const CashierGuard = ({ userProfile, children }: { userProfile: UserProfile | null, children: React.ReactNode }) => {
  const [isCashierDocument, setIsCashierDocument] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkCashier = async () => {
      if (localStorage.getItem('cashier_session_active') === 'true') {
        setIsCashierDocument(true);
        return;
      }
      if (userProfile?.isCashier || userProfile?.isAdmin) {
        setIsCashierDocument(true);
        return;
      }
      if (userProfile?.uid) {
        const cashierDoc = await getDoc(doc(db, 'cashiers', userProfile.uid));
        setIsCashierDocument(cashierDoc.exists());
      } else {
        setIsCashierDocument(false);
      }
    };
    checkCashier();
  }, [userProfile]);

  if (isCashierDocument === null) return <div className="min-h-screen flex items-center justify-center bg-bento-bg text-bento-ink">Authenticating Cashier...</div>;
  if (isCashierDocument || userProfile?.isCashier) return <>{children}</>;
  return <Navigate to="/cashier/login" />;
};

const DriverGuard = ({ children }: { children: React.ReactNode }) => {
  const isDriverAuth = localStorage.getItem('driver_auth') === 'true';
  if (isDriverAuth) return <>{children}</>;
  return <Navigate to="/driver/login" />;
};

function Navbar({ userProfile }: { userProfile: UserProfile | null }) {
  const location = useLocation();
  const { t } = useTranslation();

  const isStaffRoute = location.pathname.startsWith('/waiter') || 
                       location.pathname.startsWith('/kitchen') || 
                       location.pathname.startsWith('/barman') || 
                       location.pathname.startsWith('/cashier') ||
                       location.pathname.startsWith('/admin');
  
  const isLoginPage = location.pathname === '/login' || 
                      location.pathname === '/admin/login' || 
                      location.pathname === '/waiter/login' || 
                      location.pathname === '/kitchen/login' || 
                      location.pathname === '/barman/login' || 
                      location.pathname === '/cashier/login';

  if (isLoginPage || isStaffRoute) return null;

  return (
    <nav className="fixed bottom-6 left-6 right-6 z-[60] lg:hidden">
      <div className="max-w-md mx-auto bg-bento-card-bg/80 backdrop-blur-3xl border border-bento-card-border px-4 py-3 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex justify-around items-center relative">
        <Link to="/" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/' ? 'text-amber-500 scale-110' : 'text-amber-500/40'}`}>
          <Coffee size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('menu')}</span>
          {location.pathname === '/' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-amber-500/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
        <Link to="/cart" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/cart' ? 'text-amber-500 scale-110' : 'text-amber-500/40'}`}>
          <ShoppingCart size={22} strokeWidth={location.pathname === '/cart' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('cart')}</span>
          {location.pathname === '/cart' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-amber-500/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
          )}
        </Link>
        {auth.currentUser && !auth.currentUser.isAnonymous && (
          <Link to="/orders" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/orders' ? 'text-amber-500 scale-110' : 'text-amber-500/40'}`}>
            <ListOrdered size={22} strokeWidth={location.pathname === '/orders' ? 2.5 : 2} />
            <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('orders')}</span>
            {location.pathname === '/orders' && (
              <motion.div layoutId="nav-pill" className="absolute inset-0 bg-amber-500/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
            )}
          </Link>
        )}
        <Link to="/profile" className={`relative z-10 flex flex-col items-center p-2 transition-all duration-300 ${location.pathname === '/profile' ? 'text-amber-500 scale-110' : 'text-amber-500/40'}`}>
          <UserIcon size={22} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
          <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{t('profile')}</span>
          {location.pathname === '/profile' && (
            <motion.div layoutId="nav-pill" className="absolute inset-0 bg-amber-500/10 rounded-2xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
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
  const isCashierInStorage = localStorage.getItem('cashier_session_active') === 'true';
  
  // Logic: Staff view is active IF we are on a staff route OR if the user is explicitly a staff member
  const isStaffRoute = location.pathname.startsWith('/waiter') || 
                       location.pathname.startsWith('/kitchen') || 
                       location.pathname.startsWith('/barman') || 
                       location.pathname.startsWith('/cashier') ||
                       location.pathname.startsWith('/admin');

  const isStaffUser = userProfile?.isWaiter || 
                      userProfile?.isKitchen || 
                      userProfile?.isBarman || 
                      userProfile?.isCashier || 
                      userProfile?.isAdmin ||
                      isWaiterInStorage || 
                      isKitchenInStorage || 
                      isBarmanInStorage ||
                      isCashierInStorage;

  const isLoginPage = location.pathname === '/login' || 
                      location.pathname === '/admin/login' || 
                      location.pathname === '/waiter/login' || 
                      location.pathname === '/kitchen/login' || 
                      location.pathname === '/barman/login' || 
                      location.pathname === '/cashier/login';

  // The "oversized" layout should ONLY be for true staff dashboards or special full-screen pages
  const isStaffView = isStaffRoute && !isLoginPage;

  const isWaiter = userProfile?.isWaiter || isWaiterInStorage;

  useEffect(() => {
    if (!userProfile?.uid || isStaffUser) return;
    
    // Safety: If a normal user logs in, clear any lingering staff storage
    if (userProfile && !userProfile.isWaiter && !userProfile.isKitchen && !userProfile.isBarman && !userProfile.isCashier && !userProfile.isAdmin) {
       localStorage.removeItem('waiter_session_active');
       localStorage.removeItem('kitchen_session_active');
       localStorage.removeItem('barman_session_active');
       localStorage.removeItem('cashier_session_active');
       sessionStorage.removeItem('admin_mode');
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userProfile.uid),
      where('status', '==', 'ready')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs;
      if (docs.length === 0) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || (change.type === 'modified' && change.doc.data().status === 'ready')) {
          toast.success(`🎉 Your order is ready!`, {
            duration: 10000,
            icon: '☕',
            position: 'top-center'
          });
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
          audio.play().catch(e => console.log('Audio blocked', e));
        }
      });
    }, (error) => {
      if (!auth.currentUser?.isAnonymous) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    });

    return () => unsubscribe();
  }, [userProfile?.uid, isStaffUser]);

    const adminEmailFallback = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
  const isCreator = auth.currentUser?.email?.toLowerCase() === adminEmailFallback.toLowerCase();
  const isAdmin = userProfile?.isAdmin || isCreator;

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
    <div className={`min-h-screen bg-bento-bg font-sans text-bento-ink ${!isStaffView ? 'pb-24 sm:pb-0 sm:pt-20' : ''}`}>
      <Toaster position="top-center" />
      
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin text-amber-500">
            <Coffee size={40} />
          </div>
        </div>
      ) : (
        <>
          {userProfile && !isWaiter && (
            <Onboarding 
              userProfile={userProfile} 
              isOpen={!!isIncompleteProfile} 
              onComplete={() => {}} 
            />
          )}
          
          {!isStaffView && !isLoginPage && (
            <header className="fixed top-0 left-0 right-0 z-[60] py-6 px-6">
              <div className="max-w-7xl mx-auto flex justify-between items-center bg-bento-card-bg/40 backdrop-blur-3xl border border-bento-card-border px-6 py-4 rounded-[2rem] shadow-2xl">
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
                  <span className="text-xl sm:text-2xl font-black italic text-amber-500 tracking-tighter uppercase drop-shadow-lg">{t('app_name')}</span>
                </Link>

                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex items-center gap-2 pr-6">
                    <Link to="/" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/' ? 'text-amber-500 font-bold' : 'text-amber-500/40 hover:text-amber-500'}`}>
                      <Coffee size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('menu')}</span>
                      {location.pathname === '/' && (
                        <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-amber-500/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                    </Link>
                    <Link to="/cart" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/cart' ? 'text-amber-500 font-bold' : 'text-amber-500/40 hover:text-amber-500'}`}>
                      <ShoppingCart size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('cart')}</span>
                      {location.pathname === '/cart' && (
                        <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-amber-500/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                    </Link>
                    <Link to="/orders" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/orders' ? 'text-amber-500 font-bold' : 'text-amber-500/40 hover:text-amber-500'}`}>
                      <ListOrdered size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('orders')}</span>
                      {location.pathname === '/orders' && (
                        <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-amber-500/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                    </Link>
                    <Link to="/profile" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group ${location.pathname === '/profile' ? 'text-amber-500 font-bold' : 'text-amber-500/40 hover:text-amber-500'}`}>
                      <UserIcon size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t('profile')}</span>
                      {location.pathname === '/profile' && (
                        <motion.div layoutId="nav-pill-desktop" className="absolute inset-0 bg-amber-500/10 rounded-xl -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${location.pathname.startsWith('/admin') ? 'bg-amber-500 text-stone-900 font-bold' : 'text-amber-500/40 hover:text-amber-500'}`}>
                        <LayoutDashboard size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('admin')}</span>
                      </Link>
                    )}
                  </div>

                  <div className="hidden lg:flex gap-1">
                    {['en', 'fr', 'ar', 'es'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => changeLanguage(lang)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                          i18n.language === lang 
                          ? 'bg-amber-500 text-stone-900 border-amber-500 shadow-sm' 
                          : 'bg-stone-900 text-stone-400 border-white/5 hover:border-amber-500/30'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                    <button 
                      onClick={() => navigate('/settings')}
                      className="ml-2 p-2 bg-stone-900 text-stone-400 border border-white/5 rounded-lg hover:text-white transition-colors"
                    >
                      <SettingsIcon size={16} />
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 text-bento-ink bg-bento-card-bg rounded-xl hover:bg-stone-500/10 transition-colors lg:hidden"
                  >
                    {isMenuOpen ? <X size={24} /> : <MoreVertical size={24} />}
                  </button>
                </div>
              </div>
            </header>
          )}

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="fixed inset-0 z-[70] bg-stone-950 flex flex-col p-8 lg:hidden overflow-y-auto pt-24"
              >
                <div className="flex justify-between items-center mb-12">
                  <Link to="/" className="flex items-center gap-4" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl bg-white flex items-center justify-center">
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
                  <button onClick={() => setIsMenuOpen(false)} className="p-3 bg-stone-900 rounded-2xl text-white">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-2 flex-grow">
                  <Link onClick={() => setIsMenuOpen(false)} to="/" className="flex items-center gap-4 p-5 rounded-2xl bg-bento-primary text-bento-bg font-bold text-lg">
                    <HomeIcon /> <span>{t('menu')}</span>
                  </Link>
                  <Link onClick={() => setIsMenuOpen(false)} to="/cart" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-bento-card-bg text-bento-ink/70 font-bold text-lg">
                    <ShoppingCart /> <span>{t('cart')}</span>
                  </Link>
                  {user && !user.isAnonymous && (
                    <Link onClick={() => setIsMenuOpen(false)} to="/orders" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-bento-card-bg text-bento-ink/70 font-bold text-lg">
                      <ListOrdered /> <span>{t('orders')}</span>
                    </Link>
                  )}
                  <Link onClick={() => setIsMenuOpen(false)} to="/profile" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-bento-card-bg text-bento-ink/70 font-bold text-lg">
                    <UserIcon /> <span>{t('profile')}</span>
                  </Link>
                  <Link onClick={() => setIsMenuOpen(false)} to="/settings" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-bento-card-bg text-bento-ink/70 font-bold text-lg">
                    <SettingsIcon /> <span>{t('settings')}</span>
                  </Link>
                  {isAdmin && (
                    <Link onClick={() => setIsMenuOpen(false)} to="/admin" className="flex items-center gap-4 p-5 rounded-2xl hover:bg-bento-card-bg text-bento-ink/70 font-bold text-lg">
                      <LayoutDashboard /> <span>{t('admin')}</span>
                    </Link>
                  )}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Choose Language</p>
                  <div className="grid grid-cols-2 gap-3">
                {['en', 'fr', 'ar', 'es'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => changeLanguage(lang)}
                    className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center gap-2 border ${
                      i18n.language === lang 
                      ? 'bg-amber-500 text-stone-900 border-amber-500 shadow-lg' 
                      : 'bg-bento-card-bg text-bento-ink/40 border-bento-card-border'
                    }`}
                  >
                    <Languages size={18} />
                    {lang.toUpperCase()}
                  </button>
                ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Navbar userProfile={userProfile} />
          <ReviewPopup />
          <main className={`transition-all duration-500 min-h-screen ${isStaffView || isLoginPage ? 'w-full max-w-none' : 'max-w-2xl lg:max-w-7xl mx-auto px-6 pb-24 pt-24 lg:pt-10'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <Routes location={location}>
                  <Route path="/" element={user ? <Home userProfile={userProfile} /> : <Navigate to="/login" />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cart" element={<Cart userProfile={userProfile} />} />
                  <Route path="/profile" element={user ? <Profile userProfile={userProfile} /> : <Navigate to="/login" />} />
                  <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
                  <Route path="/settings" element={<Settings theme={theme} setTheme={setTheme} userProfile={userProfile} />} />
                  
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminGuard userProfile={userProfile}><AdminDashboard /></AdminGuard>} />
                  <Route path="/admin/staff" element={<AdminGuard userProfile={userProfile}><StaffManagement /></AdminGuard>} />
                  <Route path="/admin/stats" element={<AdminGuard userProfile={userProfile}><AdminStats /></AdminGuard>} />
                  <Route path="/admin/menu" element={<AdminGuard userProfile={userProfile}><AdminMenu /></AdminGuard>} />
                  <Route path="/admin/orders" element={<AdminGuard userProfile={userProfile}><AdminOrders /></AdminGuard>} />
                  <Route path="/admin/brand" element={<AdminGuard userProfile={userProfile}><BrandSettings /></AdminGuard>} />

                  <Route path="/waiter/login" element={<WaiterLogin />} />
                  <Route path="/waiter/dashboard" element={<WaiterGuard userProfile={userProfile}><WaiterDashboard /></WaiterGuard>} />
                  <Route path="/kitchen/login" element={<KitchenLogin />} />
                  <Route path="/kitchen/dashboard" element={<KitchenGuard userProfile={userProfile}><KitchenDashboard /></KitchenGuard>} />
                  <Route path="/barman/login" element={<BarmanLogin />} />
                  <Route path="/barman/dashboard" element={<BarmanGuard userProfile={userProfile}><BarmanDashboard /></BarmanGuard>} />
                  <Route path="/cashier/login" element={<CashierLogin />} />
                  <Route path="/cashier/dashboard" element={<CashierGuard userProfile={userProfile}><CashierDashboard /></CashierGuard>} />
                  <Route path="/driver/login" element={<DriverLogin />} />
                  <Route path="/driver/dashboard" element={<DriverGuard><DriverDashboard /></DriverGuard>} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          {isLoginPage && !isStaffView && (
            <footer className="relative z-[70] max-w-2xl mx-auto px-6 pb-40 sm:pb-24 text-center mt-20">
              <div className="flex justify-center gap-x-6 gap-y-4 flex-wrap py-10 border border-bento-card-border bg-bento-card-bg/20 backdrop-blur-md rounded-[2.5rem] px-8 shadow-2xl">
                {[
                  { to: "/admin/login", label: t('admin_access') },
                  { to: "/waiter/login", label: t('waiter_access') },
                  { to: "/cashier/login", label: t('cashier_access', 'POS Cashier') },
                  { to: "/kitchen/login", label: t('kitchen_access', 'Kitchen') },
                  { to: "/barman/login", label: t('barman_access', 'Barman') },
                  { to: "/driver/login", label: t('driver_access', 'Driver') },
                ].map((link) => (
                  <Link 
                    key={link.to}
                    to={link.to} 
                    className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 hover:text-amber-600 transition-all flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-amber-500 rounded-full transition-colors" />
                    {link.label}
                  </Link>
                ))}
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
      
      // Clear staff markers on logout to prevent layout/UI persistence bugs
      if (!u) {
        localStorage.removeItem('waiter_session_active');
        localStorage.removeItem('kitchen_session_active');
        localStorage.removeItem('barman_session_active');
        localStorage.removeItem('cashier_session_active');
        sessionStorage.removeItem('admin_mode');
      }

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (u) {
        unsubscribeProfile = onSnapshot(doc(db, 'users', u.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          setLoading(false);
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
