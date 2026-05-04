import { doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, UserProfile, OrderStatus } from '../types';
import toast from 'react-hot-toast';

export async function awardOrderPoints(order: Order) {
  try {
    const userRef = doc(db, 'users', order.userId);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data() as UserProfile | undefined;
    
    const currentItemLoyalty = userData?.itemLoyalty || {};
    const newItemLoyalty = { ...currentItemLoyalty };
    
    order.items.forEach(item => {
      const currentCount = newItemLoyalty[item.productId] || 0;
      newItemLoyalty[item.productId] = currentCount + item.quantity;
    });

    const coffeeKeywords = ['coffee', 'cappuccino', 'latte', 'espresso', 'café', 'machiato', 'boisson chaude'];
    const coffeeCountInOrder = order.items.reduce((acc, item) => {
      const isCoffee = coffeeKeywords.some(kw => item.name.toLowerCase().includes(kw));
      return isCoffee ? acc + item.quantity : acc;
    }, 0);

    const pointsToAward = order.pointsEarned || order.items.length; // Fallback if pointsEarned not set

    await updateDoc(userRef, {
      points: increment(pointsToAward),
      coffeeCount: increment(coffeeCountInOrder),
      itemLoyalty: newItemLoyalty
    });
    
    const rewardTriggers = order.items.filter(item => (newItemLoyalty[item.productId] || 0) >= 11);
    if (rewardTriggers.length > 0) {
      toast.success(`🎉 ${order.customerName} earned a reward!`, { icon: '🎁' });
    }
  } catch (err) {
    console.error('Error awarding points:', err);
  }
}
