import fs from 'fs';

let content = fs.readFileSync('src/components/CallWaiter.tsx', 'utf8');

content = content.replace(
  /setActiveDineInOrder\(null\);\s*\}\s*\}\);/g,
  `setActiveDineInOrder(null);
      }
    }, (error) => {
      console.warn("CallWaiter orders snapshot error:", error);
    });`
);

content = content.replace(
  /setActiveRequest\(null\);\s*\}\s*\}\);/g,
  `setActiveRequest(null);
      }
    }, (error) => {
      console.warn("CallWaiter request snapshot error:", error);
    });`
);

fs.writeFileSync('src/components/CallWaiter.tsx', content);
