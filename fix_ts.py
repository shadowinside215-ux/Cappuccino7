import re

with open('src/pages/Cart.tsx', 'r') as f:
    code = f.read()

code = code.replace("userProfile?.itemLoyalty?.[item.productId] >= 11", "(userProfile?.itemLoyalty?.[item.productId] || 0) >= 11")

with open('src/pages/Cart.tsx', 'w') as f:
    f.write(code)

print("TS updated.")
