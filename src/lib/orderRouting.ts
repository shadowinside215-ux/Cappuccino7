import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { OrderItem } from '../types';

const kitchenKeywords = ['meal', 'food', 'burger', 'pizza', 'pasta', 'breakfast', 'sandwich', 'salad', 'crepe', 'pancake', 'waffle', 'petit déjeuner', 'omelette', 'tacos', 'panini', 'oeuf', 'egg'];
const barmanKeywords = ['juice', 'jus', 'drink', 'boisson', 'coffee', 'café', 'tea', 'thé', 'infusion', 'ice cream', 'glace', 'smoothie', 'mojito', 'milkshake', 'iced drink', 'frappuccino', 'hot drink', 'cappuccino', 'latte', 'espresso', 'water', 'eau', 'soda', 'coke', 'fanta', 'sprite'];

export async function processOrderItems(items: OrderItem[]): Promise<OrderItem[]> {
  const itemsWithMetadata: OrderItem[] = [];

  for (const item of items) {
    try {
      const productDoc = await getDoc(doc(db, 'products', item.productId));
      if (productDoc.exists()) {
        const productData = productDoc.data();
        const catDoc = await getDoc(doc(db, 'categories', productData.categoryId));
        const categoryName = catDoc.exists() ? catDoc.data().name : 'Menu';
        const lowerCat = categoryName.toLowerCase();
        const lowerName = item.name.toLowerCase();

        const isBreakfast = lowerCat.includes('breakfast') || lowerName.includes('petit déjeuner');
        const drinkMatch = barmanKeywords.find(kw => lowerName.includes(kw));
        
        if (isBreakfast && drinkMatch) {
          let foodName = item.name;
          barmanKeywords.forEach(kw => {
            const regex = new RegExp(`(\\+|with|and|&|\\s|\\/)*${kw}\\b`, 'gi');
            foodName = foodName.replace(regex, '').trim();
          });

          itemsWithMetadata.push({
            ...item,
            name: foodName || item.name,
            categoryName,
            subSection: productData.subSection || '',
            system: 'kitchen',
            isComboPart: true,
            comboType: 'food',
            pointsWorth: item.quantity
          });
          
          const drinkLabel = drinkMatch.charAt(0).toUpperCase() + drinkMatch.slice(1);
          itemsWithMetadata.push({
            ...item,
            name: `Drink: ${drinkLabel}`,
            price: 0,
            categoryName,
            subSection: productData.subSection || '',
            system: 'barman',
            isComboPart: true,
            comboType: 'drink',
            pointsWorth: 0
          });
        } else {
          let system: 'kitchen' | 'barman' = 'barman';
          const matchesDrink = barmanKeywords.some(kw => lowerName.includes(kw));
          const matchesFood = kitchenKeywords.some(kw => lowerName.includes(kw) || lowerCat.includes(kw));

          if (matchesDrink) {
            system = 'barman';
          } else if (matchesFood) {
            system = 'kitchen';
          }

          itemsWithMetadata.push({
            ...item,
            categoryName,
            subSection: productData.subSection || '',
            system,
            pointsWorth: item.quantity
          });
        }
      } else {
        itemsWithMetadata.push({ ...item, categoryName: 'Menu', subSection: '', system: 'barman', pointsWorth: item.quantity });
      }
    } catch (e) {
      console.error("Error routing item", e);
      itemsWithMetadata.push({ ...item, categoryName: 'Menu', subSection: '', system: 'barman', pointsWorth: item.quantity });
    }
  }

  return itemsWithMetadata;
}
