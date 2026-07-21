import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

old_update = """  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };"""

new_update = """  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          let newQty = item.quantity + delta;
          if (newQty > 11) newQty = 11;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as OrderItem[];
    });
  };"""

code = code.replace(old_update, new_update)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("CashierDashboard POS cart fixed.")
