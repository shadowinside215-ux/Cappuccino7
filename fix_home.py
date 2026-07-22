import re

with open('src/pages/Home.tsx', 'r') as f:
    code = f.read()

# Replace price in popup modal
old_popup_price = """<span className="text-2xl font-black text-amber-400 italic">{selectedProduct.price} DH</span>"""
new_popup_price = """<div className="flex flex-col items-end">
                      {userProfile && (userProfile.itemLoyalty?.[selectedProduct.id] || 0) >= 11 ? (
                        <>
                          <span className="text-xs font-black text-stone-500 line-through decoration-red-500/50">{selectedProduct.price} DH</span>
                          <span className="text-2xl font-black text-amber-400 italic">0 DH</span>
                        </>
                      ) : (
                        <span className="text-2xl font-black text-amber-400 italic">{selectedProduct.price} DH</span>
                      )}
                    </div>"""
code = code.replace(old_popup_price, new_popup_price)

# Replace price in grid
old_grid_price = """{product.price} DH"""
new_grid_price = """{userProfile && (userProfile.itemLoyalty?.[product.id] || 0) >= 11 ? (
                              <div className="flex flex-col items-center">
                                <span className="text-[8px] line-through text-bento-ink/50 decoration-red-500/50">{product.price} DH</span>
                                <span className="text-amber-500">0 DH</span>
                              </div>
                            ) : (
                              <>{product.price} DH</>
                            )}"""
code = code.replace(old_grid_price, new_grid_price)

with open('src/pages/Home.tsx', 'w') as f:
    f.write(code)

print("Home updated.")
