import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Driver imports
content = content.replace(/import DriverLogin from '\.\/pages\/driver\/DriverLogin';\n/g, '');
content = content.replace(/import DriverDashboard from '\.\/pages\/driver\/DriverDashboard';\n/g, '');

// Remove DriverGuard
content = content.replace(/const DriverGuard = \(\{ children \}: \{ children: React\.ReactNode \}\) => \{\n  const isDriverAuth = localStorage\.getItem\('driver_auth'\) === 'true' && auth\.currentUser != null;\n  if \(isDriverAuth\) return <>{children}<\/>;\n  return <Navigate to="\/driver\/login" \/>;\n\};\n/g, '');

// Remove routes
content = content.replace(/\s*<Route path="\/driver\/login" element=\{<DriverLogin \/>\} \/>\n/g, '\n');
content = content.replace(/\s*<Route path="\/driver\/dashboard" element=\{<DriverGuard><DriverDashboard \/><\/DriverGuard>\} \/>\n/g, '\n');

// Update footer condition
content = content.replace(/\{location\.pathname === '\/login' && !user && !isStaffView && systemUnlocked && \(/g, '{isLoginPage && !user && !isStaffView && systemUnlocked && (');

// Remove driver from footer links
content = content.replace(/\s*\{ to: "\/driver\/login", label: t\('driver_access', 'Driver'\) \},/g, '');

fs.writeFileSync('src/App.tsx', content);
