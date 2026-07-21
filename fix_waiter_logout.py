import re
import os

files = [
    ('src/pages/waiter/WaiterDashboard.tsx', 'waiter_session_active'),
    ('src/pages/staff/KitchenDashboard.tsx', 'kitchen_session_active'),
    ('src/pages/staff/BarmanDashboard.tsx', 'barman_session_active'),
    ('src/pages/cashier/CashierDashboard.tsx', 'cashier_session_active')
]

for file, session_key in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            code = f.read()

        # Find the exit button and replace its onClick
        # The exit button has text {t('exit', 'Exit')} or similar
        
        # Replace the button entirely
        btn_pattern = r'<button[^>]*onClick=\{[^}]*setShowLogoutConfirm\(true\)[^}]*\}[^>]*>.*?<\/button>'
        
        new_btn = f"""<button 
             onClick={{() => {{
               signOutApp().then(() => {{
                 localStorage.removeItem('{session_key}');
                 localStorage.removeItem('staffSession');
                 navigate('/login');
               }}).catch(() => {{}});
             }}}}
             className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 cursor-pointer relative z-50 hover:bg-red-100 transition-colors"
           >
             {{t('exit', 'Exit')}}
           </button>"""
           
        code = re.sub(btn_pattern, new_btn, code, flags=re.DOTALL)
        
        # Remove the showLogoutConfirm state
        code = re.sub(r'const \[showLogoutConfirm, setShowLogoutConfirm\] = useState\(false\);\n', '', code)
        
        # Remove the modal block (AnimatePresence with showLogoutConfirm)
        modal_pattern = r'<AnimatePresence>\s*\{showLogoutConfirm && \([\s\S]*?\}\s*<\/AnimatePresence>'
        code = re.sub(modal_pattern, '', code)
        
        with open(file, 'w') as f:
            f.write(code)

print("Exit buttons fixed to use global modal")
