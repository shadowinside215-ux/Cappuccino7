import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /audio\.play\(\)\.catch\(e => console\.log\('Audio blocked', e\)\);\s*\}\s*\}\);\s*\}, \(error\) => \{/g,
  `audio.play().catch(e => console.log('Audio blocked', e));
        }
      });
    }, (error) => {`
);

fs.writeFileSync('src/App.tsx', content);
