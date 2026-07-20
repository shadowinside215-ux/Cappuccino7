import fs from 'fs';

function replaceInFile(file) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/order\.status === 'pending'/g, "(order.status === 'pending' || order.status === 'Waiting')");
    content = content.replace(/req\.status === 'pending'/g, "(req.status === 'pending' || req.status === 'Waiting')");
    content = content.replace(/activeRequest\.status === 'pending'/g, "(activeRequest.status === 'pending' || activeRequest.status === 'Waiting')");
    content = content.replace(/request\.status === 'pending'/g, "(request.status === 'pending' || request.status === 'Waiting')");
    fs.writeFileSync(file, content);
  }
}

replaceInFile('src/pages/Orders.tsx');
replaceInFile('src/pages/driver/DriverDashboard.tsx');
replaceInFile('src/components/CallWaiter.tsx');
replaceInFile('src/pages/waiter/WaiterDashboard.tsx');
