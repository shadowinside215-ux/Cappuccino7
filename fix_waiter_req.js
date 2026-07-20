import fs from 'fs';

let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  /status: 'new' \| 'accepted' \| 'completed';/,
  "status: 'new' | 'accepted' | 'completed' | 'Waiting' | 'Taken' | 'Completed';"
);
fs.writeFileSync('src/types.ts', content);

let adminOrders = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');
adminOrders = adminOrders.replace(
  /import \{ Clock, CheckCircle, Truck, Info, Award, Eye \} from 'lucide-react';/,
  "import { Clock, CheckCircle, Truck, Info, Award, Eye, Search } from 'lucide-react';"
);
fs.writeFileSync('src/pages/admin/AdminOrders.tsx', adminOrders);
