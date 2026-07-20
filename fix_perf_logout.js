import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/StaffPerformance.tsx', 'utf8');

if (!content.includes('signOutApp')) {
  content = content.replace(
    /import \{ useNavigate \} from 'react-router-dom';/,
    \`import { useNavigate } from 'react-router-dom';
import { signOutApp } from '../../lib/googleAuth';
import { LogOut } from 'lucide-react';\`
  );
}

content = content.replace(
  /<div className="flex items-center gap-4">/,
  \`<div className="flex items-center justify-between"><div className="flex items-center gap-4">\`
);

content = content.replace(
  /<p className="text-\[10px\] font-black text-amber-600 uppercase tracking-widest mt-1">Staff Performance & Timestamps<\/p>\n        <\/div>\n      <\/div>/,
  \`<p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Staff Performance & Timestamps</p>
        </div>
      </div>
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
        className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors border border-red-500/20"
      >
        <LogOut size={20} />
      </button>
      </div>\`
);

fs.writeFileSync('src/pages/admin/StaffPerformance.tsx', content);
