import re

files = ['src/pages/staff/KitchenDashboard.tsx', 'src/pages/staff/BarmanDashboard.tsx']

for file in files:
    with open(file, 'r') as f:
        code = f.read()

    # Z-index
    code = code.replace('className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]', 'className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]')

    # Button
    old_btn = """           <button 
             onClick={() => setShowLogoutConfirm(true)}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100"
           >
             {t('exit') as string}
           </button>"""
           
    new_btn = """           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogoutConfirm(true); }}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 cursor-pointer relative z-50 hover:bg-red-100 transition-colors"
           >
             {t('exit', 'Exit')}
           </button>"""

    code = code.replace(old_btn, new_btn)

    with open(file, 'w') as f:
        f.write(code)

print("Other dashboards exit fixed.")
