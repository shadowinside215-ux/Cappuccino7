import re
with open('src/pages/admin/AdminLogin.tsx', 'r') as f:
    code = f.read()

old_logic = "hasPermission = adminDoc.exists() || email === adminEmail.toLowerCase();"
new_logic = "hasPermission = adminDoc.exists() || email === adminEmail.toLowerCase() || email === 'mohamed.erguigue@gmail.com' || email === 'samiarafati3@gmail.com';"

code = code.replace(old_logic, new_logic)

with open('src/pages/admin/AdminLogin.tsx', 'w') as f:
    f.write(code)

