import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Update view state
code = code.replace(
    "const [view, setView] = useState<'pos' | 'pending'>('pos');",
    "const [view, setView] = useState<'pos' | 'pending' | 'history'>('pos');"
)

# 2. Remove showJournalModal state
code = code.replace(
    "  const [showJournalModal, setShowJournalModal] = useState(false);\n",
    ""
)

# 3. Add History tab
pending_tab = """           <button 
             onClick={() => setView('pending')}
             className={`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative whitespace-nowrap ${view === 'pending' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}`}
           >
             {t('pos_pending_payments')}
             {unpaidOrders.length > 0 && (
               <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[8px] rounded-full font-black">
                 {unpaidOrders.length}
               </span>
             )}
           </button>"""

new_tabs = pending_tab + """
           <button 
             onClick={() => setView('history')}
             className={`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative whitespace-nowrap ${view === 'history' ? 'border-amber-500 text-bento-ink' : 'border-transparent text-stone-500'}`}
           >
             {t('pos_sales_journal')}
           </button>"""

code = code.replace(pending_tab, new_tabs)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

