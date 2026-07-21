import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# Let's write a replacement for the updatedItems logic in handleMarkPaid
old_logic = """        // Update order item price to 0
        const updatedItems = order.items.map(i => 
          i === eligibleItem ? { ...i, price: 0 } : i
        );"""

new_logic = """        // Update order item price to 0 and handle quantity > 1
        const updatedItems = [];
        for (const item of order.items) {
          if (item === eligibleItem) {
            if (item.quantity > 1) {
              updatedItems.push({ ...item, quantity: item.quantity - 1 });
              updatedItems.push({
                ...item,
                productId: item.productId + '-reward',
                name: item.name + ' (Loyalty Reward)',
                price: 0,
                quantity: 1
              });
            } else {
              updatedItems.push({
                ...item,
                name: item.name + ' (Loyalty Reward)',
                price: 0
              });
            }
          } else {
            updatedItems.push(item);
          }
        }"""

code = code.replace(old_logic, new_logic)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)
print("Fixed handleMarkPaid reward logic.")
