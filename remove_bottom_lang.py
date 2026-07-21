import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

bottom_bar_lang = """                <div className="flex gap-1 md:mb-1">
                   <button 
                     onClick={() => i18n.changeLanguage('en')}
                     className={`px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase transition-colors ${i18n.language === 'en' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'bg-stone-500/10 text-stone-500 hover:text-bento-ink'}`}
                   >
                     EN
                   </button>
                   <button 
                     onClick={() => i18n.changeLanguage('fr')}
                     className={`px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase transition-colors ${i18n.language === 'fr' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'bg-stone-500/10 text-stone-500 hover:text-bento-ink'}`}
                   >
                     FR
                   </button>
                   <button 
                     onClick={() => i18n.changeLanguage('ar')}
                     className={`px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase transition-colors ${i18n.language === 'ar' ? 'bg-amber-500 text-stone-900 shadow-sm' : 'bg-stone-500/10 text-stone-500 hover:text-bento-ink'}`}
                   >
                     AR
                   </button>
                </div>"""

# Ensure exact match by using a flexible replace for whitespace if needed, or just standard string replace.
code = code.replace(bottom_bar_lang, "")

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

