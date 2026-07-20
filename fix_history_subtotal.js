import fs from 'fs';

let content = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');

const oldRightSide = `<div className="text-right">
                  <div className="text-3xl font-black text-stone-900">{selectedOrder.total.toFixed(2)} MAD</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100 inline-flex items-center gap-1 mt-2">
                    <CheckCircle size={12} /> {selectedOrder.paymentMethod || 'Paid'}
                  </div>
                </div>`;

const newRightSide = `<div className="text-right">
                  <div className="text-[10px] font-bold text-stone-500 uppercase">Subtotal: {selectedOrder.total.toFixed(2)} MAD</div>
                  {selectedOrder.paymentMethod === 'reward' && (
                    <div className="text-[10px] font-bold text-amber-500 uppercase">Discount: -{selectedOrder.total.toFixed(2)} MAD (Reward)</div>
                  )}
                  <div className="text-3xl font-black text-stone-900 mt-1">{selectedOrder.paymentMethod === 'reward' ? '0.00' : selectedOrder.total.toFixed(2)} MAD</div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-100 inline-flex items-center gap-1 mt-2">
                    <CheckCircle size={12} /> {selectedOrder.paymentMethod || 'Paid'}
                  </div>
                </div>`;

content = content.replace(oldRightSide, newRightSide);
fs.writeFileSync('src/components/AdminHistoryTab.tsx', content);
