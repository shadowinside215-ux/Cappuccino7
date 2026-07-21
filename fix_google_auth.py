with open('src/lib/googleAuth.ts', 'r') as f:
    code = f.read()

code = code.replace("document.getElementById('cancel-logout')", "overlay.querySelector('#cancel-logout')")
code = code.replace("document.getElementById('confirm-logout')", "overlay.querySelector('#confirm-logout')")

with open('src/lib/googleAuth.ts', 'w') as f:
    f.write(code)

print("googleAuth fixed")
