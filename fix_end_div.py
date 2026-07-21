import re
with open('src/pages/cashier/CashierDashboard.tsx', 'r') as f:
    code = f.read()

# The missing closing brace is at the end of the Categories Bottom Bar
end_of_bottom_bar = """                  <ChevronRight size={20} />
                </button>
             </div>
          </div>"""

# Wait, `</div>` is closing `h-full px-2 md:px-4 border-r border-bento-card-border flex items-center bg-bento-bg/50`?
# Let's count divs.
# <div className="h-20 md:h-24 bg-bento-bg border-t border-bento-card-border flex items-center relative shrink-0">
#   <div className="flex flex-row md:flex-col ..."></div>
#   <div className="h-full px-2 md:px-4 ..."></div>
#   <div className="flex-1 flex overflow-hidden relative h-full"> ... </div>
# </div>
# Yes, `</div>` at the end of the bottom bar closes the `h-20` div.
# We need to change that `</div>` to `</div>}`.

code = code.replace(
"""                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>""",
"""                  <ChevronRight size={20} />
                </button>
             </div>
          </div>}
        </div>"""
)

with open('src/pages/cashier/CashierDashboard.tsx', 'w') as f:
    f.write(code)

