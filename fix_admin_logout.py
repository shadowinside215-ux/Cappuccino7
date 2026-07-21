import re

with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    code = f.read()

# Remove the state
code = code.replace("const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  ", "")

# Fix the button
old_btn = """            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="p-3 bg-bento-card-bg rounded-2xl text-stone-700 hover:text-bento-primary transition-colors border border-stone-200 shadow-sm"
              title="Exit Admin Console"
            >
              <LogOut size={24} />
            </button>"""

new_btn = """            <button 
              onClick={async () => {
                try {
                  sessionStorage.removeItem('admin_mode');
                  localStorage.removeItem('staffSession');
                  navigate('/');
                } catch(e) {}
              }}
              className="p-3 bg-bento-card-bg rounded-2xl text-stone-700 hover:text-bento-primary transition-colors border border-stone-200 shadow-sm"
              title="Exit Admin Console"
            >
              <LogOut size={24} />
            </button>"""

code = code.replace(old_btn, new_btn)

# Remove the modal
modal_regex = r"<AnimatePresence>.*?showLogoutConfirm && \([^)]*\).*?</AnimatePresence>"
code = re.sub(r'      <AnimatePresence>\s*\{showLogoutConfirm[\s\S]*?</AnimatePresence>\n', '', code)

with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
    f.write(code)

print("Admin dashboard logout fixed.")
