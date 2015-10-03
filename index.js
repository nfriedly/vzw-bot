// note: run this file via `npm start` which automatically ensures that the casperjs and phantomjs dependencies are in $PATH
'use strict';

var cp = require('child_process');
require('dotenv').config({silent: true});

console.log('starting CasperJS...');

var result = cp.spawnSync('casperjs', [
    'vzw-bot.casper.js',
    `--username=${process.env.VZW_USERNAME}`,
    `--password=${process.env.VZW_PASSWORD}`,
    `--secret=${process.env.VZW_SECRET}`
]);


console.log(result.stdout.toString());
console.error(result.stderr.toString());

// todo: in the case of error, email logs + error.png

process.exit(result.status);
