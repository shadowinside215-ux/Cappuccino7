import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/AdminOrders.tsx', 'utf8');

const oldEmptyState = `          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-brown-100 flex flex-col items-center">
              <CheckCircle2 size={48} className="text-brown-200 mb-4" />
              <h3 className="text-xl font-bold text-brown-900 mb-2">{t('no_orders') as string}</h3>
              <p className="text-brown-400">{t('no_orders_desc') as string}</p>
            </div>
          ) : (`;

const newEmptyState = `          {activeOrders.length === 0 ? null : (`;

content = content.replace(oldEmptyState, newEmptyState);
fs.writeFileSync('src/pages/admin/AdminOrders.tsx', content);
