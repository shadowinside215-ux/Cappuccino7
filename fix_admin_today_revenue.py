import re
with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Update unsubRev to also compute and set todayRev and todayOrders
old_unsubRev = """    const unsubRev = onSnapshot(qRev, (snapshot) => {
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
    }, (error) => {"""

new_unsubRev = """    const unsubRev = onSnapshot(qRev, (snapshot) => {
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
        if (d.id === today) {
          todayRev = data.amount || 0;
          todayOrders = data.orderCount || 0;
        }
      });
      
      setWeeklyRevenue(revData);
      setStats(prev => ({ ...prev, todayRevenue: todayRev, totalOrders: todayOrders }));
      setLoading(false);
      setRevError(null);
    }, (error) => {"""
code = code.replace(old_unsubRev, new_unsubRev)

# 2. Delete the qToday query and its unsubToday entirely to avoid conflicts
qToday_logic = """    // Compute Today's Revenue and Orders from the orders collection directly for absolute accuracy
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
    });"""

code = code.replace(qToday_logic, "")

# Remove unsubToday from the return function
code = code.replace("unsubToday();", "")

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

