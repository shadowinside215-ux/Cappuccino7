import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, writeBatch, addDoc, where } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database, Gift, Mail, ChevronRight, Award, ShieldCheck, LogOut, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0
  });
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

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

  const registerAdmin = async () => {
    if (!auth.currentUser) {
      toast.error('You must be signed in to register as admin');
      return;
    }
    setIsRegisteringAdmin(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        registeredAt: new Date().toISOString(),
        role: 'super_admin'
      });
      toast.success('Admin permissions registered successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to register admin permissions. You might not have the required email.');
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
      
      const today = new Date().toISOString().split('T')[0];
      const todayTotal = docs.reduce((acc, o) => {
        const orderDate = o.createdAt?.toDate().toISOString().split('T')[0];
        return orderDate === today ? acc + o.total : acc;
      }, 0);

      setStats(prev => ({ ...prev, activeOrders: activeCount, todayRevenue: todayTotal }));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const prodsSnap = await getDocs(collection(db, 'products'));
        const catsSnap = await getDocs(collection(db, 'categories'));
        
        const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(usersData);

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
          totalUsers: usersSnap.size,
          totalItems: prodsSnap.size
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple/stats');
      }
    };
    fetchStats();

    return () => unsubOrders();
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
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mb-1 pl-1">{t('admin_overview')}</p>
            <h1 className="text-4xl font-bold text-bento-primary">{t('dashboard')}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={seedNewItems}
            disabled={isSeeding}
            className="bg-bento-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
          >
            <Package size={16} /> {isSeeding ? t('importing') : t('import_menu')}
          </button>
          <button 
            onClick={registerAdmin}
            disabled={isRegisteringAdmin}
            className="bg-bento-accent text-bento-primary px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
          >
            <ShieldCheck size={16} /> {isRegisteringAdmin ? '...' : t('fix_perms')}
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
      <div className="bento-grid">
        <div className="card lg:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6">
            <ShoppingBag size={24} />
          </div>
          <p className="text-4xl font-black text-bento-primary mb-1">{stats.activeOrders}</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('active_orders_label')}</p>
        </div>
        
        <div className="card lg:col-span-1">
          <div className="p-3 bg-green-50 text-green-600 rounded-2xl w-fit mb-6">
            <TrendingUp size={24} />
          </div>
          <p className="text-4xl font-black text-bento-primary mb-1">{stats.todayRevenue.toFixed(0)} MAD</p>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('today_revenue_label')}</p>
        </div>

        <div className="card lg:col-span-2 accent-card !bg-bento-accent !text-bento-primary">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Users size={24} />
            </div>
            <div className="text-right">
              <p className="text-4xl font-black">{stats.totalUsers}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('registered_users')}</p>
            </div>
          </div>
          <p className="text-sm font-medium opacity-80 mt-auto">
            {t('community_growth_msg')}
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
              <div key={user.uid} className="card !p-5 flex flex-col sm:flex-row items-center gap-6 group hover:border-bento-accent/20 transition-all">
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
                      <p className="text-[10px] text-bento-accent font-black uppercase tracking-widest flex items-center gap-1">
                        <Award size={10} /> {user.points} {t('reward_points')}
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
                    onClick={() => toast.success(`Viewing details for ${user.name}...`)}
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
    </div>
  );
}
