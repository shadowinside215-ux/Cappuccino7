import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /\{isLoginPage && !user && !isStaffView && systemUnlocked && \(/g,
  '{location.pathname === \'/login\' && !user && !isStaffView && systemUnlocked && ('
);

fs.writeFileSync('src/App.tsx', content);
