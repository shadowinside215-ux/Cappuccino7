import fs from 'fs';

let content = fs.readFileSync('src/lib/googleAuth.ts', 'utf8');

content = content.replace(
  /export async function signOutApp\(\): Promise<void> \{/g,
  `export async function signOutApp(skipConfirmation: boolean = false): Promise<void> {`
);

content = content.replace(
  /const confirmed = await confirmLogout\(\);\n  if \(!confirmed\) \{\n    return Promise\.reject\('User cancelled logout'\);\n  \}/g,
  `if (!skipConfirmation) {
    const confirmed = await confirmLogout();
    if (!confirmed) {
      return Promise.reject('User cancelled logout');
    }
  }`
);

fs.writeFileSync('src/lib/googleAuth.ts', content);
