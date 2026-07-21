with open('src/pages/admin/AdminStats.tsx', 'r') as f:
    code = f.read()

old_block = """    // Listen to dailyRevenue collection
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
    }, (error) => {"""

new_block = """    // Listen to stats collection
    const q = query(collection(db, 'stats'), orderBy('lastUpdated', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          amount: (d.amount || 0) + (d.revenue || 0),
          orderCount: (d.orderCount || 0) + (d.orders || 0),
          lastUpdated: d.lastUpdated
        } as DailyStat;
      });
      setData(stats);
      setLoading(false);
    }, (error) => {"""

if old_block in code:
    code = code.replace(old_block, new_block)
    with open('src/pages/admin/AdminStats.tsx', 'w') as f:
        f.write(code)
    print("Replaced stats block in AdminStats.tsx")
else:
    print("Could not find old_block in AdminStats.tsx")
