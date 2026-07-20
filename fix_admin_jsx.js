import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /<p className="text-\[10px\] font-bold text-stone-400 uppercase tracking-widest">Average Order Value<\/p>\n\n        \{\!isClientAdmin && \(/,
  '<p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Average Order Value</p>\n          </div>\n\n        {!isClientAdmin && ('
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
