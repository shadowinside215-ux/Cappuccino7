import re

with open('src/pages/Cart.tsx', 'r') as f:
    code = f.read()

# Add Minus to imports
code = code.replace("Plus, Trash2,", "Plus, Minus, Trash2,")

# Update updateQuantity
old_update = """  const updateQuantity = (id: string, delta: number) => {
    const newItems = items.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };"""

new_update = """  const updateQuantity = (id: string, delta: number) => {
    const newItems = items.map(item => {
      if (item.productId === id) {
        let newQty = item.quantity + delta;
        if (newQty > 11) newQty = 11;
        newQty = Math.max(0, newQty);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };"""

code = code.replace(old_update, new_update)

# Update the buttons
old_buttons = """                        <div className="flex items-center gap-4 bg-bento-ink/10 rounded-full px-4 py-2 ring-1 ring-bento-card-border backdrop-blur-md">
                          <button 
                            onClick={() => updateQuantity(item.productId, -item.quantity)}
                            className="text-red-500/80 hover:text-red-500 transition-colors text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                          >
                            Cancel order
                          </button>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="text-bento-ink/40 hover:text-bento-ink transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>"""

new_buttons = """                        <div className="flex items-center gap-4 bg-bento-ink/10 rounded-full px-4 py-2 ring-1 ring-bento-card-border backdrop-blur-md">
                          <button 
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="text-bento-ink/40 hover:text-bento-ink transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="text-bento-ink/40 hover:text-bento-ink transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                          <div className="w-[1px] h-4 bg-bento-card-border mx-2"></div>
                          <button 
                            onClick={() => updateQuantity(item.productId, -item.quantity)}
                            className="text-red-500/80 hover:text-red-500 transition-colors text-[10px] uppercase font-black tracking-widest whitespace-nowrap"
                          >
                            {t('remove', 'Remove')}
                          </button>
                        </div>"""

code = code.replace(old_buttons, new_buttons)

with open('src/pages/Cart.tsx', 'w') as f:
    f.write(code)

print("Cart.tsx updated.")
