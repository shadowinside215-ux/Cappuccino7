import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

bottom_bar_left = """             <div className="flex flex-row md:flex-col h-full bg-bento-card-bg border-r border-bento-card-border px-2 md:px-3 items-center justify-center gap-2 md:gap-1 z-20">
                <div className="flex gap-2">
                   <button onClick={() => setShowClosureModal(true)} className="p-2 md:p-1.5 bg-stone-500/10 rounded-lg text-red-500 hover:bg-red-500/20" title={t('pos_closure')}><LogOut size={16} /></button>
                </div>
             </div>"""

code = code.replace(bottom_bar_left, "")

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

