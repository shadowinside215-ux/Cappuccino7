import fs from 'fs';

let content = fs.readFileSync('src/pages/Orders.tsx', 'utf8');

content = content.replace(
  /setRequest\(null\);\s*\}\s*\}\);\s*\}, \[order\.id\]\);/g,
  `setRequest(null);
      }
    }, (error) => {
      console.warn("Orders waiterRequests snapshot error:", error);
    });
  }, [order.id]);`
);

fs.writeFileSync('src/pages/Orders.tsx', content);
