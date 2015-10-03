#!/usr/bin/env casperjs

var usageMsg = [
    'Usage: ',
    'vzw-bot --username=foo@bar.com --password=abc123 --"security question?"="security answer" --"other security question?"="other answer"',
    '',
    'Tip: you can shorten the security question to a smaller substring such as --pet=rover or --teacher="Mr.Smith"'
].join('\n');

var casper = require('casper').create({
    //verbose: true,
    //logLevel: 'debug'
});

var timeout = 15*1000;

var username = casper.cli.get("username");
var password = casper.cli.get("password");
var securityQuestions = Object.keys(casper.cli.options).filter(function(q) {
    // everything except the args below is assumed to be a potential security question
    return ['casper-path', 'cli', 'direct', 'engine', 'username', 'password'].indexOf(q) == -1;
});
if (!username || !password || !securityQuestions.length) {
    throw usageMsg;
}

casper.start('http://www.verizonwireless.com/b2c/myverizonlp/', function loginPage() {
    this.echo('Logging in...');
    this.fill('#myaccountForm', { IDToken1: username }, false);
    this.click("#signIntoMyVerizonButton");
}, null, timeout);

casper.waitForUrl(/https:\/\/login.verizonwireless.com\/amserver\/UI\/Login/, function securityQuestionPage() {
    var securityQ = this.evaluate(function() {
        return document.querySelector('#challengequestion').textContent.match(/Secret Question:\s+(.*)\s+Enter Your Answer:/)[1]
    });
    if (!securityQ) {
        this.echo("Unable to determine security question :(");
        this.capture('./error.png');
        this.debugHTML();
    }
    var questionParam = securityQuestions.filter(function(param) {
        return securityQ.indexOf(param) != -1;
    })[0];
    if (!questionParam) { 
        throw 'No answer found for security question: '+ securityQ;
    }
    var answer = this.cli.get(questionParam);
    this.echo('Security question is "' + securityQ + '". Answering with value from --' + questionParam);
    this.fill('#challengequestion', {IDToken1: answer}, false);
    this.click('#signIn');
}, null, timeout);

casper.waitForSelector('#loginForm', function enterPassword() {
    this.echo("Entering password...");
    this.fill('#loginForm', { IDToken2: password }, false);
    this.click("#signIn");
}, null, timeout);

casper.waitForUrl( /overview/, function verify() {
    this.echo("Going to rewards site");
    this.click('a[title="Redeem Now"]');
}, null, timeout);

casper.then( function rewardsHome() {
    this.echo("Going to sweepstakes listing");
    this.click('#HL-R-CurrentSweepstakes');
}, null, timeout);

casper.then( function findTablet() {
    this.echo("Going to Samsung sweepstakes");
    this.clickLabel('Samsung Galaxy Tab S 10.5 - White', 'a');
}, null, timeout);

casper.then( function buyTickets() {
    this.echo("Buying tickets");
    this.fill('#form_buytickets', { ticketQty: 10, agreement: true }, true);
}, null, timeout);

casper.then( function done() {
    this.echo("Done!");
    this.capture('./done.png');
}, null, timeout);

casper.run();
