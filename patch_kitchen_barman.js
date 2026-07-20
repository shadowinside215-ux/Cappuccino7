import fs from 'fs';

const patchFile = (file, startedAtField) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /\.\.\.\(newKitchenStatus === 'ready' \? \{ readyAt: serverTimestamp\(\), kitchenReadyAt: serverTimestamp\(\) \} : \{\}\)/,
    `...(newKitchenStatus === 'ready' ? { 
          readyAt: serverTimestamp(), 
          kitchenReadyAt: serverTimestamp(),
          kitchenPrepDuration: order.kitchenStartedAt ? Math.round((Date.now() - (order.kitchenStartedAt.toDate ? order.kitchenStartedAt.toDate().getTime() : new Date(order.kitchenStartedAt).getTime())) / 60000) : 0
        } : {})`
  );
  
  content = content.replace(
    /\.\.\.\(newBarmanStatus === 'ready' \? \{ readyAt: serverTimestamp\(\), barmanReadyAt: serverTimestamp\(\) \} : \{\}\)/,
    `...(newBarmanStatus === 'ready' ? { 
          readyAt: serverTimestamp(), 
          barmanReadyAt: serverTimestamp(),
          barmanPrepDuration: order.barmanStartedAt ? Math.round((Date.now() - (order.barmanStartedAt.toDate ? order.barmanStartedAt.toDate().getTime() : new Date(order.barmanStartedAt).getTime())) / 60000) : 0
        } : {})`
  );

  // Update status changes inside the if checks just in case they used pending instead of Waiting
  content = content.replace(/updates\.status = 'preparing';/g, "");
  
  fs.writeFileSync(file, content);
};

patchFile('src/pages/staff/KitchenDashboard.tsx', 'kitchenStartedAt');
if (fs.existsSync('src/pages/staff/BarmanDashboard.tsx')) {
  patchFile('src/pages/staff/BarmanDashboard.tsx', 'barmanStartedAt');
}

