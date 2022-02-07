const sh = require('shelljs');
const colors = require('colors/safe');

sh.echo(colors.magenta('Settings up development environment for windows'));

process.env.NODE_ENV = 'DEV';

sh.exec('vue-cli-service serve --port 8001', { async: true });
sh.exec('npx electron src/main/main.js', { async: true });
