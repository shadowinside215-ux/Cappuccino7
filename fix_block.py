import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

marker1 = "                           <Coffee size={32} className=\"opacity-20\" />\n                         </div>\n                       )}\n          {view === 'history' && ("
marker2 = "bg-stone-100 text-stone-500'}`}>\n          {view === 'history' && ("

missing_code = """                       ) : (
                         <OptimizedImage 
                           src={product.image} 
                           alt={product.name}
                           size="medium"
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                           containerClassName="w-full h-full"
                           showOverlay={false}
                           priority={idx < 12}
                         />
                       )}
                       <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
                          <span className="text-[10px] sm:text-xs font-black text-white tabular-nums">{product.price.toFixed(0)} MAD</span>
                       </div>
                    </div>
                    <div className="p-2 sm:p-4 flex flex-col items-center justify-center text-center flex-1">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase leading-tight line-clamp-2 text-stone-900 dark:text-stone-100 tracking-tight">{t(`products.${product.name}`, product.name)}</span>
                      {product.description && (
                        <p className="text-[7px] sm:text-[8px] text-stone-400 font-medium leading-tight mt-1 line-clamp-2 italic">
                          {t(`descriptions.${product.name}`, product.description)}
                        </p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {view === 'pending' && (
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
"""

# The code currently has:
#                           <Coffee size={32} className="opacity-20" />
#                         </div>
#                       )}
#          {view === 'history' && (
# ... [history block] ...
#                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">

# Wait, no. My previous script found `start_marker` and `tail_marker` and replaced it.
# Let's see what is actually in the file now.
