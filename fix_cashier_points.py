import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

old_code = """updates[`itemLoyalty.${productId}`] = increment(earnedCount);
                  
                  const currentPoints = itemLoyalty[productId] || 0;
                  const newPoints = currentPoints + earnedCount;
                  
                  if (currentPoints < 11 && newPoints >= 11) {"""

new_code = """const currentPoints = itemLoyalty[productId] || 0;
                  let newPoints = currentPoints + earnedCount;
                  if (newPoints > 11) newPoints = 11;
                  
                  updates[`itemLoyalty.${productId}`] = newPoints;
                  
                  if (currentPoints < 11 && newPoints === 11) {"""

code = code.replace(old_code, new_code)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("Small block replacement.")
