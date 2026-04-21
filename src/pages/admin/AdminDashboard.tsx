import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0
  });
  const [isEmpty, setIsEmpty] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Active Orders listener
    const qActive = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qActive, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as Order);
      const activeCount = docs.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
      
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = docs.reduce((acc, o) => {
        const orderDate = o.createdAt?.toDate().toISOString().split('T')[0];
        return orderDate === today ? acc + o.total : acc;
      }, 0);

      setStats(prev => ({ ...prev, activeOrders: activeCount, todayRevenue: todayTotal }));
    });

    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const prodsSnap = await getDocs(collection(db, 'products'));
      const catsSnap = await getDocs(collection(db, 'categories'));
      
      setIsEmpty(catsSnap.empty);
      setStats(prev => ({ 
        ...prev, 
        totalUsers: usersSnap.size,
        totalItems: prodsSnap.size
      }));
    };
    fetchStats();

    return () => unsubOrders();
  }, []);

  const initializeDatabase = async () => {
    try {
      const batch = writeBatch(db);
      
      // Default categories
      const categories = [
        { name: 'Coffee Drinks', order: 1 },
        { name: 'Breakfast Items', order: 2 },
        { name: 'Juices & Soda', order: 3 },
        { name: 'Desserts & Pastries', order: 4 }
      ];

      categories.forEach(cat => {
        const ref = doc(collection(db, 'categories'));
        batch.set(ref, cat);
      });

      // Default settings
      batch.set(doc(db, 'settings', 'global'), {
        pointsRate: 1,
        rewardThreshold: 100
      });

      await batch.commit();
      setIsEmpty(false);
      toast.success('Database initialized with default categories!');
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize database');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 pl-1">Administrative Overview</p>
          <h1 className="text-4xl font-bold text-bento-primary">Dashboard</h1>
        </div>
      </div>

      {isEmpty && (
        <div className="card accent-card overflow-hidden relative">
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl">
                <Database className="text-bento-accent" size={32} />
              </div>
              <div>
                <h4 className="font-bold text-xl">Empty Database Detected</h4>
                <p className="text-bento-bg/70 text-sm">Initialize with default categories and settings to get started.</p>
              </div>
            </div>
            <button 
              onClick={initializeDatabase}
              className="bg-bento-accent text-bento-primary font-bold py-4 px-8 rounded-2xl hover:bg-white transition-all shadow-xl active:scale-[0.98]"
            >
              Run Setup
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>
      )}

      {/* Stats Grid - Bento Style */}
      <div className="bento-grid">
        <div className="card lg:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6">
            <ShoppingBag size={24} />
          </div>
          <p className="text-4xl font-black text-bento-primary mb-1">{stats.activeOrders}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Active Orders</p>
        </div>
        
        <div className="card lg:col-span-1">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-6">
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-black text-bento-primary mb-1">${stats.todayRevenue.toFixed(0)}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Today's Revenue</p>
        </div>

        <div className="card lg:col-span-2 accent-card !bg-bento-accent !text-bento-primary">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Users size={24} />
            </div>
            <div className="text-right">
              <p className="text-4xl font-black">{stats.totalUsers}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Registered Customers</p>
            </div>
          </div>
          <p className="text-sm font-medium opacity-80 mt-auto">
            Growing your community one cup at a time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <button 
          onClick={() => navigate('/admin/orders')}
          className="card accent-card !p-8 group hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-1">Live Orders</h3>
              <p className="text-bento-bg/60 text-sm">Manage incoming coffee requests</p>
            </div>
            <div className="p-4 bg-white/10 rounded-full group-hover:bg-bento-accent group-hover:text-bento-primary transition-all">
              <Package size={32} />
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/menu')}
          className="card !p-8 border-2 border-bento-primary group hover:bg-stone-50 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-1">Menu Designer</h3>
              <p className="text-stone-400 text-sm">Update products and availability</p>
            </div>
            <div className="p-4 bg-stone-100 rounded-full group-hover:bg-bento-primary group-hover:text-white transition-all">
              <SettingsIcon size={32} className="transition-colors" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
