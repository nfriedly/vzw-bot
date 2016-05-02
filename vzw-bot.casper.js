#!/usr/bin/env casperjs

"use strict";

var knownSweekstakes = [
    // default ratio is 0.1 (Meaning that the script should spend a maximum of 10% of available points on a single sweepstakes in a single run.)

    // food (ish)
    {matcher: /Applebee'?s/},
    {matcher: /Arby'?s/},
    {matcher: /Ben and Jerry'?s/},
    {matcher: /Boston Market/},
    {matcher: /Buffalo Wild Wings/},
    {matcher: /Cabela'?s/},
    {matcher: /Chick Fil A/, tickets: 100},
    {matcher: /Cold Stone Creamery/},
    {matcher: /Cracker Barrel/},
    {matcher: /Dave and Buster'?s/},
    {matcher: /Denny'?s/},
    {matcher: /Dunkin Donuts/},
    {matcher: /GNC/},
    {matcher: /IHOP/},
    {matcher: /Morton'?s? Steakhouse/},
    {matcher: /Panera/},
    {matcher: /Papa John'?s/},
    {matcher: /Red Robin/, tickets: 60},
    {matcher: /Ritas/},
    {matcher: /Ruth Chris/},
    {matcher: /Starbucks/},
    {matcher: /Tony Romas/},
    {matcher: /Wendy'?s/, tickets: 50},

    // shopping & misc.
    {matcher: /AMC/},   // cinci has an amc, but meh
    {matcher: /Regal/}, // we have a cinemark and a rave (apparently owned by cinemark)
    {matcher: /Amazon/, tickets: 100, ratio: 0.2},
    {matcher: /AutoZone/},
    {matcher: /Babies R Us/},
    {matcher: /Barnes and Noble/},
    {matcher: /Bass Pro Shop/},
    {matcher: /Bed Bath and Beyond/, tickets: 50},
    {matcher: /Bath (and |& )?Body Works/, tickets: 50},
    {matcher: /Best Buy/},
    {matcher: /Brooks Brothers/, tickets: 10},
    {matcher: /Build-A-Bear/},
    {matcher: /CVS/, tickets: 50},
    {matcher: /Disney/},
    {matcher: /Earring|Necklace/},
    {matcher: /Express/, tickets: 60, ratio: 0.2},
    {matcher: /Fanatics/},
    {matcher: /Foot ?locker/i},
    {matcher: /Game ?Stop/i, tickets: 50},
    {matcher: /\bGap\b/, tickets: 60},
    {matcher: /Groupon/},
    {matcher: /H & M/},
    {matcher: /Home Depot/, tickets: 50},
    {matcher: /Homegoods/},
    {matcher: /iTunes/i, tickets: 60, ratio: 0.2},
    {matcher: /JC Penne?y/, tickets: 50}, // verizon spells it wrong sometimes.. I almost wonder if it's on purpose
    {matcher: /Jiffy Lube/},
    {matcher: /J\.? ?Crew/, tickets: 10},
    {matcher: /Kay Jewelers/},
    {matcher: /Kohl'?s/, tickets: 50},
    {matcher: /Lowes/, tickets: 20},
    {matcher: /Macy'?s/, tickets: 50},
    {matcher: /Nike/},
    {matcher: /Nordstrom/},
    {matcher: /Payless/},
    {matcher: /Pier 1 Imports/},
    {matcher: /Rite Aid/},
    {matcher: /Sally'?s/},
    {matcher: /Stub Hub/},
    {matcher: /Target/, tickets: 65},
    {matcher: /Toys R Us/},
    {matcher: /Ulta/},
    {matcher: /Verizon/, tickets: 100},
    {matcher: /Walmart/, tickets: 75},
    {matcher: /Walgreens/, tickets: 40},
    {matcher: /Whole ?Foods/i, tickets: 30},
    {matcher: /Zappos/i},

    // gas
    {matcher: /\bBP\b/, tickets: 100},
    {matcher: /Chevron/},
    {matcher: /Marathon/, tickets: 100},
    {matcher: /Mobil/},
    {matcher: /Shell/, tickets: 100},

    //money
    {matcher: /Visa Gift Card/, tickets: 30, ratio: 1},

    // daily sweeps
    {matcher: /Samsung Galaxy Tab/, tickets: 10},
    {matcher: /LG Urbane/},

    // featured sweeps that are probably one-off things
    {matcher: /Surround Yourself In Sony/, tickets: 2},
    {matcher: /Netflix Nights/, tickets: 10},
    {matcher: /Tour of Wine Country/, tickets: 10},
    {matcher: /A Night On Broadway/, tickets: 10},
    {matcher: /Winter Getaway/},
    {matcher: /Tablets For All/},
    {matcher: /Macbook/i, tickets: 100, ratio: 1},
    {matcher: /Get Your Mac On/, tickets: 100, ratio: 1},
    {matcher: /Xbox One/i, tickets: 100, ratio: 1},
    {matcher: /Dash For Holiday Cash/i, tickets: 5},
    {matcher: /Gift For You - Gift For Charity/i, tickets: 3},
    {matcher: /Entertainment For All/, tickets: 5},
    {matcher: /California Spa/, tickets: 5},
    {matcher: /Operation: Washington DC/},
    {matcher: /BET® Awards VIP Experience/},
    {matcher: /Grand Canyon Family Vacation/, tickets: 1},
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
    // failsafe so that I don't buy double of everything if the previous step failed
    if (!entries || !entries.length) {
        this.echo("No current entries found, aborting.");
        this.exit(1);
    }
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

var pointsAvailable = 0;

casper.waitForSelector('#HL-R-CurrentSweepstakes', function rewardsHome() {
    checkForWin();
    checkNext();

    this.echo('Points at start: ' + this.fetchText('#rewardsbalancevalue'));

    pointsAvailable = parseInt(this.fetchText('#rewardsbalancevalue').trim().replace(/,/g, ''), 0);

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

                // initial short-circuit if we're already at the desired target (or out of points)
                if (numTicketsToBuy > 0 && pointsAvailable) {

                    casper.then(function () {
                        this.echo("Going to " + sweepstakes + '...');
                    });

                    casper.thenOpen(availableDetails.url);

                    casper.wait((Math.random()*30+5)*1000); // wait a few seconds

                    casper.waitForSelector('#form_buytickets', function () {

                        // update since we may have spent some on the last step
                        pointsAvailable = parseInt(this.fetchText('#rewardsbalancevalue').trim().replace(/,/g, ''), 0);
                        var cost = parseInt(this.fetchText('span.update_finalPrice').trim(), 0);
                        var maxTicketsPossible = Math.floor(pointsAvailable/cost);
                        var ratio = knownDetails.ratio || 0.1;
                        var maxTicketsRatio = Math.round(pointsAvailable * ratio / cost);
                        numTicketsToBuy = Math.min(maxTicketsPossible, Math.min(numTicketsToBuy, maxTicketsRatio));

                        if (numTicketsToBuy > 0) {
                            this.echo("Buying " + numTicketsToBuy + " tickets for " + sweepstakes + '...');
                            this.fill('#form_buytickets', {ticketQty: numTicketsToBuy, agreement: true}, true);
                        } else {
                            this.echo("Running low on points, not buying");
                            this.bypass(1); // don't wait for "Entered!" - it ain't gonna happen today.
                        }

                    });

                    casper.waitForSelector('#ocBox', function () {
                        this.echo("Entered!");
                    });
                }
                return true; // stop the .some loop, we found the one we were looking for
            }
        });

        // todo: also check upcoming sweeps and report new ones there so that I can babysit this thing less often
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
