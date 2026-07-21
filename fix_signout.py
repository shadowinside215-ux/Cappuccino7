import os

files = [
    'src/pages/waiter/WaiterDashboard.tsx',
    'src/pages/staff/KitchenDashboard.tsx',
    'src/pages/staff/BarmanDashboard.tsx',
    'src/pages/cashier/CashierDashboard.tsx',
    'src/pages/Profile.tsx'
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r') as f:
            content = f.read()
        
        # Replace await signOutApp(true); navigate...
        content = content.replace("await signOutApp(true); navigate('/login');", "signOutApp(true).catch(console.error); navigate('/login');")
        content = content.replace("await signOutApp(true);\\n      navigate('/');", "signOutApp(true).catch(console.error);\\n      navigate('/');")
        
        with open(file, 'w') as f:
            f.write(content)

print("Sign out fixed")
