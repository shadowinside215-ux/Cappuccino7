import { doc, setDoc, increment, serverTimestamp, getDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { Order } from '../types';
import { format, startOfWeek, startOfMonth } from 'date-fns';

/**
 * Statistics Service
 * Ensures revenue is only counted when explicitly paid.
 * Tracks daily, weekly, and monthly stats.
 */

export const addOrderToStats = async (orderId: string, orderTotal: number) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      throw new Error('Order not found');
    }

    const orderData = orderSnap.data() as Order;

    // 1. Prevent double counting
    if (orderData.isPaid) {
      console.warn('Order already counted in stats');
      return;
    }

    const batch = writeBatch(db);
    const now = new Date();
    
    // Day ID: YYYY-MM-DD
    const dayId = format(now, 'yyyy-MM-dd');
    // Week ID: YYYY-Www (e.g. 2024-W22)
    const weekId = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-ww');
    // Month ID: YYYY-MM
    const monthId = format(startOfMonth(now), 'yyyy-MM');

    // 2. Update Daily Revenue (The primary source for AdminStats)
    const dailyRef = doc(db, 'dailyRevenue', dayId);
    batch.set(dailyRef, {
      amount: increment(orderTotal),
      orderCount: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 3. Update Weekly Stats (requested explicitly)
    const weeklyRef = doc(db, 'weeklyRevenue', weekId);
    batch.set(weeklyRef, {
      amount: increment(orderTotal),
      orderCount: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 4. Update Monthly Stats (requested explicitly)
    const monthlyRef = doc(db, 'monthlyRevenue', monthId);
    batch.set(monthlyRef, {
      amount: increment(orderTotal),
      orderCount: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 5. Update Legacy 'stats' collection (if still used by some components)
    const legacyRef = doc(db, 'stats', dayId);
    batch.set(legacyRef, {
      revenue: increment(orderTotal),
      orders: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 6. Mark order as paid
    batch.update(orderRef, {
      isPaid: true,
      paidAt: serverTimestamp()
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error adding order to stats:', error);
    throw error;
  }
};
