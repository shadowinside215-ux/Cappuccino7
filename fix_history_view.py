import re
with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# Fix header responsiveness
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
                      <div className="p-3 md:p-4 bg-amber-600 rounded-2xl md:rounded-3xl text-stone-950 shadow-xl">
                         <History size={24} className="md:w-8 md:h-8" />
                      </div>
                      <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-bento-ink">{t('pos_sales_journal')}</h2>
                   </div>
                   <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 w-full md:w-auto">
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200 flex-1 sm:flex-none">
                       <Calendar size={16} className="text-stone-400 mr-2 shrink-0" />
                       <input
                          type="date"
                          value={journalDate}
                          onChange={e => setJournalDate(e.target.value)}
                          className="bg-transparent border-none outline-none text-sm font-bold text-stone-700 w-full"
                        />
                     </div>
                     <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200 flex-1 sm:flex-none">
                       <Search size={16} className="text-stone-400 mr-2 shrink-0" />
                       <input type="text" value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm font-bold w-full md:w-48 text-stone-700" />
                     </div>
                   </div>
                </header>"""
code = code.replace(old_header, new_header)

old_table_header = """                <div className="p-8 border-b border-bento-card-border grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-500/5">
                   <span className="pl-6">{t('pos_time')}</span>
                   <span>{t('pos_seller_id')}</span>
                   <span>{t('pos_payment_status')}</span>
                   <span className="text-right pr-6">{t('pos_amount')} (MAD)</span>
                   <span className="text-center">Action</span>
                </div>"""

new_table_header = """                <div className="p-4 md:p-8 border-b border-bento-card-border hidden md:grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-500/5">
                   <span className="pl-6">{t('pos_time')}</span>
                   <span>{t('pos_seller_id')}</span>
                   <span>{t('pos_payment_status')}</span>
                   <span className="text-right pr-6">{t('pos_amount')} (MAD)</span>
                   <span className="text-center">Action</span>
                </div>"""
code = code.replace(old_table_header, new_table_header)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

