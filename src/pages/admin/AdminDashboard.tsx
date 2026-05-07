import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, getDocs, getDoc, doc, setDoc, writeBatch, addDoc, where, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database, Gift, Mail, ChevronRight, Award, ShieldCheck, LogOut, Palette, Star, X, History, Info, Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0,
    totalOrders: 0
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState<Record<string, { amount: number, orderCount: number }>>({});
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  const fetchProductsForMapping = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const mapping: Record<string, string> = {};
      snap.docs.forEach(doc => {
        mapping[doc.id] = doc.data().name;
      });
      setProductsMap(mapping);
    } catch (err) {
      console.error("Mapping error:", err);
    }
  };

  useEffect(() => {
    fetchProductsForMapping();
  }, []);

  const resetTodayRevenue = async () => {
    if (!confirm('Reset today\'s revenue to 0?')) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      await setDoc(doc(db, 'dailyRevenue', today), { amount: 0, lastUpdated: serverTimestamp() });
      toast.success("Today's revenue reset.");
    } catch (err) {
      toast.error("Failed to reset revenue.");
    }
  };

  const resetWeeklyRevenue = async () => {
    if (!confirm('Clear all revenue data for the week?')) return;
    const toastId = toast.loading('Clearing weekly revenue...');
    try {
      const revSnap = await getDocs(collection(db, 'dailyRevenue'));
      const batch = writeBatch(db);
      revSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      toast.success('Weekly revenue cleared.', { id: toastId });
      setWeeklyRevenue({});
      setStats(prev => ({ ...prev, todayRevenue: 0 }));
    } catch (err) {
      toast.error('Failed to clear revenue.', { id: toastId });
    }
  };

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    toast.loading(`Fetching history for ${user.name}...`, { id: 'details' });
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setUserOrders(orders);
      toast.success('History loaded', { id: 'details' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch history', { id: 'details' });
    }
  };

  useEffect(() => {
    // Auto-register super admin
    const initializeAdmin = async () => {
      if (auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com') {
        try {
          // 1. Auto-register admin record
          const adminRef = doc(db, 'admins', auth.currentUser.uid);
          const adminDoc = await getDoc(adminRef);
          if (!adminDoc.exists()) {
            await setDoc(adminRef, {
              email: auth.currentUser.email,
              registeredAt: new Date().toISOString(),
              role: 'super_admin'
            });
          }
        } catch (err) {
          console.error("Admin initialization failed:", err);
        }
      }
    };
    initializeAdmin();
  }, []);

  const registerAdmin = async () => {
    // Keep the manual button for robustness
    if (!auth.currentUser) return;
    setIsRegisteringAdmin(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        registeredAt: new Date().toISOString(),
        role: 'super_admin'
      });
      toast.success('Admin Document Created in Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'admins');
    } finally {
      setIsRegisteringAdmin(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    // Active Orders count (using optimized query)
    const qActive = query(collection(db, 'orders'), where('status', 'not-in', ['delivered', 'cancelled']));
    const unsubOrders = onSnapshot(qActive, (snapshot) => {
      setStats(prev => ({ ...prev, activeOrders: snapshot.size }));
    }, (error) => {
      // Just log, don't throw for count queries
      console.warn("Active orders count error:", error.message);
    });

    // Weekly Revenue Listener (Limit to last 14 days to keep it light)
    const qRev = query(
      collection(db, 'dailyRevenue'), 
      orderBy('lastUpdated', 'desc')
    );
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      const revData: Record<string, { amount: number, orderCount: number }> = {};
      let todayRev = 0;
      let todayOrders = 0;
      const today = new Date().toISOString().split('T')[0];
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        revData[d.id] = { 
          amount: data.amount || 0, 
          orderCount: data.orderCount || 0 
        };
        if (d.id === today) {
          todayRev = data.amount || 0;
          todayOrders = data.orderCount || 0;
        }
      });
      
      setWeeklyRevenue(revData);
      setStats(prev => ({ ...prev, todayRevenue: todayRev, totalOrders: todayOrders }));
    }, (error) => {
      console.warn("Revenue listener error:", error.message);
    });

    // Total Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      const clientsOnly = allUsers.filter(u => !u.isAdmin && !u.isWaiter && !u.isDriver);
      setUsers(clientsOnly);
      setStats(prev => ({ ...prev, totalUsers: clientsOnly.length }));
    });

    // Total Items Listener
    const unsubItems = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, totalItems: snapshot.size }));
    });

    const fetchStats = async () => {
      try {
        const catsSnap = await getDocs(collection(db, 'categories'));
        setIsEmpty(catsSnap.empty);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple/stats');
      }
    };
    fetchStats();

    return () => {
      unsubOrders();
      unsubRev();
      unsubUsers();
      unsubItems();
    };
  }, []);

  // Use initial setup link when DB is empty
  const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';

  const initializeDatabase = async (force = false) => {
    if (isSettingUp) return;
    
    if (!force) {
      const confirmMessage = "⚠️ RESET DATABASE: This will re-add all default categories and menu items. Your custom items will be deleted, but EXISTING images will be kept. Proceed?";
      if (!window.confirm(confirmMessage)) return;
    }

    setIsSettingUp(true);
    const toastId = toast.loading('Initializing database components...');
    
    try {
      // 1. Define Structure
      const categories = [
        { id: 'breakfast', name: '🥐 PETIT DÉJEUNER (Breakfast)', order: 0 },
        { id: 'petites-faims', name: '🍳 PETITES FAIMS', order: 1 },
        { id: 'coffee', name: '☕ COFFEE / HOT DRINKS (Les boissons)', order: 2 },
        { id: 'tea', name: '🍵 THÉ & INFUSIONS', order: 3 },
        { id: 'special-hot', name: '🔥 SPECIAL HOT DRINKS', order: 4 },
        { id: 'iced-latte', name: '🧊 ICED LATTE', order: 5 },
        { id: 'ice-tea', name: '🧊 ICE TEA', order: 6 },
        { id: 'juices', name: '🥤 JUS (JUICES)', order: 7 },
        { id: 'frappuccino', name: '🧋 FRAPPUCCINOS COFFEE', order: 8 },
        { id: 'milkshakes', name: '🥤 MILKSHAKES', order: 9 },
        { id: 'smoothies', name: '🥤 SMOOTHIES', order: 10 },
        { id: 'mojitos', name: '🍹 MOJITOS', order: 11 },
        { id: 'salads', name: '🥗 SALADS', order: 12 },
        { id: 'burgers', name: '🍔 Burgers', order: 13 },
        { id: 'sandwiches', name: '🥪 Sandwiches', order: 14 },
        { id: 'pizza', name: '🍕 PIZZA', order: 15 },
        { id: 'plats-gourmands', name: '🥘 PLATS GOURMANDS', order: 16 },
        { id: 'pates', name: '🍝 PÂTES', order: 17 },
        { id: 'crepes-desserts', name: '🥞 Crêpes & Desserts', order: 18 },
        { id: 'healthy-food', name: '🥗 HEALTHY FOOD', order: 19 },
        { id: 'extras', name: '➕ EXTRAS', order: 20 }
      ];

      const productsData: Record<string, any[]> = {
        'breakfast': [
          { name: 'Occidental', price: 38 },
          { name: 'Amazigh', price: 45 },
          { name: 'Gourmand', price: 48 },
          { name: 'Ftour Fassi', price: 45 },
          { name: 'Ftour Chamali', price: 58 },
          { name: 'Omelette Spéciale', price: 48 },
          { name: 'Cappuccino7 Breakfast', price: 68 },
          { name: 'Healthy Breakfast', price: 60 },
          { name: 'Turkie', price: 68 },
          { name: 'Anglais', price: 85 },
          { name: 'Brunch (1 personne)', price: 87, s: 'brunch' },
          { name: 'Brunch (2 personnes)', price: 150, s: 'brunch' }
        ],
        'petites-faims': [
          { name: 'Omlette nature', price: 20 },
          { name: 'Omlette Fromage', price: 25 },
          { name: 'Omlette Fromage Champignion', price: 28 },
          { name: 'Beghrir Amlou', price: 30 },
          { name: 'Croque Monsieur', price: 35 },
          { name: 'Croque Madame', price: 35 }
        ],
        'coffee': [
          { name: 'Lait chaude', price: 14 },
          { name: 'Espresso', price: 14 },
          { name: 'Café americain', price: 15 },
          { name: 'Lait parfumé', price: 14 },
          { name: 'Café crème', price: 15 },
          { name: 'Nespresso', price: 15 },
          { name: 'Latté Macchiato', price: 16 },
          { name: 'Double Espresso', price: 18 },
          { name: 'Cappuccino Italien', price: 18 },
          { name: 'Chocolat chaud', price: 18 },
          { name: 'Cappuccino viennois', price: 25 },
          { name: 'Café au miel', price: 18 }
        ],
        'tea': [
          { name: 'Thé à la menthe', price: 14 },
          { name: 'Lipton', price: 14 },
          { name: 'Verveine', price: 14 },
          { name: 'Infusion thé bio', price: 16 }
        ],
        'special-hot': [
          { name: 'Mocaccino', price: 20 },
          { name: 'Noisette Macchiato', price: 20 },
          { name: 'Caramel Macchiato', price: 22 },
          { name: 'Chocolat viennois', price: 22 },
          { name: 'Chocolat Fondue', price: 28 },
          { name: 'Chocolat Bresilien', price: 30 }
        ],
        'iced-latte': [
          { name: 'Caramel & cream', price: 25 },
          { name: 'Noisette', price: 25 },
          { name: 'Happy moka', price: 25 }
        ],
        'ice-tea': [
          { name: 'Pêche', price: 30 },
          { name: 'Citron', price: 30 },
          { name: 'Framboise', price: 30 }
        ],
        'juices': [
          { name: 'Orange', price: 25 },
          { name: 'Citron', price: 25 },
          { name: 'Carotte', price: 25 },
          { name: 'Pomme', price: 25 },
          { name: 'Banane', price: 25 },
          { name: 'Mangue', price: 25 },
          { name: 'Fraise', price: 25 },
          { name: 'Ananas', price: 25 },
          { name: 'Kiwi', price: 25 },
          { name: 'Panaché', price: 35 },
          { name: 'Avocat fruits secs', price: 30 },
          { name: 'Zazaa', price: 48 }
        ],
        'frappuccino': [
          { name: 'Caramel & Cream', price: 35 },
          { name: 'Caramel Beurre salé', price: 35 },
          { name: 'Moka Chocolate', price: 35 },
          { name: 'Noisette', price: 35 },
          { name: 'Amaretto', price: 35 }
        ],
        'milkshakes': [
          { name: 'Caramel Shake', price: 40 },
          { name: 'Orange shake', price: 40 },
          { name: 'Mixed berries (fruits rouges)', price: 40 },
          { name: 'Mango Alphonso', price: 40 },
          { name: 'Chocolat Oreo', price: 40 },
          { name: 'Fruit de la passion', price: 40 },
          { name: 'Fraise', price: 40 }
        ],
        'smoothies': [
          { name: 'Detox Maison', price: 35 },
          { name: 'Berry Explosion', price: 35 },
          { name: 'Mango Madness', price: 35 },
          { name: 'Tropical paradise', price: 35 }
        ],
        'mojitos': [
          { name: 'Classique', price: 25 },
          { name: 'Mango mojito', price: 25 },
          { name: 'Berries mojito', price: 25 },
          { name: 'Passion mojito', price: 25 },
          { name: 'Ananas mojito', price: 25 },
          { name: 'Blue mojito', price: 25 },
          { name: 'Concombre mojito', price: 25 },
          { name: 'Strawberry mojito', price: 25 }
        ],
        'salads': [
          { name: 'Salade Marocaine', price: 35 },
          { name: 'Salade Thon', price: 40 },
          { name: 'Salade Royale', price: 55 },
          { name: 'Salade Niçoise', price: 42 },
          { name: 'Salade du Chef', price: 65 }
        ],
        'burgers': [
          { name: 'Burger Furri', price: 45, d: 'Viande hachée, Jambon, Fromage, Tomate, Oignon, Laitue, Sauce blanche, Eau minérale' },
          { name: 'Burger Viande hachée', price: 45, d: 'Viande hachée, Laitue, Fromage, Tomate, Oignon' },
          { name: 'Chicken Burger', price: 40, d: 'Poulet haché, Fromage, Tomate, Oignon, Laitue, Soda ou Eau minérale' },
          { name: 'Chicken Kids Burger (mini burger)', price: 35, d: 'Poulet haché, Fromage, Tomate, Oignon, Laitue' },
          { name: 'Beef Kids Burger (mini burger)', price: 38, d: 'Viande hachée, Fromage, Tomate, Laitue' }
        ],
        'sandwiches': [
          { name: 'Sandwich Thon (froids)', price: 35, d: 'Oignon, Laitue, Tomate, Fromage, Sauce fraîcheur' },
          { name: 'Sandwich Jambon (froids)', price: 35, d: 'Laitue, Tomate, Fromage, Sauce mayonnaise, Moutarde' },
          { name: 'Sandwich Viande hachée (chauds)', price: 45, d: 'Viande hachée, Fromage, Tomate, Laitue, Sauce fromage crème' },
          { name: 'Sandwich Poulet (chauds)', price: 40, d: 'Poulet, Tomate, Laitue, Oignon, Olives vertes, Sauce pistou' }
        ],
        'pizza': [
          { name: 'Margarita', price: 35 },
          { name: 'Vegeterienne', price: 45 },
          { name: 'Thon', price: 50 },
          { name: 'Quatre Fromages', price: 55 },
          { name: 'Viande Hachée', price: 55 },
          { name: 'Fruit de mer', price: 65 }
        ],
        'plats-gourmands': [
          { name: 'Escaloppe de poulet à la crème', price: 75 },
          { name: 'Emincé de boeuf', price: 85 },
          { name: 'Cordon Bleu', price: 80 }
        ],
        'pates': [
          { name: 'Bolognaise', price: 45 },
          { name: 'Carbonara', price: 50 },
          { name: 'Pesto', price: 45 },
          { name: 'Fruits de mer', price: 60 }
        ],
        'crepes-desserts': [
          { name: 'Nature', price: 20, s: 'crepes_sucrees' },
          { name: 'Confiture', price: 25, s: 'crepes_sucrees' },
          { name: 'Nutella', price: 30, s: 'crepes_sucrees' },
          { name: 'Nutella et Banane', price: 37, s: 'crepes_sucrees' },
          { name: 'Miel & Noix', price: 35, s: 'crepes_sucrees' },
          { name: 'Royal', price: 40, s: 'crepes_sucrees' },
          { name: 'Exotique', price: 48, s: 'crepes_sucrees' },
          { name: 'Brésilienne', price: 48, s: 'crepes_sucrees' },
          { name: 'Cappuccino7 Special', price: 52, s: 'crepes_sucrees' },
          { name: 'Fromage Mozerella', price: 42, s: 'crepes_salees' },
          { name: 'Dinde fumée', price: 48, s: 'crepes_salees' },
          { name: 'Poulet Champignon', price: 54, s: 'crepes_salees' }
        ],
        'healthy-food': [
          { name: 'Salade de Quinoa', price: 45 },
          { name: 'Bowl Poulet Grillé', price: 55 },
          { name: 'Smoothie Vert Détox', price: 35 }
        ],
        'extras': [
          { name: 'Frite', price: 15 },
          { name: 'Fromage', price: 5 },
          { name: 'Oeuf', price: 5 },
          { name: 'Dinde', price: 7 },
          { name: 'Viande hachée', price: 10 },
          { name: 'Poulet', price: 10 },
          { name: 'Champignon', price: 7 }
        ]
      };

      // 2. Clear & Add in sequence
      const batch = writeBatch(db);
      
      for (const cat of categories) {
        const catRef = doc(db, 'categories', cat.id);
        batch.set(catRef, { name: cat.name, order: cat.order, id: cat.id }, { merge: true });
        
        const items = productsData[cat.id] || [];
        items.forEach(item => {
          const safeId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
          const prodRef = doc(db, 'products', `${cat.id}-${safeId}`);
          
          batch.set(prodRef, { 
            name: item.name,
            price: Number(item.price),
            description: item.description || item.d || '',
            subSection: item.s || '',
            categoryId: catRef.id, 
            isAvailable: true,
            id: prodRef.id
          }, { merge: true });
        });
      }

      // 3. Preserve brand settings - only set defaults if they don't exist
      const brandRef = doc(db, 'settings', 'brand');
      const brandSnap = await getDoc(brandRef);
      
      if (!brandSnap.exists()) {
        batch.set(brandRef, {
          logoUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a4f?w=800&q=80',
          heroImageUrl: 'https://images.unsplash.com/photo-1501339819358-ee5f8babc4c1?q=80&w=1600&auto=format&fit=crop',
          loginBgUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop',
          updatedAt: new Date().toISOString()
        });
      } else {
        // If it exists, only update updatedAt to show sync happened
        batch.set(brandRef, { updatedAt: new Date().toISOString() }, { merge: true });
      }

      await batch.commit();
      
      setIsEmpty(false);
      toast.success('Your menu is now LIVE!', { id: toastId });
      
    } catch (err) {
      console.error("Setup error:", err);
      toast.error('Setup failed: ' + (err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
    } finally {
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com') {
      const autoSync = async () => {
        const hasSync = localStorage.getItem('menu_auto_sync_v29');
        if (!hasSync) {
          console.log("AI Studio: Automatically syncing your requested menu items...");
          await initializeDatabase(true);
          localStorage.setItem('menu_auto_sync_v29', 'true');
        }
      };
      autoSync();
    }
  }, [auth.currentUser?.email]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="p-3 bg-stone-100 dark:bg-stone-800 rounded-2xl text-stone-500 hover:text-bento-primary transition-colors"
            title="Exit Admin Console"
          >
            <LogOut size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] pl-1">{t('admin_overview')}</p>
              {isCreator && <span className="bg-amber-400 text-stone-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">Super Admin</span>}
            </div>
            <h1 className="text-4xl font-bold text-bento-primary">{t('dashboard')}</h1>
          </div>
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
                <h4 className="font-bold text-xl">{t('empty_db_title')}</h4>
                <p className="text-bento-bg/70 text-sm">{t('empty_db_desc')}</p>
              </div>
            </div>
            <button 
              onClick={initializeDatabase}
              disabled={isSettingUp}
              className={`bg-bento-accent text-bento-primary font-bold py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-[0.98] ${isSettingUp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}`}
            >
              {isSettingUp ? t('setup_required') : t('run_setup')}
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>
      )}

      {/* Stats Grid - Bento Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card !p-6 lg:col-span-1 border-t-4 border-amber-400">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
            <ShoppingBag size={20} />
          </div>
          <p className="text-3xl md:text-4xl font-black text-stone-900 mb-1">{stats.totalOrders}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Orders Today</p>
        </div>

        <div className="card !p-6 lg:col-span-1 relative group overflow-hidden border-t-4 border-green-400">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl md:text-4xl font-black text-stone-900 mb-1">{stats.todayRevenue.toFixed(0)} MAD</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Today's Revenue (MAD)</p>
          
          <button 
            onClick={resetTodayRevenue}
            className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
            title="Reset Today's Revenue"
          >
            <X size={16} />
          </button>
        </div>

        <div className="card !p-6 lg:col-span-2 accent-card !bg-bento-accent !text-bento-primary">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Users size={20} />
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-black">{stats.totalUsers}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('registered_users')}</p>
            </div>
          </div>
          <p className="text-xs font-medium opacity-80 mt-auto">
            {t('community_growth_msg')}
          </p>
        </div>
      </div>

      {/* Weekly Revenue Chart-like View */}
      <div className="card !p-4 md:!p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-bento-primary uppercase italic tracking-tighter">Weekly Performance</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">Revenue per day of the week</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={resetWeeklyRevenue}
              className="flex-1 sm:flex-none px-3 py-2 bg-red-50 text-red-500 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100"
            >
              Reset Weekly
            </button>
            <button 
              onClick={async () => {
                if (!confirm('Clear ALL historic revenue data?')) return;
                const toastId = toast.loading('Clearing all revenue...');
                try {
                  const revSnap = await getDocs(collection(db, 'dailyRevenue'));
                  const batch = writeBatch(db);
                  revSnap.docs.forEach(d => batch.delete(d.ref));
                  await batch.commit();
                  toast.success('All revenue data cleared.', { id: toastId });
                  setWeeklyRevenue({});
                  setStats(prev => ({ ...prev, todayRevenue: 0 }));
                } catch (err) {
                   toast.error('Failed to clear revenue', { id: toastId });
                }
              }}
              className="flex-1 sm:flex-none px-3 py-2 bg-stone-900 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
            >
              Reset All Rev
            </button>
            <History className="hidden sm:block text-stone-200" size={32} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
           <button 
             onClick={() => navigate('/admin/stats')}
             className="bg-stone-900 text-white p-8 rounded-3xl flex items-center justify-between group hover:bg-stone-800 transition-all shadow-xl"
           >
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Deep Analytics</span>
               <h4 className="text-2xl font-black italic tracking-tighter uppercase mt-1">View All Statistics</h4>
               <p className="text-xs opacity-60 mt-2">Revenue, Orders & Monthly reports</p>
             </div>
             <div className="p-4 bg-white/10 rounded-2xl group-hover:bg-amber-400 group-hover:text-stone-900 transition-all">
               <TrendingUp size={28} />
             </div>
           </button>

           <div className="bg-amber-400 p-8 rounded-3xl flex items-center justify-between text-stone-900">
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Community</span>
               <h4 className="text-2xl font-black italic tracking-tighter uppercase mt-1">Users List</h4>
               <p className="text-xs opacity-60 mt-2">Manage customer profiles</p>
             </div>
             <div className="p-4 bg-stone-900/10 rounded-2xl">
               <Users size={28} />
             </div>
           </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-4 h-48 items-end opacity-40 pointer-events-none blur-[1px]">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const revItem = weeklyRevenue[dateStr] || { amount: 0, orderCount: 0 };
            const amount = revItem.amount;
            const amounts = Object.values(weeklyRevenue).map((v: any) => v.amount);
            const maxAmount = Math.max(...(amounts.length > 0 ? amounts : [0]), 100);
            const heightPercent = Math.min((amount / maxAmount) * 100, 100);
            const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
            
            return (
              <div key={dateStr} className="flex flex-col items-center gap-3 group h-full justify-end">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-stone-900 text-white text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg z-10 whitespace-nowrap">
                    {amount} MAD
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-lg md:rounded-t-xl transition-all ${
                      dateStr === new Date().toISOString().split('T')[0] 
                        ? 'bg-bento-accent shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                        : 'bg-stone-100 group-hover:bg-stone-200'
                    }`}
                  />
                </div>
                <div className="text-center overflow-hidden">
                  <p className="text-[8px] md:text-[9px] font-black text-stone-400 uppercase tracking-tighter truncate">{dayName}</p>
                  <p className="text-[7px] md:text-[8px] font-bold text-stone-300">{date.getDate()}/{date.getMonth() + 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <button 
          onClick={() => navigate('/admin/orders')}
          className="card accent-card !p-8 group hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-1">{t('live_orders')}</h3>
              <p className="text-bento-bg/60 text-sm">{t('live_orders_desc')}</p>
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
              <h3 className="text-2xl font-bold mb-1">{t('menu_designer')}</h3>
              <p className="text-stone-400 text-sm">{t('menu_designer_desc')}</p>
            </div>
            <div className="p-4 bg-stone-100 rounded-full group-hover:bg-bento-primary group-hover:text-white transition-all">
              <SettingsIcon size={32} className="transition-colors" />
            </div>
          </div>
        </button>

        <button 
          onClick={() => navigate('/admin/brand')}
          className="card !p-8 border-2 border-bento-accent group hover:bg-amber-50 hover:scale-[1.02] md:col-span-2"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-1">{t('brand_logo')}</h3>
              <p className="text-stone-400 text-sm">{t('brand_logo_desc')}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-full group-hover:bg-bento-accent group-hover:text-bento-primary transition-all">
              <Palette size={32} className="transition-colors" />
            </div>
          </div>
        </button>
      </div>

      {/* User Loyalty Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-bento-primary tracking-tight">{t('customer_communities')}</h2>
            <div className="px-2 py-0.5 bg-bento-accent/20 rounded-full text-bento-primary text-[10px] font-black uppercase tracking-widest">{t('users_count', { count: users.length })}</div>
          </div>
        </div>

        <div className="space-y-3">
          {users.map(user => {
            const itemLoyalty = user.itemLoyalty || {};
            // Any item with 11 or more points counts as a reward ready to redeem
            const readyRewards = Object.entries(itemLoyalty)
              .filter(([_, count]) => (count as number) >= 11)
              .length;

            return (
              <div key={user.uid} className="card !p-5 !bg-[#FDF8F3] flex flex-col sm:flex-row items-center gap-6 group hover:border-bento-accent/20 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-bento-accent/10 group-hover:text-bento-primary transition-all">
                    {readyRewards > 0 ? <Gift className="text-bento-accent animate-bounce" size={24} /> : <Users size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-bento-ink text-lg">{user.name || (t('guest') === 'guest' ? 'Anonymous User' : t('anonymous_user', 'Anonymous User'))}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </p>
                      <div className="h-1 w-1 bg-stone-200 rounded-full" />
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1 italic">
                        <Star size={10} /> Status: Gold
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex-1 sm:flex-none">
                    <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1 text-right">{t('loyalty_status')}</p>
                    <div className="flex items-center gap-2">
                       {readyRewards > 0 ? (
                         <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                           <Gift size={12} /> {t('reward_ready_count', { count: readyRewards })}
                         </div>
                       ) : (
                         <div className="bg-stone-50 text-stone-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100">
                           {t('collecting_points')}
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => viewUserDetails(user)}
                    className="p-3 bg-stone-50 text-stone-300 hover:bg-bento-primary hover:text-white rounded-2xl transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FDF8F3] w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-bento-accent rounded-2xl flex items-center justify-center text-bento-primary shadow-lg transform -rotate-3">
                    <Users size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 uppercase italic leading-none">{selectedUser.name}</h2>
                    <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Orders</p>
                    <p className="text-3xl font-black text-stone-900 leading-none">{userOrders.length}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-sm font-bold text-stone-900 tracking-tight leading-none pt-1">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Loyalty Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Award size={18} className="text-amber-500" />
                      <h3 className="font-black text-stone-900 uppercase tracking-tight italic">Menu Item Loyalty</h3>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.keys(selectedUser.itemLoyalty || {}).length === 0 ? (
                         <div className="p-8 text-center text-stone-300 text-xs font-bold uppercase italic">No points collected yet</div>
                      ) : (
                        Object.entries(selectedUser.itemLoyalty).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([prodId, count]) => (
                          <div key={prodId} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-amber-200 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-stone-900 uppercase italic">
                                {productsMap[prodId] || `Item ${prodId.slice(-4)}`}
                              </span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">ID: {prodId.slice(-4)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(count as number) >= 11 && <Gift className="text-green-500" size={14} />}
                              <span className="text-sm font-black text-stone-900">{count} {(count as number) > 1 ? 'Points' : 'Point'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <History size={18} className="text-stone-400" />
                      <h3 className="font-black text-stone-900 uppercase tracking-tight italic">Recent History</h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {userOrders.length === 0 ? (
                        <div className="p-8 text-center text-stone-300 text-xs font-bold uppercase italic">No orders found</div>
                      ) : (
                        userOrders.map(order => {
                          const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                          const deliveryTime = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : (order.deliveredAt ? new Date(order.deliveredAt) : null);
                          
                          return (
                            <div key={order.id} className="p-5 rounded-2xl border border-stone-100 bg-[#FDF8F3]/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                   <p className="text-[10px] font-black text-stone-900 uppercase italic">
                                     {orderTime.toLocaleDateString()}
                                   </p>
                                   <div className="flex flex-col gap-1 mt-1.5 font-bold uppercase text-[9px] tracking-wider">
                                     <div className="flex items-center gap-2 text-stone-400">
                                       <Clock size={10} /> Placed: {orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </div>
                                     {deliveryTime && (
                                       <div className="flex items-center gap-2 text-green-500">
                                         <CheckCircle2 size={10} /> Delivered: {deliveryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </div>
                                     )}
                                   </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{order.items.length} Points • {order.total} DH</p>
                                <div className="text-[9px] font-black text-stone-300 uppercase tracking-tighter">ID: {order.id.slice(-6)}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-stone-50 flex justify-end">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
