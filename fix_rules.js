import fs from 'fs';
let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  /match \/monthlyRevenue\/\{id\} \{\n\s*allow read: if isStaff\(\);\n\s*allow write: if isStaff\(\);\n\s*allow delete: if isAdmin\(\);\n\s*\}/,
  `match /monthlyRevenue/{id} {
      allow read: if isStaff();
      allow write: if isStaff();
      allow delete: if isAdmin();
    }

    match /yearlyRevenue/{id} {
      allow read: if isStaff();
      allow write: if isStaff();
      allow delete: if isAdmin();
    }`
);

fs.writeFileSync('firestore.rules', content);
