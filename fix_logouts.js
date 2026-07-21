import fs from 'fs';

// 1. Fix Profile.tsx
let profile = fs.readFileSync('src/pages/Profile.tsx', 'utf8');
profile = profile.replace(/await signOutApp\(\);/g, 'await signOutApp(true);'); // Guest logout skips confirm

// For the main profile logout button, remove window.confirm and use the beautiful modal
profile = profile.replace(
  /onClick=\{async \(\) => \{\s*const confirmed = window\.confirm\(t\('logout_confirm', 'Are you sure you want to log out\?'\)\);\s*if \(confirmed\) \{\s*await signOutApp\(true\);\s*navigate\('\/login'\);\s*\}\s*\}\}/g,
  `onClick={async () => {
                try {
                  await signOutApp(false);
                  navigate('/login');
                } catch(e) {}
              }}`
);
fs.writeFileSync('src/pages/Profile.tsx', profile);

// 2. Fix Dashboards
const dashboards = [
  'src/pages/admin/AdminDashboard.tsx',
  'src/pages/waiter/WaiterDashboard.tsx',
  'src/pages/staff/KitchenDashboard.tsx',
  'src/pages/staff/BarmanDashboard.tsx',
  'src/pages/cashier/CashierDashboard.tsx'
];

for (const path of dashboards) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Replace navigate('/') with signOut logic
    content = content.replace(/navigate\('\/'\);/g, 
      `try {
                  await signOutApp(false);
                  navigate('/login');
                } catch(e) {}`
    );
    
    // Make sure signOutApp is imported if not already
    if (!content.includes('signOutApp')) {
      content = content.replace(/import \{ useNavigate \} from 'react-router-dom';/, "import { useNavigate } from 'react-router-dom';\nimport { signOutApp } from '../../lib/googleAuth';");
    }
    
    fs.writeFileSync(path, content);
  }
}

