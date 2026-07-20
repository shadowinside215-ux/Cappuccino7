import fs from 'fs';
let content = fs.readFileSync('src/pages/staff/KitchenDashboard.tsx', 'utf8');

content = content.replace(
  "const [initialLoadDone, setInitialLoadDone] = useState(false);",
  "const [initialLoadDone, setInitialLoadDone] = useState(false);\n  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');"
);

// We need to change the query to depend on activeTab
content = content.replace(
  /const q = query\([\s\S]*?where\('kitchenStatus', 'in', \['pending', 'preparing', 'ready'\]\)\n    \);/,
  `const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = activeTab === 'active' 
      ? query(collection(db, 'orders'), where('kitchenStatus', 'in', ['pending', 'preparing']))
      : query(collection(db, 'orders'), where('kitchenStatus', 'in', ['ready', 'completed']), where('createdAt', '>=', today));`
);

// Add activeTab to dependency array
content = content.replace(
  "}, [initialLoadDone, t, auth.currentUser]);",
  "}, [initialLoadDone, t, auth.currentUser, activeTab]);"
);

// Update updateKitchenStatus:
// Remove 'completed' logic if we want, or keep it but change the UI.
// The user says: "remove the complete button from barman and kitchen they should have only 2 preparing and ready buttons"
// I will just remove the complete button from the JSX.

let updatedJsx = content.replace(
  /<button[\s\S]*?onClick=\{\(\) => updateKitchenStatus\(order, 'completed'\)\}[\s\S]*?<\/button>/,
  ''
);

// Add a tab toggle in the UI.
updatedJsx = updatedJsx.replace(
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

// In history tab, show time took to make.
// We can add it where the action buttons are.
updatedJsx = updatedJsx.replace(
  /\{order\.deliveryNotes && \(/,
  `{activeTab === 'history' && (
                  <div className="mt-4 p-4 bg-stone-100 rounded-2xl flex items-center justify-between text-stone-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">Prep Time</span>
                    <span className="text-sm font-bold">
                      {order.kitchenReadyAt && order.kitchenStartedAt ? 
                        Math.round((order.kitchenReadyAt.toDate().getTime() - order.kitchenStartedAt.toDate().getTime()) / 60000) + ' min' 
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {activeTab === 'active' && (
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={() => updateKitchenStatus(order, order.kitchenStatus === 'pending' ? 'preparing' : 'ready')}
                      className={\`flex flex-col items-center gap-2 py-6 rounded-[2rem] transition-all \${
                        order.kitchenStatus === 'preparing' 
                        ? 'bg-green-500 text-stone-950 shadow-lg shadow-green-500/20' 
                        : 'bg-stone-500/10 text-stone-500 hover:bg-stone-500/20 hover:text-bento-ink'
                      }\`}
                    >
                      {order.kitchenStatus === 'preparing' ? <CheckCircle2 size={24} /> : <Soup size={24} />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {order.kitchenStatus === 'preparing' ? t('mark_ready_status') : t('mark_preparing')}
                      </span>
                    </button>
                  </div>
                )}
                {/* Action Buttons */}
                {/* The old grid grid-cols-2 gap-3 was here, we removed the complete button and wrapped the remaining button in activeTab check above */}
                {order.deliveryNotes && (`
);

// Wait, the original code had:
// <div className="grid grid-cols-2 gap-3">
//    <button ... />
// </div>
// Let's replace the whole Action Buttons block.

fs.writeFileSync('src/pages/staff/KitchenDashboard.tsx', content);
