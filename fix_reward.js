import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

// For handleMarkPaid
const oldMarkPaid = `  const handleMarkPaid = async (order: Order, method: 'cash' | 'card' | 'reward') => {
    setIsProcessing(true);
    try {
      setIsSyncing(true);
      const { addOrderToStats } = await import('../../lib/stats');
      
      // Update order with payment method
      // We don't set isPaid: true here because addOrderToStats will handle it in a batch
      const updatePromise = updateDoc(doc(db, 'orders', order.id), {
        paymentMethod: method,
        updatedAt: serverTimestamp(),
        paidAtLocal: new Date().toISOString()
      });`;

const newMarkPaid = `  const handleMarkPaid = async (order: Order, method: 'cash' | 'card' | 'reward') => {
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
          [\`itemLoyalty.\${eligibleItem.productId}\`]: increment(-11)
        });
        
        // Update order item price to 0
        const updatedItems = order.items.map(i => 
          i === eligibleItem ? { ...i, price: 0 } : i
        );
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
      });`;

content = content.replace(oldMarkPaid, newMarkPaid);

const oldCheckout = `  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'reward') => {
    if (cart.length === 0) return;
    setIsProcessing(true);

    try {
      setIsSyncing(true);`;

const newCheckout = `  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'reward') => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    
    if (paymentMethod === 'reward') {
       toast.error("Not enough points for a reward");
       setIsProcessing(false);
       return;
    }

    try {
      setIsSyncing(true);`;

content = content.replace(oldCheckout, newCheckout);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
