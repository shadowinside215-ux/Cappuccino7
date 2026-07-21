import re
with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# Replace the h-14 header container
code = code.replace(
    '<div className="h-14 bg-bento-card-bg border-b border-bento-card-border flex items-center px-4 gap-2 md:gap-4 shrink-0 overflow-x-auto">',
    '<div className="h-14 bg-bento-card-bg border-b border-bento-card-border flex items-center px-2 md:px-4 gap-2 md:gap-4 shrink-0 overflow-x-auto custom-scrollbar-hide">'
)

code = code.replace(
    '<div className="flex-1 flex gap-2 md:gap-4 ml-2">',
    '<div className="flex-1 flex gap-2 md:gap-4 ml-1 md:ml-2 items-center h-full">'
)

code = code.replace(
    'className={`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${view === \'pos\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}',
    'className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === \'pos\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}'
)

code = code.replace(
    'className={`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative whitespace-nowrap ${view === \'pending\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}',
    'className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === \'pending\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}'
)

code = code.replace(
    'className={`px-4 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 relative whitespace-nowrap ${view === \'history\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}',
    'className={`px-3 md:px-6 h-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all border-b-2 shrink-0 whitespace-nowrap flex items-center ${view === \'history\' ? \'border-amber-500 text-bento-ink\' : \'border-transparent text-stone-500\'}`}'
)

code = code.replace(
    '<button \n              onClick={() => setShowClosureModal(true)}\n             className="p-1.5 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20"\n           >',
    '<button \n              onClick={() => setShowClosureModal(true)}\n             className="p-1.5 bg-red-500/10 rounded-lg text-red-500 hover:bg-red-500/20 ml-auto shrink-0"\n           >'
)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

