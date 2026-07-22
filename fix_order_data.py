import re

with open('src/pages/Cart.tsx', 'r') as f:
    code = f.read()

# Replace total: total with the original total
old_order_data = """      const orderData: any = {
        userId: auth.currentUser.uid,
        customerName: userProfile?.name || auth.currentUser.displayName || (isGuest ? t('guest', 'Guest') : t('customer', 'Customer')),
        
        items: itemsWithMetadata,
        total: total,
"""

new_order_data = """      const orderData: any = {
        userId: auth.currentUser.uid,
        customerName: userProfile?.name || auth.currentUser.displayName || (isGuest ? t('guest', 'Guest') : t('customer', 'Customer')),
        
        items: itemsWithMetadata,
        total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
"""

code = code.replace(old_order_data, new_order_data)

with open('src/pages/Cart.tsx', 'w') as f:
    f.write(code)

print("Cart orderData updated.")
