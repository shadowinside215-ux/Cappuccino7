import re

with open('src/pages/Home.tsx', 'r') as f:
    code = f.read()

old_add = """  const addToCart = (product: Product, customization?: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id && item.customization === customization);
    if (existing) {
      existing.quantity += 1;
    } else {"""

new_add = """  const addToCart = (product: Product, customization?: string) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((item: any) => item.productId === product.id && item.customization === customization);
    if (existing) {
      existing.quantity = Math.min(11, existing.quantity + 1);
    } else {"""

code = code.replace(old_add, new_add)
with open('src/pages/Home.tsx', 'w') as f:
    f.write(code)

print("Home.tsx addToCart fixed.")
