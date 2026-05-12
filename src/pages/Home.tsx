import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Category, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useRef } from 'react';
import { 
  Plus, 
  Search, 
  Star, 
  MapPin, 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  Award, 
  X,
  Pizza,
  Zap,
  Ticket,
  Navigation,
  LocateFixed
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBrandSettings } from '../lib/brand';
import OptimizedImage from '../components/ui/OptimizedImage';

export default function Home({ userProfile }: { userProfile: UserProfile | null }) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { settings: brandSettings } = useBrandSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [breakfastStep, setBreakfastStep] = useState<1 | 2>(1);
  const [selectedDrink, setSelectedDrink] = useState<string>('');
  const [sugarPreference, setSugarPreference] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showGeoPrompt, setShowGeoPrompt] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Geolocation prompt disabled for now
    /*
    const hasPrompted = localStorage.getItem('geo_prompted');
    if (!hasPrompted) {
      const timer = setTimeout(() => setShowGeoPrompt(true), 2500);
      return () => clearTimeout(timer);
    }
    */
  }, []);

  const handleAutoLocate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not supported");
      setShowGeoPrompt(false);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        sessionStorage.setItem('current_location', JSON.stringify(coords));
        localStorage.setItem('geo_prompted', 'true');
        setIsLocating(false);
        setShowGeoPrompt(false);
        toast.success(t('location_captured'));
      },
      (error) => {
        console.error("GPS Error:", error);
        localStorage.setItem('geo_prompted', 'true');
        setIsLocating(false);
        setShowGeoPrompt(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isEmpty = !loading && categories.length === 0;

  const starterMenu: Product[] = [
    { id: 'start-1', name: 'Occidental Breakfast', price: 38, description: "Deux viennoiseries, Jus d'orange, Balboula, Boisson chaude au choix, Eau minérale", image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800', categoryId: 'breakfast', isAvailable: true },
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
      toast(t('free_coffee_available'), {
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
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    const qProd = query(collection(db, 'products'));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'products');
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

  const addToCart = (product: Product, customization?: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id && item.customization === customization);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        customization: customization
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    toast.success(t('added_to_cart', { name: product.name }));
    window.dispatchEvent(new Event('cartUpdated'));
    navigate('/cart');
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
    if (name.includes('coffee')) return t('categories.coffee');
    if (name.includes('tea')) return t('categories.tea');
    if (name.includes('jus') || name.includes('juice')) return t('categories.jus');
    if (name.includes('hot drinks')) return t('categories.hot_drinks');
    if (name.includes('hot beverages')) return t('categories.hot_beverages');
    if (name.includes('iced latte') || name.includes('iced latté')) return t('categories.iced_latte');
    if (name.includes('ice tea')) return t('categories.ice_tea');
    if (name.includes('frappuccino')) return t('categories.frappuccino');
    if (name.includes('crepes_desserts') || name.includes('crêpes')) return t('categories.crepes_desserts');
    if (name.includes('fast food')) return t('categories.fast_food');
    if (name.includes('healthy')) return t('categories.healthy');
    if (name.includes('desserts')) return t('categories.desserts');
    if (name.includes('ice cream')) return t('categories.ice_cream');
    if (name.includes('signature')) return t('categories.signature');
    if (name.includes('extra')) return t('categories.extras');
    if (name.includes('salades')) return t('categories.salades');
    if (name.includes('burgers')) return t('categories.burgers');
    if (name.includes('sandwiches')) return t('categories.sandwiches');
    if (name.includes('pizza')) return t('categories.pizza');
    if (name.includes('plats gourmands') || name.includes('artisan plates')) return t('categories.plats gourmands');
    if (name.includes('pâtes') || name.includes('pasta')) return t('categories.pâtes');
    
    // Fallback to trying to find the key directly
    return t(`categories.${name}`, catName);
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
              className="relative w-full max-w-lg bg-bento-card-bg rounded-[3rem] overflow-y-auto max-h-[90vh] custom-scrollbar shadow-2xl border border-bento-card-border"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-bento-bg/40 backdrop-blur-xl rounded-full flex items-center justify-center text-bento-ink hover:bg-bento-ink hover:text-bento-bg transition-all active:scale-90 border border-bento-card-border"
              >
                <X size={20} />
              </button>
              
              <div className="aspect-[4/3] overflow-hidden">
                <OptimizedImage 
                  src={selectedProduct.image || (selectedProduct.name.toLowerCase().includes('anglais') ? 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800' : '')} 
                  containerClassName="w-full h-full"
                  className="w-full h-full object-cover"
                  alt={selectedProduct.name}
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="p-10 space-y-8 pb-12">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl font-black text-bento-ink italic uppercase tracking-tighter">
                      {t(`products.${selectedProduct.name}`, selectedProduct.name)}
                    </h2>
                    <span className="text-2xl font-black text-amber-400 italic">{selectedProduct.price} DH</span>
                  </div>
                  <p className="text-bento-ink/40 text-sm font-medium leading-relaxed italic">
                    {t(`descriptions.${selectedProduct.name}`, selectedProduct.description)}
                  </p>
                </div>

                {/* Breakfast Customization Flow */}
                {selectedProduct.categoryId === 'breakfast' && (
                  <div className="space-y-6 pt-8 border-t border-white/5">
                    <AnimatePresence mode="wait">
                      {breakfastStep === 1 ? (
                        <motion.div 
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black uppercase text-amber-500 tracking-[0.3em] italic">
                              {t('choose_drink_question')}
                            </p>
                          </div>
                          
                          {/* Mini Scrollable Drink Menu */}
                          <div className="max-h-[220px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                            {products
                              .filter(p => (p.categoryId === 'coffee' || p.categoryId === 'drinks' || p.categoryId === 'tea') && !p.name.toLowerCase().includes('juice') && !p.name.toLowerCase().includes('jus') && !p.name.toLowerCase().includes('smoothie'))
                              .map((drink) => (
                                <button
                                  key={drink.id}
                                  onClick={() => setSelectedDrink(drink.name)}
                                  className={`w-full flex items-center justify-between px-6 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all border ${
                                    selectedDrink === drink.name 
                                      ? 'bg-amber-400 text-stone-900 border-amber-400 shadow-xl shadow-amber-400/20' 
                                      : 'bg-bento-bg/5 text-bento-ink/50 border-bento-card-border hover:border-bento-accent/20'
                                  }`}
                                >
                                  <span>{t(`products.${drink.name}`, drink.name)}</span>
                                  <div className={`w-2 h-2 rounded-full ${selectedDrink === drink.name ? 'bg-stone-900' : 'bg-bento-ink/20'}`} />
                                </button>
                              ))}
                          </div>

                          <button
                            disabled={!selectedDrink}
                            onClick={() => setBreakfastStep(2)}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedDrink 
                                ? 'bg-white text-stone-900 shadow-xl' 
                                : 'bg-white/10 text-white/20 cursor-not-allowed'
                            }`}
                          >
                            {t('next_step')}
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-black uppercase text-amber-500 tracking-[0.3em] italic">
                              {t('sugar_preference_question')}
                            </p>
                            <button 
                              onClick={() => setBreakfastStep(1)}
                              className="text-[9px] font-black uppercase text-amber-500 hover:text-amber-400 transition-colors"
                            >
                              {t('go_back')}
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            {[
                                { id: 'With Sugar', label: t('with_sugar') }, 
                                { id: 'Without Sugar', label: t('without_sugar') }
                            ].map((pref) => (
                              <button
                                key={pref.id}
                                onClick={() => setSugarPreference(pref.id)}
                                className={`px-4 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all border ${
                                  sugarPreference === pref.id 
                                    ? 'bg-amber-400 text-stone-900 border-amber-400 shadow-xl shadow-amber-400/20' 
                                    : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                                }`}
                              >
                                {pref.id === 'With Sugar' ? '🍬 ' : '🚫 '}
                                {pref.label}
                              </button>
                            ))}
                          </div>

                          <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mb-2 italic">{t('summary')}</p>
                            <p className="text-xs font-bold text-white flex items-center gap-2">
                              {t(`products.${selectedDrink}`, selectedDrink)} • {t(sugarPreference === 'With Sugar' ? 'with_sugar' : 'without_sugar')}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">{t('rating', 'Rating')}</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">★ 4.9 <span className="text-[10px] text-white/20 font-medium">{t('excellent')}</span></p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 space-y-1">
                    <p className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">{t('wait_time')}</p>
                    <p className="text-sm font-bold text-white">~12 {t('mins_short', 'Mins')} <span className="text-[10px] text-white/20 font-medium">{t('avg')}</span></p>
                  </div>
                </div>

                <button 
                  disabled={selectedProduct.categoryId === 'breakfast' && (!selectedDrink || !sugarPreference)}
                  onClick={() => {
                    const customization = selectedProduct.categoryId === 'breakfast' 
                      ? `${selectedDrink} - ${sugarPreference}`
                      : undefined;
                    addToCart(selectedProduct, customization);
                    setSelectedProduct(null);
                    setBreakfastStep(1);
                    setSelectedDrink('');
                    setSugarPreference('');
                  }}
                  className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 ${
                    (selectedProduct.categoryId === 'breakfast' && (!selectedDrink || !sugarPreference))
                      ? 'bg-white/10 text-white/30 cursor-not-allowed'
                      : 'bg-white text-stone-900 hover:scale-[1.02] active:scale-95'
                  }`}
                >
                  {loading ? '...' : t('confirm_and_add')} <Plus size={20} />
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
              <p className="text-xs opacity-70">{t('empty_db_msg')}</p>
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
      <header className="relative overflow-hidden rounded-[2.5rem] md:rounded-[4rem] min-h-[500px] md:min-h-[650px] flex flex-col justify-end p-8 md:p-16 mb-12 md:mb-16 group/hero shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-bento-bg">
        {/* Background Image/Overlay */}
        <div className="absolute inset-0 z-0">
          {brandSettings.heroImageUrl && (
            <OptimizedImage 
              priority
              src={brandSettings.heroImageUrl} 
              containerClassName="w-full h-full"
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover/hero:scale-105"
              alt=""
              referrerPolicy="no-referrer"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bento-bg via-bento-bg/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-bento-bg/50 to-transparent md:from-bento-bg/70" />
        </div>

        <div className="relative z-10 space-y-10 md:max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col gap-6"
          >
            <h1 className="text-4xl md:text-6xl font-black italic text-bento-primary tracking-tighter uppercase leading-[0.8] drop-shadow-2xl">
              {t('app_name')}
            </h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-2xl w-fit px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">
                <span className="text-amber-400">★ 4.9</span>
                <span className="opacity-40">|</span>
                <span>{t('premium_selection')}</span>
              </div>
              <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-2xl w-fit px-4 md:px-5 py-2 md:py-2.5 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest ring-1 ring-white/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>{t('open_now')}</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="space-y-2"
          >
            <p className="text-white/50 text-[11px] md:text-sm font-medium italic pl-1 max-w-sm md:max-w-md leading-relaxed">
              {t('hero_description')}
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
              {t('start_order')} <Plus size={18} />
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('menu-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 md:flex-none justify-center bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-8 md:px-10 py-4 md:py-5 rounded-[1.8rem] md:rounded-[2rem] font-black shadow-2xl flex items-center gap-3 hover:bg-white/20 transition-all active:scale-95 text-[10px] md:text-xs uppercase tracking-widest"
            >
              {t('explore')} <Coffee size={18} className="text-amber-400" />
            </button>
          </motion.div>
        </div>
      </header>

      {/* Trust Elements - Bento Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"{t('trust_badge_1')}"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"{t('trust_text_1')}"</p>
        </div>
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"{t('trust_badge_2')}"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"{t('trust_text_2')}"</p>
        </div>
        <div className="card !p-5 bg-bento-card-bg border-dashed">
          <p className="text-[10px] font-black text-stone-300 dark:text-stone-600 uppercase tracking-widest mb-3 italic">"{t('trust_badge_3')}"</p>
          <p className="text-sm font-bold text-bento-primary leading-tight">"{t('trust_text_3')}"</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative pt-4 space-y-8" id="menu-grid">
        <div className="relative">
          <Search className={`absolute ${i18n.language === 'ar' ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-stone-400`} size={18} />
          <input
            type="text"
            placeholder={t('menu_search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-bento-card-bg border border-bento-card-border rounded-2xl py-4 ${i18n.language === 'ar' ? 'pr-14 pl-6' : 'pl-14 pr-6'} shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300 dark:placeholder:text-stone-600`}
          />
        </div>

        {/* Loyalty Points Explanation Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-bento-card-bg rounded-[3rem] p-8 md:p-14 overflow-hidden border border-bento-card-border shadow-2xl group cursor-default ring-1 ring-bento-card-border"
        >
          {/* Internal Header Requested by User - Coffee Style */}
          <div className="absolute top-0 left-0 right-0 bg-bento-bg/20 backdrop-blur-sm px-8 py-4 border-b border-bento-card-border flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              <span className="text-[9px] font-black text-bento-ink/60 uppercase tracking-[0.3em] italic">
                {t('loyalty_badge')}
              </span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/30" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400/10" />
            </div>
          </div>

          {/* Glowing Background Icons */}
          <div className="absolute top-20 right-10 text-amber-400/5 rotate-12 transition-transform duration-[3000ms] group-hover:scale-125 group-hover:-rotate-6 pointer-events-none">
             <Coffee size={300} />
          </div>
          <div className="absolute -bottom-10 -left-10 text-amber-400/5 -rotate-12 transition-transform duration-[3000ms] group-hover:scale-110 pointer-events-none">
             <Award size={200} />
          </div>

          <div className="relative z-10 pt-12">
            <h2 
              className="text-3xl md:text-5xl font-black text-amber-400 italic tracking-tighter uppercase leading-tight mb-8 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
              dangerouslySetInnerHTML={{ __html: t('loyalty_headline') }}
            />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-8 space-y-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-[10px] font-black shrink-0 mt-0.5">1</div>
                      <p 
                        className="text-white/80 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t('loyalty_step_1') }}
                      />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-[10px] font-black shrink-0 mt-0.5">2</div>
                      <p 
                        className="text-white/80 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t('loyalty_step_2') }}
                      />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-stone-900 text-[10px] font-black shrink-0 mt-0.5">3</div>
                      <p 
                        className="text-white/80 text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: t('loyalty_step_3') }}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                   <div className="px-4 py-2 bg-stone-900/50 rounded-xl border border-white/5 flex items-center gap-2.5 transition-colors hover:border-amber-400/30">
                      <Ticket size={14} className="text-amber-400" />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{t('automatic_rewards')}</span>
                   </div>
                   <div className="px-4 py-2 bg-stone-900/50 rounded-xl border border-white/5 flex items-center gap-2.5 transition-colors hover:border-amber-400/30">
                      <Star size={14} className="text-amber-400" />
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">{t('vip_tiers')}</span>
                   </div>
                </div>
              </div>

              <div className="md:col-span-4 flex justify-end">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-24 h-24 bg-amber-400 rounded-3xl flex flex-col items-center justify-center p-4 shadow-[0_0_40px_rgba(251,191,36,0.3)] rotate-3 border-4 border-[#1a120b]"
                >
                  <Award size={32} className="text-stone-900 mb-1" />
                  <span className="text-stone-900 font-black text-xs italic uppercase tracking-tighter">{t('gift_tag')}</span>
                </motion.div>
              </div>
            </div>
          </div>
          
          {/* Animated Glow Effects */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-amber-400/[0.03] blur-[100px] pointer-events-none" />
        </motion.div>
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
                staggerChildren: 0.05,
                delayChildren: 0.2
              }
            }
          }}
          className="flex gap-4 overflow-x-auto pb-6 pt-1 no-scrollbar scroll-smooth relative px-1 snap-x" 
          id="menu-list"
        >
          <motion.button
            variants={{
              hidden: { opacity: 0, scale: 0.5, y: 20 },
              show: { 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }
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
                hidden: { opacity: 0, scale: 0.5, y: 20 },
                show: { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }
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
        {displayCategories
          .filter(cat => selectedCategory === 'all' || cat.id === selectedCategory)
          .map(cat => {
            const catProducts = displayProducts.filter(p => p.categoryId === cat.id && p.isAvailable);
            if (catProducts.length === 0) return null;

            // Filter by search query if present
            const searchFiltered = catProducts.filter(p => 
              p.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (searchFiltered.length === 0) return null;

            // Group by subSection if present
            const sections: Record<string, typeof searchFiltered> = {};
            const sectionOrder: string[] = [];
            
            searchFiltered.forEach(p => {
              const sec = (p as any).subSection || '_none';
              if (!sections[sec]) {
                sections[sec] = [];
                sectionOrder.push(sec);
              }
              sections[sec].push(p);
            });

            return (
              <motion.section 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                key={cat.id} 
                id={`cat-${cat.id}`}
                className="space-y-12"
              >
              <div className="flex items-center gap-10">
                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter whitespace-nowrap pl-2">
                  {getTranslatedCategory(cat.name)}
                </h2>
                <div className="h-px bg-white/10 w-full" />
              </div>

              {sectionOrder.map(secKey => (
                <div key={secKey} className="space-y-8">
                  {secKey !== '_none' && (
                    <div className="flex items-center gap-4 bg-white/5 w-fit px-6 py-2 rounded-full border border-white/5">
                      <span className="text-sm font-black text-amber-400 uppercase tracking-[0.2em] italic">
                        {t(`sections.${secKey}`, secKey)}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 tabular-nums">
                    {sections[secKey].map((product, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.05, duration: 0.5 }}
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className="group relative bg-bento-card-bg/5 backdrop-blur-3xl rounded-[2.5rem] border border-bento-card-border overflow-hidden hover:bg-bento-card-bg/10 transition-all duration-500 cursor-pointer shadow-2xl"
                      >
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="sm:w-2/5 aspect-square relative overflow-hidden">
                        <OptimizedImage
                          src={product.image || (product.name.toLowerCase().includes('anglais') ? 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?q=80&w=800' : '')}
                          alt={product.name}
                          containerClassName="w-full h-full"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="absolute top-4 left-4">
                          <div className="bg-bento-card-bg/10 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-black text-bento-ink uppercase tracking-widest ring-1 ring-bento-card-border shadow-2xl">
                            {product.price} DH
                          </div>
                        </div>

                        {userProfile && (userProfile.itemLoyalty?.[product.id] || 0) > 0 && (
                          <div className={`absolute bottom-4 left-4 ${userProfile.itemLoyalty?.[product.id] >= 11 ? 'bg-amber-400 text-stone-900 ring-4 ring-amber-400/30' : 'bg-amber-400 text-stone-900 ring-2 ring-white/10'} px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-1.5 transition-all duration-500`}>
                            <Award size={10} strokeWidth={3} />
                            <span>
                              {userProfile.itemLoyalty?.[product.id] >= 11 
                                ? `12 - ${t('get_free_order')}` 
                                : `${userProfile.itemLoyalty?.[product.id]} ${t('pts_short')}`}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 p-8 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-bento-ink uppercase tracking-tight italic group-hover:text-bento-primary transition-colors">
                            {t(`products.${product.name}`, product.name)}
                          </h3>
                          <p className="text-bento-ink/40 text-xs font-medium leading-relaxed line-clamp-2 md:line-clamp-3 italic">
                            {t(`descriptions.${product.name}`, product.description || '')}
                          </p>
                        </div>
                        
                        <div className="mt-8 flex items-center justify-between">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               if (product.categoryId === 'breakfast') {
                                 setSelectedProduct(product);
                               } else {
                                 addToCart(product);
                               }
                             }}
                            className="bg-bento-primary text-bento-bg px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-2xl"
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
              </div>
            ))}
          </motion.section>
        );
      })}
    </div>

      {/* GPS Onboarding Modal Hidden */}
      <AnimatePresence>
        {false && showGeoPrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4 bg-stone-900/60 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400" />
              
              <div className="w-24 h-24 bg-amber-400/10 rounded-[2rem] mx-auto mb-8 flex items-center justify-center text-amber-500 relative">
                <LocateFixed size={48} className={isLocating ? 'animate-spin' : ''} />
                <div className="absolute inset-0 bg-amber-400/5 rounded-[2rem] animate-ping" />
              </div>

              <h3 className="text-2xl font-black text-stone-900 uppercase italic tracking-tighter mb-4 leading-none">
                {t('welcome_locate_title')}
              </h3>
              <p className="text-stone-500 text-sm font-medium leading-relaxed mb-10">
                {t('welcome_locate_desc')}
              </p>

              <div className="space-y-4">
                <button
                  onClick={handleAutoLocate}
                  disabled={isLocating}
                  className="w-full bg-stone-900 text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLocating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Navigation size={18} className="rotate-45" />
                  )}
                  {t('allow_gps')}
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('geo_prompted', 'true');
                    setShowGeoPrompt(false);
                  }}
                  className="w-full text-stone-400 hover:text-stone-900 py-3 font-black text-[9px] uppercase tracking-[0.2em] transition-colors"
                >
                  {t('skip_gps')}
                </button>
              </div>
              
              <div className="mt-8 pt-8 border-t border-stone-50">
                 <p className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">{t('secure_precision')}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
