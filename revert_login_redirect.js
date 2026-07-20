import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

content = content.replace(
  /const unsubscribe = auth\.onAuthStateChanged\(\(user\) => \{\s*if \(user && !loading\) \{\s*navigate\('\/'\);\s*\}\s*\}\);\s*const checkRedirectResult = async \(\) => \{/g,
  "const checkRedirectResult = async () => {"
);

content = content.replace(
  /checkRedirectResult\(\);\s*return \(\) => unsubscribe\(\);\s*\}, \[navigate, loading\]\);/g,
  "checkRedirectResult();\n  }, [navigate]);"
);

fs.writeFileSync('src/pages/Login.tsx', content);
