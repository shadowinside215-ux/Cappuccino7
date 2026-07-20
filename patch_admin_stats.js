import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Add states for month/year stats
const newStates = `
  const [monthlyStats, setMonthlyStats] = useState({ revenue: 0, orders: 0 });
  const [yearlyStats, setYearlyStats] = useState({ revenue: 0, orders: 0 });
`;

content = content.replace(
  /const \[weeklyRevenue, setWeeklyRevenue\] = useState<Record<string, \{ amount: number, orderCount: number \}\>>\(\{\}\);/,
  "const [weeklyRevenue, setWeeklyRevenue] = useState<Record<string, { amount: number, orderCount: number }>>({});" + newStates
);

// Add listeners inside useEffect
const newListeners = `
    const unsubMonth = onSnapshot(collection(db, 'monthlyRevenue'), (snapshot) => {
      let rev = 0; let ord = 0;
      const currentMonth = new Date().toISOString().slice(0, 7); // yyyy-MM
      snapshot.docs.forEach(d => {
        if (d.id === currentMonth) {
          rev += d.data().amount || 0;
          ord += d.data().orderCount || 0;
        }
      });
      setMonthlyStats({ revenue: rev, orders: ord });
    });

    const unsubYear = onSnapshot(collection(db, 'yearlyRevenue'), (snapshot) => {
      let rev = 0; let ord = 0;
      const currentYear = new Date().getFullYear().toString(); // yyyy
      snapshot.docs.forEach(d => {
        if (d.id === currentYear) {
          rev += d.data().amount || 0;
          ord += d.data().orderCount || 0;
        }
      });
      setYearlyStats({ revenue: rev, orders: ord });
    });
`;

content = content.replace(
  /const unsubRev = onSnapshot\(qRev, \(snapshot\) => \{/,
  newListeners + "\n    const unsubRev = onSnapshot(qRev, (snapshot) => {"
);

// Add UI blocks below Today's Revenue
const uiBlocks = `
          </div>
          <div className="card !p-6 flex flex-col justify-center bg-bento-card-bg border-bento-card-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-2xl md:text-3xl font-black text-bento-ink mb-1">{monthlyStats.revenue.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Monthly Rev (Orders: {monthlyStats.orders})</p>
          </div>
          <div className="card !p-6 flex flex-col justify-center bg-bento-card-bg border-bento-card-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-2xl md:text-3xl font-black text-bento-ink mb-1">{yearlyStats.revenue.toFixed(0)} MAD</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Yearly Rev (Orders: {yearlyStats.orders})</p>
          </div>
          <div className="card !p-6 flex flex-col justify-center bg-bento-card-bg border-bento-card-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-2xl md:text-3xl font-black text-amber-600 mb-1">{stats.totalOrders > 0 ? (stats.todayRevenue / stats.totalOrders).toFixed(2) : '0'} DH</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Average Order Value</p>
`;

content = content.replace(
  /<\/div>\n\s*\{\!isClientAdmin && \(/,
  uiBlocks + "\n        {!isClientAdmin && ("
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
