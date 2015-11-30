#!/usr/bin/env casperjs

"use strict";

// todo: calculate the cost and don't spend more points than I have
// also, consider adding a way to prioritize

var knownSweekstakes = [
    // food (ish)
    {matcher: /Arby'?s/}, // sometimes written as Arby's and other times Arbys
    {matcher: /Ben and Jerry'?s/}, // sometimes Jerry's other times Jerrys - this matches both
    {matcher: /Boston Market/},
    {matcher: /Buffalo Wild Wings/, tickets: 5},
    {matcher: /Cabela'?s/},
    {matcher: /Cold Stone Creamery/},
    {matcher: /Cracker Barrel/, tickets: 5},
    {matcher: /Dave and Buster's/},
    {matcher: /Dunkin Donuts/},
    {matcher: /GNC/},
    {matcher: /IHOP/},
    {matcher: /Papa John's/, tickets: 5},
    {matcher: /Ritas/},
    {matcher: /Starbucks/},
    {matcher: /Wendy'?s/, tickets: 10},

    // shopping & misc.
    {matcher: /AMC/},   // cinci has an amc, but meh
    {matcher: /Regal/}, // we have a cinemark and a rave (apparently owned by cinemark)
    {matcher: /Amazon/, tickets: 50},
    {matcher: /Barnes and Noble/, tickets: 5},
    {matcher: /AutoZone/},
    {matcher: /Bed Bath and Beyond/, tickets: 5},
    {matcher: /Bath & Body Works|Bath Body Works/, tickets: 5},
    {matcher: /Best Buy/},
    {matcher: /Build-A-Bear/},
    {matcher: /CVS/, tickets: 10},
    {matcher: /Earrings|Necklace/},
    {matcher: /Express/, tickets: 25},
    {matcher: /Game Stop/, tickets: 10},
    {matcher: /\bGap\b/, tickets: 10},
    {matcher: /Home Depot/, tickets: 10},
    {matcher: /Homegoods/},
    {matcher: /iTunes/i, tickets: 20},
    {matcher: /Jiffy Lube/},
    {matcher: /Kohl's/, tickets: 10},
    {matcher: /Macy's/, tickets: 10},
    {matcher: /Pier 1 Imports/},
    {matcher: /Rite Aid/, tickets: 5},
    {matcher: /Sally's/},
    {matcher: /Ulta Beauty/},

    // gas
    {matcher: /\bBP\b/, tickets: 10},
    {matcher: /Chevron/},
    {matcher: /Mobil/},
    {matcher: /Verizon/, tickets: 50},
    {matcher: /Walmart/, tickets: 20},
    {matcher: /Whole Foods/, tickets: 10},

    // daily sweeps
    {matcher: /Samsung Galaxy Tab/, tickets: 10},
    {matcher: /LG Urbane/},

    // featured sweeps that are probably one-off things
    {matcher: /500 Visa Gift Card/, tickets: 10},
    {matcher: /Tour of Wine Country/, tickets: 10},
    {matcher: /A Night On Broadway/, tickets: 10},
    {matcher: /Winter Getaway/},
    {matcher: /Tablets For All/},
    {matcher: /Macbook/i, tickets: 100},
    {matcher: /Xbox One/i, tickets: 100},
];


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

// get our initial number of entries
casper.waitForSelector('#HL-Account', function goToAccount() {
    this.echo('Fetching status');
    this.click('#HL-Account');
});

casper.waitForSelector('#red5', function goToSweepstakesHistory() {
    this.click('#red5');
});

var currentEntries = {};
casper.then(function () {
    var entries = this.evaluate(function() {
        /*globals $*/
        return $('div.panel:has(h1:contains(Current Sweepstakes)) a.title')
            .map(function(){ return this.textContent; })
            .toArray();
    });
    entries.forEach(function(entry){
        var parts = entry.match(/(.*) \((\d+)\s+Ticket(s| )\)/);
        if (!parts) {
            this.echo('Unable to parse current entries for ' + entry);
            this.echo(parts);
        } else {
            currentEntries[parts[1]] = parseInt(parts[2], 10);
        }
    }, this);
});

casper.waitForSelector('#HL-R-CurrentSweepstakes', function rewardsHome() {
    checkForWin();
    checkNext();

    this.echo('Points at start: ' + this.fetchText('#rewardsbalancevalue'));

    this.then(function() {
        this.echo("Going to sweepstakes listing");
        this.click('#HL-R-CurrentSweepstakes');
    });
});




casper.thenOpen('https://rewards.verizonwireless.com/gateway?viewType=&t=giveawayhome&resetPageNum=Y&sweepstype=cs&pageSize=48', function () {

    var availableSweepstakes = this.evaluate(function () {
        /*globals $*/
        return $('div.price-matrix h1 a, li.featSweep h4:not(.panel-title)').map(function () {
            return {name: this.textContent, url: this.href || $(this).parents('li.featSweep').find('a.see-details')[0].href};
        }).toArray();
    });

    // iterate over the list of available sweepstakes to check if we know of it and have already purchased the requested number of tickets
    availableSweepstakes.forEach(function (availableDetails) {
        var sweepstakes = availableDetails.name;

        // .some so that we can stop as soon as we find the matching sweepstakes
        var isKnown = knownSweekstakes.some(function(knownDetails) {
            if (knownDetails.matcher.test(sweepstakes)) {
                // found a hit, see if we need to buy tickets
                var currentNumTickets = currentEntries[sweepstakes] || 0,
                    numTicketsToBuy = (knownDetails.tickets || 0) - currentNumTickets;

                if (numTicketsToBuy > 0) {

                    casper.then(function () {
                        this.echo("Buying " + numTicketsToBuy + " tickets for " + sweepstakes + '...');
                    });

                    casper.thenOpen(availableDetails.url);

                    casper.wait((Math.random()*30+5)*1000); // wait a few seconds

                    casper.waitForSelector('#form_buytickets', function () {
                        this.fill('#form_buytickets', {ticketQty: numTicketsToBuy, agreement: true}, true);
                    });

                    casper.waitForSelector('#ocBox', function () {
                        this.echo("Entered!");
                    });
                }
                return true; // stop the .some loop, we found the one we were looking for
            }
        });
        if (!isKnown) {
            this.echo('New sweepstakes: ' + sweepstakes);
        }
    }, this);

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
