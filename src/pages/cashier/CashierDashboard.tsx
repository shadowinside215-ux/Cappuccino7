import { translateCustomization } from '../../utils/translations';
import React, { useState, useEffect, useRef } from 'react';
import { signOutApp } from '../../lib/googleAuth';
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
  Milk,
  Navigation,
  Sandwich,
  Wifi,
  WifiOff,
  Database,
  Eye,
  Gift
, Check, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc, updateDoc, serverTimestamp, increment, addDoc, Timestamp, onSnapshotsInSync } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useBrandSettings } from '../../lib/brand';
import { Category, Product, Order, OrderItem } from '../../types';
import { processOrderItems } from '../../lib/orderRouting';
import { generateThermalReceipt, printToThermalPrinter } from '../../lib/thermalPrinter';
import toast from 'react-hot-toast';
import { startOfDay, endOfDay } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { format, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { OrderTimer } from '../../components/OrderTimer';
import { OrderTimestamps } from '../../components/OrderTimestamps';
import OptimizedImage from '../../components/ui/OptimizedImage';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
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
  'Sandwiches': Sandwich,
  'Sandwich': Sandwich,
  'Panini': Sandwich,
  'Tacos': Sandwich,
  'Burger': Sandwich,
  'سندويشات': Sandwich,
  'فطور': Coffee,
  'حلويات': Cookie,
  'مشروبات': Coffee,
};

export default function CashierDashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'pos' | 'pending' | 'history'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [journalDate, setJournalDate] = useState(() => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
  });
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('pos_current_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [deliveryType, setDeliveryType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedClientLoyalty, setSelectedClientLoyalty] = useState<Record<string, number> | null>(null);
  const [selectedClientRewards, setSelectedClientRewards] = useState<Record<string, number> | null>(null);
  const { settings: brand } = useBrandSettings();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const cartEndRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const isOnline = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);

  // Auto-save cart to localStorage
  useEffect(() => {
    localStorage.setItem('pos_current_cart', JSON.stringify(cart));
  }, [cart]);

  // Track Firestore sync status
  useEffect(() => {
    const unsubSync = onSnapshotsInSync(db, () => {
      // This fires when all local changes have been synchronized with the server
      setIsSyncing(false);
    });
    return () => unsubSync();
  }, []);



  // New States for POS Functionality
  const [activeVendeur, setActiveVendeur] = useState<string>(localStorage.getItem('pos_vendeur_name') || 'CASHIER');
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [showVendeurGrid, setShowVendeurGrid] = useState(false);
  const [showClosureModal, setShowClosureModal] = useState(false);
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
      where('status', 'in', ['pending', 'Waiting', 'accepted', 'Taken', 'preparing', 'ready']),
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

    // Load Unpaid Orders
    const qUnpaid = query(
      collection(db, 'orders'),
      where('isPaid', '==', false),
      orderBy('createdAt', 'desc')
    );
    // Listen for loyalty reward notifications
    const qRewards = query(
      collection(db, 'waiterRequests'),
      where('status', '==', 'new'),
      where('type', 'in', ['loyalty_reward', 'reward_redemption']),
      orderBy('timestamp', 'desc')
    );
    let isInitialRewardsLoad = true;
    const unsubRewards = onSnapshot(query(collection(db, 'waiterRequests'), where('type', 'in', ['loyalty_reward', 'reward_redemption']), orderBy('timestamp', 'desc')), (snap) => {
      setRewardsHistory(snap.docs.map(d => ({ id: d.id, ...d.data()})));
      if (isInitialRewardsLoad) {
        isInitialRewardsLoad = false;
        return;
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const req = change.doc.data();
          toast.success(`🎁 ${req.message} (${req.clientName})`, {
            duration: 10000,
            icon: '🏆',
            position: 'top-center'
          });
        }
      });
    }, (error) => {
      console.warn('Rewards listener error:', error.message);
    });

    const unsubUnpaid = onSnapshot(qUnpaid, (snap) => {
      const orders = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      setUnpaidOrders(orders);
      
      // Auto-load latest unpaid order if cart is empty and nothing is selected
      if (orders.length > 0) {
        setUnpaidOrders(prev => {
          // If we had no orders before or the latest one changed
          if (prev.length === 0 || (orders[0] && orders[0].id !== prev[0]?.id)) {
            // Only auto-load if current cart is empty and we aren't already viewing an order
            setCart(currentCart => {
              setSelectedOrder(currentSelected => {
                if (currentCart.length === 0 && !currentSelected) {
                  return orders[0];
                }
                return currentSelected;
              });
              return currentCart;
            });
          }
          return orders;
        });
      }
    }, (error) => {
      console.warn('Unpaid listener error:', error.message);
    });

    return () => {
      unsubCat();
      unsubProd();
      unsubOrders();
      unsubUnpaid();
      unsubRewards();
    };
  }, []);

  // Load Completed Orders for Journal (based on selected date)
  useEffect(() => {
    const [y, m, d] = journalDate.split('-').map(Number);
    const targetStart = new Date(y, m - 1, d, 0, 0, 0);
    const targetEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
    
    const qJournal = query(
      collection(db, 'orders'),
      where('isPaid', '==', true),
      where('createdAt', '>=', targetStart),
      where('createdAt', '<=', targetEnd),
      orderBy('createdAt', 'desc')
    );
    
    const unsubJournal = onSnapshot(qJournal, (snap) => {
      setJournalOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => {
      console.warn('Journal listener error:', error.message);
    });
    
    return () => unsubJournal();
  }, [journalDate]);

  // Fetch selected client's loyalty in real-time
  useEffect(() => {
    let unsubUser = () => {};
    if (selectedOrder && selectedOrder.userId && selectedOrder.userId !== 'cashier') {
      import('firebase/firestore').then(({ onSnapshot, doc }) => {
        unsubUser = onSnapshot(doc(db, 'users', selectedOrder.userId), (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setSelectedClientLoyalty(data.itemLoyalty || {});
            setSelectedClientRewards(data.availableRewards || {});
          } else {
            setSelectedClientLoyalty(null);
            setSelectedClientRewards(null);
          }
        });
      });
    } else {
      setSelectedClientLoyalty(null);
      setSelectedClientRewards(null);
    }
    return () => unsubUser();
  }, [selectedOrder?.id, selectedOrder?.userId]);

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
      const orders = snap.docs.map(d => d.data() as Order).filter(o => o.isPaid);
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
            ? { ...item, quantity: Math.min(11, item.quantity + 1) } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        description: product.description,
        categoryName: categories.find(c => c.id === product.categoryId)?.name || 'Menu'
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter((item): item is OrderItem => item !== null);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'reward') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    if (paymentMethod === 'reward') {
       toast.error("Not enough points for a reward");
       setIsProcessing(false);
       return;
    }

    try {
      setIsSyncing(true);
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
        isPaid: false, // addOrderToStats will set this to true
        createdAt: serverTimestamp(),
        localCreatedAt: new Date().toISOString(), 
        pointsEarned: Math.floor(totalPrice / 10),
        prepTime: hasKitchenItems ? 30 : 10
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update Stats rigorously
      const { addOrderToStats } = await import('../../lib/stats');
      // For new POS, we know it hasn't been paid/counted yet
      const statsPromise = addOrderToStats(docRef.id, totalPrice, { skipCheck: true, paymentMethod });
      
      if (isOnline) {
        await statsPromise;
      }

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
      items: order.items.map(item => ({...item, customization: translateCustomization(item.customization || '', t)})),
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

  const handleMarkPaid = async (order: Order, method: 'cash' | 'card' | 'reward') => {
    setIsProcessing(true);
    try {
      setIsSyncing(true);
      const { addOrderToStats } = await import('../../lib/stats');
      const { getDoc, increment } = await import('firebase/firestore');

      if (method === 'reward') {
        if (!order.userId || order.userId === 'cashier' || order.isPOS) {
          toast.error("Not enough points for a reward");
          setIsProcessing(false);
          setIsSyncing(false);
          return;
        }
        const userSnap = await getDoc(doc(db, 'users', order.userId));
        const itemLoyalty = userSnap.data()?.itemLoyalty || {};
        let eligibleItem = null;
        for (const item of order.items) {
          if (item.productId && itemLoyalty[item.productId] >= 11) {
            eligibleItem = item;
            break;
          }
        }
        if (!eligibleItem) {
          toast.error("Not enough points for a reward");
          setIsProcessing(false);
          setIsSyncing(false);
          return;
        }
        // Deduct 11 points
        await updateDoc(doc(db, 'users', order.userId), {
          [`itemLoyalty.${eligibleItem.productId}`]: increment(-11)
        });
        
        // Update order item price to 0 and handle quantity > 1
        const updatedItems = [];
        for (const item of order.items) {
          if (item === eligibleItem) {
            if (item.quantity > 1) {
              updatedItems.push({ ...item, quantity: item.quantity - 1 });
              updatedItems.push({
                ...item,
                productId: item.productId + '-reward',
                name: item.name + ' (Loyalty Reward)',
                price: 0,
                quantity: 1
              });
            } else {
              updatedItems.push({
                ...item,
                name: item.name + ' (Loyalty Reward)',
                price: 0
              });
            }
          } else {
            updatedItems.push(item);
          }
        }
        const newTotal = updatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        
        await updateDoc(doc(db, 'orders', order.id), {
          items: updatedItems,
          total: newTotal
        });
        order.items = updatedItems;
        order.total = newTotal;
      }
      
      // Update order with payment method
      // We don't set isPaid: true here because addOrderToStats will handle it in a batch
      const updatePromise = updateDoc(doc(db, 'orders', order.id), {
        paymentMethod: method,
        updatedAt: serverTimestamp(),
        paidAtLocal: new Date().toISOString()
      });

      if (isOnline) {
        await updatePromise;
        await addOrderToStats(order.id, order.total, { paymentMethod: method });
        
// Give points to the user based on items ordered
        if (method !== 'reward' && order.userId && !order.isPOS) {
          try {
            const { increment } = await import('firebase/firestore');
            const userRef = doc(db, 'users', order.userId);
            const userSnap = await (await import('firebase/firestore')).getDoc(userRef);
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const itemLoyalty = userData.itemLoyalty || {};
              const updates: Record<string, any> = {};
              
              const pointsEarned: Record<string, number> = {};
              
              order.items.forEach(item => {
                if (item.productId && item.price > 0 && !item.name.includes('(Loyalty Reward)')) {
                  pointsEarned[item.productId] = (pointsEarned[item.productId] || 0) + item.quantity;
                }
              });
              
              for (const [productId, earnedCount] of Object.entries(pointsEarned)) {
                  const currentPoints = itemLoyalty[productId] || 0;
                  let newPoints = currentPoints + earnedCount;
                  if (newPoints > 11) newPoints = 11;
                  
                  updates[`itemLoyalty.${productId}`] = newPoints;
                  
                  if (currentPoints < 11 && newPoints === 11) {
                      // Reached 11 points! Send notification
                      const notificationDoc = {
                        tableZone: 'General',
                        fullTableLabel: order.customerName,
                        clientName: order.customerName,
                        status: 'new',
                        timestamp: serverTimestamp(),
                        type: 'loyalty_reward',
                        message: `Reward Unlocked for ${order.items.find(i => i.productId === productId)?.name}!`,
                        waiterId: order.waiterId || null
                      };
                      import('firebase/firestore').then(({ addDoc, collection }) => {
                        addDoc(collection(db, 'waiterRequests'), notificationDoc);
                      });
                  }
              }
              
              if (Object.keys(updates).length > 0) {
                await updateDoc(userRef, updates);
              }
            }
          } catch (e) {
            console.error('Error updating loyalty points:', e);
          }
        }
      }
      
      if (method === 'reward') {
        toast.success(t('pos_reward_processed', 'Reward claimed successfully'));
      } else {
        toast.success(t('pos_payment_confirmed'));
      }
      setSelectedOrder(null); // Clear selected order after payment
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

  const handleRewardCheck = async (productId: string, itemIndex: number, originalItem: any) => {
    if (!selectedOrder || !selectedOrder.userId) return;
    try {
      setIsProcessing(true);
      const { runTransaction, doc } = await import('firebase/firestore');
      const userRef = doc(db, 'users', selectedOrder.userId);
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const orderDoc = await transaction.get(orderRef);
        
        if (!userDoc.exists() || !orderDoc.exists()) {
           throw new Error("Document does not exist!");
        }
        
        const itemLoyalty = userDoc.data().itemLoyalty || {};
        const currentPoints = itemLoyalty[productId] || 0;
        
        if (currentPoints < 11) {
           throw new Error("Not enough loyalty points for this reward.");
        }
        
        const orderData = orderDoc.data() as Order;
        
        const items = [...orderData.items];
        const item = items[itemIndex];
        
        if (item.price === 0 || item.name.includes('(Loyalty Reward)')) {
            throw new Error("Item is already a reward.");
        }
        
        if (item.quantity > 1) {
            item.quantity -= 1;
            items.push({
               ...item,
               productId: item.productId + '-reward',
               name: item.name + ' (Loyalty Reward)',
               price: 0,
               quantity: 1
            });
        } else {
            item.price = 0;
            item.name = item.name + ' (Loyalty Reward)';
        }
        
        const newTotal = Math.max(0, orderData.total - originalItem.price);
        
        transaction.update(userRef, {
          [`itemLoyalty.${productId}`]: currentPoints - 11
        });
        
        transaction.update(orderRef, {
          items: items,
          total: newTotal
        });
      });
      
      toast.success('Loyalty reward claimed successfully! Item is now free.');
      
      // We don't need to manually update state if we are listening to snapshot,
      // but selectedOrder is static, so we might need to fetch it again or close it.
      // Easiest is to let the user re-select, or just clear selectedOrder to force UI refresh.
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to apply reward');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTranslatedCategory = (catName: string) => {
    const name = catName.toLowerCase();
    if (name.includes('frappuccino')) return t('categories.frappuccino');
    if (name.includes('breakfast') || name.includes('petit déjeuner') || name.includes('فطور')) return t('categories.breakfast');
    if (name.includes('petites faims') || name.includes('وجبات خفيفة')) return t('categories.petites_faims');
    if (name.includes('milkshake') || name.includes('ميلك شيك')) return t('categories.milkshakes');
    if (name.includes('smothie') || name.includes('smoothie') || name.includes('سموثي')) return t('categories.smoothies');
    if (name.includes('mojito') || name.includes('موهيتو')) return t('categories.mojitos');
    if (name.includes('brunch')) return t('categories.brunch');
    if (name.includes('coffee')) return t('categories.coffee');
    if (name.includes('tea')) return t('categories.tea');
    if (name.includes('jus') || name.includes('juice')) return t('categories.jus');
    if (name.includes('hot drinks')) return t('categories.hot_drinks');
    if (name.includes('hot beverages')) return t('categories.hot_beverages');
    if (name.includes('iced latte') || name.includes('iced latté')) return t('categories.iced_latte');
    if (name.includes('ice tea')) return t('categories.ice_tea');
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
    return t(`categories.${name}`, catName);
  };

  const getCategoryIcon = (name: string) => {
    for (const key in CATEGORY_ICONS) {
      if (name.includes(key)) return CATEGORY_ICONS[key];
    }
    return UtensilsCrossed;
  };

  return (
    <div className="h-screen bg-bento-bg text-bento-ink flex flex-col font-mono overflow-hidden select-none">
      {/* View Switcher Tabs - POS / PENDING / STAFF */}
      <div className="h-14 bg-bento-card-bg border-b border-bento-card-border flex items-center px-2 md:px-4 gap-2 md:gap-4 shrink-0 overflow-x-auto custom-scrollbar-hide">
         {/* Online/Offline Status */}
         <div className="flex items-center gap-2 pr-4 border-r border-bento-card-border">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isOnline ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500 animate-pulse'}`}>
               {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
               <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            {isSyncing && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                 <RefreshCw size={10} className="animate-spin" />
                 <span>SYNCING</span>
              </div>
            )}
         </div>

         <div className="flex-1 flex gap-2 md:gap-4 ml-1 md:ml-2 items-center h-full">
           <button 
             onClick={() => setView('pos')}
             className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === 'pos' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}`}
           >
             {t('pos_take_order')}
           </button>
           <button 
             onClick={() => setView('pending')}
             className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === 'pending' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}`}
           >
             {t('pos_pending_payments')}
             {unpaidOrders.length > 0 && (
               <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full font-black">
                 {unpaidOrders.length}
               </span>
             )}
           </button>
           <button 
             onClick={() => setView('history')}
             className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === 'history' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}`}
           >
             {t('pos_sales_journal')}
           </button>
           
            
           <div className="flex bg-stone-500/10 p-1 rounded-lg shrink-0 ml-auto mr-2 md:mr-4">
               <button onClick={() => i18n.changeLanguage('en')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'en' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>EN</button>
               <button onClick={() => i18n.changeLanguage('fr')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'fr' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>FR</button>
               <button onClick={() => i18n.changeLanguage('ar')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'ar' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>AR</button>
           </div>

           <button 
              onClick={() => setShowClosureModal(true)}
              className="p-1.5 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20"
            >
              <LogOut size={14} />
            </button>
         </div>
         
         {/* Mobile Cart Toggle */}
         {view === 'pos' && (
           <div className="md:hidden">
              <button 
                onClick={() => setShowMobileCart(!showMobileCart)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${showMobileCart ? 'bg-amber-500 border-amber-600 text-stone-900' : 'bg-stone-500/10 border-stone-500/20 text-stone-500'}`}
              >
                 <ShoppingCart size={18} />
                 {cart.length > 0 && <span className="text-[10px] font-black">{cart.length}</span>}
              </button>
           </div>
         )}
      </div>
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Product Grid or Pending View */}
        <div className={`flex-1 flex flex-col min-w-0 ${showMobileCart && view === 'pos' ? 'hidden md:flex' : 'flex'}`}>
          {view === 'pos' && (
            <div className="flex-1 overflow-y-auto bg-bento-bg custom-scrollbar p-2 md:p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-4 pb-20 md:pb-0">
                {filteredProducts.map((product, idx) => (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={async () => {
                      addToCart(product);
                    }}
                    className="flex flex-col bg-white dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-2xl overflow-hidden group active:brightness-90 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1"
                  >
                    <div className="aspect-square w-full bg-stone-100 dark:bg-stone-900 overflow-hidden relative">
                       {product.hideImage ? (
                         <div className="w-full h-full bg-[#f6f3f0] dark:bg-stone-800 flex flex-col items-center justify-center text-stone-400 group-hover:scale-110 transition-transform duration-500">
                           <Coffee size={32} className="opacity-20" />
                         </div>
                       ) : (
                         <OptimizedImage 
                           src={product.image} 
                           alt={product.name}
                           size="medium"
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           containerClassName="w-full h-full"
                           showOverlay={false}
                           priority={idx < 12}
                         />
                       )}
                       <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                          <span className="text-[10px] sm:text-xs font-black text-white tabular-nums">{product.price.toFixed(0)} MAD</span>
                       </div>
                    </div>
                    <div className="p-2 sm:p-4 flex flex-col items-center justify-center text-center flex-1">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase leading-tight line-clamp-2 text-stone-900 dark:text-stone-100 tracking-tight">{t(`products.${product.name}`, product.name)}</span>
                      {product.description && (
                        <p className="text-[7px] sm:text-[8px] text-stone-400 font-medium leading-tight mt-1 line-clamp-2 italic">
                          {t(`descriptions.${product.name}`, product.description)}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {view === 'pending' && (
            <div className="flex-1 overflow-y-auto bg-bento-bg p-6 space-y-4 custom-scrollbar">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter text-amber-500 mb-8">{t('pos_unpaid_orders')}</h2>
               
               {/* Ready for Collection Section */}
               <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-stone-900">
                        <CheckCircle2 size={16} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-bento-ink">{t('ready_for_collection', 'Ready for Collection')}</h3>
                     <div className="h-px flex-1 bg-stone-500/10"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     {unpaidOrders.filter(o => (o.status === 'delivered' || o.status === 'Completed' || o.status === 'ready') || o.isPOS).map(order => (
                        <div key={order.id} className="bg-white border-2 border-green-500/50 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-green-500 transition-all shadow-xl shadow-green-500/5 min-h-[250px] sm:min-h-[350px]">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${order.deliveryType === 'dine-in' ? 'bg-stone-900 text-white border border-amber-500/20 shadow-lg' : 'bg-stone-100 text-stone-500'}`}>
                                      {order.deliveryType === 'dine-in' ? (
                                        <div className="flex items-center gap-2">
                                          <Navigation size={10} className="text-amber-400" />
                                          {order.fullTableLabel || order.tableNumber}
                                        </div>
                                      ) : order.deliveryType}
                                    </span>
                                 </div>
                                 <p className="text-stone-400 font-bold text-[10px] uppercase">{order.customerName}</p>
                                 {order.waiterName && (
                                   <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black uppercase text-amber-600">
                                      <Users size={10} />
                                      {t('waiter', 'Waiter') as string}: {order.waiterName}
                                   </div>
                                 )}
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-stone-900 tabular-nums">{order.total.toFixed(2)}</p>
                                 <p className="text-[8px] text-stone-500 font-black uppercase tracking-widest">MAD TOTAL</p>
                              </div>
                           </div>
                           
                           <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex flex-col gap-0.5 pb-2 border-b border-stone-50">
                                   <div className="flex justify-between text-[10px] font-black uppercase text-stone-700">
                                      <span>{item.quantity}x {t(`products.${item.name}`, item.name) as string}</span>
                                      <span>{(item.price * item.quantity).toFixed(2)} MAD</span>
                                   </div>
                                   {(item as any).categoryName && (
                                     <span className="text-[7px] font-black uppercase tracking-widest text-amber-600/60">
                                       {t(`categories.${(item as any).categoryName}`, (item as any).categoryName) as string}
                                     </span>
                                   )}
                                   {item.customization && (
                                     <span className="text-[8px] font-black text-bento-ink/40 uppercase italic">
                                       • {translateCustomization(item.customization, t)}
                                     </span>
                                   )}
                                </div>
                              ))}
                           </div>
                           
                           <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handlePrintOrder(order)}
                                className="p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all flex items-center justify-center shadow-lg"
                                title="Print Thermal Receipt"
                              >
                                <Printer size={24} />
                              </button>
                              <button 
                                onClick={() => handleMarkPaid(order, 'cash')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-stone-950 p-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-green-500/20"
                              >
                                 <span className="flex items-center gap-2">
                                    <Banknote size={18} />
                                    {t('pay_cash', 'Pay Cash')}
                                 </span>
                              </button>
                           </div>
                        </div>
                     ))}
                     {unpaidOrders.filter(o => (o.status === 'delivered' || o.status === 'Completed' || o.status === 'ready') || o.isPOS).length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 grayscale border-2 border-dashed border-stone-200 rounded-[3rem]">
                           <CheckCircle2 size={48} className="mb-4 text-stone-400" />
                           <p className="font-black uppercase tracking-[0.3em] text-[10px] text-stone-500 text-center px-4">{t('no_orders_ready', 'No orders ready for collection')}</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* In Preparation Section */}
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-stone-900">
                        <Clock size={16} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-bento-ink">{t('in_preparation', 'In Preparation')}</h3>
                     <div className="h-px flex-1 bg-stone-500/10"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     {unpaidOrders.filter(o => (o.status === 'preparing' || o.status === 'pending') && !o.isPOS).map(order => (
                        <div key={order.id} className="bg-white/50 border border-amber-500/20 p-6 rounded-[2.5rem] flex flex-col justify-between group opacity-70 hover:opacity-100 transition-all min-h-[250px] sm:min-h-[350px]">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${order.deliveryType === 'dine-in' ? 'bg-stone-900 text-white border border-amber-500/20 shadow-lg' : 'bg-stone-100 text-stone-500'}`}>
                                      {order.deliveryType === 'dine-in' ? (
                                        <div className="flex items-center gap-2">
                                          <Navigation size={10} className="text-amber-400" />
                                          {order.fullTableLabel || order.tableNumber}
                                        </div>
                                      ) : order.deliveryType}
                                    </span>
                                 </div>
                                 <p className="text-stone-400 font-bold text-[10px] uppercase">{order.customerName}</p>
                                 {order.waiterName && (
                                   <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black uppercase text-amber-600">
                                      <Users size={10} />
                                      {t('waiter', 'Waiter') as string}: {order.waiterName}
                                   </div>
                                 )}
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-stone-400 tabular-nums">{order.total.toFixed(2)}</p>
                              </div>
                           </div>
                           
                           <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar opacity-60">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-[9px] font-bold uppercase text-stone-500">
                                   <span>{item.quantity}x {t(`products.${item.name}`, item.name) as string}</span>
                                </div>
                              ))}
                           </div>
                           
                           <div className="pt-4 border-t border-amber-500/10 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 animate-pulse flex items-center gap-2">
                                 <Clock size={14} />
                                 {t('waiting_for_kitchen', 'Waiting for kitchen...')}
                              </span>
                           </div>
                        </div>
                     ))}
                     {unpaidOrders.filter(o => (o.status === 'preparing' || o.status === 'pending') && !o.isPOS).length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 grayscale border-2 border-dashed border-stone-200 rounded-[3rem]">
                           <Clock size={48} className="mb-4 text-stone-400" />
                           <p className="font-black uppercase tracking-[0.3em] text-[10px] text-stone-500 text-center px-4">{t('no_orders_prep', 'No orders in preparation')}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}
          
          {view === 'history' && (
            <div className="flex-1 overflow-y-auto bg-bento-card-bg custom-scrollbar shadow-2xl">
                <header className="flex justify-between items-center p-6 border-b border-bento-card-border sticky top-0 bg-bento-card-bg/90 backdrop-blur z-10">
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-amber-600 rounded-3xl text-stone-950 shadow-xl">
                         <History size={32} />
                      </div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-bento-ink">{t('pos_sales_journal')}</h2>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200">
                       <Calendar size={16} className="text-stone-400 mr-2" />
                       <input 
                         type="date" 
                         value={journalDate} 
                         onChange={e => setJournalDate(e.target.value)} 
                         className="bg-transparent border-none outline-none text-sm font-bold text-stone-700" 
                       />
                     </div>
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200">
                       <Search size={16} className="text-stone-400 mr-2" />
                       <input type="text" value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm font-bold w-48 text-stone-700" />
                     </div>
                   </div>
                </header>
                <div className="p-4 md:p-8 border-b border-bento-card-border hidden md:grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-500/5">
                   <span className="pl-6">{t('pos_time')}</span>
                   <span>{t('pos_seller_id')}</span>
                   <span>{t('pos_payment_status')}</span>
                   <span className="text-right pr-6">{t('pos_amount')} (MAD)</span>
                   <span className="text-center">Action</span>
                </div>
                <div className="p-4 space-y-2">
                   {journalOrders.filter(o => 
      !journalSearch || 
      o.id.toLowerCase().includes(journalSearch.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.vendeur?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(journalSearch.toLowerCase()))
    ).map(order => (
                     <div key={order.id} className="bg-bento-bg border border-bento-card-border p-4 md:p-6 rounded-2xl flex flex-col md:grid md:grid-cols-5 gap-4 md:gap-0 items-center hover:bg-stone-500/5 transition-colors group">
                        <span className="pl-6 text-stone-500 font-bold tabular-nums flex items-center gap-3">
                           <Clock size={14} className="opacity-40" />
                           {order.createdAt instanceof Timestamp ? formatInTimeZone(order.createdAt.toDate(), 'Africa/Casablanca', 'dd/MM/yyyy HH:mm:ss') : 'LIVE'}
                        </span>
                        <div>
                           <div className="text-bento-ink font-black uppercase text-sm italic group-hover:text-amber-500 transition-colors">#{order.id.slice(-6).toUpperCase()}</div>
                           <div className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">{order.vendeur}</div>
                        </div>
                        <div className="flex gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.paymentMethod === 'cash' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                {order.paymentMethod}
                           </span>
                           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest self-center opacity-40">{order.deliveryType}</span>
                        </div>
                        <span className="text-right pr-6 text-2xl font-black text-bento-ink tabular-nums group-hover:scale-110 transition-transform origin-right">{order.total.toFixed(2)}</span>
                        <div className="flex justify-center gap-2">
                           <button 
                             onClick={() => handlePrintOrder(order)}
                             className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all"
                             title="Print Thermal Receipt"
                           >
                             <Printer size={18} />
                           </button>
                        </div>
                     </div>
                   ))}
                   {journalOrders.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale scale-150">
                         <Calculator size={80} strokeWidth={1} />
                         <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-6">{t('no_active_orders')}</p>
                      </div>
                   )}
                </div>
            </div>
          )}
          
          {/* Categories Bottom Bar - Matching the theme */}
          {view === 'pos' && <div className="h-20 md:h-24 bg-bento-bg border-t border-bento-card-border flex items-center relative shrink-0">
             <div className="flex flex-row md:flex-col h-full bg-bento-card-bg border-r border-bento-card-border px-2 md:px-3 items-center justify-center gap-2 md:gap-1 z-20">

                <div className="flex gap-2">
                   <button onClick={() => setShowClosureModal(true)} className="p-2 md:p-1.5 bg-stone-500/10 rounded-lg text-red-500 hover:bg-red-500/20" title={t('pos_closure')}><LogOut size={16} /></button>
                </div>
             </div>

             <div className="h-full px-2 md:px-4 border-r border-bento-card-border flex items-center bg-bento-bg/50">
                <Search size={14} className="text-stone-500 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder={t('pos_search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-[9px] md:text-[10px] font-black uppercase text-bento-ink placeholder:text-stone-400 w-24 md:w-32"
                />
             </div>
             
             <div className="flex-1 flex overflow-hidden relative h-full">
                <button 
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 z-10 h-full w-8 md:w-12 bg-black/20 flex items-center justify-center text-bento-ink hover:bg-black/40 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div 
                  ref={categoryScrollRef}
                  className="flex h-full overflow-x-auto custom-scrollbar-hide scroll-smooth flex-1 items-center px-8 md:px-12 gap-px bg-bento-bg"
                >
                    <button 
                      onClick={() => setSelectedCategory('all')}
                      className={`flex-shrink-0 min-w-[100px] md:min-w-[120px] h-full flex flex-col items-center justify-center gap-1 border-r border-bento-card-border uppercase text-[8px] md:text-[9px] font-black transition-all ${selectedCategory === 'all' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'text-stone-500 hover:bg-bento-card-bg'}`}
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
                          className={`flex-shrink-0 min-w-[110px] md:min-w-[140px] h-full flex flex-col items-center justify-center gap-1 border-r border-bento-card-border uppercase text-[8px] md:text-[9px] font-black transition-all ${selectedCategory === cat.id ? 'bg-bento-card-bg text-bento-ink border-b-2 border-amber-500' : 'text-stone-500 hover:bg-bento-card-bg'}`}
                        >
                          <Icon size={16} />
                          {getTranslatedCategory(cat.name)}
                        </button>
                      );
                    })}
                </div>

                <button 
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 z-10 h-full w-8 md:w-12 bg-black/20 flex items-center justify-center text-bento-ink hover:bg-black/40 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>}
        </div>

        {/* Right Side: Virtual Ticket */}
        <div className={`w-full md:w-[280px] lg:w-[400px] bg-bento-card-bg text-bento-ink flex flex-col shadow-2xl relative border-l border-bento-card-border overflow-hidden shrink-0 ${showMobileCart && view === 'pos' ? 'flex' : view === 'pos' ? 'hidden md:flex' : 'hidden'}`}>
           {/* Order Queue Header */}
           <div className="h-20 bg-stone-100 dark:bg-stone-900 border-b border-bento-card-border flex items-center px-4 gap-2 overflow-x-auto custom-scrollbar-hide shrink-0">
              <button 
                onClick={() => setSelectedOrder(null)}
                className={`shrink-0 h-14 px-3 rounded-xl flex items-center gap-2 transition-all border ${!selectedOrder ? 'bg-amber-500 border-amber-600 text-stone-900 shadow-md' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
              >
                <div className="flex flex-col items-center">
                   <Plus size={14} />
                   <span className="text-[10px] font-black uppercase">POS</span>
                </div>
              </button>
              
              {unpaidOrders.map(order => (
                <button 
                  key={order.id}
                  onClick={async () => {
                    setSelectedOrder(order);
                    setCart([]); 
                  }}
                  className={`shrink-0 h-14 px-3 rounded-xl flex flex-col justify-center gap-0.5 transition-all border relative ${selectedOrder?.id === order.id ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-500 text-amber-600' : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-400'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-tighter">#{order.id.slice(-4).toUpperCase()}</span>
                  <span className="text-[8px] font-bold opacity-60 truncate w-16">{order.customerName}</span>
                </button>
              ))}
           </div>
           {/* Ticket Content */}
           <div className="flex-1 flex flex-col overflow-hidden">
             <div className="p-4 border-b border-gray-300 flex items-center justify-between bg-gray-200">
                <div className="flex flex-col">
                   <span className="text-[11px] font-black uppercase tracking-widest text-stone-600">
                     {t('pos_current_ticket')}
                   </span>
                   {/* Removed customerName */}
                </div>
                <div className="flex gap-2">
                   {!selectedOrder && (
                     <button 
                       onClick={() => setDeliveryType(prev => prev === 'dine-in' ? 'takeaway' : 'dine-in')}
                       className="px-3 py-1 bg-stone-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg"
                     >
                       {deliveryType === 'dine-in' ? t('pos_dine_in') : t('pos_takeaway')}
                     </button>
                   )}
                   <button 
                      onClick={async () => {
                        if (selectedOrder) {
                          setSelectedOrder(null);
                        } else {
                          if (cart.length === 0) return;
                          if (confirm(t('pos_confirm_cancel'))) {
                             setCart([]);
                             toast.success(t('pos_cancel_ticket'));
                          }
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                   >
                      {selectedOrder ? <X size={18} /> : <Trash2 size={18} />}
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {(selectedOrder ? selectedOrder.items : cart).map((item, idx) => (
                  <div key={selectedOrder ? `ext-${idx}` : item.productId} className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50 group hover:bg-white transition-colors">
                     <div className="flex items-center gap-3">
                        {!selectedOrder ? (
                          <div className="flex flex-col items-center gap-1">
                             <button onClick={() => updateQuantity(item.productId, 1)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-green-600 transition-colors"><Plus size={14} /></button>
                             <span className="font-black text-sm tabular-nums">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.productId, -1)} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 font-black text-sm">
                             {item.quantity}
                          </div>
                        )}
                        {item.image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100 ring-1 ring-black/5 shadow-sm">
                            <OptimizedImage 
                              src={item.image} 
                              size="medium"
                              className="w-full h-full object-cover" 
                              showOverlay={false}
                            />
                          </div>
                        )}
                        <span className="text-[11px] font-bold uppercase tracking-tight max-w-[150px] leading-tight text-stone-800">{t(`products.${item.name}`, item.name) as string}</span>
                     </div>
                     <div className="flex items-center gap-1.5 self-end">
                        {selectedOrder && selectedClientLoyalty && !item.name.includes('(Loyalty Reward)') && (
                          <button
                            onClick={async () => {
                               if ((selectedClientLoyalty[item.productId] || 0) < 11) {
                                  toast.error("Not enough loyalty points for this reward.");
                               } else {
                                  handleRewardCheck(item.productId, idx, item);
                               }
                            }}
                            className={`${(selectedClientLoyalty[item.productId] || 0) >= 11 ? 'bg-[#d4af37] text-stone-900 shadow-lg cursor-pointer hover:bg-amber-400' : 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-50'} px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1`}
                          >
                            {(selectedClientLoyalty[item.productId] || 0) >= 11 ? 'Redeem Reward' : `${selectedClientLoyalty[item.productId] || 0}/11 PTS`}
                          </button>
                        )}
                        <span className="font-black tabular-nums text-stone-900">{(item.price * item.quantity).toFixed(2)}</span>
                        {!selectedOrder && (
                           <button 
                             onClick={() => removeFromCart(item.productId)}
                             className="p-1.5 text-stone-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                             title={t('pos_item_removed') as string}
                           >
                              <Trash2 size={14} />
                           </button>
                        )}
                     </div>
                  </div>
                ))}
                
                {(!selectedOrder && cart.length === 0) && (
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
              <div className="bg-[#1D3244] p-4 md:p-6 flex justify-between items-end border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] shrink-0">
                 <span className="text-[9px] md:text-[10px] font-black uppercase text-white/50 tracking-widest">{t('pos_total_price')}</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-md">
                      {(selectedOrder ? selectedOrder.total : totalPrice).toFixed(2)}
                    </span>
                    <span className="text-[10px] md:text-sm font-bold text-white/60">MAD</span>
                 </div>
              </div>

              {/* Payment Buttons (Large blocks as in image) */}
              <div className="h-24 md:h-32 grid grid-cols-3 gap-px bg-[#111] p-px border-t border-white/5 shrink-0">
                 <button 
                   onClick={() => selectedOrder ? handleMarkPaid(selectedOrder, 'cash') : handleCheckout('cash')}
                   disabled={!selectedOrder && cart.length === 0}
                   className="bg-[#22C55E] hover:brightness-110 active:brightness-90 transition-all flex flex-col items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                 >
                    <Banknote size={24} /> {t('pos_cash')}
                 </button>
                 <button 
                   onClick={() => selectedOrder ? handleMarkPaid(selectedOrder, 'reward') : handleCheckout('reward')}
                   disabled={!selectedOrder && cart.length === 0}
                   className="bg-[#3B82F6] hover:brightness-110 active:brightness-90 transition-all flex flex-col items-center justify-center gap-2 text-white font-black text-[11px] uppercase tracking-widest disabled:opacity-50 disabled:grayscale"
                 >
                    <Gift size={24} /> {t('pos_reward', 'REWARD')}
                 </button>
                 <button 
                   onClick={async () => {
                      const displayOrder = selectedOrder || {
                        id: "PROV-" + Math.floor(Math.random()*1000),
                        items: cart.map(item => ({...item, customization: translateCustomization(item.customization || '', t)})),
                        total: totalPrice,
                        customerName: 'Passage',
                        deliveryType
                      };
                      
                      const r = generateThermalReceipt({
                         restaurantName: "Cappuccino 7",
                         orderId: displayOrder.id,
                         items: displayOrder.items.map(item => ({...item, customization: translateCustomization(item.customization || '', t)})),
                         total: displayOrder.total,
                         cashierName: activeVendeur,
                         paymentMethod: 'PROVISOIRE',
                         date: new Date(),
                         deliveryType: displayOrder.deliveryType || deliveryType,
                         customerName: displayOrder.customerName
                      });
                      printToThermalPrinter(r);
                      toast.success(t('pos_provisional_printed'));
                   }}
                   disabled={!selectedOrder && cart.length === 0}
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
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-bento-card-bg rounded-[2rem] w-full max-w-xl overflow-hidden border border-bento-card-border shadow-2xl">
               <div className="bg-red-700 p-8 text-white">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">{t('pos_session_closure')}</h2>
               </div>
               <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     <div className="bg-bento-bg p-6 rounded-2xl border border-bento-card-border">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_total_sales')}</span>
                        <span className="text-3xl font-black text-bento-ink">{closureStats.total.toFixed(2)} MAD</span>
                     </div>
                     <div className="bg-bento-bg p-6 rounded-2xl border border-bento-card-border">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_orders_count')}</span>
                        <span className="text-3xl font-black text-amber-500">{closureStats.count}</span>
                     </div>
                     <div className="bg-bento-bg p-6 rounded-2xl border border-bento-card-border">
                        <span className="text-[10px] text-stone-500 font-bold uppercase block mb-1">{t('pos_cash_rev')}</span>
                        <span className="text-3xl font-black text-green-500">{closureStats.cash.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <button onClick={() => setShowClosureModal(false)} className="flex-1 py-4 rounded-xl bg-stone-500/10 text-stone-500 font-black uppercase text-[11px] hover:bg-stone-500/20 transition-colors">{t('cancel')}</button>
                     <button 
                       onClick={async () => {
                         localStorage.removeItem('cashier_session_active');
                         localStorage.removeItem('staffSession');
                         
                         toast.success('Clôture validée - Session terminée');
                         try {
                  
                  signOutApp(true).catch(console.error); navigate('/login');
                } catch(e) {}
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
        {showVendeurGrid && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-bento-bg/98 backdrop-blur-3xl flex items-center justify-center p-12">
            <div className="w-full max-w-4xl">
               <div className="text-center mb-16">
                  <h2 className="text-6xl font-black text-bento-ink uppercase italic tracking-tighter mb-4">{t('pos_identification')}</h2>
                  <p className="text-stone-500 font-black uppercase tracking-[0.5em] text-[10px]">{t('pos_select_operator')}</p>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {staffMembers.map((staff, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        setActiveVendeur(staff.name);
                        localStorage.setItem('pos_vendeur_name', staff.name);
                        setShowVendeurGrid(false);
                        toast.success(`Opérateur activé: ${staff.name}`);
                      }}
                      className={`aspect-square rounded-[3rem] flex flex-col items-center justify-center gap-6 border-4 shadow-2xl transition-all relative overflow-hidden group ${activeVendeur === staff.name ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-bento-card-border bg-bento-card-bg text-stone-500 hover:border-amber-500/30'}`}
                    >
                       <div className={`p-6 rounded-[2rem] ${activeVendeur === staff.name ? 'bg-amber-600 text-stone-950 shadow-lg' : 'bg-bento-bg shadow-xl group-hover:bg-bento-bg/80'}`}>
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
               </div>
               <button onClick={() => setShowVendeurGrid(false)} className="mt-20 mx-auto block w-16 h-16 bg-bento-card-bg border border-bento-card-border rounded-full flex items-center justify-center text-stone-500 hover:text-bento-ink transition-all shadow-xl"><X size={28} /></button>
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
