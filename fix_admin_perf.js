import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const perfButton = `        <button 
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
        </button>`;

content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">/,
  '<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">\n' + perfButton
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
