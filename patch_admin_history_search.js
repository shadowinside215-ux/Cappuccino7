import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

// Add search state
content = content.replace(
  /export default function AdminOrders\(\) \{/,
  "export default function AdminOrders() {\n  const [searchQuery, setSearchQuery] = useState('');"
);
content = content.replace(
  /import \{ useState, useEffect \} from 'react';/,
  "import { useState, useEffect } from 'react';\nimport { Search } from 'lucide-react';"
);

// Filter completedOrders
content = content.replace(
  /const completedOrders = orders\.filter\(o => o\.status === 'delivered' \|\| o\.status === 'Completed' \|\| o\.status === 'Paid' \|\| o\.isPaid\)\.slice\(0, 15\);/,
  `const completedOrders = orders.filter(o => 
    (o.status === 'delivered' || o.status === 'Completed' || o.status === 'Paid' || o.isPaid) &&
    (!searchQuery || 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.waiterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.fullTableLabel || o.tableNumber)?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ).slice(0, 15);`
);

// Add search input UI
const searchUI = `
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white px-4 py-2 rounded-xl border border-stone-200">
                <Search size={16} className="text-stone-400 mr-2" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search history..." className="bg-transparent border-none outline-none text-xs font-bold w-48 text-stone-700" />
              </div>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-200">
                 Live Tracking
              </div>
            </div>
`;

content = content.replace(
  /<div className="px-4 py-2 bg-green-100 text-green-700 rounded-2xl text-\[10px\] font-black uppercase tracking-widest border border-green-200">\s*Live Tracking\s*<\/div>/,
  searchUI
);

fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
