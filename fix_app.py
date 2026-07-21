import re

with open('src/App.tsx', 'r') as f:
    code = f.read()

code = code.replace("{location.pathname === '/login' && !user && !isStaffView && systemUnlocked && (", "{location.pathname === '/login' && !isStaffView && systemUnlocked && (")

with open('src/App.tsx', 'w') as f:
    f.write(code)

print("Fixed App.tsx")
