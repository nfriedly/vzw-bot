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

// see if there is currently a popup message open, and if so, it says that I won
function checkForWin(){
    if (casper.exists('#messagePopupHeader h6') && casper.fetchText('#messagePopupHeader h6') == 'Congratulations!') {
        casper.echo('[win] ' + casper.fetchText('#messageContent') + '\nClaiming...');
        casper.click('a.claimnow');
        casper.waitForSelector('input.review-your-order', function() {
            this.click('input.review-your-order');
        });
        casper.waitForSelector('#agreepo', function() {
            this.click('#agreepo');
            this.click('input.claim-your-prize');
        });
        // todo: clean this up
        casper.wait(6000);
        casper.then(function() {
            casper.capture('win.png');
        });
    }
}

// see if there's a "next message" button available and if so click it, check for a win, repeat
function checkNext() {
    if (casper.exists('a.msg-btn-next')) {
        casper.click('a.msg-btn-next');
        casper.waitForSelectorTextChange('#messageContent', function() {
            checkForWin();
            checkNext();
        });
    }
}

casper.waitForSelector('#HL-R-CurrentSweepstakes', function rewardsHome() {
    checkForWin();
    checkNext();

    this.echo('Points at start: ' + this.fetchText('#rewardsbalancevalue'));

    this.then(function() {
        this.echo("Going to sweepstakes listing");
        this.click('#HL-R-CurrentSweepstakes');
    });
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

var today = new Date();

casper.thenOpen('https://rewards.verizonwireless.com/gateway?viewType=&t=giveawayhome&resetPageNum=Y&sweepstype=cs&pageSize=48', function () {

    // todo: grab the history first and then go through each current sweepstakes to ensure that at least numTickets have been purchased
    var isSunday = (today.getDay() === 0);
    var knownSweekstakes = [
        // food (ish)
        {name: "Arby'?s"}, // sometimes written as Arby's and other times Arbys
        {name: "Ben and Jerry'?s"}, // sometimes Jerry's other times Jerrys - this matches both
        {name: "Buffalo Wild Wings", scheduled: isSunday, numTickets: 5},
        {name: "Cabela's"},
        {name: "Cracker Barrel", scheduled: isSunday, numTickets: 5},
        {name: "Dave and Buster's"},
        {name: "Dunkin Donuts"},
        {name: "GNC"},
        {name: "Papa John's", scheduled: isSunday, numTickets: 5},
        {name: "Ritas"},
        {name: "Starbucks"},
        {name: "Boston Market"},
        {name: "Cold Stone Creamery"},
        {name: "Wendy'?s", scheduled: isSunday, numTickets: 10},

        // shopping & misc.
        {name: "AMC"},   // cinci has an amc, but meh
        {name: 'Regal'}, // we have a cinemark and a rave (apparently owned by cinemark)
        {name: "Amazon", scheduled: isSunday, numTickets: 50},
        {name: "Barnes and Noble", scheduled: isSunday, numTickets: 5},
        {name: "AutoZone"},
        {name: "Bed Bath and Beyond", scheduled: isSunday, numTickets: 5},
        {name: "Bath & Body Works|Bath Body Works", scheduled: isSunday, numTickets: 5},
        {name: "Best Buy"},
        {name: "Build-A-Bear"},
        {name: "Footlocker", scheduled: isSunday, numTickets: 5},
        {name: "Game Stop", scheduled: isSunday, numTickets: 10},
        {name: "Gap", scheduled: isSunday, numTickets: 10},
        {name: "Home Depot", scheduled: isSunday, numTickets: 10},
        {name: "iTunes|Itunes", scheduled: isSunday, numTickets: 20},
        {name: "Jiffy Lube"},
        {name: "Kohl's", scheduled: isSunday, numTickets: 10},
        {name: "Rite Aid", scheduled: isSunday, numTickets: 5},
        {name: "Sally's"},
        {name: "Ulta Beauty"},
        {name: "Earrings|Necklace"},
        {name: "CVS", scheduled: isSunday, numTickets: 10},

        // gas
        {name: "BP", scheduled: isSunday, numTickets: 10},
        {name: "Chevron"},
        {name: "Mobil"},
        {name: "Verizon", scheduled: isSunday, numTickets: 50},
        {name: "Walmart", scheduled: isSunday, numTickets: 20},
        {name: "Whole Foods", scheduled: isSunday, numTickets: 10},

        // daily sweeps
        {name: "Samsung Galaxy Tab", scheduled: true, numTickets: 9},
        {name: "LG Urbane", scheduled: true, numTickets: 19},

        // special one-off things that probably don't even get picked up by the code below
        {name: "Cyber Shop til You Drop"},
        {name: "Family Fall Favorites"},
        {name: "Thomas Rhett Autographed Guitar"},
    ];

    var sweepstakesToEnterToday = [];

    var availableSweepstakes = this.evaluate(function () {
        /*globals $*/
        return $('div.price-matrix h1 a').map(function () {
            return this.textContent;
        }).toArray();
    });

    var reKnown = new RegExp(knownSweekstakes.map(function(d) {return d.name;}).join('|'));
    availableSweepstakes.forEach(function (sweepstakes) {
        var match = sweepstakes.match(reKnown);
        if (match) {
            knownSweekstakes.some(function(details) {
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
        } else {
            this.echo('New sweepstakes: ' + sweepstakes);
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

    this.echo('Points at end: ' + this.fetchText('#rewardsbalancevalue'));
});


casper.run();
