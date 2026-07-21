import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# 1. Remove the old button
code = code.replace("""                   <button onClick={() => setShowJournalModal(true)} className="p-2 md:p-1.5 bg-stone-500/10 rounded-lg text-stone-500 hover:text-bento-ink" title={t('pos_journal')}><History size={16} /></button>\n""", "")

# 2. Remove the old modal
# We can find `{showJournalModal && (` and the matching `</AnimatePresence>` around line 1350
start_idx = code.find("{showJournalModal && (")
if start_idx != -1:
    # Find the nearest <AnimatePresence> before it
    animate_start = code.rfind("<AnimatePresence>", 0, start_idx)
    # Find the nearest </AnimatePresence> after it
    animate_end = code.find("</AnimatePresence>", start_idx)
    if animate_start != -1 and animate_end != -1:
        code = code[:animate_start] + code[animate_end + len("</AnimatePresence>"):]

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

print("Cleaned up old modal and button.")
