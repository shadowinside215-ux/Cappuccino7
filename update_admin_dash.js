import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Find the qRev section and replace the snapshot listener logic
const replaceLogic = `
    const unsubRev = onSnapshot(qRev, (snapshot) => {
      const revData: Record<string, { amount: number, orderCount: number }> = {};
      let todayRev = 0;
      let todayOrders = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        revData[d.id] = { 
          amount: data.amount || 0,
          orderCount: data.orderCount || 0
        };
      });
      
      setWeeklyRevenue(revData);
      setLoading(false);
      setRevError(null);
    }, (error) => {
      console.warn("Revenue listener error:", error.message);
      setRevError(error.message);
      setLoading(false);
    });

    // Compute Today's Revenue and Orders from the orders collection directly for absolute accuracy
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const qToday = query(
      collection(db, 'orders'),
      where('createdAt', '>=', todayStart),
      where('createdAt', '<=', todayEnd)
    );
    const unsubToday = onSnapshot(qToday, (snap) => {
      let dailyTotal = 0;
      let dailyCount = 0;
      snap.docs.forEach(d => {
        const o = d.data() as Order;
        if (o.isPaid || o.status === 'Paid') {
          dailyTotal += (o.total || 0);
          dailyCount++;
        }
      });
      setStats(prev => ({ ...prev, todayRevenue: dailyTotal, totalOrders: dailyCount }));
    }, (err) => {
      console.warn("Today orders listener error:", err.message);
    });
`;

// Also need to import startOfDay and endOfDay from date-fns
if (!content.includes('startOfDay')) {
  content = content.replace(
    /import \{ format \} from 'date-fns';/,
    "import { format, startOfDay, endOfDay } from 'date-fns';"
  );
}

// Replace the old unsubRev block
content = content.replace(
  /const unsubRev = onSnapshot\(qRev, \(snapshot\) => \{[\s\S]*?setLoading\(false\);\n    \}\);/,
  replaceLogic.trim()
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
