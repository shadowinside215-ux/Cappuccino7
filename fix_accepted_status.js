import fs from 'fs';

function replaceInFile(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/order\.status === 'accepted'/g, "(order.status === 'accepted' || order.status === 'Taken')");
    content = content.replace(/req\.status === 'accepted'/g, "(req.status === 'accepted' || req.status === 'Taken')");
    content = content.replace(/activeRequest\.status === 'accepted'/g, "(activeRequest.status === 'accepted' || activeRequest.status === 'Taken')");
    content = content.replace(/request\.status === 'accepted'/g, "(request.status === 'accepted' || request.status === 'Taken')");
    fs.writeFileSync(file, content);
  }
}

replaceInFile('src/pages/Orders.tsx');
replaceInFile('src/pages/driver/DriverDashboard.tsx');
replaceInFile('src/components/CallWaiter.tsx');
replaceInFile('src/pages/waiter/WaiterDashboard.tsx');
