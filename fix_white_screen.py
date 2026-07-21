with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

bad_effect = """  // Auto-update selectedOrder when unpaidOrders changes
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = unpaidOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [unpaidOrders, selectedOrder]);"""

code = code.replace(bad_effect, "")

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("Removed bad effect")
