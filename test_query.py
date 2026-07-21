import re
with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

old_query = """    const qRev = query(
      collection(db, 'dailyRevenue'), 
      orderBy('lastUpdated', 'desc')
    );"""
new_query = """    const qRev = query(
      collection(db, 'dailyRevenue')
    );"""

code = code.replace(old_query, new_query)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

