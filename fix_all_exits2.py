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

    # Fix the key issue
    code = code.replace('className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]', 'key="logout-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999]')

    old_nav = "navigate('/login');"
    new_nav = "await signOutApp(true); navigate('/login');"
    code = code.replace(old_nav, new_nav)

    with open(file, 'w') as f:
        f.write(code)

print("Updated modals again.")
