import fs from 'fs';
let content = fs.readFileSync('src/pages/waiter/WaiterDashboard.tsx', 'utf8');

content = content.replace(/Palace Taha • \{waiterProfile\?\.assignedZone === 'Both' \? 'Inside & Outside' : waiterProfile\?\.assignedZone === 'A' \? 'Inside \(Zone A\)' : waiterProfile\?\.assignedZone === 'B' \? 'Outside \(Zone B\)' : 'Select Zone'\}/g, 
  "Palace Taha • {waiterProfile?.assignedZone === 'Both' ? t('inside_and_outside', 'Inside & Outside') : waiterProfile?.assignedZone === 'A' ? t('inside_zone_a', 'Inside (Zone A)') : waiterProfile?.assignedZone === 'B' ? t('outside_zone_b', 'Outside (Zone B)') : t('select_zone', 'Select Zone')}");

content = content.replace(/>\s*Inside \(A\)\s*<\/button>/g, "> {t('inside_a', 'Inside (A)')} </button>");
content = content.replace(/>\s*Outside \(B\)\s*<\/button>/g, "> {t('outside_b', 'Outside (B)')} </button>");
content = content.replace(/>\s*Both\s*<\/button>/g, "> {t('both_zones', 'Both')} </button>");

content = content.replace(/>Inside Tables \(Zone A\)<\/h3>/g, ">{t('inside_tables', 'Inside Tables (Zone A)')}</h3>");
content = content.replace(/>Outside Tables \(Zone B\)<\/h3>/g, ">{t('outside_tables', 'Outside Tables (Zone B)')}</h3>");

content = content.replace(/>Inside Requests \(Zone A\)<\/h3>/g, ">{t('inside_requests', 'Inside Requests (Zone A)')}</h3>");
content = content.replace(/>Outside Requests \(Zone B\)<\/h3>/g, ">{t('outside_requests', 'Outside Requests (Zone B)')}</h3>");

content = content.replace(/\{t\('zone_updated', 'Zone updated'\)\}: \$\{zone === 'Both' \? 'Both A & B' : \`Zone \$\{zone\}\`\}/g, 
  "{t('zone_updated', 'Zone updated')}: ${zone === 'Both' ? t('both_zones') : `Zone ${zone}`}");

fs.writeFileSync('src/pages/waiter/WaiterDashboard.tsx', content);
