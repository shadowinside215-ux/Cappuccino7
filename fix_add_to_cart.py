import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

old_add = """  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }"""

new_add = """  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: Math.min(11, item.quantity + 1) } 
            : item
        );
      }"""

code = code.replace(old_add, new_add)
with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("CashierDashboard addToCart fixed.")
