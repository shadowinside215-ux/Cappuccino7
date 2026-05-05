import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, getDocs, getDoc, doc, setDoc, writeBatch, addDoc, where, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database, Gift, Mail, ChevronRight, Award, ShieldCheck, LogOut, Palette, Star, X, History, Info, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState<Record<string, number>>({});
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

  const seedNewItems = async () => {
    if (!auth.currentUser) {
      toast.error('You must be signed in to seed items');
      return;
    }
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      const catsSnap = await getDocs(collection(db, 'categories'));
      const existingCats = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const categoryConfigs = [
        { name: '🍔 Burgers', order: 100 },
        { name: '🥪 Sandwiches', order: 110 },
        { name: '🍕 Pizza', order: 120 },
        { name: '🥘 Plats gourmands', order: 130 },
        { name: '🍝 Pâtes', order: 140 }
      ];

      const catMap: Record<string, string> = {};

      for (const config of categoryConfigs) {
        let catId = existingCats.find(c => c.name === config.name)?.id;
        if (!catId) {
          const newCatRef = doc(collection(db, 'categories'));
          batch.set(newCatRef, config);
          catId = newCatRef.id;
        }
        catMap[config.name] = catId;
      }

      const productsSnap = await getDocs(collection(db, 'products'));
      const existingProds = productsSnap.docs.map(doc => doc.data().name);

      const products = [
        // Burgers
        { name: 'Burger Furri', price: 45, categoryId: catMap['🍔 Burgers'], description: 'Viande hachée, Jambon, Fromage, Tomate, Oignon, Laitue, Sauce blanche, Eau minérale included', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Burger Viande hachée', price: 45, categoryId: catMap['🍔 Burgers'], description: 'Viande hachée, Laitue, Fromage, Tomate, Oignon', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Chicken Burger', price: 40, categoryId: catMap['🍔 Burgers'], description: 'Poulet haché, Fromage, Tomate, Oignon, Laitue, Soda ou Eau minérale included', image: 'https://images.unsplash.com/photo-1606755962773-b324e0a13086?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Chicken Kids Burger', price: 35, categoryId: catMap['🍔 Burgers'], description: 'Mini burger: Poulet haché, Fromage, Tomate, Oignon, Laitue', image: 'https://images.unsplash.com/photo-1512152272829-e3139592d56f?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Beef Kids Burger', price: 38, categoryId: catMap['🍔 Burgers'], description: 'Mini burger: Viande hachée, Fromage, Tomate, Laitue', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        
        // Sandwiches
        { name: 'Sandwich Thon (froids)', price: 35, categoryId: catMap['🥪 Sandwiches'], description: 'Oignon, Laitue, Tomate, Fromage, Sauce fraîcheur', image: 'https://images.unsplash.com/photo-1553909489-cd47e0907d3f?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Sandwich Jambon (froids)', price: 35, categoryId: catMap['🥪 Sandwiches'], description: 'Laitue, Tomate, Fromage, Sauce mayonnaise, Moutarde', image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453aa?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Sandwich Viande hachée (chauds)', price: 45, categoryId: catMap['🥪 Sandwiches'], description: 'Viande hachée, Fromage, Tomate, Laitue, Sauce fromage crème', image: 'https://images.unsplash.com/photo-1539252554452-da00ad54da0b?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Sandwich Poulet (chauds)', price: 40, categoryId: catMap['🥪 Sandwiches'], description: 'Poulet, Tomate, Laitue, Oignon, Olives vertes, Sauce pistou', image: 'https://images.unsplash.com/photo-1481068131515-9c3027cb9595?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        
        // Pizza
        { name: 'Margherita', price: 30, categoryId: catMap['🍕 Pizza'], description: 'Sauce tomate, Fromage, Olives noires, Poivrons, Oignon, Mozzarella', image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pizza Thon', price: 35, categoryId: catMap['🍕 Pizza'], description: 'Sauce tomate, Fromage, Thon, Oignon, Olives noires, Poivrons, Mozzarella', image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pizza Poulet', price: 40, categoryId: catMap['🍕 Pizza'], description: 'Sauce tomate, Fromage, Poulet, Oignon, Olives noires, Poivrons, Mozzarella', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pizza Viande hachée', price: 45, categoryId: catMap['🍕 Pizza'], description: 'Sauce tomate, Fromage, Viande hachée, Oignon, Olives noires, Poivrons, Mozzarella', image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pizza Quatre Saisons', price: 50, categoryId: catMap['🍕 Pizza'], description: 'Sauce tomate, Fromage, Poulet, Viande hachée, Charcuterie, Hotdog, Thon, Oignon, Olives noires, Poivrons, Mozzarella', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        
        // Plats gourmands
        { name: 'Émincé de Boeuf', price: 55, categoryId: catMap['🥘 Plats gourmands'], description: 'Boeuf avec sauce du chef et garniture légumes sautée', image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Émincé de Poulet', price: 45, categoryId: catMap['🥘 Plats gourmands'], description: 'Poulet with crème champignons and garniture légumes sautée', image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pasticcio Poulet', price: 37, categoryId: catMap['🥘 Plats gourmands'], description: 'Pasticcio au poulet gratiné', image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Pasticcio Dinde Fumé', price: 32, categoryId: catMap['🥘 Plats gourmands'], description: 'Pasticcio à la dinde fumée gratiné', image: 'https://images.unsplash.com/photo-1544333346-6473919e2776?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        
        // Pâtes
        { name: 'Alfredo', price: 48, categoryId: catMap['🍝 Pâtes'], description: 'Poulet champignon fromage. Choix de Tagliatélle, Spaghetti ou Penné', image: 'https://images.unsplash.com/photo-1645112481338-331408a2a95c?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Napolitaine', price: 48, categoryId: catMap['🍝 Pâtes'], description: 'Sauce pistou. Choix de Tagliatélle, Spaghetti ou Penné', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Bolognaise', price: 42, categoryId: catMap['🍝 Pâtes'], description: 'Sauce bolognaise traditionnelle. Choix de Tagliatélle, Spaghetti ou Penné', image: 'https://images.unsplash.com/photo-1598866539627-9a6983001l5?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Carbonara', price: 52, categoryId: catMap['🍝 Pâtes'], description: 'Sauce carbonara crémeuse. Choix de Tagliatélle, Spaghetti ou Penné', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80', isAvailable: true },
        { name: 'Lasagne Bolognaise', price: 68, categoryId: catMap['🍝 Pâtes'], description: 'Lasagne au four à la bolognaise', image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80', isAvailable: true }
      ];

      let addedCount = 0;
      for (const p of products) {
        if (!existingProds.includes(p.name)) {
          const prodRef = doc(collection(db, 'products'));
          batch.set(prodRef, p);
          addedCount++;
        }
      }
      
      await batch.commit();
      if (addedCount > 0) {
        toast.success(`${addedCount} new menu items added successfully!`);
      } else {
        toast.success('Menu is already up to date!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to seed items. Check console for details.');
    } finally {
      setIsSeeding(false);
    }
  };

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
    // Auto-register super admin and perform requested cleanup
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

          // 2. Perform requested system-wide cleanup (Wipe All)
          // We use sessionStorage to ensure it doesn't run repeatedly in a loop
          if (window.sessionStorage.getItem('ai_cleanup_done') !== 'true') {
            console.log("AI Agent performing requested system-wide cleanup...");
            
            // Delete all orders
            const ordersSnap = await getDocs(collection(db, 'orders'));
            if (ordersSnap.docs.length > 0) {
              const batch = writeBatch(db);
              ordersSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }

            // Reset all user points/loyalty
            const usersSnap = await getDocs(collection(db, 'users'));
            if (usersSnap.docs.length > 0) {
              const batch = writeBatch(db);
              usersSnap.docs.forEach(d => {
                batch.update(d.ref, {
                  points: 0,
                  itemLoyalty: {},
                  coffeeCount: 0,
                  totalSpent: 0
                });
              });
              await batch.commit();
            }

            // Clear all revenue tracking
            const revSnap = await getDocs(collection(db, 'dailyRevenue'));
            if (revSnap.docs.length > 0) {
              const batch = writeBatch(db);
              revSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }

            // Delete all products
            const productsSnap = await getDocs(collection(db, 'products'));
            if (productsSnap.docs.length > 0) {
              const batch = writeBatch(db);
              productsSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }

            // Delete all categories
            const catsSnap = await getDocs(collection(db, 'categories'));
            if (catsSnap.docs.length > 0) {
              const batch = writeBatch(db);
              catsSnap.docs.forEach(d => batch.delete(d.ref));
              await batch.commit();
            }

            window.sessionStorage.setItem('ai_cleanup_done', 'true');
            toast.success("AI Agent: Full system wipe complete (Orders, Users, Stats, Menu). ✋");
          }
        } catch (err) {
          console.error("Admin initialization/cleanup failed:", err);
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

    // Active Orders listener
    const qActive = query(collection(db, 'orders'));
    const unsubOrders = onSnapshot(qActive, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as Order);
      const activeCount = docs.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
      setStats(prev => ({ ...prev, activeOrders: activeCount }));
    }, (error) => {
      if (auth.currentUser) {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    });

    // Weekly Revenue Listener
    const qRev = query(collection(db, 'dailyRevenue'), orderBy('lastUpdated', 'desc'));
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      const revData: Record<string, number> = {};
      let todayRev = 0;
      const today = new Date().toISOString().split('T')[0];
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        revData[d.id] = data.amount || 0;
        if (d.id === today) todayRev = data.amount || 0;
      });
      
      setWeeklyRevenue(revData);
      setStats(prev => ({ ...prev, todayRevenue: todayRev }));
    });

    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const prodsSnap = await getDocs(collection(db, 'products'));
        const catsSnap = await getDocs(collection(db, 'categories'));
        
        const allUsers = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        const clientsOnly = allUsers.filter(u => !u.isAdmin && !u.isWaiter && !u.isDriver);
        setUsers(clientsOnly);

        // Robust auto-seed check: Check if category exists AND has items
        const hasDesserts = catsSnap.docs.some(d => d.id === 'crepes-desserts');
        const dessProdSnap = await getDocs(query(collection(db, 'products'), where('categoryId', '==', 'crepes-desserts')));
        const hasDessertsItems = dessProdSnap.size > 0;
        
        if ((!hasDesserts || !hasDessertsItems) && !isSettingUp) {
          console.log("Auto-seeding Desserts menu items...");
          seedDessertsMenu();
        }

        // Quick FIX: Unhide any hidden desserts
        if (hasDessertsItems) {
          const hiddenDesserts = dessProdSnap.docs.filter(d => !d.data().isAvailable);
          if (hiddenDesserts.length > 0) {
            const batch = writeBatch(db);
            hiddenDesserts.forEach(d => batch.update(d.ref, { isAvailable: true }));
            await batch.commit();
            console.log(`Unhid ${hiddenDesserts.length} desserts.`);
          }
        }

        setIsEmpty(catsSnap.empty);
        setStats(prev => ({ 
          ...prev, 
          totalUsers: clientsOnly.length,
          totalItems: prodsSnap.size
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple/stats');
      }
    };
    fetchStats();

    return () => {
      unsubOrders();
      unsubRev();
    };
  }, []);

  const seedDessertsMenu = async () => {
    if (isSettingUp) return;
    setIsSettingUp(true);
    try {
      const batch = writeBatch(db);
      
      // 1. Add Category
      const catId = 'crepes-desserts';
      const catRef = doc(db, 'categories', catId);
      batch.set(catRef, {
        name: 'crepes_desserts',
        order: 2, // Second category, after Breakfast (1)
        id: catId
      });

      // 2. Define Products
      const productsToAdd = [
        // CRÊPES SALÉES
        { name: 'Fromage (Mozzarella et fromage rouge)', price: 42, subSection: 'crepes_salees' },
        { name: 'Dinde fumée (Sauce blanche, dinde fumée, fromage)', price: 48, subSection: 'crepes_salees' },
        { name: 'Poulet Champignon (Sauce champignon, poulet, fromage)', price: 54, subSection: 'crepes_salees' },
        
        // CRÊPES SUCRÉES
        { name: 'Nature', price: 20, subSection: 'crepes_sucrees' },
        { name: 'Confiture', price: 25, subSection: 'crepes_sucrees' },
        { name: 'Nutella', price: 30, subSection: 'crepes_sucrees' },
        { name: 'Nutella et Banane', price: 37, subSection: 'crepes_sucrees' },
        { name: 'Miel & Noix', price: 35, subSection: 'crepes_sucrees' },
        { name: 'Royal (Caramel & fruits secs & crème chantilly)', price: 40, subSection: 'crepes_sucrees' },
        { name: 'Exotique', price: 48, subSection: 'crepes_sucrees' },
        { name: 'Brésilienne', price: 48, subSection: 'crepes_sucrees' },
        { name: 'Brésilienne Nutella Banane, Boule de glace vanille', price: 48, subSection: 'crepes_sucrees' },
        { name: 'Cappuccino7 (Nutella, boule de glace au choix, Oréo, Kitkat, noix)', price: 52, subSection: 'crepes_sucrees' },
        { name: 'Miel et fruit sec', price: 49, subSection: 'crepes_sucrees' },

        // GAUFRES
        { name: 'Caramel', price: 30, subSection: 'gaufres' },
        { name: 'Miel & Noix', price: 30, subSection: 'gaufres' },
        { name: 'Nutella', price: 35, subSection: 'gaufres' },
        { name: 'Miel aux fruits secs', price: 49, subSection: 'gaufres' },

        // PANCAKES
        { name: 'Caramel', price: 30, subSection: 'pancakes' },
        { name: 'Miel & Noix', price: 30, subSection: 'pancakes' },
        { name: 'Nutella', price: 35, subSection: 'pancakes' },
        { name: 'Miel aux fruits secs', price: 49, subSection: 'pancakes' },
      ];

      productsToAdd.forEach((p, idx) => {
        const pId = `dessert-${idx}`;
        const pRef = doc(db, 'products', pId);
        batch.set(pRef, {
          ...p,
          categoryId: catId,
          id: pId,
          image: p.subSection === 'crepes_salees' 
            ? 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=800'
            : p.subSection === 'crepes_sucrees'
            ? 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800'
            : p.subSection === 'gaufres'
            ? 'https://images.unsplash.com/photo-1573532026732-f1e967a57c5f?q=80&w=800'
            : 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800', // pancakes
          description: '',
          isAvailable: true
        });
      });

      await batch.commit();
      toast.success('Desserts Menu Seeded Successfully!');
      setIsSettingUp(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to seed menu');
      setIsSettingUp(false);
    }
  };

  const initializeDatabase = async () => {
    if (isSettingUp) return;
    setIsSettingUp(true);
    try {
      const batch = writeBatch(db);
      
      // Default categories with priorities
      const categories = [
        { name: 'breakfast', order: 1 },
        { name: 'crepes_desserts', order: 2, id: 'crepes-desserts' },
        { name: 'brunch', order: 3 },
        { name: 'drinks', order: 4 },
        { name: 'fast_food', order: 5 },
        { name: 'healthy', order: 6 },
        { name: 'desserts', order: 7 },
        { name: 'ice_cream', order: 8 },
        { name: 'signature', order: 9 },
        { name: 'extras', order: 10 }
      ];

      // Supplements for add-on
      const supplementItems = [
        { name: '🥤 Eau minérale', price: 5 },
        { name: '🍗 Dinde fumée', price: 15 },
        { name: '🍯 Amlou', price: 10 },
        { name: '🍫 Nutella', price: 12 },
        { name: '🍓 Confiture', price: 10 },
        { name: '🧀 Fromage', price: 10 },
        { name: '🧀 Fromage (jaune / cheese slice)', price: 15 },
        { name: '🫒 Huile d’olive', price: 10 }
      ];

      const dessertsItems = [
        // CRÊPES SALÉES
        { name: 'Fromage (Mozzarella et fromage rouge)', price: 42, subSection: 'crepes_salees', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=800' },
        { name: 'Dinde fumée (Sauce blanche, dinde fumée, fromage)', price: 48, subSection: 'crepes_salees', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=800' },
        { name: 'Poulet Champignon (Sauce champignon, poulet, fromage)', price: 54, subSection: 'crepes_salees', image: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?q=80&w=800' },
        
        // CRÊPES SUCRÉES
        { name: 'Nature', price: 20, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Confiture', price: 25, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Nutella', price: 30, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Nutella et Banane', price: 37, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Miel & Noix', price: 35, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Royal (Caramel & fruits secs & crème chantilly)', price: 40, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Exotique', price: 48, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Brésilienne', price: 48, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Brésilienne Nutella Banane, Boule de glace vanille', price: 48, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Cappuccino7 (Nutella, boule de glace au choix, Oréo, Kitkat, noix)', price: 52, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },
        { name: 'Miel et fruit sec', price: 49, subSection: 'crepes_sucrees', image: 'https://images.unsplash.com/photo-1547985444-239619623e1c?q=80&w=800' },

        // GAUFRES
        { name: 'Caramel', price: 30, subSection: 'gaufres', image: 'https://images.unsplash.com/photo-1573532026732-f1e967a57c5f?q=80&w=800' },
        { name: 'Miel & Noix', price: 30, subSection: 'gaufres', image: 'https://images.unsplash.com/photo-1573532026732-f1e967a57c5f?q=80&w=800' },
        { name: 'Nutella', price: 35, subSection: 'gaufres', image: 'https://images.unsplash.com/photo-1573532026732-f1e967a57c5f?q=80&w=800' },
        { name: 'Miel aux fruits secs', price: 49, subSection: 'gaufres', image: 'https://images.unsplash.com/photo-1573532026732-f1e967a57c5f?q=80&w=800' },

        // PANCAKES
        { name: 'Caramel', price: 30, subSection: 'pancakes', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800' },
        { name: 'Miel & Noix', price: 30, subSection: 'pancakes', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800' },
        { name: 'Nutella', price: 35, subSection: 'pancakes', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800' },
        { name: 'Miel aux fruits secs', price: 49, subSection: 'pancakes', image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?q=80&w=800' },
      ];

      // Mapping for specific required data
      const breakfastItems = [
        { name: 'Occidental', price: 38, description: "Deux viennoiseries, Jus d'orange, Balboula, Boisson chaude au choix, Eau minérale", image: '' },
        { name: 'Amazigh', price: 48, description: 'Beghrir, Harcha, Meloui, Betbout, Amlou, Fromage, Miel, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=800' },
        { name: 'Gourmand', price: 45, description: 'Œufs au plat ou brouillés, Panier de pain, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800' },
        { name: 'Ftour Fassi', price: 48, description: 'Œufs au khlii, Huile d\'olive, olives noires, Panier de pain, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=800' },
        { name: 'Ftour Chamali', price: 48, description: 'Œufs brouillés avec charcuterie et fromage blanc, Panier de pain, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1513442542250-854d436a73f2?q=80&w=800' },
        { name: 'Omelette Spéciale', price: 48, description: 'Œufs brouillés, Tomate cerise, oignons, Dinde fumée, Panier de pain, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1494597564530-897f5a210287?q=80&w=800' },
        { name: 'Cappuccino7 Breakfast', price: 68, description: 'Croque Monsieur, Hotdog, Fromage blanc, Salade verte, Crêpes Nutella, Salade de fruits, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800' },
        { name: 'Healthy Breakfast', price: 60, description: 'Toast avocat + œufs, Bol d’avoine (banane, chia, fruits secs), Fruits de saison, yaourt, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1490312278390-ab6414f8d2f5?q=80&w=800' },
        { name: 'Turkie', price: 68, description: 'Œufs au plat ou brouillés, Hash browns, Tomate grillée, Boisson chaude, Jus d\'orange, Balboula, Eau minérale', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800' },
        { name: 'Anglais', price: 85, description: 'Œufs au plat, Fromages, Concombre, tomate, olives, Jambon, beurre, confiture, Pain, Jus d\'orange, Balboula, Boisson chaude au choix, Eau minérale', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800' }
      ];

      const brunchItems = [
        { name: 'Brunch (1 Personne)', price: 87, description: 'Omelette, saucisses, Beghrir, Harcha, Meloui, Miel, Amlou, Fromage, Jus orange, Pancakes Nutella, Boisson chaude...', image: 'https://images.unsplash.com/photo-1544179855-502a50a187fd?q=80&w=800' },
        { name: 'Brunch (2 Personnes)', price: 150, description: 'Double portion: Omelette, saucisses, plateau beldi complet, fromages, charcuterie, jus orange, pancakes, desserts...', image: 'https://images.unsplash.com/photo-1544179855-502a50a187fd?q=80&w=800' }
      ];

      const drinkItems = [
        { name: 'Espresso Prestige', price: 15, description: 'Strong, aromatic artisan espresso roast.', image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=800' },
        { name: 'Signature Cappuccino', price: 25, description: 'Our namesake classic with velvety foam.', image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?q=80&w=800' },
        { name: 'Fresh Orange Juice', price: 20, description: '100% natural, freshly squeezed.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800' }
      ];

      const fastFoodItems = [
        { name: 'Classic Beef Burger', price: 45, description: 'Premium beef, cheddar, fresh lettuce, and house sauce.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800' },
        { name: 'Chicken Club Sandwich', price: 40, description: 'Triple decker with grilled chicken, turkey, and eggs.', image: 'https://images.unsplash.com/photo-1567234665766-4740a7575db0?q=80&w=800' }
      ];

      const healthyItems = [
        { name: 'Avocado Energy Toast', price: 55, description: 'Sourdough, smashed avocado, poached eggs, seeds.', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=800' },
        { name: 'Greek Quinoa Salad', price: 48, description: 'Fresh veggies, feta, olives, and citrus dressing.', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800' }
      ];

      const dessertItems = [
        { name: 'Nutella Pancakes', price: 35, description: 'Stack of 3 fluffy pancakes with chocolate and fruits.', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=800' },
        { name: 'Moroccan Pastry Plate', price: 30, description: 'Assortment of artisan traditional cookies.', image: 'https://images.unsplash.com/photo-1533035353720-f1c6a75cd8ab?q=80&w=800' }
      ];

      const iceCreamItems = [
        { name: 'Artisan Vanilla Bean', price: 25, description: 'Double scoop of premium vanilla with honey drizzle.', image: 'https://images.unsplash.com/photo-1570197788417-0e82375c9391?q=80&w=800' },
        { name: 'Pistachio Delight', price: 30, description: 'Traditional roasted pistachio with chopped nuts.', image: 'https://images.unsplash.com/photo-1505394033323-4241bb21750b?q=80&w=800' }
      ];

      for (const cat of categories) {
        const catRef = doc(db, 'categories', cat.id || `gen-${Math.random()}`);
        if (cat.id) {
          batch.set(catRef, { name: cat.name, order: cat.order, id: cat.id });
        } else {
          batch.set(catRef, cat);
        }
        
        let items: any[] = [];
        if (cat.name === 'breakfast') items = breakfastItems;
        else if (cat.name === 'crepes_desserts') items = dessertsItems;
        else if (cat.name === 'brunch') items = brunchItems;
        else if (cat.name === 'drinks') items = drinkItems;
        else if (cat.name === 'fast_food') items = fastFoodItems;
        else if (cat.name === 'healthy') items = healthyItems;
        else if (cat.name === 'desserts') items = dessertItems;
        else if (cat.name === 'ice_cream') items = iceCreamItems;
        else if (cat.name === 'signature') items = [breakfastItems[6]];
        else if (cat.name === 'extras') items = supplementItems;

        items.forEach(item => {
          const prodRef = doc(collection(db, 'products'));
          batch.set(prodRef, { 
            ...item, 
            categoryId: catRef.id, 
            isAvailable: true,
            id: prodRef.id // Ensure ID is consistent
          });
        });
      }

      // Default settings
      batch.set(doc(db, 'settings', 'global'), {
        pointsRate: 1,
        rewardThreshold: 100
      });

      await batch.commit();
      setIsEmpty(false);
      toast.success('Database initialized with default categories!');
      // Give a tiny delay for Firestore to propogate then redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 800);
    } catch (err) {
      console.error(err);
      toast.error('Failed to initialize database');
    } finally {
      setIsSettingUp(false);
    }
  };

  const isCreator = auth.currentUser?.email?.toLowerCase() === 'dragonballsam86@gmail.com';

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
        <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
          <button 
            onClick={seedNewItems}
            disabled={isSeeding}
            className="flex-1 sm:flex-none bg-stone-900 text-white px-4 md:px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[9px] md:text-[10px] font-black uppercase tracking-widest"
          >
            <Package size={16} /> {isSeeding ? '...' : 'Menu'}
          </button>
          <button 
            onClick={registerAdmin}
            disabled={isRegisteringAdmin}
            className="flex-1 sm:flex-none bg-bento-accent text-bento-primary px-4 md:px-5 py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[9px] md:text-[10px] font-black uppercase tracking-widest"
          >
            <ShieldCheck size={16} /> {isRegisteringAdmin ? '...' : 'Fix'}
          </button>
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
        <div className="card !p-6 lg:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-4">
            <ShoppingBag size={20} />
          </div>
          <p className="text-3xl md:text-4xl font-black text-bento-primary mb-1">{stats.activeOrders}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('active_orders_label')}</p>
        </div>
        
        <div className="card !p-6 lg:col-span-1 relative group overflow-hidden">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-4">
            <TrendingUp size={20} />
          </div>
          <p className="text-3xl md:text-4xl font-black text-bento-primary mb-1">{stats.todayRevenue.toFixed(0)} MAD</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('today_revenue_label')}</p>
          
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
        
        <div className="grid grid-cols-7 gap-1 md:gap-4 h-48 items-end">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const amount = weeklyRevenue[dateStr] || 0;
            const amounts = Object.values(weeklyRevenue) as number[];
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
