import os
import re

files_to_update = ['src/pages/admin/AdminDashboard.tsx', 'src/pages/admin/AdminStats.tsx', 'src/pages/admin/AdminMenu.tsx', 'src/pages/admin/AdminOrders.tsx', 'src/pages/admin/BrandSettings.tsx', 'src/pages/admin/StaffManagement.tsx', 'src/pages/admin/StaffPerformance.tsx']

for filepath in files_to_update:
    if not os.path.exists(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    # We want to replace hasRole definition
    old_hasRole = "const hasRole = adminDoc.exists() || email === creatorEmail || sessionStorage.getItem('admin_mode') === 'true';"
    new_hasRole = "const hasRole = adminDoc.exists() || email === creatorEmail || email === 'mohamed.erguigue@gmail.com' || email === 'samiarafati3@gmail.com' || sessionStorage.getItem('admin_mode') === 'true';"
    
    if old_hasRole in content:
        content = content.replace(old_hasRole, new_hasRole)
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"Pattern not found in {filepath}")

