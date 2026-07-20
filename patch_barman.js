import fs from 'fs';
let content = fs.readFileSync('src/pages/staff/BarmanDashboard.tsx', 'utf8');

content = content.replace(
  "const [initialLoadDone, setInitialLoadDone] = useState(false);",
  "const [initialLoadDone, setInitialLoadDone] = useState(false);\n  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');"
);

content = content.replace(
  /const q = query\([\s\S]*?where\('barmanStatus', 'in', \['pending', 'preparing', 'ready'\]\)\n    \);/,
  `const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = activeTab === 'active' 
      ? query(collection(db, 'orders'), where('barmanStatus', 'in', ['pending', 'preparing']))
      : query(collection(db, 'orders'), where('barmanStatus', 'in', ['ready', 'completed']), where('createdAt', '>=', today));`
);

content = content.replace(
  "}, [initialLoadDone, t, auth.currentUser]);",
  "}, [initialLoadDone, t, auth.currentUser, activeTab]);"
);

content = content.replace(
  /<div className="flex items-center gap-4">/,
  `<div className="flex items-center gap-4">
          <div className="bg-stone-200 dark:bg-stone-800 p-1 rounded-2xl flex gap-1 mr-4">
            <button 
              onClick={() => setActiveTab('active')}
              className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${activeTab === 'active' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
            >
              Active
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={\`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all \${activeTab === 'history' ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}\`}
            >
              History
            </button>
          </div>`
);

content = content.replace(
  /<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\s*\{\/\* Action Buttons \*\/\}/,
  `` // this might not match exactly, let's use a safer replace
);

fs.writeFileSync('src/pages/staff/BarmanDashboard.tsx', content);
