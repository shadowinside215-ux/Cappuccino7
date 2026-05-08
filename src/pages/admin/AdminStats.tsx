import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { TrendingUp, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight, LayoutDashboard, History, Download, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO, subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface DailyStat {
  id: string; // YYYY-MM-DD
  amount: number;
  orderCount: number;
  lastUpdated?: any;
}

export default function AdminStats() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      const email = auth.currentUser.email?.toLowerCase();
      const creatorEmail = 'dragonballsam86@gmail.com';
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      const hasRole = adminDoc.exists() || email === creatorEmail || sessionStorage.getItem('admin_mode') === 'true';
      setIsAdmin(hasRole);
      if (!hasRole) setLoading(false);
    };
    checkRole();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!isAdmin) return;
    const timer = setTimeout(() => setMounted(true), 100);
    // Listen to dailyRevenue collection
    const q = query(collection(db, 'dailyRevenue'), orderBy('lastUpdated', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs.map(doc => ({
        id: doc.id,
        amount: doc.data().amount || 0,
        orderCount: doc.data().orderCount || 0,
        lastUpdated: doc.data().lastUpdated
      } as DailyStat));
      setData(stats);
      setLoading(false);
    }, (error) => {
      console.error("Stats listener error:", error);
      // Don't throw here to avoid breaking the component state
      setLoading(false);
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [isAdmin]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    
    // Aggregates
    let todayRev = 0;
    let todayOrders = 0;
    let weekRev = 0;
    let weekOrders = 0;
    let monthRev = 0;
    let monthOrders = 0;

    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    data.forEach(stat => {
      try {
        const statDate = parseISO(stat.id);
        const statYear = statDate.getFullYear();
        const currentYear = now.getFullYear();
        
        if (stat.id === todayStr) {
          todayRev = stat.amount;
          todayOrders = stat.orderCount;
        }

        if (isWithinInterval(statDate, { start: weekStart, end: weekEnd })) {
          weekRev += stat.amount;
          weekOrders += stat.orderCount;
        }

        if (statYear === currentYear && isWithinInterval(statDate, { start: monthStart, end: monthEnd })) {
          monthRev += stat.amount;
          monthOrders += stat.orderCount;
        }
      } catch (e) {
        console.error("Date parse error:", e);
      }
    });

    return {
      today: { rev: todayRev, orders: todayOrders },
      week: { rev: weekRev, orders: weekOrders },
      month: { rev: monthRev, orders: monthOrders }
    };
  }, [data]);

  // Chart data for last 14 days
  const chartData = useMemo(() => {
    const result = [];
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dStr = format(d, 'yyyy-MM-dd');
      const stat = data.find(s => s.id === dStr);
      result.push({
        name: format(d, 'EEE dd'),
        revenue: stat?.amount || 0,
        orders: stat?.orderCount || 0
      });
    }
    return result;
  }, [data]);

  // Monthly stats for current year
  const monthlyStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months.map((month, idx) => {
      let mRev = 0;
      let mOrders = 0;
      
      data.forEach(stat => {
        const d = parseISO(stat.id);
        if (d.getFullYear() === currentYear && d.getMonth() === idx) {
          mRev += stat.amount;
          mOrders += stat.orderCount;
        }
      });

      return {
        month,
        revenue: mRev,
        orders: mOrders
      };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="animate-spin text-amber-500" size={32} />
          <p className="font-black text-stone-400 uppercase tracking-widest text-xs">{t('analyzing_data')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-[2rem] flex items-center justify-center text-red-600 mb-6">
          <LayoutDashboard size={40} />
        </div>
        <h2 className="text-2xl font-black text-stone-900 uppercase italic mb-2">{t('access_denied')}</h2>
        <p className="text-stone-500 max-w-xs mb-8">You don't have permission to view statistics. Please contact the administrator.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <button onClick={() => navigate('/admin')} className="p-2 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors">
               <LayoutDashboard size={20} className="text-stone-500" />
             </button>
             <span className="text-[10px] font-black uppercase text-stone-400 tracking-[0.2em]">Live Analytics</span>
           </div>
           <h1 className="text-4xl font-black text-stone-900 italic tracking-tighter uppercase">{t('revenue_statistics')}</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-5 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
             <Download size={14} /> {t('export_csv')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-900 text-white rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <div className="flex items-center gap-1 text-green-500 bg-green-50 px-2 py-1 rounded-lg text-[9px] font-black">
              <ArrowUpRight size={10} /> 12%
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-stone-900 tabular-nums">{stats.today.rev.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{t('today_revenue')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-900 text-white rounded-2xl">
              <Calendar size={20} />
            </div>
            <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg text-[9px] font-black">
              <ArrowUpRight size={10} /> 8%
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-stone-900 tabular-nums">{stats.week.rev.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">{t('weekly_revenue')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-stone-900 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <TrendingUp size={20} className="text-amber-400" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums">{stats.month.rev.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">{t('monthly_current')}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-amber-400 p-6 rounded-[2rem] shadow-sm flex flex-col justify-between text-stone-900">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-stone-900/10 rounded-2xl">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div>
            <p className="text-4xl font-black tabular-nums">{stats.today.orders}</p>
            <p className="text-[10px] font-bold text-stone-900/40 uppercase tracking-widest mt-1">{t('total_orders_today')}</p>
          </div>
        </motion.div>
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">Revenue Growth</h3>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Last 14 days performance</p>
            </div>
          </div>
            <div className="h-80 w-full min-w-0" style={{ position: 'relative', minHeight: '320px' }}>
              {mounted && (
                <ResponsiveContainer width="99.9%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#A8A29E' }} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#fbbf24" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
        </div>

        <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
           <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter mb-6">Activity Peak</h3>
           <div className="h-80 w-full min-w-0" style={{ position: 'relative', minHeight: '320px' }}>
             {mounted && (
               <ResponsiveContainer width="99.9%" height={320}>
                 <BarChart data={chartData}>
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Bar dataKey="orders" fill="#1c1917" radius={[10, 10, 10, 10]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
           </div>
           <p className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-4">Orders per day</p>
        </div>
      </div>

      {/* Monthly View Section */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">Annual Overview ({new Date().getFullYear()})</h3>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Revenue and order distribution</p>
          </div>
          <div className="p-3 bg-stone-50 rounded-2xl">
            <History size={20} className="text-stone-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {monthlyStats.map((m, i) => (
            <div key={m.month} className={`p-8 border-stone-50 ${i % 4 !== 3 ? 'md:border-r' : ''} ${i < 8 ? 'border-b' : ''}`}>
               <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">{m.month}</p>
               <h4 className="text-2xl font-black text-stone-900 mb-4">{m.revenue.toLocaleString()} MAD</h4>
               <div className="flex items-center justify-between text-xs font-bold">
                 <span className="text-stone-400">Total Orders</span>
                 <span className="bg-stone-50 px-2 py-1 rounded-lg text-stone-900">{m.orders}</span>
               </div>
               <div className="w-full h-1.5 bg-stone-50 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${Math.min(100, (m.revenue / (Math.max(...monthlyStats.map(mo => mo.revenue)) || 1)) * 100)}%` }} 
                  />
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
        <div className="p-8 border-b border-stone-100">
           <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">Daily Ledger</h3>
           <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Detailed history of all daily activity</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-stone-50">
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Date</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Total Revenue</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Orders</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Avg Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {data.slice(0, 30).map((stat) => (
                <tr key={stat.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-8 py-6 font-black text-stone-900">{format(parseISO(stat.id), 'dd MMM yyyy')}</td>
                  <td className="px-8 py-6">
                    <span className="font-black text-stone-900">{stat.amount.toLocaleString()} MAD</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-stone-100 rounded-lg font-bold text-xs">{stat.orderCount} Orders</span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-stone-400">
                    {stat.orderCount > 0 ? (stat.amount / stat.orderCount).toFixed(1) : 0} MAD
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
