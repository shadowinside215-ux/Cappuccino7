import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

// Also need to import format from date-fns
if (!content.includes("import { format } from 'date-fns'")) {
  content = content.replace("import { Timer } from 'lucide-react';", "import { Timer } from 'lucide-react';\nimport { format } from 'date-fns';");
}

content = content.replace(
  /const today = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];/,
  "const today = format(new Date(), 'yyyy-MM-dd');"
);

// Monthly stats
content = content.replace(
  /const currentMonth = new Date\(\)\.toISOString\(\)\.slice\(0, 7\);/,
  "const currentMonth = format(new Date(), 'yyyy-MM');"
);

fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
