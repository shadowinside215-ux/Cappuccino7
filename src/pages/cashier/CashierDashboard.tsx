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
  ChevronLeft,
  Calendar,
  Filter,
  Users,
  FileText,
  AlertTriangle,
  Cookie,
  Flame,
  Snowflake,
  Grape,
  Milk
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc, updateDoc, serverTimestamp, increment, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { Category, Product, Order, OrderItem } from '../../types';
import { processOrderItems } from '../../lib/orderRouting';
import { generateThermalReceipt, printToThermalPrinter } from '../../lib/thermalPrinter';
import toast from 'react-hot-toast';
import { format, startOfDay, endOfDay, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const CATEGORY_ICONS: Record<string, any> = {
  'Petit Déjeuner': Coffee,
  'Breakfast': Coffee,
  'Petites Faims': Cookie,
  'Coffee': Coffee,
  'Thé': Coffee,
  'Hot Drinks': Flame,
  'Iced Latte': Snowflake,
  'Ice Tea': Snowflake,
  'Jus': Grape,
  'Milkshakes': Milk,
  'Frappuccinos': Coffee,
};

export default function CashierDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'pos' | 'pending'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [deliveryType, setDeliveryType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { settings: brand } = useBrandSettings();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const cartEndRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  // New States for POS Functionality
  const [activeVendeur, setActiveVendeur] = useState<string>(localStorage.getItem('pos_vendeur_name') || 'CASHIER-01');
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [showVendeurGrid, setShowVendeurGrid] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [journalOrders, setJournalOrders] = useState<Order[]>([]);
  const [closureStats, setClosureStats] = useState({ total: 0, count: 0, cash: 0, card: 0 });

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

    // Load Active Orders (for Network view if needed)
    const qOrders = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'accepted', 'preparing', 'ready']),
      orderBy('createdAt', 'desc')
    );
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setActiveOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    // Load Staff for Seller Choice
    const qStaff = query(collection(db, 'users'), where('isCashier', '==', true));
    getDocs(qStaff).then(snap => {
      setStaffMembers(snap.docs.map(d => d.data()));
    });

    // Load Completed Orders for Journal (only for today by default)
    const todayStart = startOfDay(new Date());
    const qJournal = query(
      collection(db, 'orders'),
      where('isPOS', '==', true),
      where('createdAt', '>=', todayStart),
      orderBy('createdAt', 'desc')
    );
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setJournalOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      console.warn('Journal listener limited:', error.message);
    });

    // Load Unpaid Orders
    const qUnpaid = query(
      collection(db, 'orders'),
      where('isPaid', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsubUnpaid = onSnapshot(qUnpaid, (snap) => {
      setUnpaidOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    }, (error) => {
      console.warn('Unpaid listener error:', error.message);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubOrders();
      unsubJournal();
      unsubUnpaid();
    };
  }, []);

  // Real-time closure stats (Today's performance)
  useEffect(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', todayStart),
      where('createdAt', '<=', todayEnd)
    );

    const unsub = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(d => d.data() as Order).filter(o => o.isPOS);
      const total = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      const cash = orders.filter(o => o.paymentMethod === 'cash').reduce((acc, o) => acc + (o.total || 0), 0);
      const card = orders.filter(o => o.paymentMethod === 'card').reduce((acc, o) => acc + (o.total || 0), 0);
      
      setClosureStats({
        total,
        count: orders.length,
        cash,
        card
      });
    });

    return () => unsub();
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
        customerName: 'Client Passage',
        vendeur: activeVendeur,
        items: itemsWithMetadata,
        total: totalPrice,
        status: 'delivered', // POS orders are usually delivered immediately
        kitchenStatus: hasKitchenItems ? 'pending' : 'completed',
        barmanStatus: hasBarmanItems ? 'pending' : 'completed',
        deliveryType: deliveryType,
        paymentMethod,
        isPOS: true,
        isPaid: false, // Will be marked paid below
        createdAt: serverTimestamp(),
        pointsEarned: Math.floor(totalPrice / 10),
        prepTime: 20
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update Stats rigorously
      const { addOrderToStats } = await import('../../lib/stats');
      await addOrderToStats(docRef.id, totalPrice);

      const receipt = generateThermalReceipt({
        restaurantName: "Cappuccino 7",
        orderId: docRef.id,
        items: itemsWithMetadata,
        total: totalPrice,
        cashierName: activeVendeur,
        paymentMethod,
        date: new Date(),
        deliveryType,
        customerName: 'Passage'
      });
      printToThermalPrinter(receipt);

      toast.success(t('pos_sale_validated'));
      setCart([]);
    } catch (err) {
      console.error(err);
      toast.error('Échec de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintOrder = (order: Order) => {
    const receipt = generateThermalReceipt({
      restaurantName: "Cappuccino 7",
      orderId: order.id,
      items: order.items,
      total: order.total,
      cashierName: order.vendeur || 'CASHIER',
      paymentMethod: order.paymentMethod || 'CASH',
      date: order.createdAt instanceof Timestamp ? order.createdAt.toDate() : new Date(),
      deliveryType: order.deliveryType,
      customerName: order.customerName || 'Passage'
    });
    printToThermalPrinter(receipt);
    toast.success(t('pos_provisional_printed'));
  };

  const handleMarkPaid = async (order: Order, method: 'cash' | 'card') => {
    setIsProcessing(true);
    try {
      const { addOrderToStats } = await import('../../lib/stats');
      
      // Update order with payment method first
      await updateDoc(doc(db, 'orders', order.id), {
        paymentMethod: method,
        isPaid: true, // stats service will also do this but redundancy is safe
        updatedAt: serverTimestamp()
      });

      await addOrderToStats(order.id, order.total);
      
      toast.success(t('pos_payment_confirmed'));
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark as paid');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const scrollCategories = (dir: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmt = 400;
      categoryScrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmt : scrollAmt, behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (name: string) => {
    for (const key in CATEGORY_ICONS) {
      if (name.includes(key)) return CATEGORY_ICONS[key];
    }
    return UtensilsCrossed;
  };

  return (
    <div className="h-screen bg-[#111] text-[#E0E0E0] flex flex-col font-mono overflow-hidden select-none">
      {/* View Switcher Tabs */}
      <div className="h-14 bg-stone-900 border-b border-white/5 flex items-center px-4 gap-4">
         <button 
           onClick={() => setView('pos')}
           className={`px-6 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${view === 'pos' ? 'border-amber-500 text-white' : 'border-transparent text-stone-500'}`}
         >
           Terminal POS
         </button>
         <button 
           onClick={() => setView('pending')}
           className={`px-6 h-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative ${view === 'pending' ? 'border-amber-500 text-white' : 'border-transparent text-stone-500'}`}
         >
           {t('pos_pending_payments')}
           {unpaidOrders.length > 0 && (
             <span className="absolute top-2 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">
               {unpaidOrders.length}
             </span>
           )}
         </button>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Grid or Pending View */}
        <div className="flex-1 flex flex-col min-w-0">
          {view === 'pos' ? (
            <div className="flex-1 overflow-y-auto bg-[#1A1A1A] custom-scrollbar">
              <div className="grid grid-cols-5 md:grid-cols-6 border-b border-white/5">
                {filteredProducts.map(product => (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addToCart(product)}
                    className="aspect-square bg-[#00ADC0] border border-black/10 flex flex-col items-center justify-center p-2 text-center group active:brightness-50 transition-all hover:brightness-110"
                  >
                    <span className="text-[9px] md:text-[10px] font-black uppercase leading-tight mb-2 text-white drop-shadow-sm line-clamp-2 px-1">{product.name}</span>
                    <span className="text-[10px] md:text-[11px] font-black text-white/80 tabular-nums">{product.price.toFixed(2)}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-[#111] p-6 space-y-4 custom-scrollbar">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter text-amber-500 mb-8">{t('pos_unpaid_orders')}</h2>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {unpaidOrders.map(order => (
                    <div key={order.id} className="bg-stone-900 border border-white/5 p-6 rounded-3xl flex flex-col justify-between group hover:border-amber-500/30 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-xl font-black text-white uppercase italic tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                                <span className="px-2 py-0.5 bg-stone-800 text-stone-500 text-[8px] font-black uppercase rounded">{order.deliveryType}</span>
                             </div>
                             <p className="text-stone-400 font-bold text-[10px] uppercase">{order.customerName}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-black text-white tabular-nums">{order.total.toFixed(2)}</p>
                             <p className="text-[8px] text-stone-500 font-black uppercase tracking-widest">MAD TOTAL</p>
                          </div>
                       </div>

                       <div className="space-y-2 mb-6 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-[10px] font-bold text-stone-500">
                               <span>{item.quantity}x {item.name}</span>
                               <span>{item.price * item.quantity} MAD</span>
                            </div>
                          ))}
                       </div>

                       <div className="grid grid-cols-2 gap-2 mt-auto">
                          <button 
                            onClick={() => handleMarkPaid(order, 'cash')}
                            className="bg-green-600/20 text-green-500 border border-green-600/30 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <Banknote size={14} /> {t('pos_paid_cash')}
                          </button>
                          <button 
                            onClick={() => handleMarkPaid(order, 'card')}
                            className="bg-blue-600/20 text-blue-400 border border-blue-600/30 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                             <CreditCard size={14} /> {t('pos_paid_card')}
                          </button>
                       </div>
                    </div>
                  ))}
                  {unpaidOrders.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-20 bg-stone-900/50 rounded-[3rem] border-2 border-dashed border-white/5">
                       <CheckCircle2 size={64} strokeWidth={1} />
                       <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-6">All Orders Settled</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* Categories Bottom Bar - Matching the dark theme and size from image */}
          <div className="h-24 bg-[#111] border-t border-white/5 flex items-center relative">
             <div className="flex flex-col h-full bg-stone-900 border-r border-white/5 px-2 justify-center gap-1 z-20">
                <div className="flex gap-1 mb-1">
                   <button 
                     onClick={() => i18n.changeLanguage('en')}
                     className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${i18n.language === 'en' ? 'bg-amber-500 text-black' : 'bg-white/5 text-stone-500 hover:text-white'}`}
                   >
                     EN
                   </button>
                   <button 
                     onClick={() => i18n.changeLanguage('fr')}
                     className={`px-2 py-0.5 rounded text-[8px] font-black uppercase transition-colors ${i18n.language === 'fr' ? 'bg-amber-500 text-black' : 'bg-white/5 text-stone-500 hover:text-white'}`}
                   >
                     FR
                   </button>
                </div>
                <button 
                  onClick={() => setShowVendeurGrid(true)}
                  className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg text-[8px] font-black uppercase"
                >
                  {activeVendeur}
                </button>
                <div className="flex gap-1">
                   <button onClick={() => setShowJournalModal(true)} className="p-1.5 bg-white/5 rounded-lg text-stone-400 hover:text-white" title={t('pos_journal')}><History size={14} /></button>
                   <button onClick={() => setShowClosureModal(true)} className="p-1.5 bg-white/5 rounded-lg text-red-500 hover:bg-red-500/10" title={t('pos_closure')}><LogOut size={14} /></button>
                </div>
             </div>

             <div className="h-full px-4 border-r border-white/5 flex items-center bg-stone-950/50">
                <Search size={14} className="text-stone-500 mr-2" />
                <input 
                  type="text" 
                  placeholder={t('pos_search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-white placeholder:text-stone-700 w-32"
                />
             </div>
             <button 
               onClick={() => scrollCategories('left')}
               className="absolute left-0 z-10 h-full w-12 bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
             >
               <ChevronLeft size={24} />
             </button>
             
             <div 
               ref={categoryScrollRef}
               className="flex h-full overflow-x-auto custom-scrollbar-hide scroll-smooth flex-1 items-center px-12 gap-px bg-[#111]"
             >
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`flex-shrink-0 min-w-[120px] h-full flex flex-col items-center justify-center gap-1 border-r border-white/5 uppercase text-[9px] font-black transition-all ${selectedCategory === 'all' ? 'bg-amber-600 text-black' : 'text-stone-500 hover:bg-white/5'}`}
                >
                  <LayoutGrid size={16} />
                  {t('pos_all')}
                </button>
                {categories.map(cat => {
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 min-w-[140px] h-full flex flex-col items-center justify-center gap-1 border-r border-white/5 uppercase text-[9px] font-black transition-all ${selectedCategory === cat.id ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-white/5'}`}
                    >
                      <Icon size={16} />
                      {cat.name}
                    </button>
                  );
                })}
             </div>

             <button 
               onClick={() => scrollCategories('right')}
               className="absolute right-0 z-10 h-full w-12 bg-black/60 flex items-center justify-center text-white hover:bg-black transition-colors"
             >
               <ChevronRight size={24} />
             </button>
          </div>
        </div>

        {/* Right Side: Virtual Ticket (Specific fixed width as in image) */}
        <div className="w-[300px] md:w-[350px] bg-[#E5E7EB] text-[#111] flex flex-col shadow-2xl relative border-l border-white/10">
           {/* Ticket Content */}
           <div className="flex-1 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-gray-300 flex items-center justify-between bg-gray-200">
                <span className="text-[11px] font-black uppercase tracking-widest text-stone-600">{t('pos_current_ticket')}</span>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setDeliveryType(prev => prev === 'dine-in' ? 'takeaway' : 'dine-in')}
                     className="px-3 py-1 bg-stone-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"
                   >
                     {deliveryType === 'dine-in' ? t('pos_dine_in') : t('pos_takeaway')}
                   </button>
                   <button 
                      onClick={() => {
                        if (cart.length === 0) return;
                        if (confirm(t('pos_confirm_cancel'))) {
                           setCart([]);
                           toast.success(t('pos_cancel_ticket'));
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {cart.map(item => (
                  <div key={item.productId} className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50 group hover:bg-white transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-1">
                           <button onClick={() => updateQuantity(item.productId, 1)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600 transition-colors"><Plus size={14} /></button>
                           <span className="font-black text-sm tabular-nums">{item.quantity}</span>
                           <button onClick={() => updateQuantity(item.productId, -1)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                        </div>
                        <span className="text-[11px] font-bold uppercase tracking-tight max-w-[180px] leading-tight text-stone-800">{item.name}</span>
                     </div>
                     <span className="font-black tabular-nums text-stone-900">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                {cart.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center opacity-40 py-20 grayscale">
                      <Calculator size={64} className="text-gray-400 mb-4" />
                      <p className="font-black uppercase tracking-[0.2em] text-[10px] text-gray-500">{t('pos_ready_for_order')}</p>
                   </div>
                )}
                <div ref={cartEndRef} />
             </div>
           </div>

           {/* Totals & Payments Section */}
           <div className="flex flex-col">
              {/* Total Display (Dark Blue-Gray) */}
              <div className="bg-[#1D3244] p-6 flex justify-between items-end border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
                 <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">{t('pos_total_price')}</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">{totalPrice.toFixed(2)}</span>
                    <span className="text-sm font-bold text-white/60">MAD</span>
                 </div>
              </div>

              {/* Payment Buttons (Large blocks as in image) */}
              <div className="h-32 grid grid-cols-3 gap-px bg-[#111] p-px border-t border-white/5">
                 <button 
                   onClick={() => handleCheckout('cash')}
                   disabled={cart.length === 0}
                   className="bg-[#22C55E] hover:brightness-110 active:brightness-90 transition-all flex flex-col items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                 >
                    <Banknote size={24} /> {t('pos_cash')}
                 </button>
                 <button 
                   onClick={() => handleCheckout('card')}
                   disabled={cart.length === 0}
                   className="bg-[#3B82F6] hover:brightness-110 active:brightness-90 transition-all flex flex-col items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                 >
                    <CreditCard size={24} /> {t('pos_card')}
                 </button>
                 <button 
                   onClick={() => {
                      if(cart.length === 0) return;
                      const r = generateThermalReceipt({
                         restaurantName: "Cappuccino 7",
                         orderId: "PROV-" + Math.floor(Math.random()*1000),
                         items: cart,
                         total: totalPrice,
                         cashierName: activeVendeur,
                         paymentMethod: 'PROVISOIRE',
                         date: new Date(),
                         deliveryType
                      });
                      printToThermalPrinter(r);
                      toast.success(t('pos_provisional_printed'));
                   }}
                   disabled={cart.length === 0}
                   className="bg-[#F59E0B] hover:brightness-110 active:brightness-90 transition-all flex flex-col items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                 >
                    <Printer size={24} /> {t('pos_print_note')}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* MODALS (Clôture, Journal, Vendeur) - Same functionality, matching look */}
      <AnimatePresence>
        {showClosureModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#1a1a1a] rounded-[2rem] w-full max-w-xl overflow-hidden border border-white/10 shadow-2xl">
               <div className="bg-red-700 p-8 text-white">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t('pos_session_closure')}</h2>
               </div>
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-stone-900 p-6 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_total_sales')}</span>
                        <span className="text-3xl font-black text-white">{closureStats.total.toFixed(2)} MAD</span>
                     </div>
                     <div className="bg-stone-900 p-6 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_orders_count')}</span>
                        <span className="text-3xl font-black text-amber-500">{closureStats.count}</span>
                     </div>
                     <div className="bg-stone-900 p-6 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_cash_rev')}</span>
                        <span className="text-3xl font-black text-green-500">{closureStats.cash.toFixed(2)}</span>
                     </div>
                     <div className="bg-stone-900 p-6 rounded-2xl border border-white/5">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_card_rev')}</span>
                        <span className="text-3xl font-black text-blue-500">{closureStats.card.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setShowClosureModal(false)} className="flex-1 py-4 rounded-xl bg-stone-800 text-stone-400 font-black uppercase text-[11px] hover:bg-stone-700 transition-colors">{t('cancel')}</button>
                     <button 
                       onClick={() => {
                         toast.success('Clôture validée - Session terminée');
                         navigate('/login');
                       }}
                       className="flex-1 py-4 rounded-xl bg-red-600 text-white font-black uppercase text-[11px] hover:bg-red-500 transition-colors shadow-lg"
                     >
                       {t('pos_confirm_close')}
                     </button>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showJournalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col p-8">
             <header className="flex justify-between items-center mb-10 max-w-7xl mx-auto w-full px-4">
                <div className="flex items-center gap-6">
                   <div className="p-6 bg-amber-600 rounded-3xl text-stone-950 shadow-2xl">
                      <History size={40} />
                   </div>
                   <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">{t('pos_sales_journal')}</h2>
                </div>
                <button onClick={() => setShowJournalModal(false)} className="bg-white/10 p-4 rounded-full text-white hover:bg-white/20 transition-all"><X size={32} /></button>
             </header>
             <div className="flex-1 bg-stone-900/50 rounded-[3rem] border border-white/5 overflow-hidden flex flex-col max-w-7xl mx-auto w-full shadow-2xl">
                <div className="p-8 border-b border-white/5 grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-stone-500">
                   <span className="pl-6">{t('pos_time')}</span>
                   <span>{t('pos_seller_id')}</span>
                   <span>{t('pos_payment_status')}</span>
                   <span className="text-right pr-6">{t('pos_amount')} (MAD)</span>
                   <span className="text-center">Action</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                   {journalOrders.map(order => (
                     <div key={order.id} className="bg-stone-900/80 border border-white/5 p-6 rounded-2xl grid grid-cols-5 items-center hover:bg-white/[0.02] transition-colors group">
                        <span className="pl-6 text-stone-500 font-bold tabular-nums flex items-center gap-3">
                           <Clock size={14} className="opacity-40" />
                           {order.createdAt instanceof Timestamp ? format(order.createdAt.toDate(), 'HH:mm:ss') : 'LIVE'}
                        </span>
                        <div>
                           <div className="text-white font-black uppercase text-sm italic group-hover:text-amber-500 transition-colors">#{order.id.slice(-6).toUpperCase()}</div>
                           <div className="text-[9px] text-stone-600 font-bold uppercase tracking-widest mt-1">{order.vendeur}</div>
                        </div>
                        <div className="flex gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.paymentMethod === 'cash' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                               {order.paymentMethod}
                           </span>
                           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest self-center opacity-40">{order.deliveryType}</span>
                        </div>
                        <span className="text-right pr-6 text-2xl font-black text-white tabular-nums group-hover:scale-110 transition-transform origin-right">{order.total.toFixed(2)}</span>
                        <div className="flex justify-center">
                           <button 
                             onClick={() => handlePrintOrder(order)}
                             className="p-3 bg-stone-800 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-stone-950 transition-all shadow-lg"
                           >
                             <Printer size={18} />
                           </button>
                        </div>
                     </div>
                   ))}
                   {journalOrders.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale scale-150">
                         <FileText size={80} strokeWidth={1} />
                         <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-6">{t('no_active_orders')}</p>
                      </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVendeurGrid && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-12">
            <div className="w-full max-w-4xl">
               <div className="text-center mb-16">
                  <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-4">{t('pos_identification')}</h2>
                  <p className="text-stone-500 font-black uppercase tracking-[0.5em] text-[10px]">{t('pos_select_operator')}</p>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {staffMembers.map((staff, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveVendeur(staff.name);
                        localStorage.setItem('pos_vendeur_name', staff.name);
                        setShowVendeurGrid(false);
                        toast.success(`Opérateur activé: ${staff.name}`);
                      }}
                      className={`aspect-square rounded-[3rem] flex flex-col items-center justify-center gap-6 border-4 shadow-2xl transition-all relative overflow-hidden group ${activeVendeur === staff.name ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-white/5 bg-stone-900 text-stone-500 hover:border-white/10'}`}
                    >
                       <div className={`p-6 rounded-[2rem] ${activeVendeur === staff.name ? 'bg-amber-600 text-stone-950 shadow-lg' : 'bg-white/5 shadow-xl group-hover:bg-white/10'}`}>
                          <User size={48} strokeWidth={1.5} />
                       </div>
                       <span className="font-black uppercase tracking-widest text-[12px]">{staff.name}</span>
                       {activeVendeur === staff.name && (
                         <div className="absolute top-4 right-4 bg-amber-500 text-stone-950 rounded-full p-1 shadow-lg">
                           <CheckCircle2 size={16} />
                         </div>
                       )}
                    </motion.button>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.05, y: -5 }}
                    onClick={() => {
                      setActiveVendeur('CASHIER-01');
                      localStorage.setItem('pos_vendeur_name', 'CASHIER-01');
                      setShowVendeurGrid(false);
                    }}
                    className="aspect-square rounded-[3rem] bg-stone-900 border-4 border-white/5 text-stone-500 flex flex-col items-center justify-center gap-6 hover:border-white/10 shadow-2xl transition-all group"
                  >
                     <div className="p-6 rounded-[2rem] bg-white/5 shadow-xl group-hover:bg-white/10">
                        <LayoutGrid size={48} strokeWidth={1.5} />
                     </div>
                     <span className="font-black uppercase tracking-widest text-[12px]">STANDARD-POS</span>
                  </motion.button>
               </div>
               <button onClick={() => setShowVendeurGrid(false)} className="mt-20 mx-auto block w-16 h-16 bg-stone-900 border border-white/10 rounded-full flex items-center justify-center text-stone-500 hover:text-white transition-all shadow-xl"><X size={28} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Processing State Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center space-y-6">
            <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full shadow-[0_0_50px_rgba(217,119,6,0.2)]" />
            <span className="text-amber-500 font-black uppercase tracking-[0.6em] text-[10px] animate-pulse">{t('pos_transmission')}</span>
        </div>
      )}
    </div>
  );
}
