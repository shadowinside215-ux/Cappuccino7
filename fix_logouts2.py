import re

def add_state(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    if "const [showLogoutConfirm" not in content:
        content = content.replace("const [orders, setOrders]", "const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  const [orders, setOrders]")
        with open(filepath, 'w') as f:
            f.write(content)

add_state('src/pages/staff/KitchenDashboard.tsx')
add_state('src/pages/staff/BarmanDashboard.tsx')
add_state('src/pages/waiter/WaiterDashboard.tsx')

print("Fixed.")
