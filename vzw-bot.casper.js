#!/usr/bin/env casperjs

"use strict";

var usageMsg = [
    'Usage: ',
    'vzw-bot --username=foo@bar.com --password=abc123 --secret="secret question answer'
].join('\n');

function handleTimeout() {
    this.capture('./screen.png');
    this.echo("Timeout reached, screenshot saved");
    this.exit(1);
}

var casper = require('casper').create({
    //verbose: true,
    //logLevel: 'debug'
    onError: function(message, stack) {
        this.capture('./screen.png');
        this.echo("Error: " + message);
        this.echo('Stack:\n  ' + stack.join('  \n'));
        this.exit(1);
    },
    onStepTimeout: handleTimeout,
    onTimeout: handleTimeout,
    onWaitTimeout: handleTimeout
});

casper.options.waitTimeout = 15*1000;

var username = casper.cli.get("username");
var password = casper.cli.get("password");
var secret = casper.cli.get("secret");

// sometimes verizon goes back to the "enter your username" page right after you enter your username...?
// maybe we should start at https://login.verizonwireless.com/amserver/UI/Login ... or the home page?
casper.start('http://www.verizonwireless.com/', function login() {
    this.echo('Logging in with username ' + username + '...');
    this.fill('#vgnSignInForm', { IDToken1: username }, false);
    this.click("#signInSubmitButton");
});

casper.waitForSelector('#challengequestion', function securityQuestion() {
    this.echo("Answering security question...");
    this.fill('#challengequestion', {IDToken1: secret}, false);
    this.click('#signIn');
});

casper.waitForSelector('#loginForm', function enterPassword() {
    this.echo("Entering password...");
    this.fill('#loginForm', { IDToken2: password }, false);
    this.click("#signIn");
});

casper.waitForUrl(/overview/, function accountHome() {
    this.echo("Going to rewards site");
    this.click('a[title="Redeem Now"]');
});

casper.then( function rewardsHome() {
    this.echo("Going to sweepstakes listing");
    this.click('#HL-R-CurrentSweepstakes');
});

casper.then( function findTablet() {
    this.echo("Going to Samsung sweepstakes");
    this.clickLabel('Samsung Galaxy Tab S 10.5 - White', 'a');
});

casper.then( function buyTickets() {
    this.echo("Buying tickets");
    this.fill('#form_buytickets', { ticketQty: 10, agreement: true }, true);
});

casper.waitForSelector('#ocBox', function done() {
    this.echo("Done!");
    this.capture('./screen.png');
});

casper.run();
