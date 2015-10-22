#!/usr/bin/env casperjs

"use strict";

var usageMsg = [
    'Usage: ',
    'vzw-bot --username=foo@bar.com --password=abc123 --secret="secret question answer'
].join('\n');

function handleTimeout() {
    /*jshint validthis:true */
    this.capture('./timeout.png');
    this.echo("Timeout reached, screenshot saved");
}

var casper = require('casper').create({
    //verbose: true,
    //logLevel: 'debug'
    onError: function (casperInstance, errorMessage /*, engine*/) {
        this.echo("Error: " + errorMessage);
        this.echo("capturing screenshot");
        this.capture('./error.png');
    },
    onStepTimeout: handleTimeout,
    onTimeout: handleTimeout,
    onWaitTimeout: handleTimeout
});

casper.options.waitTimeout = 15 * 1000;

var username = casper.cli.get("username");
var password = casper.cli.get("password");
var secret = casper.cli.get("secret");

casper.start();
casper.userAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:40.0) Gecko/20100101 Firefox/40.0');

// sometimes verizon goes back to the "enter your username" page right after you enter your username...?
// maybe we should start at https://login.verizonwireless.com/amserver/UI/Login ... or the home page?
casper.thenOpen('http://www.verizonwireless.com/', function login() {
    this.echo('Logging in with username ' + username + '...');
    this.fill('#vgnSignInForm', {IDToken1: username}, false);
    this.click("#signInSubmitButton");
});

casper.waitForSelector('#challengequestion', function securityQuestion() {
    this.echo("Answering security question...");
    this.fill('#challengequestion', {IDToken1: secret}, false);
    this.click('button[type="submit"].o-red-button');
});

casper.waitForSelector('#loginForm', function enterPassword() {
    this.echo("Entering password...");
    this.fill('#loginForm', {IDToken2: password}, false);
    this.click('button[type="submit"].o-red-button');
});

casper.waitForSelector('div.o-usage-data-meter-text', function() {
    var cap = parseFloat(this.fetchText('div.o-usage-data-meter-text span').substr(3)); // parseFloat ignores trailing text :)
    var used = parseFloat(this.fetchText('div.o-meter-innerText'));
    this.echo('Data: ' + used + '/' + cap + ' GB');
});

casper.waitForSelector('a[title="Redeem Now"]', function accountHome() {
    this.echo("Going to rewards site");
    this.click('a[title="Redeem Now"]');
});

casper.waitForSelector('#HL-R-CurrentSweepstakes', function rewardsHome() {
    this.echo("Going to sweepstakes listing");
    this.click('#HL-R-CurrentSweepstakes');
});


function enterSweepstakes(sweepstakes, numTickets) {

    casper.then(function() {
        this.echo("Entering " + sweepstakes + '...');
    });

    casper.wait((Math.random()*30+5)*1000); // wait a few seconds - todo: nix this for localdev

    casper.waitForText(sweepstakes, function findTablet() {
        this.clickLabel(sweepstakes, 'a');
    });

    casper.waitForSelector('#form_buytickets', function buyTickets() {
        this.fill('#form_buytickets', {ticketQty: numTickets, agreement: true}, true);
    });

    casper.waitForSelector('#ocBox', function done() {
        this.echo("Entered!");
        //this.capture('./' + (sweepstakes.replace(/[^a-z0-9]+/ig, ' ').trim().replace(/ /g, '-')) + '.png');
    });

    casper.back();
}


casper.thenOpen('https://rewards.verizonwireless.com/gateway?viewType=&t=giveawayhome&resetPageNum=Y&sweepstype=cs&pageSize=48', function () {

    var knownSweekstakes = [
        "$10 AMC Gift Card - 300 Winners",
        "$10 Amazon Gift Card - 300 Winners",
        "$10 Arby's Gift Card - 300 Winners",
        "$10 Barnes and Noble Gift Card - 300 Winners",
        "$10 Bath & Body Works Gift Card - 300 Winners",
        "$10 Bed Bath and Beyond Gift Card - 300 Winners",
        "$10 Best Buy Gift Card - 300 Winners",
        "$10 Buffalo Wild Wings Gift Card - 300 Winners",
        "$10 Build-A-Bear Gift Card - 300 Winners",
        "$10 Chevron Gift Card - 300 Winners",
        "$10 Cracker Barrel Gift Card - 300 Winners",
        "$10 Dave and Buster's Gift Card - 300 Winners",
        "$10 Dunkin Donuts Gift Card - 300 Winners",
        "$10 Footlocker Gift Card 300 Winners",
        "$10 GNC Gift Card - 300 Winners",
        "$10 Game Stop Gift Card - 300 Winners",
        "$10 Gap Gift Card - 300 Winners",
        "$10 Home Depot Gift Card - 300 Winners",
        "$10 Jiffy Lube Gift Card - 300 Winners",
        "$10 Kohl's Gift Card - 300 Winners",
        "$10 Mobile Gift Card - 300 Winners",
        "$10 Papa John's Gift Card - 300 Winners",
        "$10 Rite Aid Gift Card - 300 Winners",
        "$10 Sally's Gift Card - 300 Winners",
        "$10 Starbucks Gift Card - 300 Winners",
        "$10 Ulta Beauty Gift Card - 300 Winner",
        "$10 Walmart Gift Card - 300 Winners",
        "$10 Whole Foods Gift Card - 300 Winners",
        "$15 Ben and Jerry's Gift Card - 300 Winners",
        "$15 Chevron Gift Card - 300 Winners",
        "$15 Itunes Gift Card - 300 Winners",
        "$15 Ritas Gift Card - 300 Winners",
        "$25 Verizon Gift Card - 300 Winners",
        "$5 AutoZone Gift Card - 300 Winners",
        "$5 BP Gift Card - 300 Winners",
        "$5 Cabela's Gift Card - 300 Winners",
        "Family Fall Favorites",
        "Samsung Galaxy Tab S 10.5 - White",
        "Samsung Galaxy Tab S 10.5 White",
        "Samsung Galaxy Tab? S 10.5 - White",
        "Thomas Rhett Autographed Guitar",
    ];

    // todo: allow a specified number of entries per sweeps, and then check each one to ensure the number is met or exceeded
    var sweepstakesToEnter = [
        // also entering the samsung one, but with 2 (extra) tickets per day instead of 10 once every two weeks
        "$10 Kohl's Gift Card - 300 Winners",
        "$10 Buffalo Wild Wings Gift Card - 300 Winners",
        "$10 Walmart Gift Card - 300 Winners",
        "$10 Rite Aid Gift Card - 300 Winners",
        "$10 Bed Bath and Beyond Gift Card - 300 Winners",
        "$5 BP Gift Card - 300 Winners",
        "$10 Bath & Body Works Gift Card - 300 Winners",
        "$10 Papa John's Gift Card - 300 Winners",
        "$10 Cracker Barrel Gift Card - 300 Winners",
        "$25 Verizon Gift Card - 300 Winners",
        "$10 Amazon Gift Card - 300 Winners",
        "$10 Gap Gift Card - 300 Winners",
    ];

    var availableSweepstakes = this.evaluate(function () {
        /*globals $*/
        return $('div.price-matrix h1 a').map(function () {
            return this.textContent;
        }).toArray();
    });

    availableSweepstakes.forEach(function (sweepstakes) {
        if (knownSweekstakes.indexOf(sweepstakes) == -1) {
            this.echo('New sweepstakes: ' + sweepstakes);
        }
    }, this);

    enterSweepstakes("Samsung Galaxy Tab S 10.5 - White", 4);

    if (new Date().getDay() === 0) { // if today is Sunday (because all except the Samsung tablet one last two weeks, but weekly is easier than bi-weekly)
        sweepstakesToEnter.forEach(function (sweepstakes) {

            if (availableSweepstakes.indexOf(sweepstakes) == -1) {
                this.echo('Skipping ' + sweepstakes);
                return;
            }

            enterSweepstakes(sweepstakes, 10);

        }, this);
    }

});



casper.waitForSelector('#HL-Account', function goToAccount() {
    this.click('#HL-Account');
});

casper.waitForSelector('#red5', function goToSweepstakesHistory() {
    this.click('#red5');
});

casper.then(function () {
    var entries = this.evaluate(function() {
        /*globals $*/
        return $('div.panel:has(h1:contains(Current Sweepstakes)) a.title')
            .map(function(){ return this.textContent; })
            .toArray();
    });
    if (!entries || !entries.length) {
        this.capture('history.png');
    } else {
        this.echo("Current Entries:");
        entries.forEach(function(entry){this.echo(" - " + entry);}, this);
    }
});


casper.run();
