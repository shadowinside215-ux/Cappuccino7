import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  /setUserProfile\(null\);\s*\}\s*setLoading\(false\);\s*\}\);/g,
  `setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("App Profile Snapshot Error:", error);
          setLoading(false);
        });`
);
fs.writeFileSync('src/App.tsx', content);
