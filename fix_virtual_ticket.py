import re
with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# Update left side visibility
code = code.replace(
    '<div className={`flex-1 flex flex-col min-w-0 ${showMobileCart ? \'hidden md:flex\' : \'flex\'}`}>',
    '<div className={`flex-1 flex flex-col min-w-0 ${showMobileCart && view === \'pos\' ? \'hidden md:flex\' : \'flex\'}`}>'
)

# Update right side visibility
old_virtual_ticket = '<div className={`w-full md:w-[280px] lg:w-[400px] bg-bento-card-bg text-bento-ink flex flex-col shadow-2xl relative border-l border-bento-card-border overflow-hidden shrink-0 ${showMobileCart ? \'flex\' : \'hidden md:flex\'}`}>'
new_virtual_ticket = '<div className={`w-full md:w-[280px] lg:w-[400px] bg-bento-card-bg text-bento-ink flex flex-col shadow-2xl relative border-l border-bento-card-border overflow-hidden shrink-0 ${showMobileCart && view === \'pos\' ? \'flex\' : view === \'pos\' ? \'hidden md:flex\' : \'hidden\'}`}>'
code = code.replace(old_virtual_ticket, new_virtual_ticket)

# Update the Mobile Cart Toggle button in the header so it only appears in POS view!
mobile_cart_toggle = """         {/* Mobile Cart Toggle */}
         <div className="md:hidden">
            <button 
              onClick={() => setShowMobileCart(!showMobileCart)}
              className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${showMobileCart ? 'bg-amber-500 border-amber-600 text-stone-900' : 'bg-stone-500/10 border-stone-500/20 text-stone-500'}`}
            >
               <ShoppingCart size={18} />
               {cart.length > 0 && <span className="text-[10px] font-black">{cart.length}</span>}
            </button>
         </div>"""

new_mobile_cart_toggle = """         {/* Mobile Cart Toggle */}
         {view === 'pos' && (
           <div className="md:hidden">
              <button 
                onClick={() => setShowMobileCart(!showMobileCart)}
                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${showMobileCart ? 'bg-amber-500 border-amber-600 text-stone-900' : 'bg-stone-500/10 border-stone-500/20 text-stone-500'}`}
              >
                 <ShoppingCart size={18} />
                 {cart.length > 0 && <span className="text-[10px] font-black">{cart.length}</span>}
              </button>
           </div>
         )}"""

code = code.replace(mobile_cart_toggle, new_mobile_cart_toggle)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

