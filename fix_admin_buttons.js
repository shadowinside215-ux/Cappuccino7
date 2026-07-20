import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

const getStatusColor = `
                          const getActiveColor = (s: string) => {
                            if (s === 'preparing') return 'bg-orange-500 border-orange-500 text-white';
                            if (s === 'ready') return 'bg-green-500 border-green-500 text-white';
                            if (s === 'delivered' || s === 'Completed') return 'bg-blue-500 border-blue-500 text-white';
                            if (s === 'Paid') return 'bg-emerald-500 border-emerald-500 text-white';
                            if (s === 'cancelled') return 'bg-red-500 border-red-500 text-white';
                            return 'bg-brown-600 border-brown-600 text-white';
                          };
`

content = content.replace(
  /order\.status === status\s*\?\s*'bg-brown-600 border-brown-600 text-white shadow-lg shadow-brown-100 scale-105'\s*:\s*'bg-white border-gray-100 text-gray-400 hover:border-brown-200'/g,
  "order.status === status ? (status === 'preparing' ? 'bg-orange-500 border-orange-500 text-white' : status === 'ready' ? 'bg-green-500 border-green-500 text-white' : status === 'delivered' ? 'bg-blue-500 border-blue-500 text-white' : status === 'cancelled' ? 'bg-red-500 border-red-500 text-white' : 'bg-brown-600 border-brown-600 text-white') + ' shadow-lg scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-brown-200'"
);

fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
