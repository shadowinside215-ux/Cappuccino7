import React, { useState, useEffect, useRef } from 'react';
import { 
  Calculator, 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Banknote, 
  Printer, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Pizza,
  Coffee,
  IceCream,
  UtensilsCrossed,
  X,
  User,
  Bell,
  RefreshCw,
  LayoutGrid,
  History,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc, updateDoc, serverTimestamp, increment, addDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { Category, Product, Order, OrderItem } from '../../types';
import { processOrderItems } from '../../lib/orderRouting';
import { generateThermalReceipt, printToThermalPrinter } from '../../lib/thermalPrinter';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function CashierDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [customerName, setCustomerName] = useState('');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'pos' | 'orders' | 'history'>('pos');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings: brand } = useBrandSettings();
  const navigate = useNavigate();
  const cartEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll cart
  useEffect(() => {
    cartEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cart]);

  useEffect(() => {
    // Load Categories
    const qCat = query(collection(db, 'categories'), orderBy('order', 'asc'));
    const unsubCat = onSnapshot(qCat, (snap) => {
      setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    });

    // Load Products
    const qProd = query(collection(db, 'products'), where('isAvailable', '==', true));
    const unsubProd = onSnapshot(qProd, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    // Load Active Orders (Real-time sync with customers, kitchen, barman)
    const qOrders = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'accepted', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setActiveOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      
      // Notify on new pending orders
      const newOrders = snap.docChanges().filter(change => change.type === 'added');
      if (newOrders.length > 0 && !loading) {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
        toast('New Order Received!', { icon: '🔔' });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubOrders();
    };
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        categoryName: categories.find(c => c.id === product.categoryId)?.name || 'Menu'
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'card') => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      const itemsWithMetadata = await processOrderItems(cart);
      const hasKitchenItems = itemsWithMetadata.some(item => item.system === 'kitchen');
      const hasBarmanItems = itemsWithMetadata.some(item => item.system === 'barman');

      const orderData = {
        userId: auth.currentUser?.uid || 'cashier',
        customerName: customerName || 'Walk-in Customer',
        items: itemsWithMetadata,
        total: totalPrice,
        status: 'accepted',
        kitchenStatus: hasKitchenItems ? 'pending' : 'completed',
        barmanStatus: hasBarmanItems ? 'pending' : 'completed',
        deliveryType: deliveryType,
        paymentMethod,
        isPOS: true,
        createdAt: serverTimestamp(),
        pointsEarned: Math.floor(totalPrice / 10), // Base loyalty for POS
        prepTime: 20
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update statistics for completed revenue
      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'stats', today);
      await setDoc(statsRef, {
        revenue: increment(totalPrice),
        orders: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Print Receipt automatically
      const receipt = generateThermalReceipt({
        restaurantName: "Cappuccino 7",
        orderId: docRef.id,
        items: itemsWithMetadata,
        total: totalPrice,
        cashierName: auth.currentUser?.displayName || 'Cashier',
        paymentMethod,
        date: new Date(),
        deliveryType,
        customerName: customerName || 'Walk-in'
      });
      printToThermalPrinter(receipt);

      toast.success('Order Completed');
      setCart([]);
      setCustomerName('');
    } catch (err) {
      console.error(err);
      toast.error('Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="h-screen bg-[#111] text-[#E0E0E0] flex flex-col font-mono overflow-hidden select-none">
      {/* Top POS Info Bar */}
      <header className="h-10 bg-[#222] border-b border-white/5 px-4 flex items-center justify-between text-[11px] font-bold">
        <div className="flex gap-6 uppercase">
          <span className="text-amber-500">Date: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
          <span className="text-blue-400">Direct Sales</span>
          <span className="text-teal-400">Station: POS-01</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="bg-stone-800 px-3 py-0.5 rounded text-white/60">Vendeur: {auth.currentUser?.displayName || 'CASHIER'}</span>
          <button 
            onClick={() => setView(view === 'pos' ? 'orders' : 'pos')}
            className="flex items-center gap-2 text-amber-500 hover:text-amber-400"
          >
            {view === 'pos' ? <History size={14} /> : <Calculator size={14} />}
            {view === 'pos' ? 'JOURNAL' : 'TERMINAL'}
          </button>
          <button onClick={() => navigate('/login')} className="text-red-500 flex items-center gap-1">
            <LogOut size={14} /> FERMER
          </button>
        </div>
      </header>

      {/* Main POS Interface */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Grid */}
        <section className="flex-1 flex flex-col border-r border-white/10 bg-[#000]">
          {/* Main Content (Grid) */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-4 md:grid-cols-5 2xl:grid-cols-6 border-b border-white/10">
              {filteredProducts.map(product => {
                const category = categories.find(c => c.id === product.categoryId);
                // Assign a color based on category order for visual grouping
                const colors = ['bg-[#00ADC0]', 'bg-[#0088A8]', 'bg-[#1D3244]', 'bg-[#4B6B7C]', 'bg-[#6D8DA1]'];
                const colorClass = colors[(categories.indexOf(category!) || 0) % colors.length];

                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(product)}
                    className={`${colorClass} border border-black/30 h-28 flex flex-col items-center justify-center p-3 text-center transition-all active:brightness-75`}
                  >
                    <span className="text-[12px] font-black uppercase leading-tight mb-1">{product.name}</span>
                    <span className="text-[14px] font-black tabular-nums text-black/60">{product.price.toFixed(2)}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Bottom Category Selector (Sticky to Bottom) */}
          <div className="h-28 bg-[#222] border-t border-white/10 flex overflow-hidden">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`flex-1 border-r border-white/5 uppercase text-[10px] font-black transition-all ${selectedCategory === 'all' ? 'bg-amber-600 text-black' : 'hover:bg-white/5'}`}
              >
                TOUS
              </button>
              {categories.slice(0, 10).map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-1 border-r border-white/5 uppercase text-[10px] font-black transition-all ${selectedCategory === cat.id ? 'bg-amber-600 text-black' : 'hover:bg-white/5'}`}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </section>

        {/* Right Side: Receipt List */}
        <aside className="w-[380px] bg-[#E5E7EB] text-[#1A1A1A] flex flex-col font-mono shadow-inner">
          <div className="grid grid-cols-5 bg-[#D1D5DB] border-b border-gray-400 text-[11px] font-black p-2 uppercase">
             <div className="col-span-1">Qté</div>
             <div className="col-span-3">Article</div>
             <div className="col-span-1 text-right">TTC</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {cart.map(item => (
              <button 
                key={item.productId}
                onClick={() => removeFromCart(item.productId)}
                className="w-full grid grid-cols-5 border-b border-gray-300 p-2 text-[12px] font-bold hover:bg-blue-100 transition-colors group"
              >
                 <div className="col-span-1">{item.quantity}</div>
                 <div className="col-span-3 text-left uppercase truncate">{item.name}</div>
                 <div className="col-span-1 text-right tabular-nums">{(item.price * item.quantity).toFixed(2)}</div>
              </button>
            ))}
            
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 p-10 text-center">
                 <Calculator size={48} className="mb-4" />
                 <p className="text-xs uppercase font-black">Prêt pour commande</p>
              </div>
            )}
          </div>

          <div className="bg-[#6B7280] text-white p-4 space-y-2">
             <div className="flex justify-between items-end border-t border-white/20 pt-2">
                <span className="text-[10px] font-bold uppercase">Prix Total</span>
                <span className="text-4xl font-black tabular-nums">{totalPrice.toFixed(2)} <span className="text-sm">MAD</span></span>
             </div>
          </div>

          {/* POS Bottom Control Pad */}
          <div className="grid grid-cols-3 gap-1 bg-[#111] p-1 h-32">
             <button 
               onClick={() => handleCheckout('cash')}
               className="bg-[#22C55E] text-white font-black uppercase text-[12px] flex flex-col items-center justify-center gap-2 hover:brightness-110"
             >
               <Banknote size={24} /> ESPÈCES
             </button>
             <button 
               onClick={() => handleCheckout('card')}
               className="bg-[#3B82F6] text-white font-black uppercase text-[12px] flex flex-col items-center justify-center gap-2 hover:brightness-110"
             >
               <CreditCard size={24} /> CARTE
             </button>
             <button 
               onClick={() => {
                 const receipt = generateThermalReceipt({
                   restaurantName: "Cappuccino 7",
                   orderId: "DRAFT",
                   items: cart,
                   total: totalPrice,
                   cashierName: auth.currentUser?.displayName || 'Cashier',
                   paymentMethod: 'DRAFT',
                   date: new Date(),
                   deliveryType
                 });
                 printToThermalPrinter(receipt);
               }}
               className="bg-[#F59E0B] text-black font-black uppercase text-[12px] flex flex-col items-center justify-center gap-2 hover:brightness-110"
             >
               <Printer size={24} /> ÉDITION NOTE
             </button>
          </div>
        </aside>
      </main>

      {/* Function Bar (Bottom) */}
      <footer className="h-14 bg-[#111] grid grid-cols-6 border-t border-white/10 gap-px">
          <button className="bg-[#222] font-black uppercase text-[10px] hover:bg-white/5 transition-all">Clôture</button>
          <button className="bg-[#B91C1C] font-black uppercase text-[10px] hover:bg-red-700 transition-all text-white">Annuler Ticket</button>
          <button className="bg-[#EAB308] font-black uppercase text-[10px] hover:bg-yellow-600 transition-all text-black">Journal Vente</button>
          <button className="bg-[#6B7280] font-black uppercase text-[10px] hover:bg-stone-600 transition-all">Choix du vendeur</button>
          <div className="col-span-2 bg-stone-900 flex items-center justify-center gap-3">
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Connected to Cloud Sync</span>
          </div>
      </footer>


      {/* Real-time Orders Overlay / Full View */}
      <AnimatePresence>
        {view === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-[#0A0A0A] top-20 flex flex-col"
          >
             <div className="flex-1 overflow-y-auto p-12 bg-[#0A0A0A]">
                <div className="max-w-7xl mx-auto">
                   <div className="flex items-center justify-between mb-12">
                      <div className="flex items-center gap-6">
                        <div className="p-5 bg-stone-900 rounded-[2.5rem] text-amber-500 shadow-2xl border border-white/5">
                           <Bell size={40} className="animate-bounce" />
                        </div>
                        <div>
                           <h2 className="text-5xl font-black uppercase italic tracking-tighter">Network Orders</h2>
                           <p className="text-stone-500 font-bold uppercase tracking-widest">{activeOrders.length} Pending Actions</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setView('pos')}
                        className="bg-stone-900 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl border border-white/5 hover:bg-stone-800 active:scale-95 transition-all"
                      >
                        Return to Terminal
                      </button>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {activeOrders.map(order => (
                        <div 
                          key={order.id}
                          className="bg-stone-900 rounded-[3rem] p-10 border border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden group"
                        >
                           <div className="flex items-start justify-between mb-8">
                              <div className="flex items-center gap-4">
                                <div className="p-4 bg-amber-600 rounded-2xl text-stone-950 font-black italic shadow-lg shadow-amber-900/40">
                                   #{order.id.slice(-4).toUpperCase()}
                                </div>
                                <div>
                                   <h4 className="text-2xl font-black text-white italic truncate">{order.customerName}</h4>
                                   <p className="text-xs text-stone-500 font-black uppercase tracking-widest mt-1">
                                      {format(order.createdAt?.toDate?.() || new Date(), 'HH:mm')} • {order.deliveryType}
                                   </p>
                                </div>
                              </div>
                              <div className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                order.status === 'ready' ? 'bg-green-500 text-stone-950' : 
                                order.status === 'preparing' ? 'bg-amber-600 text-stone-950 animate-pulse' :
                                'bg-stone-800 text-stone-400'
                              }`}>
                                {order.status}
                              </div>
                           </div>

                           <div className="space-y-4 mb-10 max-h-[200px] overflow-y-auto custom-scrollbar pr-4">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm font-bold py-2 border-b border-white/5">
                                   <div className="flex items-center gap-3">
                                      <span className="w-6 h-6 flex items-center justify-center bg-stone-800 rounded-lg text-amber-500 text-[10px] font-black">{item.quantity}x</span>
                                      <span className="italic">{item.name}</span>
                                   </div>
                                   <span className="text-stone-500 font-mono italic">{item.price * item.quantity} MAD</span>
                                </div>
                              ))}
                           </div>

                           <div className="flex items-center gap-4 justify-between border-t border-white/5 pt-8">
                              <div className="text-2xl font-black text-white tabular-nums">{order.total} MAD</div>
                              <div className="flex gap-4">
                                 <button 
                                   onClick={() => {
                                      const r = generateThermalReceipt({
                                        restaurantName: 'Cappuccino 7',
                                        orderId: order.id,
                                        items: order.items,
                                        total: order.total,
                                        cashierName: auth.currentUser?.displayName || 'Cashier',
                                        paymentMethod: 'ONLINE',
                                        date: new Date(),
                                        deliveryType: order.deliveryType,
                                        customerName: order.customerName,
                                        customerPhone: order.customerPhone
                                      });
                                      printToThermalPrinter(r);
                                   }}
                                   className="p-4 bg-stone-800 text-stone-400 hover:text-white rounded-2xl transition-all"
                                 >
                                   <Printer size={24} />
                                 </button>
                                 <button 
                                   onClick={async () => {
                                      await updateDoc(doc(db, 'orders', order.id), { status: 'delivered', deliveredAt: serverTimestamp() });
                                      toast.success('Order Completed');
                                   }}
                                   className="flex items-center gap-3 bg-white text-stone-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                                 >
                                    <CheckCircle2 size={18} />
                                    Complete
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}

                      {activeOrders.length === 0 && (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center text-stone-800 space-y-6">
                           <History size={120} strokeWidth={1} className="opacity-20" />
                           <p className="font-black uppercase tracking-[0.3em] text-sm">No Active Network Orders</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Monitoring Ticker (Bottom) */}
      <footer className="h-10 bg-amber-600 px-8 flex items-center justify-between text-stone-950 overflow-hidden shadow-2xl z-[60]">
        <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
          {activeOrders.map(o => (
            <div key={o.id} className="flex items-center gap-3">
              <span className="font-black uppercase text-[10px] italic">#{o.id.slice(-4)} {o.customerName} - {o.total} MAD</span>
              <div className="w-1.5 h-1.5 bg-black/50 rounded-full" />
            </div>
          ))}
          {activeOrders.length === 0 && (
             <span className="font-black uppercase text-[10px] italic">POS Terminal Standby • System Ready</span>
          )}
        </div>
        <div className="flex items-center gap-4 bg-black/10 px-4 h-full">
           <RefreshCw size={12} className="animate-spin" />
           <span className="font-black text-[10px] uppercase tracking-widest">Sync Active</span>
        </div>
      </footer>

      {/* Global Processing State */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
              className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full"
            />
        </div>
      )}
    </div>
  );
}
