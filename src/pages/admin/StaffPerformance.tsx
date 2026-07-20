import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Order } from '../../types';
import { ChefHat, Coffee, Clock, Users, ArrowLeft, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function StaffPerformance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [averages, setAverages] = useState({
    kitchen: 0,
    barman: 0,
    waiter: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
        
        const q = query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(twelveMonthsAgo)),
          orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => doc.data() as Order);

        const monthlyStats: Record<string, { kitchenTotal: number; kitchenCount: number; barmanTotal: number; barmanCount: number; waiterTotal: number; waiterCount: number; }> = {};

        // Initialize last 12 months
        for (let i = 11; i >= 0; i--) {
          const monthKey = format(subMonths(new Date(), i), 'MMM yyyy');
          monthlyStats[monthKey] = { kitchenTotal: 0, kitchenCount: 0, barmanTotal: 0, barmanCount: 0, waiterTotal: 0, waiterCount: 0 };
        }

        let totalKitchenMins = 0;
        let countKitchen = 0;
        let totalBarmanMins = 0;
        let countBarman = 0;
        let totalWaiterMins = 0;
        let countWaiter = 0;

        orders.forEach(order => {
          let orderDate = new Date();
          if (order.createdAt?.toDate) {
            orderDate = order.createdAt.toDate();
          }
          const monthKey = format(orderDate, 'MMM yyyy');
          if (!monthlyStats[monthKey]) return;

          // Kitchen Prep
          if (order.kitchenStartedAt?.toDate && order.kitchenReadyAt?.toDate) {
            const start = order.kitchenStartedAt.toDate();
            const ready = order.kitchenReadyAt.toDate();
            const diffMins = Math.max(1, (ready.getTime() - start.getTime()) / 60000);
            monthlyStats[monthKey].kitchenTotal += diffMins;
            monthlyStats[monthKey].kitchenCount++;
            totalKitchenMins += diffMins;
            countKitchen++;
          }

          // Barman Prep
          if (order.barmanStartedAt?.toDate && order.barmanReadyAt?.toDate) {
            const start = order.barmanStartedAt.toDate();
            const ready = order.barmanReadyAt.toDate();
            const diffMins = Math.max(1, (ready.getTime() - start.getTime()) / 60000);
            monthlyStats[monthKey].barmanTotal += diffMins;
            monthlyStats[monthKey].barmanCount++;
            totalBarmanMins += diffMins;
            countBarman++;
          }

          // Waiter Serve
          if (order.kitchenReadyAt?.toDate && order.kitchenCompletedAt?.toDate) {
            const ready = order.kitchenReadyAt.toDate();
            const completed = order.kitchenCompletedAt.toDate();
            const diffMins = Math.max(0.5, (completed.getTime() - ready.getTime()) / 60000);
            monthlyStats[monthKey].waiterTotal += diffMins;
            monthlyStats[monthKey].waiterCount++;
            totalWaiterMins += diffMins;
            countWaiter++;
          }
          if (order.barmanReadyAt?.toDate && order.barmanCompletedAt?.toDate) {
            const ready = order.barmanReadyAt.toDate();
            const completed = order.barmanCompletedAt.toDate();
            const diffMins = Math.max(0.5, (completed.getTime() - ready.getTime()) / 60000);
            monthlyStats[monthKey].waiterTotal += diffMins;
            monthlyStats[monthKey].waiterCount++;
            totalWaiterMins += diffMins;
            countWaiter++;
          }
        });

        const finalChartData = Object.keys(monthlyStats).map(month => {
          const s = monthlyStats[month];
          return {
            name: month,
            Kitchen: s.kitchenCount > 0 ? Math.round(s.kitchenTotal / s.kitchenCount) : 0,
            Barman: s.barmanCount > 0 ? Math.round(s.barmanTotal / s.barmanCount) : 0,
            Waiter: s.waiterCount > 0 ? Math.round(s.waiterTotal / s.waiterCount) : 0,
          };
        });

        setChartData(finalChartData);
        setAverages({
          kitchen: countKitchen > 0 ? Math.round(totalKitchenMins / countKitchen) : 0,
          barman: countBarman > 0 ? Math.round(totalBarmanMins / countBarman) : 0,
          waiter: countWaiter > 0 ? Math.round(totalWaiterMins / countWaiter) : 0,
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching staff performance:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-400">Loading metrics...</div>;
  }

  return (
    <div className="min-h-screen bg-stone-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-3 bg-white text-stone-500 rounded-2xl hover:bg-stone-200 transition-all shadow-sm border border-stone-200"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-stone-900 tracking-tighter uppercase italic">Staff Performance</h1>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">12-Month History &middot; Average Times</p>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-6 relative overflow-hidden">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <ChefHat size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Kitchen (Prep)</p>
              <p className="text-4xl font-black text-stone-900 tracking-tighter">{averages.kitchen}<span className="text-sm font-bold text-stone-400 ml-1">mins</span></p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-6 relative overflow-hidden">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Coffee size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Barman (Prep)</p>
              <p className="text-4xl font-black text-stone-900 tracking-tighter">{averages.barman}<span className="text-sm font-bold text-stone-400 ml-1">mins</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-6 relative overflow-hidden">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Users size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Waiter (Serve)</p>
              <p className="text-4xl font-black text-stone-900 tracking-tighter">{averages.waiter}<span className="text-sm font-bold text-stone-400 ml-1">mins</span></p>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100 relative">
          <div className="mb-8">
             <h3 className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">12-Month Performance Trends</h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Average Minutes per Order</p>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKitchen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBarman" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWaiter" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 'bold' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ fontSize: '10px', textTransform: 'uppercase', color: '#a8a29e', fontWeight: '900', marginBottom: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="Kitchen" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorKitchen)" />
                <Area type="monotone" dataKey="Barman" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBarman)" />
                <Area type="monotone" dataKey="Waiter" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWaiter)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
