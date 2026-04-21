import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Star, MapPin, Coffee } from 'lucide-react';
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
    });

    const qProd = query(collection(db, 'products'));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
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
    return catName;
  };

  if (loading) return <div className="text-center py-20 italic text-stone-400">...</div>;

  return (
    <div className="space-y-10">
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
      <header className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold italic text-bento-primary tracking-tighter uppercase">{t('app_name')}</h1>
          <div className="flex items-center gap-2 text-stone-600 bg-stone-100 w-fit px-3 py-1 rounded-full text-xs font-bold ring-1 ring-stone-200">
            <span className="text-bento-accent">★ 4.8</span>
            <span>(2,777 reviews)</span>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-stone-500 uppercase tracking-[0.2em] text-[10px] font-bold pl-1 flex items-center gap-2">
            <MapPin size={12} className="text-bento-accent" />
            Salé • Palace Taha • Av. Moulay Rachid
          </p>
          <p className="text-stone-400 text-xs italic pl-1">Known for friendly staff & artisan breakfast</p>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <button 
            onClick={() => {
              const el = document.getElementById('menu-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-bento-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-bento-primary/20 flex items-center gap-2 hover:bg-bento-ink transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            {t('quick_order')} <Plus size={18} />
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('menu-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border-2 border-stone-100 text-bento-primary px-8 py-4 rounded-xl font-bold shadow-sm flex items-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            {t('view_menu')} <Coffee size={18} className="text-bento-accent" />
          </button>
        </div>
      </header>

      {/* Trust Elements - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-5 bg-stone-50/50 border-dashed">
          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-3 italic">"Verified Local Favorite"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"Great experience, friendly staff and relaxing atmosphere."</p>
        </div>
        <div className="card !p-5 bg-stone-50/50 border-dashed">
          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-3 italic">"Best Breakfast in Salé"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"The breakfast sets are high quality and coffee is perfect every time."</p>
        </div>
        <div className="card !p-5 bg-stone-50/50 border-dashed">
          <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-3 italic">"Community Hub"</p>
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
          className={`w-full bg-white border border-bento-card-border rounded-2xl py-4 ${i18n.language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300`}
        />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar" id="menu-list">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`category-btn whitespace-nowrap ${
            selectedCategory === 'all' 
            ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10' 
            : 'bg-white text-bento-ink'
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
            className={`category-btn whitespace-nowrap transition-all ${
              selectedCategory === cat.id 
              ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10 scale-105' 
              : 'bg-white text-bento-ink hover:bg-stone-50'
            }`}
          >
            {getTranslatedCategory(cat.name)}
          </button>
        ))}
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
                <h2 className="text-xl font-black text-stone-300 uppercase tracking-[0.4em] whitespace-nowrap pl-1">
                  {getTranslatedCategory(cat.name)}
                </h2>
                <div className="h-px bg-stone-100 w-full" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 tabular-nums">
                {searchFiltered.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    className="card group flex flex-col sm:flex-row !p-0 overflow-hidden hover:border-bento-accent/20 transition-all duration-300"
                  >
                    <div className="sm:w-2/5 aspect-[4/3] sm:aspect-square relative overflow-hidden">
                      <img
                        src={product.image || `https://picsum.photos/seed/${product.id}/400/400`}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-black text-bento-primary shadow-sm ring-1 ring-black/5">
                        {product.price} MAD
                      </div>
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-bento-accent transition-colors leading-tight">{product.name}</h3>
                        <p className="text-stone-400 text-xs line-clamp-2 md:line-clamp-3 leading-relaxed mb-4">{product.description}</p>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="w-full py-3 bg-stone-50 text-bento-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-bento-primary hover:text-white transition-all active:scale-[0.98] border border-stone-100 mt-2"
                      >
                        Add to Order
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
