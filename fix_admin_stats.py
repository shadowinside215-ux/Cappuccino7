import re
with open('src/pages/admin/AdminStats.tsx', 'r') as f:
    code = f.read()

# I want to make sure it includes mohamed.erguigue@gmail.com and samiarafati3@gmail.com
old_hasRole = "const hasRole = adminDoc.exists() || email === adminEmail.toLowerCase() || email === 'mohamed.erguigue@gmail.com' || email === 'samiarafati3@gmail.com' || sessionStorage.getItem('admin_mode') === 'true';"
if old_hasRole in code:
    print("AdminStats already has it.")
else:
    print("AdminStats does not have exactly that string.")
