import fs from 'fs';

let content = fs.readFileSync('src/components/AdminHistoryTab.tsx', 'utf8');

const oldOrderItems = `<h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ChefHat size={12} /> Order Items
                    </h4>`;

const newOrderItems = `<h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ChefHat size={12} /> Order Items
                    </h4>
                    {selectedOrder.deliveryNotes && (
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mb-4 text-xs">
                        <span className="font-bold text-amber-700">Notes: </span>
                        <span className="text-amber-900 italic">{selectedOrder.deliveryNotes}</span>
                      </div>
                    )}`;

content = content.replace(oldOrderItems, newOrderItems);

// Add Firestore document ID
const oldHeader = `<h3 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">Order Details</h3>
                  <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mt-1">Receipt #{selectedOrder.id.slice(-8).toUpperCase()}</p>`;

const newHeader = `<h3 className="text-3xl font-black text-stone-900 uppercase italic tracking-tighter">Order Details</h3>
                  <p className="text-sm font-bold text-stone-500 uppercase tracking-widest mt-1">Receipt #{selectedOrder.id.slice(-8).toUpperCase()}</p>
                  <p className="text-[9px] font-mono text-stone-400 mt-1">Doc ID: {selectedOrder.id}</p>`;
                  
content = content.replace(oldHeader, newHeader);

fs.writeFileSync('src/components/AdminHistoryTab.tsx', content);
