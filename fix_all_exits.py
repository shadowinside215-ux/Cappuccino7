import re

files = [
    'src/pages/waiter/WaiterDashboard.tsx',
    'src/pages/staff/KitchenDashboard.tsx',
    'src/pages/staff/BarmanDashboard.tsx',
    'src/pages/cashier/CashierDashboard.tsx'
]

for file in files:
    try:
        with open(file, 'r') as f:
            code = f.read()
    except FileNotFoundError:
        continue

    # 1. Add key to motion.div of the modal
    old_modal = 'className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]'
    new_modal = 'key="logout-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]'
    code = code.replace(old_modal, new_modal)

    # 2. Add auth.signOut or signOutApp(true) to the confirm button
    # It currently looks like:
    # onClick={async (e) => {
    #   e.preventDefault(); e.stopPropagation();
    #   localStorage.removeItem('waiter_session_active');
    #   localStorage.removeItem('staffSession');
    #   try {
    #      navigate('/login');
    #   } catch(e) {}
    # }}

    # We can just replace the whole onClick for the confirm button using regex
    def replacer(m):
        inner = m.group(1)
        # Add await signOutApp(true);
        if 'signOutApp' not in inner:
            inner = inner.replace('navigate(', 'await signOutApp(true); navigate(')
        return f'onClick={{async (e) => {{{inner}}}}}'

    code = re.sub(r'onClick=\{async\s*\([^)]*\)\s*=>\s*\{([^}]+navigate\([^}]+\)[^}]+)\}\}', replacer, code)

    # Also make sure the Exit button stops propagation
    old_exit = """onClick={() => setShowLogoutConfirm(true)}"""
    new_exit = """onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogoutConfirm(true); }}"""
    code = code.replace(old_exit, new_exit)
    
    with open(file, 'w') as f:
        f.write(code)

print("Updated modals.")
