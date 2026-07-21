import fs from 'fs';

const fixFile = (filePath, replacements) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [regex, rep] of replacements) {
      content = content.replace(regex, rep);
    }
    fs.writeFileSync(filePath, content);
  }
}

fixFile('src/pages/waiter/WaiterDashboard.tsx', [
  [/setWaiterProfile\(docSnap\.data\(\) as UserProfile\);\s*\}\s*\}\);/g, `setWaiterProfile(docSnap.data() as UserProfile); } }, (err) => console.warn(err));`],
  [/setOrders\(filtered\);\s*\}\);/g, `setOrders(filtered); }, (err) => console.warn(err));`],
  [/audio\.play\(\)\.catch\(\(\) => \{\}\);\s*\}\s*\}\s*\}\);\s*if \(isInitialLoad\) \{/g, `audio.play().catch(() => {});
          }
        }
      }, (err) => console.warn(err));
      if (isInitialLoad) {`]
]);

fixFile('src/pages/cashier/CashierDashboard.tsx', [
  [/\}\);/g, '});'], // Just need to be careful with CashierDashboard. Let's do it specifically.
]);

