const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminStats.tsx', 'utf8');

if (!content.includes('signOutApp')) {
  content = content.replace(
    /import \{ useNavigate \} from 'react-router-dom';/,
    "import { useNavigate } from 'react-router-dom';\nimport { signOutApp } from '../../lib/googleAuth';\nimport { LogOut } from 'lucide-react';"
  );
}

const headerReplace = `<div className="flex items-center gap-6">
           <button 
             onClick={() => navigate('/admin')} 
             className="p-5 bg-amber-500 text-stone-900 rounded-3xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 group flex items-center gap-3"
           >
             <LayoutDashboard size={24} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-xs font-black uppercase tracking-widest">{t('back_to_dashboard', 'Back to Dashboard')}</span>
           </button>
           <button 
             onClick={async () => {
               try {
                 await signOutApp();
                 navigate('/');
               } catch(e) {
                 console.error(e);
                 navigate('/');
               }
             }}
             className="p-5 bg-red-500/10 text-red-500 rounded-3xl hover:bg-red-500/20 transition-all active:scale-95 group flex items-center gap-3"
             title="Logout"
           >
             <LogOut size={24} />
           </button>
           <div className="h-10 w-px bg-stone-200" />`;

content = content.replace(
  /<div className="flex items-center gap-6">\s*<button \s*onClick=\{\(\) => navigate\('\/admin'\)\} \s*className="[^"]*"\s*>\s*<LayoutDashboard size=\{24\} className="[^"]*" \/>\s*<span className="[^"]*">\{t\('back_to_dashboard', 'Back to Dashboard'\)\}<\/span>\s*<\/button>\s*<div className="h-10 w-px bg-stone-200" \/>/,
  headerReplace
);

fs.writeFileSync('src/pages/admin/AdminStats.tsx', content);
