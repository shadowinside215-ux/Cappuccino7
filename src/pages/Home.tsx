import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Star, MapPin, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qCat = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const qProd = query(collection(db, 'products'));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubProd();
    };
  }, []);

  const filteredProducts = products.filter(p => {
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

  if (loading) return <div className="text-center py-20">Brewing the menu...</div>;

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <header className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-6xl font-bold italic text-bento-primary tracking-tighter">Cappuccino7</h1>
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
            Order Now <Plus size={18} />
          </button>
          <button 
            onClick={() => {
              const el = document.getElementById('menu-grid');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border-2 border-stone-100 text-bento-primary px-8 py-4 rounded-xl font-bold shadow-sm flex items-center gap-2 hover:bg-stone-50 transition-all active:scale-[0.98] text-sm uppercase tracking-widest"
          >
            View Menu <Coffee size={18} className="text-bento-accent" />
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
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Explore our menu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-bento-card-border rounded-2xl py-4 pl-14 pr-6 shadow-sm focus:ring-2 focus:ring-bento-accent transition-all placeholder:text-stone-300"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`category-btn whitespace-nowrap ${
            selectedCategory === 'all' 
            ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10' 
            : 'bg-white text-bento-ink'
          }`}
        >
          All Items
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`category-btn whitespace-nowrap ${
              selectedCategory === cat.id 
              ? 'bg-bento-primary text-white shadow-lg shadow-bento-primary/10' 
              : 'bg-white text-bento-ink'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid - Bento Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pb-12">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={product.id}
              className="card group"
            >
              <div className="mb-6 rounded-[20px] overflow-hidden aspect-[16/9] relative">
                <img
                  src={product.image || `https://picsum.photos/seed/${product.id}/600/400`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full text-bento-primary font-bold shadow-sm">
                  ${product.price.toFixed(1)}
                </div>
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-bento-accent transition-colors">{product.name}</h3>
                <p className="text-stone-500 text-sm mb-6 flex-1">{product.description}</p>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full py-4 bg-bento-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-bento-ink transition-all shadow-md active:scale-[0.98]"
                >
                  <Plus size={18} /> Add to Order
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
