import fs from 'fs';
let content = fs.readFileSync('src/pages/cashier/CashierDashboard.tsx', 'utf8');

// Add a search input state for journal
content = content.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  "const [searchQuery, setSearchQuery] = useState('');\n  const [journalSearch, setJournalSearch] = useState('');"
);

// Add the input to the modal
content = content.replace(
  /<h2 className="text-5xl font-black uppercase italic tracking-tighter text-bento-ink">\{t\('pos_sales_journal'\)\}<\/h2>/,
  `<h2 className="text-5xl font-black uppercase italic tracking-tighter text-bento-ink">{t('pos_sales_journal')}</h2>
                   <div className="flex items-center bg-white/50 px-4 py-2 rounded-xl border border-stone-200 ml-4">
                     <Search size={16} className="text-stone-400 mr-2" />
                     <input type="text" value={journalSearch} onChange={e => setJournalSearch(e.target.value)} placeholder="Search..." className="bg-transparent border-none outline-none text-sm font-bold w-48 text-stone-700" />
                   </div>`
);

// Filter the journalOrders
content = content.replace(
  /\{journalOrders\.map\(order => \(/,
  `{journalOrders.filter(o => 
      !journalSearch || 
      o.id.toLowerCase().includes(journalSearch.toLowerCase()) || 
      o.customerName?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.vendeur?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.paymentMethod?.toLowerCase().includes(journalSearch.toLowerCase()) ||
      o.items?.some(i => i.name.toLowerCase().includes(journalSearch.toLowerCase()))
    ).map(order => (`
);

fs.writeFileSync('src/pages/cashier/CashierDashboard.tsx', content);
