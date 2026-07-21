import fs from 'fs';

let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Replace monthlyStats missing handler
content = content.replace(
  /setMonthlyStats\(\{ revenue: rev, orders: ord \}\);\s*\}\);/g,
  `setMonthlyStats({ revenue: rev, orders: ord });
    }, (error) => {
      console.warn("Monthly Revenue Snapshot Error:", error);
    });`
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
