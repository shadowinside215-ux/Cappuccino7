import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

content = content.replace(
  /import \{ Clock, CheckCircle2, Coffee, Package, Truck, AlertCircle, ExternalLink, MessageCircle, MapPin, ShoppingBag, Award, Gift, ChefHat, Eye \} from 'lucide-react';/,
  "import { Clock, CheckCircle2, Coffee, Package, Truck, AlertCircle, ExternalLink, MessageCircle, MapPin, ShoppingBag, Award, Gift, ChefHat, Eye, Search } from 'lucide-react';"
);

fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
