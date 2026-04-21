import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast';
import { auth, db } from './lib/firebase';
import { Coffee, ShoppingCart, User as UserIcon, ListOrdered, LayoutDashboard, Award } from 'lucide-react';
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

function Navbar({ userProfile }: { userProfile: UserProfile | null }) {
  const location = useLocation();
  const isAdmin = userProfile?.isAdmin;

  if (location.pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-bento-card-border px-4 py-3 z-50 sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      <div className="max-w-4xl mx-auto flex justify-around items-center">
        <Link to="/" className={`flex flex-col items-center p-2 transition-colors ${location.pathname === '/' ? 'text-bento-primary' : 'text-stone-400'}`}>
          <Coffee size={22} strokeWidth={location.pathname === '/' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest hidden sm:block">Menu</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center p-2 transition-colors relative ${location.pathname === '/cart' ? 'text-bento-primary' : 'text-stone-400'}`}>
          <ShoppingCart size={22} strokeWidth={location.pathname === '/cart' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest hidden sm:block">Cart</span>
        </Link>
        <Link to="/orders" className={`flex flex-col items-center p-2 transition-colors ${location.pathname === '/orders' ? 'text-bento-primary' : 'text-stone-400'}`}>
          <ListOrdered size={22} strokeWidth={location.pathname === '/orders' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest hidden sm:block">Orders</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center p-2 transition-colors ${location.pathname === '/profile' ? 'text-bento-primary' : 'text-stone-400'}`}>
          <UserIcon size={22} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
          <span className="text-[9px] mt-1 font-bold uppercase tracking-widest hidden sm:block">Profile</span>
        </Link>
        {isAdmin && (
          <Link to="/admin" className={`flex flex-col items-center p-2 transition-colors ${location.pathname.startsWith('/admin') ? 'text-bento-primary' : 'text-stone-400'}`}>
            <LayoutDashboard size={22} strokeWidth={location.pathname.startsWith('/admin') ? 2.5 : 2} />
            <span className="text-[9px] mt-1 font-bold uppercase tracking-widest hidden sm:block">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  );
}

function AppContent({ user, userProfile, loading }: { user: User | null, userProfile: UserProfile | null, loading: boolean }) {
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bento-bg">
        <div className="animate-spin text-bento-primary">
          <Coffee size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bento-bg pb-24 sm:pb-0 sm:pt-20">
      <Toaster position="top-center" />
      {location.pathname !== '/login' && (
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-stone-100 z-40 sm:hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-xl font-black italic text-bento-primary tracking-tighter uppercase">Cappuccino7</span>
            {userProfile?.points !== undefined && (
              <div className="bg-bento-accent/10 border border-bento-accent/20 px-3 py-1 rounded-full flex items-center gap-2">
                <Award size={14} className="text-bento-accent" />
                <span className="text-[10px] font-black text-bento-primary">{userProfile.points} pts</span>
              </div>
            )}
          </div>
        </header>
      )}
      <Navbar userProfile={userProfile} />
      <main className={`max-w-4xl mx-auto px-6 py-10 ${location.pathname !== '/login' ? 'pt-24 sm:pt-10' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={user ? <Profile userProfile={userProfile} /> : <Navigate to="/login" />} />
          <Route path="/orders" element={user ? <Orders /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={userProfile?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/admin/menu" element={userProfile?.isAdmin ? <AdminMenu /> : <Navigate to="/" />} />
          <Route path="/admin/orders" element={userProfile?.isAdmin ? <AdminOrders /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docSnap = await getDoc(doc(db, 'users', u.uid));
        if (docSnap.exists()) {
          setUserProfile(docSnap.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <BrowserRouter>
      <AppContent user={user} userProfile={userProfile} loading={loading} />
    </BrowserRouter>
  );
}
