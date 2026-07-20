import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

const oldAOV = `          <div className="card !p-6 flex flex-col justify-center bg-bento-card-bg border-bento-card-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <p className="text-2xl md:text-3xl font-black text-amber-600 mb-1">{stats.totalOrders > 0 ? (stats.todayRevenue / stats.totalOrders).toFixed(2) : '0'} DH</p>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Average Order Value</p>
          </div>`;

content = content.replace(oldAOV, "");
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
