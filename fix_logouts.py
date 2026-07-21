import re

# 1. KitchenDashboard
with open('src/pages/staff/KitchenDashboard.tsx', 'r') as f:
    kitchen = f.read()
if "showLogoutConfirm" not in kitchen:
    kitchen = kitchen.replace("const [showKitchen, setShowKitchen]", "const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  const [showKitchen, setShowKitchen]")
    kitchen = kitchen.replace("const logout = () => {", "const confirmLogout = () => {")
    kitchen = kitchen.replace("onClick={logout}", "onClick={() => setShowLogoutConfirm(true)}")
    modal_kitchen = """      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-bento-card-bg w-full max-w-sm p-8 rounded-[3rem] border border-bento-card-border shadow-2xl flex flex-col items-center text-center">
                <LogOut size={48} className="text-red-500 mb-6" />
                <h2 className="text-2xl font-black text-bento-primary mb-2 uppercase italic">{t('confirm_logout', 'Confirm Logout')}</h2>
                <p className="text-stone-500 font-medium mb-8">{t('logout_message', 'Are you sure you want to exit?')}</p>
                <div className="flex w-full gap-4">
                   <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-xl bg-stone-500/10 text-stone-500 font-black uppercase text-[11px] hover:bg-stone-500/20 transition-colors">{t('cancel', 'Cancel')}</button>
                   <button 
                     onClick={confirmLogout}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >
                     {t('confirm', 'Confirm')}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""
    kitchen = re.sub(r'    </div>\n  \);\n}\n?$', modal_kitchen, kitchen)
    with open('src/pages/staff/KitchenDashboard.tsx', 'w') as f:
        f.write(kitchen)


# 2. BarmanDashboard
with open('src/pages/staff/BarmanDashboard.tsx', 'r') as f:
    barman = f.read()
if "showLogoutConfirm" not in barman:
    barman = barman.replace("const [activeCategory, setActiveCategory]", "const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  const [activeCategory, setActiveCategory]")
    barman = barman.replace("const logout = () => {", "const confirmLogout = () => {")
    barman = barman.replace("onClick={logout}", "onClick={() => setShowLogoutConfirm(true)}")
    modal_barman = """      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-bento-card-bg w-full max-w-sm p-8 rounded-[3rem] border border-bento-card-border shadow-2xl flex flex-col items-center text-center">
                <LogOut size={48} className="text-red-500 mb-6" />
                <h2 className="text-2xl font-black text-bento-primary mb-2 uppercase italic">{t('confirm_logout', 'Confirm Logout')}</h2>
                <p className="text-stone-500 font-medium mb-8">{t('logout_message', 'Are you sure you want to exit?')}</p>
                <div className="flex w-full gap-4">
                   <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-xl bg-stone-500/10 text-stone-500 font-black uppercase text-[11px] hover:bg-stone-500/20 transition-colors">{t('cancel', 'Cancel')}</button>
                   <button 
                     onClick={confirmLogout}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >
                     {t('confirm', 'Confirm')}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""
    barman = re.sub(r'    </div>\n  \);\n}\n?$', modal_barman, barman)
    with open('src/pages/staff/BarmanDashboard.tsx', 'w') as f:
        f.write(barman)


# 3. WaiterDashboard
with open('src/pages/waiter/WaiterDashboard.tsx', 'r') as f:
    waiter = f.read()
if "showLogoutConfirm" not in waiter:
    waiter = waiter.replace("const [showAddModal, setShowAddModal]", "const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  const [showAddModal, setShowAddModal]")
    waiter_old_logout = """             onClick={async () => {
               localStorage.removeItem('waiter_session_active');
               localStorage.removeItem('staffSession');
               
               try {
                  await signOutApp(false);
                  navigate('/login');
                } catch(e) {}
             }}"""
    waiter_new_logout = """             onClick={() => setShowLogoutConfirm(true)}"""
    waiter = waiter.replace(waiter_old_logout, waiter_new_logout)
    waiter_modal = """      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-bento-card-bg w-full max-w-sm p-8 rounded-[3rem] border border-bento-card-border shadow-2xl flex flex-col items-center text-center">
                <h2 className="text-2xl font-black text-bento-primary mb-2 uppercase italic">{t('confirm_logout', 'Confirm Logout')}</h2>
                <p className="text-stone-500 font-medium mb-8">{t('logout_message', 'Are you sure you want to exit?')}</p>
                <div className="flex w-full gap-4">
                   <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-xl bg-stone-500/10 text-stone-500 font-black uppercase text-[11px] hover:bg-stone-500/20 transition-colors">{t('cancel', 'Cancel')}</button>
                   <button 
                     onClick={async () => {
                       localStorage.removeItem('waiter_session_active');
                       localStorage.removeItem('staffSession');
                       try {
                          await signOutApp(false);
                          navigate('/login');
                        } catch(e) {}
                     }}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >
                     {t('confirm', 'Confirm')}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""
    waiter = re.sub(r'    </div>\n  \);\n}\n?$', waiter_modal, waiter)
    with open('src/pages/waiter/WaiterDashboard.tsx', 'w') as f:
        f.write(waiter)


# 4. AdminDashboard
with open('src/pages/admin/AdminDashboard.tsx', 'r') as f:
    admin = f.read()
if "showLogoutConfirm" not in admin:
    admin = admin.replace("const [productsMap, setProductsMap]", "const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);\n  const [productsMap, setProductsMap]")
    admin_old_logout = """              onClick={async () => {
                try {
                  sessionStorage.removeItem('admin_mode');
                  localStorage.removeItem('staffSession');
                  navigate('/login');
                  setTimeout(() => {
                    signOutApp(false);
                  }, 100);
                } catch(e) {}
              }}"""
    admin_new_logout = """              onClick={() => setShowLogoutConfirm(true)}"""
    admin = admin.replace(admin_old_logout, admin_new_logout)
    admin_modal = """      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-bento-card-bg w-full max-w-sm p-8 rounded-[3rem] border border-bento-card-border shadow-2xl flex flex-col items-center text-center">
                <LogOut size={48} className="text-red-500 mb-6" />
                <h2 className="text-2xl font-black text-bento-primary mb-2 uppercase italic">{t('confirm_logout', 'Confirm Logout')}</h2>
                <p className="text-stone-500 font-medium mb-8">{t('logout_message', 'Are you sure you want to exit?')}</p>
                <div className="flex w-full gap-4">
                   <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-4 rounded-xl bg-stone-500/10 text-stone-500 font-black uppercase text-[11px] hover:bg-stone-500/20 transition-colors">{t('cancel', 'Cancel')}</button>
                   <button 
                     onClick={async () => {
                        try {
                          sessionStorage.removeItem('admin_mode');
                          localStorage.removeItem('staffSession');
                          navigate('/login');
                          setTimeout(() => {
                            signOutApp(false);
                          }, 100);
                        } catch(e) {}
                     }}
                     className="flex-1 py-4 rounded-xl bg-red-500 text-white font-black uppercase text-[11px] hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                   >
                     {t('confirm', 'Confirm')}
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""
    admin = re.sub(r'    </div>\n  \);\n}\n?$', admin_modal, admin)
    with open('src/pages/admin/AdminDashboard.tsx', 'w') as f:
        f.write(admin)

print("Done")
