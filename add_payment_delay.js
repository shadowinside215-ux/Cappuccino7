import fs from 'fs';
let content = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');

// I need to find "grid grid-cols-2 gap-3" and change it to "grid grid-cols-2 md:grid-cols-4 gap-3" or just add another box.
content = content.replace(
  /<div className="grid grid-cols-2 gap-3">/,
  '<div className="grid grid-cols-2 gap-3">'
);

// We'll replace the Total Wait Time block to include Payment Delay
const oldTotalWait = `<div className="col-span-2 bg-stone-900 p-4 rounded-2xl text-white">
                        <p className="text-[9px] font-black uppercase text-stone-400 mb-1">Total Wait Time</p>
                        <p className="text-2xl font-black text-white">
                          {getDuration(selectedOrder.createdAt, selectedOrder.deliveredAt || selectedOrder.completedAt)}
                        </p>
                      </div>`;

const newTotalWait = `<div className="col-span-2 bg-emerald-950 p-4 rounded-2xl text-white">
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
                      </div>`;

content = content.replace(oldTotalWait, newTotalWait);
fs.writeFileSync('src/components/AdminHistoryTab.tsx', content);
