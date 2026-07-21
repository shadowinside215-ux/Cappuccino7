import fs from 'fs';

const filesToUpdate = {
  'src/pages/waiter/WaiterDashboard.tsx': [
    [/Palace Taha • /g, '']
  ],
  'src/pages/waiter/WaiterLogin.tsx': [
    [/Palace Taha terminal/g, 'terminal']
  ],
  'src/pages/staff/BarmanDashboard.tsx': [
    [/ • Palace Taha/g, '']
  ],
  'src/pages/staff/KitchenDashboard.tsx': [
    [/ • Palace Taha/g, '']
  ],
  'src/i18n.ts': [
    [/Salé • Palace Taha • Avenue Moulay Rachid/g, 'Salé • Avenue Moulay Rachid'],
    [/Near Taha Palace/g, 'Near the central station'],
    [/Salé • Palais Taha • Avenue Moulay Rachid/g, 'Salé • Avenue Moulay Rachid'],
    [/Près du Palais Taha/g, 'Près de la station centrale'],
    [/Salé • Palacio Taha • Avenida Moulay Rachid/g, 'Salé • Avenida Moulay Rachid']
  ]
};

for (const [file, replacements] of Object.entries(filesToUpdate)) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const [regex, replacement] of replacements) {
      content = content.replace(regex, replacement);
    }
    fs.writeFileSync(file, content);
  }
}
