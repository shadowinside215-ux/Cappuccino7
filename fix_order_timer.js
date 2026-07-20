import fs from 'fs';
let content = fs.readFileSync('src/components/OrderTimer.tsx', 'utf8');

content = content.replace(
  /return \`\$\{mins\}:\$\{secs\.toString\(\)\.padStart\(2, '0'\)\}\`;/g,
  "return `${mins}m ${secs.toString().padStart(2, '0')}s`;"
);

content = content.replace(
  /const displayTime = \`\$\{mins\}:\$\{secs\.toString\(\)\.padStart\(2, '0'\)\}\`;/g,
  "const displayTime = `${mins}m ${secs.toString().padStart(2, '0')}s`;"
);

fs.writeFileSync('src/components/OrderTimer.tsx', content);
