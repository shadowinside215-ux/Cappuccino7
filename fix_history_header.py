import re
with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

old_header = """                <header className="flex justify-between items-center p-6 border-b border-bento-card-border sticky top-0 bg-bento-card-bg/90 backdrop-blur z-10">
                   <div className="flex items-center gap-6">
                      <div className="p-4 bg-amber-600 rounded-3xl text-stone-950 shadow-xl">
                         <History size={32} />
                      </div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-bento-ink">{t('pos_sales_journal')}</h2>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200">
                       <Calendar size={16} className="text-stone-400 mr-2" />
                       <input
                          type="date"
                          value={journalDate}
                          onChange={e => setJournalDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-bold text-stone-700"
                        />
                     </div>
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200">
                       <Search size={16} className="text-stone-400 mr-2" />
                       <input type="text" value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm font-bold w-48 text-stone-700" />
                     </div>
                   </div>
                </header>"""

new_header = """                <header className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 gap-4 border-b border-bento-card-border sticky top-0 bg-bento-card-bg/90 backdrop-blur z-10">
                   <div className="flex items-center gap-4 md:gap-6">
                      <div className="p-3 md:p-4 bg-amber-600 rounded-xl md:rounded-3xl text-stone-950 shadow-xl shrink-0">
                         <History className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter text-bento-ink leading-tight max-w-[200px] md:max-w-none">{t('pos_sales_journal')}</h2>
                   </div>
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 w-full md:w-auto">
                     <div className="flex items-center bg-white/50 px-3 md:px-4 py-2 rounded-xl border border-stone-200 w-full sm:w-auto">
                       <Calendar size={16} className="text-stone-400 mr-2 shrink-0" />
                       <input
                          type="date"
                          value={journalDate}
                          onChange={e => setJournalDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-xs md:text-sm font-bold text-stone-700 w-full"
                        />
                     </div>
                     <div className="flex items-center bg-white/50 px-3 md:px-4 py-2 rounded-xl border border-stone-200 w-full sm:w-auto">
                       <Search size={16} className="text-stone-400 mr-2 shrink-0" />
                       <input type="text" value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-xs md:text-sm font-bold w-full md:w-48 text-stone-700" />
                     </div>
                   </div>
                </header>"""

if old_header in code:
    code = code.replace(old_header, new_header)
    print("Replaced!")
else:
    print("Not found, falling back to regex")
    # regex approach or manual
    pass

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)
