const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
content = content.replace(
  "sessionStorage.removeItem('admin_mode');\n                localStorage.removeItem('staffSession');\n                navigate('/', { replace: true });",
  "navigate('/');"
);
fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);

let menuContent = fs.readFileSync('src/pages/admin/AdminMenu.tsx', 'utf8');
menuContent = menuContent.replace(
  "sessionStorage.removeItem('admin_mode');\n              localStorage.removeItem('staffSession');\n              navigate('/', { replace: true });\n              toast.success('Exited admin view');",
  "navigate('/admin', { replace: true });"
);
fs.writeFileSync('src/pages/admin/AdminMenu.tsx', menuContent);
