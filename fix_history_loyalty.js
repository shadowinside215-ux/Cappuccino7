import fs from 'fs';

let content = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');

// The Order Info section has Cashier. I'll add loyalty there.
const oldOrderInfo = `{selectedOrder.vendeur && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-stone-500">Cashier:</span>
                          <span className="font-black text-stone-900">{selectedOrder.vendeur}</span>
                        </div>
                      )}`;

const newOrderInfo = `{selectedOrder.vendeur && (
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
                      )}`;

content = content.replace(oldOrderInfo, newOrderInfo);
fs.writeFileSync('src/components/AdminHistoryTab.tsx', content);
