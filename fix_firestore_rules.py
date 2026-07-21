import re
with open('firestore.rules', 'r') as f:
    code = f.read()

old_isAdmin = """    function isAdmin() {
      return isSignedIn() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isAdmin', false) == true ||
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'admin')) ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }"""

new_isAdmin = """    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email.lower() == 'dragonballsam86@gmail.com' ||
        request.auth.token.email.lower() == 'mohamed.erguigue@gmail.com' ||
        request.auth.token.email.lower() == 'samiarafati3@gmail.com' ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && 
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('isAdmin', false) == true ||
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('role', '') == 'admin')) ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }"""

code = code.replace(old_isAdmin, new_isAdmin)

with open('firestore.rules', 'w') as f:
    f.write(code)

