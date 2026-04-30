import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { Plus, Search, Star, MapPin, Coffee, ChevronLeft, ChevronRight, Utensils, Croissant, Cake, Pizza, Cookie, GlassWater } from 'lucide-react';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

export default function Home({ userProfile }: { userProfile: UserProfile | null }) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isEmpty = !loading && categories.length === 0;

  const starterMenu: Product[] = [
    { id: 'start-1', name: 'Occidental Breakfast', price: 38, description: "Deux viennoiseries, Jus d'orange, Balboula, Boisson chaude au choix, Eau minérale", image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800', categoryId: 'breakfast', isAvailable: true },
    { id: 'start-2', name: 'Amazigh Breakfast', price: 48, description: 'Beghrir, Harcha, Meloui, Betbout, Amlou, Fromage, Miel, Jus d\'orange, Balboula, Boisson chaude...', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?q=80&w=800', categoryId: 'breakfast', isAvailable: true },
    { id: 'start-3', name: 'Brunch (1 Personne)', price: 87, description: 'Omelette, saucisses, Beghrir, Harcha, Meloui, Miel, Amlou, Fromage, Jus orange, Pancakes Nutella, Boisson chaude...', image: 'https://images.unsplash.com/photo-1544179855-502a50a187fd?q=80&w=800', categoryId: 'brunch', isAvailable: true }
  ];

  const starterCategories: Category[] = [
    { id: 'breakfast', name: '🍳 Breakfast', order: 1 },
    { id: 'brunch', name: '🥗 Brunch', order: 2 }
  ];

  const displayCategories = isEmpty ? starterCategories : categories;
  const displayProducts = isEmpty ? starterMenu : products;

  useEffect(() => {
    if (userProfile && (userProfile.coffeeCount || 0) >= 10) {
      toast('☕ Free Coffee Reward Available!', {
        icon: '🎁',
        duration: 5000,
        style: {
          borderRadius: '1.5rem',
          background: '#2D241E',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
    }
  }, [userProfile?.coffeeCount]);

  useEffect(() => {
    const qCat = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data);
      // If we have categories but the loading state is stuck, clear it
      if (data.length > 0) setLoading(false);
    }, (error) => {
      console.error("Home categories listener error:", error);
    });

    const qProd = query(collection(db, 'products'));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      console.error("Home products listener error:", error);
      setLoading(false);
    });

    // Timeout safety: if stuck loading for more than 4 seconds, show whatever we have
    const timer = setTimeout(() => setLoading(false), 4000);

    return () => {
      unsubCat();
      unsubProd();
      clearTimeout(timer);
    };
  }, []);

  const filteredProducts = displayProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && p.isAvailable;
  });

  const addToCart = (product: Product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(`Added ${product.name} to cart`);
    // Dispatch custom event to notify Cart icon (if needed)
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const isAdmin = sessionStorage.getItem('admin_mode') === 'true' || userProfile?.isAdmin;
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getTranslatedCategory = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes('breakfast')) return t('categories.breakfast');
    if (name.includes('brunch')) return t('categories.brunch');
    if (name.includes('drinks')) return t('categories.drinks');
    if (name.includes('fast food')) return t('categories.fast_food');
    if (name.includes('healthy')) return t('categories.healthy');
    if (name.includes('desserts')) return t('categories.desserts');
    if (name.includes('ice cream')) return t('categories.ice_cream');
    if (name.includes('signature')) return t('categories.signature');
    if (name.includes('extra')) return t('categories.extras');
    if (name.includes('coffee')) return t('categories.coffee');
    if (name.includes('tea')) return t('categories.tea');
    if (name.includes('hot drinks')) return t('categories.special_hot');
    if (name.includes('iced latté')) return t('categories.iced_latte');
    if (name.includes('ice tea')) return t('categories.ice_tea');
    if (name.includes('jus')) return t('categories.jus');
    if (name.includes('frappuccino')) return t('categories.frappuccino');
    if (name.includes('salades')) return t('categories.salades');
    return catName;
  };

  if (loading) return <div className="text-center py-20 italic text-stone-400">...</div>;

  return (
    <div className="space-y-12 relative px-2 sm:px-6 max-w-7xl mx-auto">
      {/* Admin Setup Warning */}
      {isEmpty && isAdmin && (
        <div className="card !bg-amber-100 !border-amber-200 !p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-amber-900">
            <div className="p-3 bg-bento-card-bg rounded-2xl shadow-sm italic font-black text-xl">!</div>
            <div>
              <p className="font-bold">{t('setup_required')}</p>
              <p className="text-xs opacity-70">The database is currently empty. Initialize the official Cappuccino7 menu.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/admin')}
            className="w-full sm:w-auto bg-amber-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black transition-all"
          >
            {t('dashboard')}
          </button>
        </div>
      )}
      {/* Hero Section */}
      <header className="space-y-8 flex flex-col items-start pt-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl sm:text-9xl font-serif font-black italic text-bento-primary dark:text-bento-accent tracking-tighter uppercase leading-[0.8]">{t('app_name')}</h1>
          <div className="flex items-center gap-2 text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-900 w-fit px-3 py-1.5 rounded-full text-[10px] font-black ring-1 ring-stone-200 dark:ring-white/5 uppercase tracking-widest mt-6">
            <span className="text-bento-accent">★ 4.8</span>
            <span className="opacity-60 text-[9px] font-bold">(2,777 reviews)</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-black flex items-center gap-2">
              <MapPin size={14} className="text-bento-accent" />
              Salé • Palace Taha • Av. Moulay Rachid
            </p>
            <p className="text-stone-400 text-xs italic">Known for friendly staff & artisan breakfast</p>
          </div>

          <div className="flex flex-col gap-4 max-w-[300px] w-full">
            <button 
              onClick={() => {
                const el = document.getElementById('menu-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-[#D4A373] text-white px-8 py-5 rounded-3xl font-black shadow-xl shadow-amber-900/20 flex items-center justify-between gap-3 hover:bg-amber-600 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
            >
              QUICK ORDER <Plus size={20} strokeWidth={4} />
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('menu-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-[#1A120B] border-2 border-[#2D241E] text-[#D4A373] px-8 py-5 rounded-3xl font-black shadow-lg flex items-center justify-between gap-3 hover:bg-black transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em]"
            >
              VIEW MENU <Coffee size={20} strokeWidth={4} />
            </button>
          </div>
        </div>
      </header>

      {/* Trust Elements - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-4 bg-bento-card-bg/60 border-dashed">
          <p className="text-[9px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-2 italic">"Verified Local Favorite"</p>
          <p className="text-xs sm:text-sm font-bold text-bento-primary leading-tight">"Great experience, friendly staff and relaxing atmosphere."</p>
        </div>
        <div className="card !p-4 bg-bento-card-bg/60 border-dashed">
          <p className="text-[9px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-2 italic">"Best Breakfast in Salé"</p>
          <p className="text-xs sm:text-sm font-bold text-bento-primary leading-tight">"The breakfast sets are high quality and coffee is perfect every time."</p>
        </div>
        <div className="card !p-4 bg-bento-card-bg/60 border-dashed">
          <p className="text-[9px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-2 italic">"Community Hub"</p>
          <p className="text-xs sm:text-sm font-bold text-bento-primary leading-tight">"Clean, modern and perfect for watching games with friends."</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative pt-4" id="menu-grid">
        <Search className={`absolute ${i18n.language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
        <input
          type="text"
          placeholder="Explore our menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full bg-bento-card-bg/60 backdrop-blur-lg border border-bento-card-border rounded-2xl py-4 ${i18n.language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600`}
        />
      </div>

      {/* Categories */}
      <div className="relative group/nav">
        {/* Navigation Arrows - Desktop Only */}
        <button 
          onClick={() => scrollCategories('left')}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 bg-bento-card-bg shadow-xl rounded-full items-center justify-center border border-stone-100 dark:border-white/5 text-bento-primary opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-stone-50 dark:hover:bg-stone-900"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div 
          ref={categoryScrollRef}
          className="flex gap-3 overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth" 
          id="menu-list"
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
              selectedCategory === 'all' 
              ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10' 
              : 'bg-bento-card-bg/60 text-bento-ink'
            }`}
          >
            {t('menu')}
          </button>
          {displayCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                const el = document.getElementById(`cat-${cat.id}`);
                if (el) {
                  const navHeight = 150; // offset for sticky headers
                  const elementPosition = el.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - navHeight;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedCategory === cat.id 
                ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10 scale-105' 
                : 'bg-bento-card-bg/60 text-bento-ink hover:bg-stone-50 dark:hover:bg-stone-900'
              }`}
            >
              {getTranslatedCategory(cat.name)}
            </button>
          ))}
        </div>

        <button 
          onClick={() => scrollCategories('right')}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 bg-bento-card-bg shadow-xl rounded-full items-center justify-center border border-stone-100 dark:border-white/5 text-bento-primary opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-stone-50 dark:hover:bg-stone-900"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Product Display - Prioritized Category Sections */}
      <div className="space-y-16 pb-24">
        {displayCategories.map(cat => {
          const catProducts = displayProducts.filter(p => p.categoryId === cat.id && p.isAvailable);
          if (catProducts.length === 0) return null;

          // Filter by search query if present
          const searchFiltered = catProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (searchFiltered.length === 0) return null;

          return (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              key={cat.id} 
              id={`cat-${cat.id}`}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    {cat.name.toLowerCase().includes('drink') || cat.name.toLowerCase().includes('coffee') ? (
                      <Coffee size={16} className="text-amber-600" />
                    ) : cat.name.toLowerCase().includes('dessert') || cat.name.toLowerCase().includes('cake') ? (
                      <Cake size={16} className="text-amber-600" />
                    ) : (
                      <Utensils size={16} className="text-amber-600" />
                    )}
                  </div>
                  <h2 className="text-sm sm:text-xl font-black text-stone-300 dark:text-stone-700 uppercase tracking-[0.4em] whitespace-nowrap pl-1">
                    {getTranslatedCategory(cat.name)}
                  </h2>
                </div>
                <div className="h-px bg-stone-100 dark:bg-white/5 w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 pb-32">
                {searchFiltered.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    className="group flex flex-col bg-[#0D0B0A] hover:bg-[#151210] transition-all duration-500 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 max-w-[360px]"
                  >
                    <div className="w-full aspect-[4/3] relative overflow-hidden shrink-0">
                      <img
                        src={product.image || `https://picsum.photos/seed/${product.id}/400/400`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-6 right-6">
                        <div className="bg-[#1A120B]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-2xl border border-white/10 uppercase tracking-widest">
                          {product.price} DH
                        </div>
                      </div>
                    </div>
                    <div className="p-6 sm:p-8 flex flex-col items-start gap-5">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h3 className="text-2xl sm:text-3xl font-serif font-black text-white leading-[1.1] transition-colors group-hover:text-[#D4A373]">
                            {t(`products.${product.name}`, product.name)}
                          </h3>
                          {userProfile && (
                            <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                              {[...Array(10)].map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`w-1 h-1 rounded-full ${
                                    i < (userProfile.itemLoyalty?.[product.id] || 0) 
                                    ? 'bg-[#D4A373]' 
                                    : 'bg-white/10'
                                  }`} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-stone-400 text-xs sm:text-sm leading-relaxed line-clamp-3 font-medium opacity-80">
                          {t(`descriptions.${product.name}`, product.description)}
                        </p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-4 bg-transparent border border-white/10 text-white rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.4em] hover:bg-white hover:text-black transition-all active:scale-[0.98] mt-2"
                      >
                        ADD TO ORDER
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>
    </div>
  );
}
