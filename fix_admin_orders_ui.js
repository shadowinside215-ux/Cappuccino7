import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

// Import the new tab
content = content.replace(
  /import \{ OrderTimer \} from '\.\.\/\.\.\/components\/OrderTimer';/,
  "import { OrderTimer } from '../../components/OrderTimer';\nimport { AdminHistoryTab } from '../../components/AdminHistoryTab';"
);

// Add state for active tab
content = content.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  "const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');\n  const [searchQuery, setSearchQuery] = useState('');"
);

// Replace the return statement
// We need to keep the live orders view and wrap it in the activeTab condition.
// Since the file is huge and `return (` is around line 119, we will just use a regex block replace for the `return (` statement downwards.

const returnReplacement = `
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-brown-950 uppercase italic tracking-tighter">{t('live_orders') as string} & History</h1>
        <div className="flex bg-stone-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('live')}
            className={\`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all \${
              activeTab === 'live' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-400 hover:text-stone-600'
            }\`}
          >
            Live Tracking
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={\`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all \${
              activeTab === 'history' 
              ? 'bg-white text-stone-900 shadow-sm' 
              : 'text-stone-400 hover:text-stone-600'
            }\`}
          >
            POS History Log
          </button>
        </div>
      </div>

      {activeTab === 'live' ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
            <AlertCircle size={14} /> {activeOrders.length} {t('waiting_label') as string}
          </div>
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-brown-100 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-brown-200 mb-4" />
              <h3 className="text-xl font-bold text-brown-900 mb-2">{t('no_orders') as string}</h3>
              <p className="text-brown-400">{t('no_orders_desc') as string}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
`;

// It's safer to just replace the whole file from `return (` to the end.
const oldReturnStr = '  return (\n    <div className="space-y-12 pb-20">';

// We can extract everything before `return (`
let topPart = content.split('  return (')[0];

// Wait, we need the activeOrders map logic. It's better to just write the activeOrders render logic manually to keep it clean.
// Actually, I can just use a node script to splice it.

