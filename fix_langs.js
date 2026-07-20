import fs from 'fs';

const langSwitcher = `          <div className="flex bg-stone-100 p-1 rounded-xl">
             <button onClick={() => i18n.changeLanguage('en')} className={\`px-2 py-1 rounded-lg text-[10px] font-black uppercase \${i18n.language === 'en' ? 'bg-white shadow-sm' : 'text-stone-400'}\`}>EN</button>
             <button onClick={() => i18n.changeLanguage('fr')} className={\`px-2 py-1 rounded-lg text-[10px] font-black uppercase \${i18n.language === 'fr' ? 'bg-white shadow-sm' : 'text-stone-400'}\`}>FR</button>
             <button onClick={() => i18n.changeLanguage('ar')} className={\`px-2 py-1 rounded-lg text-[10px] font-black uppercase \${i18n.language === 'ar' ? 'bg-white shadow-sm' : 'text-stone-400'}\`}>AR</button>
          </div>`;

function injectKitchen(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /          <button \n             onClick=\{logout\}/,
    `${langSwitcher}\n          <button \n             onClick={logout}`
  );
  if (!content.includes('import i18n from')) {
    content = content.replace(
      "import { useTranslation } from 'react-i18next';",
      "import { useTranslation } from 'react-i18next';\nimport i18n from '../../i18n';"
    );
  }
  fs.writeFileSync(file, content);
}

function injectWaiter(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    /<div className="flex flex-wrap items-center gap-4">/,
    `<div className="flex flex-wrap items-center gap-4">\n${langSwitcher}`
  );
  if (!content.includes('import i18n from')) {
    content = content.replace(
      "import { useTranslation } from 'react-i18next';",
      "import { useTranslation } from 'react-i18next';\nimport i18n from '../../i18n';"
    );
  }
  fs.writeFileSync(file, content);
}

injectKitchen('src/pages/staff/KitchenDashboard.tsx');
injectKitchen('src/pages/staff/BarmanDashboard.tsx');
injectWaiter('src/pages/waiter/WaiterDashboard.tsx');
