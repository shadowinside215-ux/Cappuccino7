import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

start_pos = code.find("{view === 'pos' ? (")
pos_idx = start_pos + len("{view === 'pos' ? (")
sep_pos = code.find(") : (", pos_idx)
pending_idx = sep_pos + len(") : (")
end_pos = code.find("          )}", pending_idx)

pos_content = code[pos_idx:sep_pos]
pending_content = code[pending_idx:end_pos]

history_tab = """          {view === 'history' && (
            <div className="flex-1 overflow-y-auto bg-bento-card-bg custom-scrollbar shadow-2xl">
                <header className="flex justify-between items-center p-6 border-b border-bento-card-border sticky top-0 bg-bento-card-bg/90 backdrop-blur z-10">
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
                </header>
                <div className="p-8 border-b border-bento-card-border grid grid-cols-5 text-[10px] font-black uppercase tracking-widest text-stone-500 bg-stone-500/5">
                   <span className="pl-6">{t('pos_time')}</span>
                   <span>{t('pos_seller_id')}</span>
                   <span>{t('pos_payment_status')}</span>
                   <span className="text-right pr-6">{t('pos_amount')} (MAD)</span>
                   <span className="text-center">Action</span>
                </div>
                <div className="p-4 space-y-2">
                   {journalOrders.filter(o => 
      !journalSearch || 
      o.id.toLowerCase().includes(journalSearch.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.vendeur?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(journalSearch.toLowerCase()))
    ).map(order => (
                     <div key={order.id} className="bg-bento-bg border border-bento-card-border p-6 rounded-2xl grid grid-cols-5 items-center hover:bg-stone-500/5 transition-colors group">
                        <span className="pl-6 text-stone-500 font-bold tabular-nums flex items-center gap-3">
                           <Clock size={14} className="opacity-40" />
                           {order.createdAt instanceof Timestamp ? formatInTimeZone(order.createdAt.toDate(), 'Africa/Casablanca', 'dd/MM/yyyy HH:mm:ss') : 'LIVE'}
                        </span>
                        <div>
                           <div className="text-bento-ink font-black uppercase text-sm italic group-hover:text-amber-500 transition-colors">#{order.id.slice(-6).toUpperCase()}</div>
                           <div className="text-[9px] text-stone-500 font-bold uppercase tracking-widest mt-1">{order.vendeur}</div>
                        </div>
                        <div className="flex gap-2">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${order.paymentMethod === 'cash' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                {order.paymentMethod}
                           </span>
                           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest self-center opacity-40">{order.deliveryType}</span>
                        </div>
                        <span className="text-right pr-6 text-2xl font-black text-bento-ink tabular-nums group-hover:scale-110 transition-transform origin-right">{order.total.toFixed(2)}</span>
                        <div className="flex justify-center gap-2">
                           <button 
                             onClick={() => handlePrintOrder(order)}
                             className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-all"
                             title="Print Thermal Receipt"
                           >
                             <Printer size={18} />
                           </button>
                        </div>
                     </div>
                   ))}
                   {journalOrders.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale scale-150">
                         <Calculator size={80} strokeWidth={1} />
                         <p className="font-black uppercase tracking-[0.5em] text-[10px] mt-6">{t('no_active_orders')}</p>
                      </div>
                   )}
                </div>
            </div>
          )}
"""

new_content = "{view === 'pos' && (" + pos_content + ")}\n          {view === 'pending' && (" + pending_content + ")}\n" + history_tab

final_code = code[:start_pos] + new_content + code[end_pos+12:]

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(final_code)

print("Replaced view renderers.")

