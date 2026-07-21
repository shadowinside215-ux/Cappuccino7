import re
with open('src/pages/admin/AdminMenu.tsx', 'r') as f:
    code = f.read()

old_logic = """      const adminEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      const isAdminEmail = user?.email?.toLowerCase() === adminEmail.toLowerCase();"""

new_logic = """      const adminEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'dragonballsam86@gmail.com';
      const email = user?.email?.toLowerCase();
      const isAdminEmail = email === adminEmail.toLowerCase() || email === 'mohamed.erguigue@gmail.com' || email === 'samiarafati3@gmail.com';"""

code = code.replace(old_logic, new_logic)

with open('src/pages/admin/AdminMenu.tsx', 'w') as f:
    f.write(code)

