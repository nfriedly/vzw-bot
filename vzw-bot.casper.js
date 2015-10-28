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


function enterSweepstakes(details) {
    var sweepstakes = details.name, numTickets = details.numTickets;

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
        "AMC",
        "Amazon",
        "Arby's",
        "Barnes and Noble",
        "Bath & Body Works",
        "Bed Bath and Beyond",
        "Ben and Jerrys",
        "Best Buy",
        "Buffalo Wild Wings",
        "Build-A-Bear",
        "Chevron",
        "Cracker Barrel",
        "Dave and Buster's",
        "Dunkin Donuts",
        "Footlocker",
        "GNC",
        "Game Stop",
        "Gap",
        "Home Depot",
        "Jiffy Lube",
        "Kohl's",
        "Mobil",
        "Papa John's",
        "Rite Aid",
        "Sally's",
        "Starbucks",
        "Ulta Beauty",
        "Walmart",
        "Whole Foods",
        "Ben and Jerry's",
        "Chevron",
        "Itunes",
        "Ritas",
        "Verizon",
        "AutoZone",
        "BP",
        "Cabela's",
        "Family Fall Favorites",
        "Samsung Galaxy Tab",
        "Thomas Rhett Autographed Guitar",
    ];

    // todo: allow a specified number of entries per sweeps, and then check each one to ensure the number is met or exceeded

    var isSunday = new Date().getDay() === 0;
    var interestedSweepstakes = [
        // for us
        {name: "Samsung Galaxy Tab", scheduled: true, numTickets: 4}, // this one resets daily while the others typically last 2 weeks (but weekly is much easier to target)
        {name: "Verizon", scheduled: isSunday, numTickets: 50},
        {name: "Amazon", scheduled: isSunday, numTickets: 50},
        {name: "Walmart", scheduled: isSunday, numTickets: 20},
        {name: "Itunes", scheduled: isSunday, numTickets: 20},
        {name: "Kohl's", scheduled: isSunday, numTickets: 10},
        {name: "BP", scheduled: isSunday, numTickets: 10},
        {name: "Game Stop", scheduled: isSunday, numTickets: 10},
        {name: "Gap", scheduled: isSunday, numTickets: 10},
        {name: "Home Depot", scheduled: isSunday, numTickets: 10},
        {name: "Rite Aid", scheduled: isSunday, numTickets: 5},
        {name: "Bed Bath and Beyond", scheduled: isSunday, numTickets: 5},
        {name: "Bath & Body Works", scheduled: isSunday, numTickets: 5},
        {name: "Footlocker", scheduled: isSunday, numTickets: 5},

        // to give away
        {name: "Cracker Barrel", scheduled: isSunday, numTickets: 5},
        {name: "Barnes and Noble", scheduled: isSunday, numTickets: 5},
        {name: "Papa John's", scheduled: isSunday, numTickets: 5},
    ];
    var sweepstakesToEnterToday = [];

    var availableSweepstakes = this.evaluate(function () {
        /*globals $*/
        return $('div.price-matrix h1 a').map(function () {
            return this.textContent;
        }).toArray();
    });

    var reKnown = new RegExp(knownSweekstakes.join('|'));
    var reEnter = new RegExp(interestedSweepstakes.map(function(d) {return d.name;}).join('|'));
    availableSweepstakes.forEach(function (sweepstakes) {
        if (!reKnown.test(sweepstakes)) {
            this.echo('New sweepstakes: ' + sweepstakes);
        }
        var match = sweepstakes.match(reEnter);
        if (match) {
            interestedSweepstakes.some(function(details) {
                if (details.name == match[0]) {
                    if (details.scheduled) {
                        sweepstakesToEnterToday.push({
                            name: sweepstakes, // get the full text that's on the link rather than the short name in the code
                            numTickets: details.numTickets
                        });
                    }
                    return true; // stop the .some loop, we found the one we were looking for (even if it isn't scheduled for today)
                }
            });

        }
    }, this);

    sweepstakesToEnterToday.forEach(enterSweepstakes);

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
