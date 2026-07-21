import re

files = [
    'src/pages/waiter/WaiterDashboard.tsx',
    'src/pages/cashier/CashierDashboard.tsx',
    'src/pages/admin/AdminDashboard.tsx'
]

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    if "await signOutApp(false);" in content:
        content = content.replace("await signOutApp(false);", "")
    if "signOutApp(false);" in content:
        content = content.replace("signOutApp(false);", "")
        
    with open(file, 'w') as f:
        f.write(content)

print("Removed signOutApp calls from dashboards.")
