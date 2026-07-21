import re

with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# Put language selection in the header
lang_buttons = """
           <div className="flex bg-stone-500/10 p-1 rounded-lg shrink-0 ml-auto mr-2 md:mr-4">
               <button onClick={() => i18n.changeLanguage('en')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'en' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>EN</button>
               <button onClick={() => i18n.changeLanguage('fr')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'fr' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>FR</button>
               <button onClick={() => i18n.changeLanguage('ar')} className={`px-2 py-1 rounded text-[7px] md:text-[8px] font-black transition-colors ${i18n.language === 'ar' ? 'bg-amber-500 text-stone-900 shadow' : 'text-stone-500'}`}>AR</button>
           </div>
"""

# Insert lang buttons before the logout button in header
code = code.replace(
    '<button \n              onClick={() => setShowClosureModal(true)}',
    lang_buttons + '\n           <button \n              onClick={() => setShowClosureModal(true)}'
)

# Hide bottom bar on non-pos views
code = code.replace(
    '{/* Categories Bottom Bar - Matching the theme */}\n          <div className="h-20 md:h-24 bg-bento-bg border-t border-bento-card-border flex items-center relative shrink-0">',
    '{/* Categories Bottom Bar - Matching the theme */}\n          {view === \'pos\' && <div className="h-20 md:h-24 bg-bento-bg border-t border-bento-card-border flex items-center relative shrink-0">'
)
# Close the new `{view === 'pos' && (` tag at the end of the bottom bar
# The end of the bottom bar is right before the Virtual Ticket
end_of_bottom_bar = """                   </button>
                </div>
             </div>
          </div>

          {/* Right Side: Virtual Ticket */}"""

new_end_of_bottom_bar = """                   </button>
                </div>
             </div>
          </div>}

          {/* Right Side: Virtual Ticket */}"""

code = code.replace(end_of_bottom_bar, new_end_of_bottom_bar)

# Since we moved language buttons to header, let's remove them from bottom bar
# The bottom bar language buttons block:
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

# Replace it with an empty string or just the logout button if that was in the bottom bar too?
# Let's check what else is in that `flex flex-row md:flex-col ...` block.
with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

