import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { Plus, Search, Star, MapPin, Coffee, ChevronLeft, ChevronRight, Award, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

import { useBrandSettings } from '../lib/brand';

export default function Home({ userProfile }: { userProfile: UserProfile | null }) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { settings: brandSettings } = useBrandSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
    <div className="space-y-10">
      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-stone-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="relative w-full max-w-lg bg-[#1A120B] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
              
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={selectedProduct.image || `https://picsum.photos/seed/${selectedProduct.id}/600/400`} 
                  className="w-full h-full object-cover"
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="p-10 space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                      {t(`products.${selectedProduct.name}`, selectedProduct.name)}
                    </h2>
                    <span className="text-2xl font-black text-amber-400 italic">{selectedProduct.price} DH</span>
                  </div>
                  <p className="text-white/40 text-sm font-medium leading-relaxed italic">
                    {t(`descriptions.${selectedProduct.name}`, selectedProduct.description)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">Rating</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">★ 4.9 <span className="text-[10px] text-white/20 font-medium">Excellent</span></p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">Wait Time</p>
                    <p className="text-sm font-bold text-white">~12 Mins <span className="text-[10px] text-white/20 font-medium">Avg</span></p>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  className="w-full bg-white text-stone-900 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Confirm & Add <Plus size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Setup Warning */}
      {isEmpty && isAdmin && (
        <div className="card !bg-amber-100 !border-amber-200 !p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4 text-amber-900">
            <div className="p-3 bg-white rounded-2xl shadow-sm italic font-black text-xl">!</div>
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
      <header className="relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] min-h-[600px] md:min-h-[850px] flex flex-col justify-end p-8 md:p-20 mb-16 md:mb-24 group/hero shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]">
        {/* Background Image/Overlay */}
        <div className="absolute inset-0 z-0">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.23, 1, 0.32, 1] }}
            src={brandSettings.heroImageUrl || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600'} 
            className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/hero:scale-105"
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/50 to-transparent md:from-stone-950/70" />
        </div>

        <div className="relative z-10 space-y-10 md:max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-6"
          >
            <h1 className="text-7xl md:text-[12rem] font-black italic text-white tracking-[12px] md:tracking-[-0.05em] uppercase leading-[0.8] drop-shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
              {t('app_name')}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-2xl w-fit px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">
                <span className="text-amber-400">★ 4.9</span>
                <span className="opacity-40">|</span>
                <span>3.2k {t('order_history')}</span>
              </div>
              <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-2xl w-fit px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>Open Now</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="space-y-2"
          >
            <p className="text-white/80 uppercase tracking-[0.3em] md:tracking-[0.4em] text-[10px] md:text-xs font-black pl-1 flex items-center gap-3 italic">
              <MapPin size={16} className="text-amber-400" />
              Salé • Palace Taha • Avenue Moulay Rachid
            </p>
            <p className="text-white/50 text-[11px] md:text-sm font-medium italic pl-1 max-w-sm md:max-w-md leading-relaxed">
              Crafting exceptional coffee moments and artisan morning experiences in the heart of the city.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-wrap gap-4 md:gap-5 pt-2 md:pt-4"
          >
            <button 
              onClick={() => {
                const el = document.getElementById('menu-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 md:flex-none justify-center bg-white text-stone-900 px-8 md:px-10 py-4 md:py-5 rounded-[1.8rem] md:rounded-[2rem] font-black shadow-[0_20px_50px_rgba(255,255,255,0.15)] flex items-center gap-3 hover:scale-[1.03] transition-all active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
            >
              Start Order <Plus size={18} />
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('menu-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 md:flex-none justify-center bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-8 md:px-10 py-4 md:py-5 rounded-[1.8rem] md:rounded-[2rem] font-black shadow-2xl flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
            >
              Explore <Coffee size={18} className="text-amber-400" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Trust Elements - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"Verified Local Favorite"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"Great experience, friendly staff and relaxing atmosphere."</p>
        </div>
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"Best Breakfast in Salé"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"The breakfast sets are high quality and coffee is perfect every time."</p>
        </div>
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"Community Hub"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"Clean, modern and perfect for watching games with friends."</p>
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
          className={`w-full bg-bento-card-bg border border-bento-card-border rounded-2xl py-4 ${i18n.language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600`}
        />
      </div>

      {/* Categories */}
      <div className="relative group/nav">
        {/* Navigation Arrows - Desktop Only */}
        <button 
          onClick={() => scrollCategories('left')}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-10 h-10 bg-white shadow-xl rounded-full items-center justify-center border border-stone-100 text-stone-900 opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-stone-50"
        >
          <ChevronLeft size={20} />
        </button>
        
        <motion.div 
          ref={categoryScrollRef}
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar scroll-smooth relative px-1 snap-x" 
          id="menu-list"
        >
          <motion.button
            variants={{
              hidden: { opacity: 0, scale: 0.8 },
              show: { opacity: 1, scale: 1 }
            }}
            onClick={() => setSelectedCategory('all')}
            className={`relative px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all duration-500 z-10 whitespace-nowrap snap-center ${
              selectedCategory === 'all' 
              ? 'text-white' 
              : 'bg-white/5 text-stone-500 hover:text-white'
            }`}
          >
            {selectedCategory === 'all' && (
              <motion.div 
                layoutId="active-cat-pill"
                className="absolute inset-0 bg-stone-900 dark:bg-amber-400 rounded-[1.5rem] -z-10 shadow-2xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {t('all_items')}
          </motion.button>
          {displayCategories.map(cat => (
            <motion.button
              variants={{
                hidden: { opacity: 0, scale: 0.8 },
                show: { opacity: 1, scale: 1 }
              }}
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                const el = document.getElementById(`cat-${cat.id}`);
                if (el) {
                  const navHeight = 150;
                  const elementPosition = el.getBoundingClientRect().top;
                  const offsetPosition = elementPosition + window.pageYOffset - navHeight;
                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`relative px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all duration-500 z-10 whitespace-nowrap snap-center ${
                selectedCategory === cat.id 
                ? 'text-white dark:text-stone-950' 
                : 'bg-white/5 text-stone-500 hover:text-white'
              }`}
            >
              {selectedCategory === cat.id && (
                <motion.div 
                  layoutId="active-cat-pill"
                  className="absolute inset-0 bg-stone-900 dark:bg-amber-400 rounded-[1.5rem] -z-10 shadow-2xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {getTranslatedCategory(cat.name)}
            </motion.button>
          ))}
        </motion.div>

        <button 
          onClick={() => scrollCategories('right')}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-10 h-10 bg-white shadow-xl rounded-full items-center justify-center border border-stone-100 text-stone-900 opacity-0 group-hover/nav:opacity-100 transition-opacity hover:bg-stone-50"
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              key={cat.id} 
              id={`cat-${cat.id}`}
              className="space-y-8"
            >
              <div className="flex items-center gap-10">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter whitespace-nowrap pl-2">
                  {getTranslatedCategory(cat.name)}
                </h2>
                <div className="h-px bg-white/10 w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 tabular-nums">
                {searchFiltered.map((product, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="group relative bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden hover:bg-white/10 transition-all duration-500 cursor-pointer shadow-2xl"
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="sm:w-2/5 aspect-square relative overflow-hidden">
                        <img
                          src={product.image || `https://picsum.photos/seed/${product.id}/400/400`}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="absolute top-4 left-4">
                          <div className="bg-white/10 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest ring-1 ring-white/20 shadow-2xl">
                            {product.price} DH
                          </div>
                        </div>

                        {userProfile && (userProfile.itemLoyalty?.[product.id] || 0) > 0 && (
                          <div className="absolute bottom-4 left-4 bg-amber-400 text-stone-900 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-1.5 ring-2 ring-white/10">
                            <Award size={10} strokeWidth={3} />
                            <span>{userProfile.itemLoyalty?.[product.id]} Pts</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-8 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-white uppercase tracking-tight italic group-hover:text-amber-200 transition-colors">
                            {t(`products.${product.name}`, product.name)}
                          </h3>
                          <p className="text-white/40 text-xs font-medium leading-relaxed line-clamp-2 md:line-clamp-3 italic">
                            {t(`descriptions.${product.name}`, product.description)}
                          </p>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               addToCart(product);
                             }}
                            className="bg-white text-stone-900 px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                           >
                            {t('add_to_cart')}
                          </button>
                          <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:border-white/20 transition-all">
                             <Plus size={18} />
                          </div>
                        </div>
                      </div>
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
