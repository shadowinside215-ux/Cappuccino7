import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# First, find the qRev block
old_block = """    const qRev = query(
      collection(db, 'dailyRevenue')
    );
    
    const unsubMonth = onSnapshot(collection(db, 'monthlyRevenue'), (snapshot) => {
      let rev = 0; let ord = 0;
      const currentMonth = format(new Date(), 'yyyy-MM'); // yyyy-MM
      snapshot.docs.forEach(d => {
        if (d.id === currentMonth) {
          rev += d.data().amount || 0;
          ord += d.data().orderCount || 0;
        }
      });
      setMonthlyStats({ revenue: rev, orders: ord });
    }, (error) => {
      console.warn("Monthly Revenue Snapshot Error:", error);
    });

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
    });"""

new_block = """    const unsubRev = onSnapshot(collection(db, 'stats'), (snapshot) => {
      const revData: Record<string, { amount: number, orderCount: number }> = {};
      let todayRev = 0;
      let todayOrders = 0;
      let monthRev = 0;
      let monthOrders = 0;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      snapshot.docs.forEach(d => {
        const data = d.data();
        const amt = (data.amount || 0) + (data.revenue || 0);
        const ord = (data.orderCount || 0) + (data.orders || 0);
        
        revData[d.id] = { 
          amount: amt,
          orderCount: ord
        };
        
        if (d.id === today) {
          todayRev = amt;
          todayOrders = ord;
        }
        
        if (d.id.startsWith(currentMonth)) {
          monthRev += amt;
          monthOrders += ord;
        }
      });
      
      setWeeklyRevenue(revData);
      setMonthlyStats({ revenue: monthRev, orders: monthOrders });
      setStats(prev => ({ ...prev, todayRevenue: todayRev, totalOrders: todayOrders }));
      setLoading(false);
      setRevError(null);
    }, (error) => {
      console.warn("Revenue listener error:", error.message);
      setRevError(error.message);
      setLoading(false);
    });"""

if old_block in code:
    code = code.replace(old_block, new_block)
    # Also need to remove unsubMonth from the cleanup
    code = code.replace("unsubMonth();\n      unsubRev();", "unsubRev();")
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(code)
    print("Replaced stats block.")
else:
    print("Could not find old stats block. Doing a regex replacement...")
