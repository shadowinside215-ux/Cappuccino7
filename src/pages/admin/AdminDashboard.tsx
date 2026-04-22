import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database, Gift, Mail, ChevronRight, Award } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0
  });
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
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
      
      const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);

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

  const addSupplements = async () => {
    if (isSettingUp) return;
    setIsSettingUp(true);
    try {
      const catsSnap = await getDocs(collection(db, 'categories'));
      const categories = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const categoryName = "THE EXTRA'S";
      let targetCat = categories.find(c => c.name.toUpperCase() === categoryName);
      
      const batch = writeBatch(db);
      
      if (!targetCat) {
        const catRef = doc(collection(db, 'categories'));
        targetCat = { id: catRef.id, name: categoryName, order: 9 };
        batch.set(catRef, { name: categoryName, order: 9 });
      }

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

      const productsSnap = await getDocs(collection(db, 'products'));
      const existingProducts = productsSnap.docs.map(doc => doc.data().name);

      let count = 0;
      for (const item of supplementItems) {
        if (existingProducts.includes(item.name)) continue;

        const prodRef = doc(collection(db, 'products'));
        batch.set(prodRef, {
          name: item.name,
          price: item.price,
          description: `Add-on: ${item.name}`,
          categoryId: targetCat.id,
          isAvailable: true,
          image: `https://picsum.photos/seed/${item.name}/400/400`
        });
        count++;
      }

      await batch.commit();
      if (count > 0) {
        toast.success(`Successfully added ${count} items to ${categoryName}!`);
      } else {
        toast.success(`Extras are already up to date!`);
      }
      setStats(prev => ({ ...prev, totalItems: prev.totalItems + count }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to add extras');
    } finally {
      setIsSettingUp(false);
    }
  };

  const addBeverages = async () => {
    if (isSettingUp) return;
    setIsSettingUp(true);
    try {
      const batch = writeBatch(db);
      
      const catsSnap = await getDocs(collection(db, 'categories'));
      const existingCats = catsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      const beverageCategories = [
        { name: '☕ Coffee', order: 10, items: [
          { name: 'Lait chaud', price: 14 },
          { name: 'Espresso', price: 14 },
          { name: 'Café americain', price: 15 },
          { name: 'Lait parfumé', price: 14 },
          { name: 'Café crème', price: 15 },
          { name: 'Nespresso', price: 15 },
          { name: 'Latte Macchiato', price: 16 },
          { name: 'Double Expresso', price: 18 },
          { name: 'Cappuccino Italien', price: 18 },
          { name: 'Chocolat chaud', price: 18 },
          { name: 'Cappuccino viennois', price: 25 },
          { name: 'Café au miel', price: 18 }
        ]},
        { name: '🍵 Thé & infusions', order: 11, items: [
          { name: 'Thé à la menthe', price: 14 },
          { name: 'Lipton', price: 14 },
          { name: 'Verveine', price: 14 },
          { name: 'Infusion thé bio', price: 16 }
        ]},
        { name: '🔥 Special hot drinks', order: 12, items: [
          { name: 'Mocaccino', price: 20 },
          { name: 'Noisette Macchiato', price: 20 },
          { name: 'Caramel Macchiato', price: 22 },
          { name: 'Chocolat viennois', price: 22 },
          { name: 'Chocolat Fondue', price: 28 },
          { name: 'Chocolat Bresilien', price: 30 }
        ]},
        { name: '🧊 Iced latté', order: 13, items: [
          { name: 'Caramel & cream', price: 25 },
          { name: 'Noisette', price: 25 },
          { name: 'Happy moka', price: 25 }
        ]},
        { name: '🍹 Ice Tea', order: 14, items: [
          { name: 'Pêche', price: 30 },
          { name: 'Citron', price: 30 },
          { name: 'Framboise', price: 30 }
        ]},
        { name: '🧃 Jus', order: 15, items: [
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
        ]},
        { name: '🧊 Frappuccinos coffee', order: 16, items: [
          { name: 'Caramel & Cream', price: 35 },
          { name: 'Caramel Beurre salé', price: 35 },
          { name: 'Moka Chocolate', price: 35 },
          { name: 'Noisette', price: 35 },
          { name: 'Amaretto', price: 35 }
        ]}
      ];

      let count = 0;
      const productsSnap = await getDocs(collection(db, 'products'));
      const existingProducts = productsSnap.docs.map(doc => doc.data().name);

      for (const cat of beverageCategories) {
        let catId = existingCats.find(c => c.name === cat.name)?.id;
        
        if (!catId) {
          const catRef = doc(collection(db, 'categories'));
          catId = catRef.id;
          batch.set(catRef, { name: cat.name, order: cat.order });
        }
        
        for (const item of cat.items) {
          if (existingProducts.includes(item.name)) continue;

          const prodRef = doc(collection(db, 'products'));
          batch.set(prodRef, {
            name: item.name,
            price: item.price,
            description: `${cat.name} selection`,
            categoryId: catId,
            isAvailable: true,
            image: `https://picsum.photos/seed/${item.name}/400/400`
          });
          count++;
        }
      }

      await batch.commit();
      if (count > 0) {
        toast.success(`Successfully added ${count} drink items!`);
      } else {
        toast.success(`Menu is already up to date!`);
      }
      setStats(prev => ({ ...prev, totalItems: prev.totalItems + count }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to add beverages');
    } finally {
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
        { name: '🍳 Breakfast', order: 1 },
        { name: '🥗 Brunch', order: 2 },
        { name: '🥤 Drinks & Juices', order: 3 },
        { name: '🍔 Fast Food', order: 4 },
        { name: '🥒 Healthy Meals', order: 5 },
        { name: '🍰 Desserts', order: 6 },
        { name: '🍦 Ice Cream', order: 7 },
        { name: '⭐ Signature Menu', order: 8 },
        { name: "✨ THE EXTRA'S", order: 9 }
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

      // Mapping for specific required data
      const breakfastItems = [
        { name: 'Occidental', price: 38, description: "Deux viennoiseries, Jus d'orange, Balboula, Boisson chaude au choix, Eau minérale", image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800' },
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
        const catRef = doc(collection(db, 'categories'));
        batch.set(catRef, cat);
        
        let items: any[] = [];
        if (cat.name.includes('Breakfast')) items = breakfastItems;
        else if (cat.name.includes('Brunch')) items = brunchItems;
        else if (cat.name.includes('Drinks')) items = drinkItems;
        else if (cat.name.includes('Fast Food')) items = fastFoodItems;
        else if (cat.name.includes('Healthy')) items = healthyItems;
        else if (cat.name.includes('Desserts')) items = dessertItems;
        else if (cat.name.includes('Ice Cream')) items = iceCreamItems;
        else if (cat.name.includes('Signature')) items = [breakfastItems[6]]; // Feature the namesake
        else if (cat.name.includes("EXTRA'S")) items = supplementItems;

        items.forEach(item => {
          const prodRef = doc(collection(db, 'products'));
          batch.set(prodRef, { ...item, categoryId: catRef.id, isAvailable: true });
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
              disabled={isSettingUp}
              className={`bg-bento-accent text-bento-primary font-bold py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-[0.98] ${isSettingUp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white'}`}
            >
              {isSettingUp ? 'Setting up...' : 'Run Setup'}
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        </div>
      )}

      {/* Supplement Quick Add */}
      {!isEmpty && (
        <div className="card !bg-white border-dashed border-2 border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-6 p-8">
          <div>
            <h4 className="font-bold text-lg text-bento-primary">Update "THE EXTRA'S" Category</h4>
            <p className="text-stone-400 text-xs">Instantly add essential supplements and sides to a dedicated section.</p>
          </div>
          <button 
            onClick={addSupplements}
            disabled={isSettingUp}
            className="w-full sm:w-auto bg-stone-50 border border-stone-100 text-bento-primary px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-bento-primary hover:text-white transition-all disabled:opacity-50"
          >
            {isSettingUp ? '...' : 'Add Extras'}
          </button>
        </div>
      )}

      {/* Beverage Quick Add */}
      {!isEmpty && (
        <div className="card !bg-white border-dashed border-2 border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-6 p-8">
          <div>
            <h4 className="font-bold text-lg text-bento-primary">Update Beverages Menu</h4>
            <p className="text-stone-400 text-xs">Instantly add the full selection of Coffee, Tea, Juices, and Frappuccinos.</p>
          </div>
          <button 
            onClick={addBeverages}
            disabled={isSettingUp}
            className="w-full sm:w-auto bg-stone-50 border border-stone-100 text-bento-primary px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-bento-primary hover:text-white transition-all disabled:opacity-50"
          >
            {isSettingUp ? '...' : 'Add Beverages'}
          </button>
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

      {/* User Loyalty Management */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-bento-primary tracking-tight">Customer Communities</h2>
            <div className="px-2 py-0.5 bg-bento-accent/20 rounded-full text-bento-primary text-[10px] font-black uppercase tracking-widest">{users.length} Users</div>
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
                    <h4 className="font-bold text-bento-ink text-lg">{user.name || 'Anonymous User'}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </p>
                      <div className="h-1 w-1 bg-stone-200 rounded-full" />
                      <p className="text-[10px] text-bento-accent font-black uppercase tracking-widest flex items-center gap-1">
                        <Award size={10} /> {user.points} Points
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0">
                  <div className="flex-1 sm:flex-none">
                    <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1 text-right">Loyalty Status</p>
                    <div className="flex items-center gap-2">
                       {readyRewards > 0 ? (
                         <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-2">
                           <Gift size={12} /> {readyRewards} Reward(s) Ready
                         </div>
                       ) : (
                         <div className="bg-stone-50 text-stone-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-stone-100">
                           Collecting Points
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
