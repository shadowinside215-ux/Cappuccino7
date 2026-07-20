import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');
content = content.replace(
  /<div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-\[10px\] font-black uppercase tracking-wider w-max">\s*<AlertCircle size=\{14\} \/> \{activeOrders\.length\} \{t\('waiting_label'\) as string\}\s*<\/div>/,
  `{activeOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-wider w-max">
              <AlertCircle size={14} /> {activeOrders.length} {t('waiting_label') as string}
            </div>
          )}`
);
fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
