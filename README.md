# enlyo

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
// Mac
yarn dev

// Windows
yarn devw
```

### Make build package
```
yarn build
```

### Make build package and deploy new release on Github
_Update version in package.json before deploy!_
```
yarn deploy
```

### Lints and fixes files
```
yarn pretty
```

### Auto update debugging
1. Install electron log
```
yarn add electron-log
```
2. Add this to autoUpdater.js
```
const log = require("electron-log")
log.transports.file.level = "debug"
autoUpdater.logger = log
```
