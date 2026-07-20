import fs from 'fs';

let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

// Add a check in useEffect to redirect if user is already logged in
// We can use onAuthStateChanged or just check auth.currentUser
content = content.replace(
  /const checkRedirectResult = async \(\) => \{/,
  `const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !loading) {
        navigate('/');
      }
    });

    const checkRedirectResult = async () => {`
);

content = content.replace(
  /checkRedirectResult\(\);\n  \}, \[navigate\]\);/,
  "checkRedirectResult();\n    return () => unsubscribe();\n  }, [navigate, loading]);"
);

fs.writeFileSync('src/pages/Login.tsx', content);
