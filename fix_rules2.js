import fs from 'fs';
let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  /existing\(\)\.status == 'pending'/g,
  "(existing().status == 'pending' || existing().status == 'Waiting')"
);

content = content.replace(
  /data\.status in \['new', 'accepted', 'completed'\];/g,
  "data.status in ['new', 'accepted', 'completed', 'New', 'Accepted', 'Completed'];"
);

content = content.replace(
  /\(data\.status == 'pending' \|\| data\.status == 'accepted' \|\| \(\(isAdmin\(\) \|\| isCashier\(\)\) && data\.status == 'delivered'\)\)/g,
  "(data.status == 'Waiting' || data.status == 'pending' || data.status == 'Taken' || data.status == 'accepted' || ((isAdmin() || isCashier()) && (data.status == 'Completed' || data.status == 'delivered')))"
);

fs.writeFileSync('firestore.rules', content);
