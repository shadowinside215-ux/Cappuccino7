import sys

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

start_idx = code.find("          {view === 'pending' && (")
end_idx = code.find("          {/* Categories Bottom Bar - Matching the theme */}")

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    sys.exit(1)

clean_pending_and_history = """          {view === 'pending' && (
            <div className="flex-1 overflow-y-auto bg-bento-bg p-6 space-y-4 custom-scrollbar">
               <h2 className="text-2xl font-black uppercase italic tracking-tighter text-amber-500 mb-8">{t('pos_unpaid_orders')}</h2>
               
               {/* Ready for Collection Section */}
               <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center text-stone-900">
                        <CheckCircle2 size={16} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-bento-ink">{t('ready_for_collection', 'Ready for Collection')}</h3>
                     <div className="h-px flex-1 bg-stone-500/10"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     {unpaidOrders.filter(o => (o.status === 'delivered' || o.status === 'Completed' || o.status === 'ready') || o.isPOS).map(order => (
                        <div key={order.id} className="bg-white border-2 border-green-500/50 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-green-500 transition-all shadow-xl shadow-green-500/5 min-h-[450px]">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${order.deliveryType === 'dine-in' ? 'bg-stone-900 text-white border border-amber-500/20 shadow-lg' : 'bg-stone-100 text-stone-500'}`}>
                                      {order.deliveryType === 'dine-in' ? (
                                        <div className="flex items-center gap-2">
                                          <Navigation size={10} className="text-amber-400" />
                                          {order.fullTableLabel || order.tableNumber}
                                        </div>
                                      ) : order.deliveryType}
                                    </span>
                                 </div>
                                 <p className="text-stone-400 font-bold text-[10px] uppercase">{order.customerName}</p>
                                 {order.waiterName && (
                                   <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black uppercase text-amber-600">
                                      <Users size={10} />
                                      {t('waiter', 'Waiter') as string}: {order.waiterName}
                                   </div>
                                 )}
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-stone-900 tabular-nums">{order.total.toFixed(2)}</p>
                                 <p className="text-[8px] text-stone-500 font-black uppercase tracking-widest">MAD TOTAL</p>
                              </div>
                           </div>
                           
                           <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex flex-col gap-0.5 pb-2 border-b border-stone-50">
                                   <div className="flex justify-between text-[10px] font-black uppercase text-stone-700">
                                      <span>{item.quantity}x {t(`products.${item.name}`, item.name) as string}</span>
                                      <span>{(item.price * item.quantity).toFixed(2)} MAD</span>
                                   </div>
                                   {(item as any).categoryName && (
                                     <span className="text-[7px] font-black uppercase tracking-widest text-amber-600/60">
                                       {t(`categories.${(item as any).categoryName}`, (item as any).categoryName) as string}
                                     </span>
                                   )}
                                   {item.customization && (
                                     <span className="text-[8px] font-black text-bento-ink/40 uppercase italic">
                                       • {translateCustomization(item.customization, t)}
                                     </span>
                                   )}
                                </div>
                              ))}
                           </div>
                           
                           <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handlePrintOrder(order)}
                                className="p-4 bg-stone-100 text-stone-600 rounded-2xl hover:bg-stone-200 transition-all flex items-center justify-center shadow-lg"
                                title="Print Thermal Receipt"
                              >
                                <Printer size={24} />
                              </button>
                              <button 
                                onClick={() => markOrderPaid(order.id)}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-stone-950 p-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex flex-col items-center justify-center gap-1 shadow-xl shadow-green-500/20"
                              >
                                 <span className="flex items-center gap-2">
                                    <Banknote size={18} />
                                    {t('pay_cash', 'Pay Cash')}
                                 </span>
                              </button>
                           </div>
                        </div>
                     ))}
                     {unpaidOrders.filter(o => (o.status === 'delivered' || o.status === 'Completed' || o.status === 'ready') || o.isPOS).length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 grayscale border-2 border-dashed border-stone-200 rounded-[3rem]">
                           <CheckCircle2 size={48} className="mb-4 text-stone-400" />
                           <p className="font-black uppercase tracking-[0.3em] text-[10px] text-stone-500">{t('no_orders_ready', 'No orders ready for collection')}</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* In Preparation Section */}
               <div>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center text-stone-900">
                        <Clock size={16} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-bento-ink">{t('in_preparation', 'In Preparation')}</h3>
                     <div className="h-px flex-1 bg-stone-500/10"></div>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                     {unpaidOrders.filter(o => (o.status === 'preparing' || o.status === 'pending') && !o.isPOS).map(order => (
                        <div key={order.id} className="bg-white/50 border border-amber-500/20 p-6 rounded-[2.5rem] flex flex-col justify-between group opacity-70 hover:opacity-100 transition-all min-h-[450px]">
                           <div className="flex justify-between items-start mb-6">
                              <div>
                                 <div className="flex items-center gap-3 mb-1">
                                    <span className="text-xl font-black text-stone-900 uppercase italic tracking-tighter">#{order.id.slice(-6).toUpperCase()}</span>
                                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${order.deliveryType === 'dine-in' ? 'bg-stone-900 text-white border border-amber-500/20 shadow-lg' : 'bg-stone-100 text-stone-500'}`}>
                                      {order.deliveryType === 'dine-in' ? (
                                        <div className="flex items-center gap-2">
                                          <Navigation size={10} className="text-amber-400" />
                                          {order.fullTableLabel || order.tableNumber}
                                        </div>
                                      ) : order.deliveryType}
                                    </span>
                                 </div>
                                 <p className="text-stone-400 font-bold text-[10px] uppercase">{order.customerName}</p>
                                 {order.waiterName && (
                                   <div className="flex items-center gap-1.5 mt-1 text-[8px] font-black uppercase text-amber-600">
                                      <Users size={10} />
                                      {t('waiter', 'Waiter') as string}: {order.waiterName}
                                   </div>
                                 )}
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-stone-400 tabular-nums">{order.total.toFixed(2)}</p>
                              </div>
                           </div>
                           
                           <div className="space-y-3 mb-6 flex-1 overflow-y-auto pr-2 custom-scrollbar opacity-60">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-[9px] font-bold uppercase text-stone-500">
                                   <span>{item.quantity}x {t(`products.${item.name}`, item.name) as string}</span>
                                </div>
                              ))}
                           </div>
                           
                           <div className="pt-4 border-t border-amber-500/10 flex items-center justify-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 animate-pulse flex items-center gap-2">
                                 <Clock size={14} />
                                 {t('waiting_for_kitchen', 'Waiting for kitchen...')}
                              </span>
                           </div>
                        </div>
                     ))}
                     {unpaidOrders.filter(o => (o.status === 'preparing' || o.status === 'pending') && !o.isPOS).length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center opacity-30 grayscale border-2 border-dashed border-stone-200 rounded-[3rem]">
                           <Clock size={48} className="mb-4 text-stone-400" />
                           <p className="font-black uppercase tracking-[0.3em] text-[10px] text-stone-500">{t('no_orders_prep', 'No orders in preparation')}</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          )}
          
          {view === 'history' && (
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

new_code = code[:start_idx] + clean_pending_and_history + code[end_idx:]

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(new_code)
print("File completely repaired!")
