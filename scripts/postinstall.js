const { execSync } = require('child_process');

// install native deps
execSync('node ./scripts/install-native-deps.js', { stdio: [0, 1, 2] });
