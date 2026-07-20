import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// The block starts with {!isClientAdmin && ( \n <> \n <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"> \n <button onClick={() => navigate('/admin/performance')}

const perfBlock = \`        <button 
          onClick={() => navigate('/admin/performance')}
          className="card !p-8 border-2 border-stone-300 group hover:bg-stone-50 hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-1">Staff Performance</h3>
              <p className="text-stone-400 text-sm font-bold uppercase tracking-widest">Order History & Analytics</p>
            </div>
            <div className="p-4 bg-stone-100 rounded-full group-hover:bg-bento-primary group-hover:text-white transition-all">
              <Users size={32} className="transition-colors" />
            </div>
          </div>
        </button>\`;

// Remove the button from inside the !isClientAdmin block
content = content.replace(perfBlock, '');

// Insert it right before {!isClientAdmin && (
// The line right before it is usually "</div> </div>" from the chart section
content = content.replace(
  /{!isClientAdmin && \(/,
  \`<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 mb-4">
\${perfBlock}
</div>
      {!isClientAdmin && (\`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
