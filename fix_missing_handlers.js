import fs from 'fs';

const fixFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace unhandled onSnapshot with an empty error handler where obviously missing.
    // Actually, I can just use a regex for common patterns.
    
    // For AdminMenu.tsx
    content = content.replace(/setCategories\(data\);\s*\}\);/g, `setCategories(data); }, (err) => console.warn(err));`);
    content = content.replace(/setProducts\(data\);\s*\}\);/g, `setProducts(data); }, (err) => console.warn(err));`);
    
    // For StaffManagement.tsx
    content = content.replace(/setConfigs\(merged\);\s*\}\s*\}\);/g, `setConfigs(merged); } }, (err) => console.warn(err));`);

    fs.writeFileSync(filePath, content);
  }
};

fixFile('src/pages/admin/AdminMenu.tsx');
fixFile('src/pages/admin/StaffManagement.tsx');

