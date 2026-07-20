import React, { useState } from 'react';
import { Order } from '../types';
import { Clock, Eye, Search, Filter, Calendar, X, ChefHat, CheckCircle, Truck, Info, Award } from 'lucide-react';

export function AdminHistoryTab({ orders }: { orders: Order[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const historyOrders = orders.filter(o => (o.isPaid || o.status === 'Paid') &&
    (!searchQuery || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.waiterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.fullTableLabel || o.tableNumber)?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const formatTimeWithSeconds = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Casablanca' });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-GB');
  };

  const getDuration = (start: any, end: any) => {
    if (!start || !end) return 'N/A';
    const s = start.toDate ? start.toDate().getTime() : new Date(start).getTime();
    const e = end.toDate ? end.toDate().getTime() : new Date(end).getTime();
    if (e < s) return '0s';
    const diff = e - s;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">Order History</h2>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Professional POS Log</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center bg-stone-50 px-4 py-3 rounded-2xl border border-stone-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
            <Search size={16} className="text-stone-400 mr-2" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search history..." 
              className="bg-transparent border-none outline-none text-xs font-bold w-full md:w-64 text-stone-700" 
            />
          </div>
          <button className="p-3 bg-stone-50 border border-stone-200 text-stone-600 rounded-2xl hover:bg-stone-100 transition-colors">
            <Filter size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-[10px] font-black uppercase tracking-widest text-stone-500 border-b border-stone-100">
                <th className="p-4 pl-6">Order ID</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Waiter</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {historyOrders.map(order => (
                <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="p-4 pl-6 text-xs font-bold text-stone-700 uppercase">#{order.id.slice(-6)}</td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-stone-900">{formatDate(order.createdAt)}</div>
                    <div className="text-[10px] font-black text-stone-400 uppercase">{formatTimeWithSeconds(order.createdAt)}</div>
                  </td>
                  <td className="p-4 text-xs font-bold text-stone-700">{order.customerName || '-'}</td>
                  <td className="p-4 text-xs font-bold text-stone-700">{order.waiterName || '-'}</td>
                  <td className="p-4 text-xs font-black text-stone-900">{order.total.toFixed(2)} MAD</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-black uppercase tracking-widest">
                      {order.isPaid || order.status === 'Paid' ? 'Paid' : 'Completed'}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-6">
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="px-4 py-2 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-stone-800 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {historyOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400 text-xs font-bold uppercase tracking-widest">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedOrder(null)} 
              className="absolute top-6 right-6 p-2 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8 border-b border-stone-100 pb-8">
                <div>
                  <h3 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">Order Details</h3>
                  <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mt-1">Receipt #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                  <p className="text-[9px] font-mono text-stone-400 mt-1">Doc ID: {selectedOrder.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Subtotal: {selectedOrder.total.toFixed(2)} MAD</div>
                  {selectedOrder.paymentMethod === 'reward' && (
                    <div className="text-[10px] font-bold text-amber-500 uppercase">Discount: -{selectedOrder.total.toFixed(2)} MAD (Reward)</div>
                  )}
                  <div className="text-3xl font-black text-stone-900 mt-1">{selectedOrder.paymentMethod === 'reward' ? '0.00' : selectedOrder.total.toFixed(2)} MAD</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100 inline-flex items-center gap-1 mt-2">
                    <CheckCircle size={12} /> {selectedOrder.paymentMethod || 'Paid'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock size={12} /> Exact Timeline
                    </h4>
                    <div className="space-y-3 bg-stone-50 p-5 rounded-2xl border border-stone-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600">Created:</span>
                        <span className="font-black text-stone-900">{formatDate(selectedOrder.createdAt)} {formatTimeWithSeconds(selectedOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600">Prep Started:</span>
                        <span className="font-black text-stone-900">{formatTimeWithSeconds(selectedOrder.kitchenStartedAt || selectedOrder.barmanStartedAt || selectedOrder.preparingAt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600">Ready:</span>
                        <span className="font-black text-stone-900">{formatTimeWithSeconds(selectedOrder.readyAt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-stone-600">Served:</span>
                        <span className="font-black text-stone-900">{formatTimeWithSeconds(selectedOrder.deliveredAt || selectedOrder.completedAt)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-3 border-t border-stone-200/50">
                        <span className="font-bold text-stone-600">Paid:</span>
                        <span className="font-black text-emerald-600">{formatTimeWithSeconds(selectedOrder.paidAt || selectedOrder.paymentConfirmedAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Info size={12} /> Performance Durations
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Kitchen Prep</p>
                        <p className="text-xl font-black text-orange-600">
                          {getDuration(selectedOrder.kitchenStartedAt || selectedOrder.barmanStartedAt || selectedOrder.preparingAt, selectedOrder.readyAt)}
                        </p>
                      </div>
                      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
                        <p className="text-[9px] font-black uppercase text-stone-500 mb-1">Waiter Service</p>
                        <p className="text-xl font-black text-blue-600">
                          {getDuration(selectedOrder.readyAt, selectedOrder.deliveredAt || selectedOrder.completedAt)}
                        </p>
                      </div>
                      <div className="col-span-2 bg-emerald-950 p-4 rounded-2xl text-white">
                        <p className="text-[9px] font-black uppercase text-emerald-400/80 mb-1">Payment Delay</p>
                        <p className="text-xl font-black text-emerald-400">
                          {getDuration(selectedOrder.deliveredAt || selectedOrder.completedAt, selectedOrder.paidAt || selectedOrder.paymentConfirmedAt)}
                        </p>
                      </div>
                      <div className="col-span-2 bg-stone-900 p-4 rounded-2xl text-white">
                        <p className="text-[9px] font-black uppercase text-stone-400 mb-1">Total Wait Time</p>
                        <p className="text-2xl font-black text-white">
                          {getDuration(selectedOrder.createdAt, selectedOrder.deliveredAt || selectedOrder.completedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ChefHat size={12} /> Order Items
                    </h4>
                    {selectedOrder.deliveryNotes && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4 text-xs">
                        <span className="font-bold text-amber-700">Notes: </span>
                        <span className="text-amber-900 italic">{selectedOrder.deliveryNotes}</span>
                      </div>
                    )}
                    <div className="bg-stone-50 rounded-2xl border border-stone-100 p-2 max-h-64 overflow-y-auto">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-white rounded-xl transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center text-[10px] font-black">{item.quantity}x</span>
                            <div>
                              <span className="text-xs font-bold text-stone-900">{item.name}</span>
                              {item.customization && (
                                <p className="text-[9px] font-bold text-stone-500">{item.customization}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-black text-stone-700">{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Award size={12} /> Order Info
                    </h4>
                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-stone-500">Order Type:</span>
                        <span className="font-black text-stone-900 uppercase">{selectedOrder.deliveryType}</span>
                      </div>
                      {selectedOrder.userId && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Customer ID:</span>
                          <span className="font-black text-stone-900 font-mono text-[9px]">{selectedOrder.userId}</span>
                        </div>
                      )}
                      {selectedOrder.customerName && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Customer:</span>
                          <span className="font-black text-stone-900">{selectedOrder.customerName}</span>
                        </div>
                      )}
                      {selectedOrder.tableArea && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Area:</span>
                          <span className="font-black text-stone-900">{selectedOrder.tableArea}</span>
                        </div>
                      )}
                      {selectedOrder.tableZone && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Location:</span>
                          <span className="font-black text-stone-900">{selectedOrder.fullTableLabel || `Zone ${selectedOrder.tableZone} - T${selectedOrder.tableNumber}`}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-stone-500">Waiter:</span>
                        <span className="font-black text-stone-900">{selectedOrder.waiterName || 'N/A'}</span>
                      </div>
                      {selectedOrder.vendeur && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Cashier:</span>
                          <span className="font-black text-stone-900">{selectedOrder.vendeur}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs pt-2 border-t border-stone-200">
                        <span className="font-bold text-stone-500">Points Earned:</span>
                        <span className="font-black text-emerald-600">+{Math.floor(selectedOrder.total / 10)}</span>
                      </div>
                      {selectedOrder.paymentMethod === 'reward' && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Points Redeemed:</span>
                          <span className="font-black text-amber-600">Yes (Reward)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
