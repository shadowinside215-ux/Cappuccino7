import re

with open('src/pages/Cart.tsx', 'r') as f:
    code = f.read()

# Replace total calculation
old_total = "const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);"
new_total = """const getItemTotalPrice = (item: OrderItem) => {
    const points = userProfile?.itemLoyalty?.[item.productId] || 0;
    if (points >= 11) {
      const rewards = Math.min(item.quantity, Math.floor(points / 11));
      return item.price * (item.quantity - rewards);
    }
    return item.price * item.quantity;
  };
  const total = items.reduce((sum, item) => sum + getItemTotalPrice(item), 0);"""

code = code.replace(old_total, new_total)

# Replace the display price
old_price = """<p className="font-black text-2xl text-bento-ink">{(item.price * item.quantity)} DH</p>"""
new_price = """<div className="flex flex-col items-end">
                          {userProfile?.itemLoyalty?.[item.productId] >= 11 ? (
                            <>
                              <p className="font-black text-xs text-bento-ink/40 line-through decoration-red-500/50 decoration-2">{(item.price * item.quantity)} DH</p>
                              <p className="font-black text-2xl text-bento-primary">{getItemTotalPrice(item)} DH</p>
                            </>
                          ) : (
                            <p className="font-black text-2xl text-bento-ink">{(item.price * item.quantity)} DH</p>
                          )}
                        </div>"""

code = code.replace(old_price, new_price)

with open('src/pages/Cart.tsx', 'w') as f:
    f.write(code)

print("Cart updated.")
