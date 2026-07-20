import { useState, useEffect, useCallback } from 'react';
import { signOutApp } from '../../lib/googleAuth';
import { useTranslation } from 'react-i18next';
import { collection, query, orderBy, onSnapshot, getDocs, getDoc, doc, setDoc, writeBatch, addDoc, where, serverTimestamp, increment } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Order, UserProfile } from '../../types';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Users, Search, Coffee, TrendingUp, Settings as SettingsIcon, Package, Database, Gift, Mail, ChevronRight, Award, ShieldCheck, LogOut, Palette, Star, X, History, Info, Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Image as ImageIcon, QrCode, Download } from 'lucide-react';
import { Timer } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES, PRODUCTS_DATA } from '../../data/menuData';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalUsers: 0,
    totalItems: 0,
    todayRevenue: 0,
    totalOrders: 0,
    mostOrderedItem: null as { name: string, count: number } | null,
    performance: null as null | {
      avgPrep: number;
      avgKitchenPrep: number;
      avgBarmanPrep: number;
      avgDelivery: number;
      avgTotal: number;
      fastest: number;
      slowest: number;
      completedToday: number;
    }
  });
  const [weeklyRevenue, setWeeklyRevenue] = useState<Record<string, { amount: number, orderCount: number }>>({});
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isRegisteringAdmin, setIsRegisteringAdmin] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [revError, setRevError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [waiters, setWaiters] = useState<UserProfile[]>([]);
  const navigate = useNavigate();

  const handleDownloadQR = () => {
    const svg = document.getElementById('table-qr-code-admin');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      
      // Add white background
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Add title text centered
        pdf.setFontSize(22);
        pdf.text('Scan for Menu', pdfWidth / 2, 20, { align: 'center' });
        
        pdf.addImage(imgData, 'PNG', 15, 30, pdfWidth - 30, ((pdfWidth - 30) * canvas.height) / canvas.width);
        pdf.save('cappuccino7-qr-code.pdf');
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  useEffect(() => {
    // Listener for staff/waiters to check zone assignments
    const q = query(collection(db, 'users'), where('role', '==', 'waiter'));
    return onSnapshot(q, (snap) => {
      const waitersData = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setWaiters(waitersData);
    });
  }, []);

  const hasZoneAWaiter = waiters.some(w => w.assignedZone === 'A');
  const hasZoneBWaiter = waiters.some(w => w.assignedZone === 'B');

  const fetchProductsForMapping = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const mapping: Record<string, string> = {};
      snap.docs.forEach(doc => {
        mapping[doc.id] = doc.data().name;
      });
      setProductsMap(mapping);
    } catch (err) {
      console.error("Mapping error:", err);
    }
  };

  useEffect(() => {
    fetchProductsForMapping();
  }, []);

  const cleanupAllTestData = async () => {
    setShowWipeConfirm(false);
    const toastId = toast.loading('Initiating deep cleanup...');
    try {
      const deleteInBatches = async (collectionName) => {
        const snap = await getDocs(collection(db, collectionName));
        let batch = writeBatch(db);
        let count = 0;
        for (const doc of snap.docs) {
          batch.delete(doc.ref);
          count++;
          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) await batch.commit();
      };

      // 1. Clear Orders
      await deleteInBatches('orders');

      // 2. Clear Revenue
      await deleteInBatches('dailyRevenue');

      // 2.5 Clear Other Stats
      const statsCollections = ['weeklyRevenue', 'monthlyRevenue', 'stats'];
      for (const collName of statsCollections) {
        await deleteInBatches(collName);
      }

      // 3. Clear Waiter Requests
      await deleteInBatches('waiterRequests');

      // 4. Reset User Loyalty
      const userSnap = await getDocs(collection(db, 'users'));
      let userBatch = writeBatch(db);
      let userCount = 0;
      for (const d of userSnap.docs) {
        userBatch.update(d.ref, {
          points: 0,
          coffeeCount: 0,
          itemLoyalty: {},
          availableRewards: {}
        });
        userCount++;
        if (userCount >= 400) {
          await userBatch.commit();
          userBatch = writeBatch(db);
          userCount = 0;
        }
      }
      if (userCount > 0) await userBatch.commit();

      toast.success('System reset successfully. All test data cleared.', { id: toastId });
      setWeeklyRevenue({});
      setStats(prev => ({ ...prev, todayRevenue: 0, totalOrders: 0, activeOrders: 0 }));
    } catch (err) {
      console.error("Cleanup error:", err);
      toast.error('Cleanup failed. Check permissions.', { id: toastId });
    }
  };

  const viewUserDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    toast.loading(`Fetching history for ${user.name}...`, { id: 'details' });
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setUserOrders(orders);
      toast.success('History loaded', { id: 'details' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch history', { id: 'details' });
    }
  };

  useEffect(() => {
    // AUTO-CLEANUP TRIGGER (One-time use to clear test data)
    const runAutoCleanup = async () => {
      const alreadyCleaned = sessionStorage.getItem('auto_cleanup_v3');
      if (alreadyCleaned) return;

      console.log("🚀 Starting Force Test Data Cleanup (v3)...");
      try {
        // 1. Clear Orders (Chunked)
        const orderSnap = await getDocs(collection(db, 'orders'));
        let batch = writeBatch(db);
        let count = 0;
        for (const d of orderSnap.docs) {
          batch.delete(d.ref);
          count++;
          if (count >= 400) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        await batch.commit();

        // 2. Clear All Revenue Data
        const revCollections = ['dailyRevenue', 'weeklyRevenue', 'monthlyRevenue', 'stats', 'revenue'];
        for (const coll of revCollections) {
          try {
            const snap = await getDocs(collection(db, coll));
            if (!snap.empty) {
              const rBatch = writeBatch(db);
              snap.docs.forEach(d => rBatch.delete(d.ref));
              await rBatch.commit();
            }
          } catch (e) {
            console.warn(`Collection ${coll} clear failed or missing`);
          }
        }

        // 3. Clear Waiter Requests
        const reqSnap = await getDocs(collection(db, 'waiterRequests'));
        if (!reqSnap.empty) {
          const wBatch = writeBatch(db);
          reqSnap.docs.forEach(d => wBatch.delete(d.ref));
          await wBatch.commit();
        }

        // 4. Reset ALL User Profiles Loyalty
        const userSnap = await getDocs(collection(db, 'users'));
        let uBatch = writeBatch(db);
        count = 0;
        for (const d of userSnap.docs) {
          uBatch.update(d.ref, {
            points: 0,
            coffeeCount: 0,
            itemLoyalty: {},
          availableRewards: {}
          });
          count++;
          if (count >= 400) {
            await uBatch.commit();
            uBatch = writeBatch(db);
            count = 0;
          }
        }
        await uBatch.commit();

        sessionStorage.setItem('auto_cleanup_v3', 'true');
        toast.success('DEEP SYSTEM RESET: All test data, revenue, and points have been cleared.', { duration: 10000 });
        window.location.reload(); 
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };

    // runAutoCleanup() disabled to prevent permission errors
  }, []);

  useEffect(() => {
    // Auto-register super admin
    const initializeAdmin = async () => {
      const adminEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      if (auth.currentUser && !auth.currentUser.isAnonymous && auth.currentUser.email?.toLowerCase() === adminEmail.toLowerCase()) {
        try {
          // 1. Auto-register admin record
          const adminRef = doc(db, 'admins', auth.currentUser.uid);
          const adminDoc = await getDoc(adminRef);
          if (!adminDoc.exists()) {
            await setDoc(adminRef, {
              email: auth.currentUser.email,
              registeredAt: serverTimestamp(),
              role: 'super_admin'
            }, { merge: true });
          }

          // 2. Sync to user profile
          const userRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userRef, { 
            isAdmin: true,
            updatedAt: serverTimestamp() 
          }, { merge: true });

        } catch (err) {
          console.error("Admin initialization failed:", err);
        }
      }
    };
    initializeAdmin();
  }, []);

  const registerAdmin = async () => {
    // Keep the manual button for robustness
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      toast.error('Google identity required for admin registration');
      return;
    }
    setIsRegisteringAdmin(true);
    try {
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        email: auth.currentUser.email,
        registeredAt: serverTimestamp(),
        role: 'super_admin'
      }, { merge: true });
      toast.success('Admin Document Created in Firestore');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `admins/${auth.currentUser.uid}`);
    } finally {
      setIsRegisteringAdmin(false);
    }
  };

  useEffect(() => {
    if (!auth.currentUser || !isAdmin) return;

    setLoading(true);

    // Active Orders count
    const qActive = query(collection(db, 'orders'), where('status', 'not-in', ['delivered', 'cancelled']));
    const unsubOrders = onSnapshot(qActive, (snapshot) => {
      setStats(prev => ({ ...prev, activeOrders: snapshot.size }));
    }, (error) => {
      // Just log, don't throw for count queries
      console.warn("Active orders count error:", error.message);
    });

    // Weekly Revenue Listener (Limit to last 14 days to keep it light)
    const qRev = query(
      collection(db, 'dailyRevenue'), 
      orderBy('lastUpdated', 'desc')
    );
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      const revData: Record<string, { amount: number, orderCount: number }> = {};
      let todayRev = 0;
      let todayOrders = 0;
      const today = new Date().toISOString().split('T')[0];
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        revData[d.id] = { 
          amount: data.amount || 0, 
          orderCount: data.orderCount || 0 
        };
        if (d.id === today) {
          todayRev = data.amount || 0;
          todayOrders = data.orderCount || 0;
        }
      });
      
      setWeeklyRevenue(revData);
      setStats(prev => ({ ...prev, todayRevenue: todayRev, totalOrders: todayOrders }));
      setLoading(false);
      setRevError(null);
    }, (error) => {
      console.warn("Revenue listener error:", error.message);
      setRevError(error.message);
      setLoading(false);
    });

    // Total Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      // Filter: Only clients who have an email and are NOT staff
      const emailClients = allUsers.filter(u => 
        u.email && 
        u.email !== '' && 
        !u.isAdmin && 
        !u.isWaiter && 
        !u.isKitchen && 
        !u.isBarman && 
        !u.isCashier && 
        !u.isDriver
      );
      setUsers(emailClients); 
      setStats(prev => ({ ...prev, totalUsers: emailClients.length }));
    }, (err) => console.log(err));

    // Total Items Listener
    const unsubItems = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, totalItems: snapshot.size }));
    }, (err) => console.log(err));

    const fetchStats = async () => {
      try {
        const catsSnap = await getDocs(collection(db, 'categories'));
        setIsEmpty(catsSnap.empty);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple/stats');
      }
    };
    fetchStats();

    
    // Fetch all orders for analytics (Most Ordered Item + Performance)
    const fetchAnalytics = async () => {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const itemCounts: Record<string, number> = {};
        
        // Performance trackers
        let prepTimes: number[] = [];
        let kitchenPrepTimes: number[] = [];
        let barmanPrepTimes: number[] = [];
        let deliveryTimes: number[] = [];
        let totalTimes: number[] = [];
        let completedToday = 0;
        
        const todayStr = new Date().toISOString().split('T')[0];

        snap.docs.forEach(doc => {
          const order = doc.data();
          
          // Items count
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach((item: any) => {
              if (item.name) {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
              }
            });
          }
          
          // Performance calculations
          if (order.status === 'delivered' || order.status === 'completed') {
            const getMs = (ts: any) => {
              if (!ts) return 0;
              if (typeof ts.toDate === 'function') return ts.toDate().getTime();
              return new Date(ts).getTime();
            };
            
            const tCreate = getMs(order.createdAt);
            const tKStart = getMs(order.kitchenStartedAt);
            const tBStart = getMs(order.barmanStartedAt);
            const tKReady = getMs(order.kitchenReadyAt);
            const tBReady = getMs(order.barmanReadyAt);
            const tReady = getMs(order.readyAt);
            const tDelivered = getMs(order.deliveredAt) || getMs(order.completedAt);
            
            if (tCreate) {
              const orderDateStr = new Date(tCreate).toISOString().split('T')[0];
              if (orderDateStr === todayStr) {
                completedToday++;
              }
              
              if (tDelivered) {
                totalTimes.push(Math.round((tDelivered - tCreate) / 60000));
              }
            }
            
            // Prep time: Start -> Ready
            const start = tKStart || tBStart || tCreate;
            const ready = tKReady || tBReady || tReady;
            if (start && ready && ready >= start) {
              prepTimes.push(Math.round((ready - start) / 60000));
            }
            if (tKStart && tKReady && tKReady >= tKStart) {
              kitchenPrepTimes.push(Math.round((tKReady - tKStart) / 60000));
            }
            if (tBStart && tBReady && tBReady >= tBStart) {
              barmanPrepTimes.push(Math.round((tBReady - tBStart) / 60000));
            }
            
            // Delivery time: Ready -> Delivered
            if (ready && tDelivered && tDelivered >= ready) {
              deliveryTimes.push(Math.round((tDelivered - ready) / 60000));
            }
          }
        });
        
        let mostOrdered = null;
        let maxCount = 0;
        Object.entries(itemCounts).forEach(([name, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mostOrdered = { name, count };
          }
        });
        
        const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
        
        const performance = {
          avgPrep: avg(prepTimes),
          avgKitchenPrep: avg(kitchenPrepTimes),
          avgBarmanPrep: avg(barmanPrepTimes),
          avgDelivery: avg(deliveryTimes),
          avgTotal: avg(totalTimes),
          fastest: totalTimes.length ? Math.min(...totalTimes) : 0,
          slowest: totalTimes.length ? Math.max(...totalTimes) : 0,
          completedToday
        };

        setStats(prev => ({ ...prev, mostOrderedItem: mostOrdered, performance }));
      } catch (e) {
        console.warn("Failed to fetch analytics", e);
      }
    };
    fetchAnalytics();


    return () => {
      unsubOrders();
      unsubRev();
      unsubUsers();
      unsubItems();
    };
  }, [isAdmin]);

  useEffect(() => {
    const checkRole = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      const email = auth.currentUser.email?.toLowerCase();
      const creatorEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      setIsCreator(email === creatorEmail);
      
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const hasRole = adminDoc.exists() || email === creatorEmail || sessionStorage.getItem('admin_mode') === 'true';
      setIsAdmin(hasRole);
      if (!hasRole) setLoading(false);
    };
    checkRole();
  }, [auth.currentUser]);

  // Use initial setup link when DB is empty

  const initializeDatabase = async (force = false) => {
    if (isSettingUp) return;
    
    if (!force) {
      const confirmMessage = "⚠️ RESET DATABASE: This will re-add all default categories and menu items. Your custom items will be deleted, but EXISTING images will be kept. Proceed?";
      if (!window.confirm(confirmMessage)) return;
    }

    setIsSettingUp(true);
    const toastId = toast.loading('Initializing database components...');
    
    try {
      // Safeguard ALL uploaded/configured product images
      const imageMap: Record<string, string> = {};

      // A. Restore from localStorage backup cache
      try {
        const localBackup = localStorage.getItem('cappuccino7_product_images_backup');
        if (localBackup) {
          const parsed = JSON.parse(localBackup);
          Object.assign(imageMap, parsed);
        }
      } catch (e) {
        console.warn("Failed to parse local backup:", e);
      }

      // B. Restore from Firebase settings backup document
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'product_images_backup'));
        if (docSnap.exists()) {
          const fbBackups = docSnap.data()?.images || {};
          Object.assign(imageMap, fbBackups);
        }
      } catch (e) {
        console.warn("Failed to fetch Firebase backup doc:", e);
      }

      // C. Restore from existing active products in Firestore to prevent overwrite of recently edited images
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        productsSnap.forEach(docSnap => {
          const d = docSnap.data();
          if (d && d.name && d.image) {
            imageMap[d.name.toLowerCase().trim()] = d.image;
          }
        });
      } catch (e) {
        console.warn("Failed to fetch existing products for image mapping:", e);
      }

      // 1. Define Structure from single source of truth database
      const categories = CATEGORIES;
      const productsData = PRODUCTS_DATA as Record<string, any[]>;

      // 2. Clear & Add in sequence
      const batch = writeBatch(db);
      
      for (const cat of categories) {
        const catRef = doc(db, 'categories', cat.id);
        batch.set(catRef, { name: cat.name, order: cat.order, id: cat.id }, { merge: true });
        
        const items = productsData[cat.id] || [];
        items.forEach(item => {
          const safeId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
          const prodRef = doc(db, 'products', `${cat.id}-${safeId}`);
          
          const existingImage = imageMap[item.name.toLowerCase().trim()];
          
          const prodData: any = { 
            name: item.name,
            price: Number(item.price),
            description: item.description || item.d || '',
            subSection: item.s || '',
            categoryId: catRef.id, 
            isAvailable: true,
            id: prodRef.id
          };

          if (existingImage) {
            prodData.image = existingImage;
          } else if (item.image || item.img) {
            prodData.image = item.image || item.img;
          }
          
          batch.set(prodRef, prodData, { merge: true });
        });
      }

      // 3. Preserve brand settings - only set defaults if they don't exist
      const brandRef = doc(db, 'settings', 'brand');
      const brandSnap = await getDoc(brandRef);
      
      if (!brandSnap.exists()) {
        batch.set(brandRef, {
          logoUrl: 'https://images.unsplash.com/photo-1541167760496-162955ed8a4f?q=100&w=3840',
          heroImageUrl: 'https://images.unsplash.com/photo-1501339819358-ee5f8babc4c1?q=100&w=3840&auto=format&fit=crop',
          loginBgUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=100&w=3840&auto=format&fit=crop',
          updatedAt: new Date().toISOString()
        });
      } else {
        // If it exists, only update updatedAt to show sync happened
        batch.set(brandRef, { updatedAt: new Date().toISOString() }, { merge: true });
      }

      await batch.commit();
      
      setIsEmpty(false);
      toast.success('Your menu is now LIVE!', { id: toastId });
      
    } catch (err) {
      console.error("Setup error:", err);
      toast.error('Setup failed: ' + (err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
    } finally {
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    const adminEmailCheck = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
    if (auth.currentUser?.email?.toLowerCase() === adminEmailCheck.toLowerCase()) {
      const autoSync = async () => {
        const hasSync = localStorage.getItem('menu_auto_sync_v33');
        if (!hasSync) {
          console.log("AI Studio: Automatically syncing your requested menu items with all categories...");
          await initializeDatabase(true);
          localStorage.setItem('menu_auto_sync_v33', 'true');
        }
      };
      autoSync();
    }
  }, [auth.currentUser?.email]);

  const isClientAdmin = auth.currentUser?.email?.toLowerCase() === 'mohamed.erguigue@gmail.com' || auth.currentUser?.email?.toLowerCase() === 'samiarafati3@gmail.com';

  return (
    <div className="space-y-8 bg-bento-bg min-h-screen p-4 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                navigate('/');
              }}
              className="p-3 bg-bento-card-bg rounded-2xl text-stone-700 hover:text-bento-primary transition-colors border border-stone-200 shadow-sm"
              title="Exit Admin Console"
            >
              <LogOut size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] pl-1">{t('admin_overview')}</p>
                {isCreator && <span className="bg-amber-400 text-stone-900 text-[8px] font-black px-2 py-0.5 rounded-full uppercase italic">{t('super_admin')}</span>}
              </div>
              <h1 className="text-4xl font-bold text-bento-primary">{t('admin_dashboard')}</h1>
            </div>
          </div>
        </div>

      {!isClientAdmin && isEmpty && (
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
              onClick={() => initializeDatabase()}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card !p-6 lg:col-span-1 border-t-4 border-amber-400 bg-bento-card-bg">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl w-fit mb-4">
              <ShoppingBag size={20} />
            </div>
            <p className="text-3xl md:text-4xl font-black text-bento-ink mb-1">{stats.totalOrders}</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('orders_today')}</p>
          </div>

          <div className="card !p-6 lg:col-span-1 relative group overflow-hidden border-t-4 border-green-400 bg-bento-card-bg">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-2xl w-fit mb-4">
              <TrendingUp size={20} />
            </div>
            <p className="text-3xl md:text-4xl font-black text-bento-ink mb-1">{stats.todayRevenue.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t('today_revenue_mad')}</p>
            
          </div>

        {!isClientAdmin && (
          <div className="card !p-6 lg:col-span-2 accent-card !bg-bento-accent !text-bento-primary">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Users size={20} />
              </div>
              <div className="text-right">
                <p className="text-3xl md:text-4xl font-black">{stats.totalUsers}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t('registered_users')}</p>
              </div>
            </div>
            <p className="text-xs font-medium opacity-80 mt-auto">
              {t('community_growth_msg')}
            </p>
          </div>
        )}
        
        {stats.mostOrderedItem && (
          <div className="card !p-6 lg:col-span-2 bg-gradient-to-br from-amber-400 to-amber-500 text-stone-900 border-none">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/30 rounded-2xl">
                <Star size={20} className="fill-stone-900" />
              </div>
              <div className="text-right">
                <p className="text-2xl md:text-3xl font-black truncate max-w-[150px]" title={stats.mostOrderedItem.name}>
                   {stats.mostOrderedItem.name}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Most Ordered</p>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-widest opacity-80 mt-auto flex items-center gap-2">
              <Award size={14} /> {stats.mostOrderedItem.count} {t('total_orders', 'Total Orders')}
            </p>
          </div>
        )}

        {stats.performance && (
          <div className="card !p-6 lg:col-span-4 bg-bento-card-bg border-bento-card-border mt-4">
            <h3 className="text-xl font-black text-bento-primary uppercase italic tracking-tighter mb-4 flex items-center gap-2">
              <Timer size={20} /> Service Performance
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Avg Total Prep</p>
                <p className="text-2xl font-black text-amber-600">{stats.performance.avgPrep}m</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Kitchen Prep</p>
                <p className="text-2xl font-black text-orange-600">{stats.performance.avgKitchenPrep}m</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Barman Prep</p>
                <p className="text-2xl font-black text-sky-600">{stats.performance.avgBarmanPrep}m</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Avg Delivery</p>
                <p className="text-2xl font-black text-blue-600">{stats.performance.avgDelivery}m</p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Fastest / Slowest</p>
                <p className="text-xl font-black text-bento-ink">
                  {stats.performance.fastest}m <span className="text-stone-400 font-normal">/</span> {stats.performance.slowest}m
                </p>
              </div>
              <div className="bg-stone-50 dark:bg-stone-900/30 p-4 rounded-2xl">
                <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Completed Today</p>
                <p className="text-2xl font-black text-green-600">{stats.performance.completedToday}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Revenue Chart-like View */}
      <div className="card !p-4 md:!p-8 bg-bento-card-bg border-bento-card-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-bento-primary uppercase italic tracking-tighter">{t('weekly_performance')}</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">{t('revenue_per_day')}</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">

            <History className="hidden sm:block text-stone-300 dark:text-stone-700" size={32} />
          </div>
        </div>

        <div className={`grid grid-cols-1 gap-4 mb-8 ${!isClientAdmin ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2'}`}>
           <button 
             onClick={() => navigate('/admin/stats')}
             className="bg-bento-card-bg text-bento-ink p-8 rounded-3xl flex items-center justify-between group hover:bg-bento-card-bg/90 transition-all shadow-xl border border-bento-card-border"
           >
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">{t('deep_analytics')}</span>
               <h4 className="text-2xl font-black italic tracking-tighter uppercase mt-1">{t('view_all_stats')}</h4>
               <p className="text-xs opacity-60 mt-2">{t('revenue_orders_monthly')}</p>
             </div>
             <div className="p-4 bg-bento-primary/10 text-bento-primary rounded-2xl group-hover:bg-bento-primary group-hover:text-bento-bg transition-all">
               <TrendingUp size={28} />
             </div>
           </button>

           <button 
             onClick={() => navigate('/admin/performance')}
             className="bg-bento-card-bg text-bento-ink p-8 rounded-3xl flex items-center justify-between group hover:bg-bento-card-bg/90 transition-all shadow-xl border border-bento-card-border"
           >
             <div className="text-left">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Team Tracking</span>
               <h4 className="text-2xl font-black italic tracking-tighter uppercase mt-1">Staff Performance</h4>
               <p className="text-xs opacity-60 mt-2">12-Month History</p>
             </div>
             <div className="p-4 bg-bento-primary/10 text-bento-primary rounded-2xl group-hover:bg-bento-primary group-hover:text-bento-bg transition-all">
               <Users size={28} />
             </div>
           </button>

           {!isClientAdmin && (
             <div className="bg-amber-400 p-8 rounded-3xl flex items-center justify-between text-stone-900">
               <div className="text-left">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{t('community')}</span>
                 <h4 className="text-2xl font-black italic tracking-tighter uppercase mt-1">{t('users_list')}</h4>
                 <p className="text-xs opacity-60 mt-2">{t('manage_customers')}</p>
               </div>
               <div className="p-4 bg-stone-900/10 rounded-2xl">
                 <Users size={28} />
               </div>
             </div>
           )}

        </div>
        
        <div className="grid grid-cols-7 gap-1 md:gap-4 h-48 items-end">
          {Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const revItem = weeklyRevenue[dateStr] || { amount: 0, orderCount: 0 };
            const amount = revItem.amount;
            const amounts = Object.values(weeklyRevenue).map((v: any) => v.amount);
            const maxAmount = Math.max(...(amounts.length > 0 ? amounts : [0]), 100);
            const heightPercent = Math.min((amount / maxAmount) * 100, 100);
            const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });
            
            return (
              <div key={dateStr} className="flex flex-col items-center gap-3 group h-full justify-end">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all bg-bento-card-bg text-bento-ink text-[8px] md:text-[10px] font-black px-2 py-1 rounded-lg z-10 whitespace-nowrap shadow-xl border border-bento-card-border">
                    {amount} MAD
                  </div>
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[40px] rounded-t-lg md:rounded-t-xl transition-all ${
                      dateStr === new Date().toISOString().split('T')[0] 
                        ? 'bg-bento-accent shadow-[0_0_15px_rgba(251,191,36,0.5)]' 
                        : 'bg-bento-card-bg/20 group-hover:bg-bento-card-bg/40'
                    }`}
                  />
                </div>
                <div className="text-center overflow-hidden">
                  <p className="text-[8px] md:text-[9px] font-black text-stone-400 uppercase tracking-tighter truncate">{dayName}</p>
                  <p className="text-[7px] md:text-[8px] font-bold text-stone-300">{date.getDate()}/{date.getMonth() + 1}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!isClientAdmin && (
        <>
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

      {/* QR Code Section */}
      <div className="card space-y-6 !p-8 border-bento-card-border bg-bento-card-bg">
        <h2 className="text-xl font-bold flex items-center gap-2 uppercase tracking-tight">
          <QrCode size={20} className="text-bento-primary" />
          Table QR Code
        </h2>
        <div className="p-6 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-white/5 flex flex-col md:flex-row items-center gap-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm">
            <QRCodeSVG 
              id="table-qr-code-admin"
              value="https://cappuccino7-alpha.vercel.app/" 
              size={160} 
              level="H"
              includeMargin={false}
              fgColor="#1C1917"
            />
          </div>
          <div className="space-y-4 flex-1 text-center md:text-left">
            <div>
              <h3 className="font-bold text-stone-800 dark:text-stone-200 mb-1 text-lg">Customer Menu QR</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                Print this QR code and place it on your tables. When scanned, it will open the app directly on the customer's phone (https://cappuccino7-alpha.vercel.app/).
              </p>
            </div>
            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-2 px-6 py-3 bg-bento-primary text-white text-sm font-bold rounded-xl hover:bg-opacity-90 transition-all active:scale-95 shadow-md"
            >
              <Download size={18} />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-bento-primary tracking-tight">{t('customer_communities')}</h2>
            <div className="px-2 py-0.5 bg-bento-accent/20 rounded-full text-bento-primary text-[10px] font-black uppercase tracking-widest">{t('users_count', { count: users.length })}</div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_users_by_email', 'Search by email...')}
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-stone-200 focus:outline-none focus:border-bento-primary focus:ring-2 focus:ring-bento-accent/20 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div className="space-y-3">
          {users
            .filter(user => user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()))
            .map(user => {
            const itemLoyalty = user.itemLoyalty || {};
            // Any item with 11 or more points counts as a reward ready to redeem
            const readyRewards = Object.entries(itemLoyalty)
              .filter(([_, count]) => (count as number) >= 11)
              .length;

            return (
              <div key={user.uid} className="card !p-5 bg-bento-card-bg border-bento-card-border flex flex-col sm:flex-row items-center gap-6 group hover:border-bento-accent/20 transition-all">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-bento-bg rounded-2xl flex items-center justify-center text-stone-400 group-hover:bg-bento-accent/10 group-hover:text-bento-primary transition-all">
                    {readyRewards > 0 ? <Gift className="text-bento-accent animate-bounce" size={24} /> : <Users size={24} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-bento-ink text-lg">{user.name || (t('guest') === 'guest' ? 'Anonymous User' : t('anonymous_user', 'Anonymous User'))}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p 
                        className="text-[10px] text-stone-400 font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-bento-primary transition-colors"
                        onClick={() => viewUserDetails(user)}
                      >
                        <Mail size={10} /> {user.email}
                      </p>
                      <div className="h-1 w-1 bg-stone-200 rounded-full" />
                      <p className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1 italic">
                        <Star size={10} /> Status: Gold
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
                    onClick={() => viewUserDetails(user)}
                    className="p-3 bg-stone-200/50 text-stone-600 hover:bg-bento-primary hover:text-white rounded-2xl transition-all border border-stone-200"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Maintenance Section */}
      <div className="pt-12 border-t border-stone-200">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-red-500" size={24} />
          <h2 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">System Maintenance</h2>
        </div>
        
        <div className="bg-red-50 border border-red-100 p-8 rounded-[3rem] shadow-xl shadow-red-500/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <h3 className="text-lg font-black text-red-700 uppercase tracking-tight mb-2">Deep Cleanup Tool</h3>
              <p className="text-sm text-red-600 font-medium opacity-80 leading-relaxed">
                This tool will wipe all operational data including orders, transactions, revenue history, and reset all user loyalty points. 
                Use this only to clear the app of test data before launching to production. This action is irreversible.
              </p>
            </div>
            <button 
              onClick={() => setShowWipeConfirm(true)}
              className="w-full md:w-auto bg-red-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-red-700 active:scale-95 transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-3"
            >
              <Database size={18} />
              Wipe All Test Data
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showWipeConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="bg-red-600 p-8 text-center text-white">
                <ShieldCheck size={48} className="mx-auto mb-4 opacity-90" />
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Confirm Data Wipe</h3>
              </div>
              <div className="p-8">
                <p className="text-stone-600 font-medium leading-relaxed mb-8">
                  <strong className="text-red-600 block mb-2">⚠️ DANGER: Irreversible Action</strong>
                  This will PERMANENTLY DELETE all orders, all revenue data, all waiter requests, and CLEAR all customer loyalty points. 
                  <br/><br/>
                  Are you absolutely sure you want to proceed?
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowWipeConfirm(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-stone-100 text-stone-600 hover:bg-stone-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={cleanupAllTestData}
                    className="flex-1 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-red-600 text-white shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
                  >
                    Wipe Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#FDF8F3] w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-bento-accent rounded-2xl flex items-center justify-center text-bento-primary shadow-lg transform -rotate-3">
                    <Users size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-stone-900 uppercase italic leading-none">{selectedUser.name}</h2>
                    <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">{selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="p-3 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Orders</p>
                    <p className="text-3xl font-black text-stone-900 leading-none">{userOrders.length}</p>
                  </div>
                  <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Joined</p>
                    <p className="text-sm font-bold text-stone-900 tracking-tight leading-none pt-1">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Loyalty Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Award size={18} className="text-amber-500" />
                      <h3 className="font-black text-stone-900 uppercase tracking-tight italic">Menu Item Loyalty</h3>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.keys(selectedUser.itemLoyalty || {}).length === 0 ? (
                         <div className="p-8 text-center text-stone-300 text-xs font-bold uppercase italic">No points collected yet</div>
                      ) : (
                        Object.entries(selectedUser.itemLoyalty).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([prodId, count]) => (
                          <div key={prodId} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100 hover:border-amber-200 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-stone-900 uppercase italic">
                                {productsMap[prodId] || `Item ${prodId.slice(-4)}`}
                              </span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">ID: {prodId.slice(-4)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {(count as number) >= 11 && (
                                <button
                                  onClick={async () => {
                                    if (confirm('Reset reward points for this item?')) {
                                      const userRef = (await import('firebase/firestore')).doc(db, 'users', selectedUser.uid);
                                      await (await import('firebase/firestore')).updateDoc(userRef, {
                                        [`itemLoyalty.${prodId}`]: (count as number) % 11
                                      });
                                      setSelectedUser({
                                        ...selectedUser,
                                        itemLoyalty: {
                                          ...selectedUser.itemLoyalty,
                                          [prodId]: (count as number) % 11
                                        }
                                      });
                                    }
                                  }}
                                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-200 transition-colors flex items-center gap-1 mr-2"
                                >
                                  <Gift size={12} /> Redeem
                                </button>
                              )}
                              <span className="text-sm font-black text-stone-900">{count} {(count as number) > 1 ? 'Points' : 'Point'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <History size={18} className="text-stone-400" />
                      <h3 className="font-black text-stone-900 uppercase tracking-tight italic">Recent History</h3>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {userOrders.length === 0 ? (
                        <div className="p-8 text-center text-stone-300 text-xs font-bold uppercase italic">No orders found</div>
                      ) : (
                        userOrders.map(order => {
                          const orderTime = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                          const deliveryTime = order.deliveredAt?.toDate ? order.deliveredAt.toDate() : (order.deliveredAt ? new Date(order.deliveredAt) : null);
                          
                          return (
                            <div key={order.id} className="p-5 rounded-2xl border border-stone-100 bg-[#FDF8F3]/50 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                   <p className="text-[10px] font-black text-stone-900 uppercase italic">
                                     {orderTime.toLocaleDateString()}
                                   </p>
                                   <div className="flex flex-col gap-1 mt-1.5 font-bold uppercase text-[9px] tracking-wider">
                                     <div className="flex items-center gap-2 text-stone-400">
                                       <Clock size={10} /> Placed: {orderTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })}
                                     </div>
                                     {deliveryTime && (
                                       <div className="flex items-center gap-2 text-green-500">
                                         <CheckCircle2 size={10} /> Delivered: {deliveryTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Casablanca' })}
                                       </div>
                                     )}
                                   </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <div className="pt-3 border-t border-stone-50 flex justify-between items-center">
                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{order.items.length} Points • {order.total} DH</p>
                                <div className="text-[9px] font-black text-stone-300 uppercase tracking-tighter">ID: {order.id.slice(-6)}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-stone-50 flex justify-end">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="bg-stone-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
                >
                  {t('close_profile')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>
      )}

    </div>
  );
}
