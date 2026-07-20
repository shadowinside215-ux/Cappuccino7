import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

content = content.replace(
  /onClick=\{[^{}]*navigate\('\/'\);[^{}]*\}/,
  \`onClick={async () => {
                try {
                  await signOutApp();
                  navigate('/');
                } catch(e) {
                  console.error(e);
                  navigate('/');
                }
              }}\`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
