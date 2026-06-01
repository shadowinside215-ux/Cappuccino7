const fs = require('fs');
const path = require('path');
const os = require('os');
const bubblewrapDir = path.join(os.homedir(), '.bubblewrap');
if (!fs.existsSync(bubblewrapDir)) {
  fs.mkdirSync(bubblewrapDir, { recursive: true });
}
const configPath = path.join(bubblewrapDir, 'config.json');
fs.writeFileSync(configPath, JSON.stringify({
  jdkPath: '/opt/java/openjdk', // or whatever jdk is available
  androidSdkPath: '/opt/android-sdk' // guess
}));
console.log('Done');
