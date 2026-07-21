import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

effect = """  // Track Firestore sync status
  useEffect(() => {
    const unsubSync = onSnapshotsInSync(db, () => {
      // This fires when all local changes have been synchronized with the server
      setIsSyncing(false);
    });
    return () => unsubSync();
  }, []);"""

new_effect = """  // Track Firestore sync status
  useEffect(() => {
    const unsubSync = onSnapshotsInSync(db, () => {
      // This fires when all local changes have been synchronized with the server
      setIsSyncing(false);
    });
    return () => unsubSync();
  }, []);

  // Auto-update selectedOrder when unpaidOrders changes
  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = unpaidOrders.find(o => o.id === selectedOrder.id);
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updatedOrder);
      }
    }
  }, [unpaidOrders, selectedOrder]);"""

code = code.replace(effect, new_effect)

# In handleRewardCheck, remove the setSelectedOrder(null) so it just stays open and updates
code = code.replace('      setSelectedOrder(null);\n    } catch (err: any) {', '    } catch (err: any) {')

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("Updated sync for selectedOrder")
