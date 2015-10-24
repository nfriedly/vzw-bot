// note: run this file via `npm start` which automatically ensures that the casperjs and phantomjs dependencies are in $PATH
'use strict';

var cp = require('child_process');
require('dotenv').config({silent: true});

console.log(require('./package.json').name + ' starting on ' + new Date().toUTCString());
if (process.env.SOURCE) {
    console.log("Source: " + process.env.SOURCE);
}
console.log('Running CasperJS script...');

var result = cp.spawnSync('casperjs', [
    'vzw-bot.casper.js',
    '--username='+process.env.VZW_USERNAME,
    '--password='+process.env.VZW_PASSWORD,
    '--secret='+process.env.VZW_SECRET
]);


console.log(result.stdout.toString());
console.error(result.stderr.toString());

// in the case of error, email logs + error.png
if ( (result.status || process.env.EMAIL_ON_SUCCESS == 'true') && process.env.EMAIL && process.env.SENDGRID_USERNAME) {

    console.log('Emailing results to %s', process.env.EMAIL);

    var fs = require('fs');
    var uncolor = require('uncolor');
    var nodemailer = require('nodemailer');
    var sgTransport = require('nodemailer-sendgrid-transport');
    var path = require('path');

    var mailer = nodemailer.createTransport(sgTransport({
        auth: {
            api_user: process.env.SENDGRID_USERNAME,
            api_key: process.env.SENDGRID_PASSWORD
        }
    }));

    var contents = [
        result.stdout.toString(),
        result.stderr.toString()
    ].join('\n');

    contents = uncolor(contents);

    var email = {
        to: process.env.EMAIL,
        from: process.env.EMAIL,
        subject: '[vzw-bot] ' + (result.status === 0 ?  'Success' : 'Error') ,
        text: contents,
        html: contents.replace(/\n/g, '<br>'),
        attachments: []
    };

    fs.readdir('./', function(err, files) {

        function getRandomId() {
            return parseInt(Math.random().toString().slice(2), 10).toString(36);
        }

        files.filter(function (name) {
            return path.extname(name) == '.png';
        }).forEach(function (name) {
            var cid = getRandomId() + '@screen.png';
            email.attachments.push({
                filename: name,
                content: fs.readFileSync('./' + name), // read the file into memory so that we can delete it right away
                cid: cid
            });
            email.html += '<br><br>' + name + ':<br><img src="cid:' + cid + '"/>';
            fs.unlinkSync('./' + name); // delete the file so we don't accidentally send the same screenshot twice
        });

        mailer.sendMail(email, function (err, res) {
            if (err) {
                console.error(err);
            }
            console.log(res);
            process.exit(result.status);
        });
    });
} else {
    process.exit(result.status);
}
