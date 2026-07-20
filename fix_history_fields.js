import fs from 'fs';

let content = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');

const oldOrderInfo = `<div className="flex justify-between text-xs">
                        <span className="font-bold text-stone-500">Order Type:</span>
                        <span className="font-black text-stone-900 uppercase">{selectedOrder.deliveryType}</span>
                      </div>`;

const newOrderInfo = `<div className="flex justify-between text-xs">
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
                      )}`;

content = content.replace(oldOrderInfo, newOrderInfo);
fs.writeFileSync('src/components/AdminHistoryTab.tsx', content);
