import re

with open('src/pages/waiter/WaiterDashboard.tsx', 'r') as f:
    code = f.read()

# Fix modal z-index and structure
code = code.replace('className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]', 'className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]')

# Just to make sure the click works, we'll explicitly pass e.stopPropagation()
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

# Make sure confirm button also stops propagation
old_confirm_btn = """                   <button 
                     onClick={async () => {
                       localStorage.removeItem('waiter_session_active');
                       localStorage.removeItem('staffSession');
                       try {
                          
                          navigate('/login');
                        } catch(e) {}
                     }}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >"""

new_confirm_btn = """                   <button 
                     onClick={async (e) => {
                       e.preventDefault(); e.stopPropagation();
                       localStorage.removeItem('waiter_session_active');
                       localStorage.removeItem('staffSession');
                       try {
                          navigate('/login');
                       } catch(e) {}
                     }}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >"""

code = code.replace(old_confirm_btn, new_confirm_btn)

with open('src/pages/waiter/WaiterDashboard.tsx', 'w') as f:
    f.write(code)

print("Waiter dashboard exit fixed.")
