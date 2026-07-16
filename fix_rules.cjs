const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');
rules = rules.replace(
  /request\.auth\.token\.email\.lower\(\) == 'dragonballsam86@gmail\.com'/g,
  "(request.auth.token.email != null && request.auth.token.email.lower() == 'dragonballsam86@gmail.com')"
);
rules = rules.replace(
  /request\.auth\.token\.email\.lower\(\) == 'mohamed\.erguigue@gmail\.com'/g,
  "(request.auth.token.email != null && request.auth.token.email.lower() == 'mohamed.erguigue@gmail.com')"
);
rules = rules.replace(
  /request\.auth\.token\.email\.lower\(\) == 'samiarafati3@gmail\.com'/g,
  "(request.auth.token.email != null && request.auth.token.email.lower() == 'samiarafati3@gmail.com')"
);
fs.writeFileSync('firestore.rules', rules);
