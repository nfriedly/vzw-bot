Elance Automatic Withdrawal Bot
===============================

Logs into your Elance account and withdrawals any available funds to the account you specify.

Installation
------------
Run the following command on your command line to install this script:

    npm install -g elance-withdrawal
    
(Requires node.js - download it from http://nodejs.org/)

Usage
-----
To use this script on your computer, run `elance-withdrawal` from the command line to perform a withdrawal. The folowing arguments are all required:
 * *username*: your Elance username or email address
 * *password*: your Elance password
 * *withdrawal-account-id*: This is Elance's internal ID for your bank or paypal account. To find it, view-source on the [withdrawal](https://www.elance.com/php/CommerceLegacyFrontEnd/Mops/Withdrawal/Controller/Withdraw.php) form, find the `<select>` dropdown that lists your accounts, and find `<option>` that lists your account. It should have a `value="some number"` - that number is the account ID.
 * *Security questions*: Copy all of your security questions and your answers. Format them like so: 
    `--"What's your pets name?"="Rover"`

All arguments should be prefixed with `--` and seperated from their values by an `=` (no spaces). So, alltogether, the command would look like this:

    elance-withdrawal --username=foo@bar.com --password=abc123 --withdrawal-account-id=12434567 --"security question?"="security answer" --"other security question?"="other answer"

Tip: you can shorten the security question to a smaller substring such as --pet=rover or --teacher="Mr.Smith"

Heroku Usage
------------

This script can be run on a free [Heroku](http://www.heroku.com/) server with a little bit of setup. Complete instructions for how to use heroku is beyond the scope of this document, but they have [very good documentation](https://devcenter.heroku.com/). The following instructions require the [Heroku Toolbelt](https://toolbelt.heroku.com/).

Create the app with the casperjs buildpack from http://github.com/misza222/heroku-buildpack-casperjs

    heroku apps:create [optional-app-name] --stack cedar --buildpack http://github.com/misza222/heroku-buildpack-casperjs.git
  
Add some logging and cronjob support:

    heroku addons:add logentries
    heroku addons:add scheduler
  
Open the cronjob config page:

    heroku addons:open scheduler
  
Set the cronjob to run your complete withdrawal command like so:

    ./vendor/casperjs/bin/casperjs index.js --username=you@yoursite.com --password=... etc.
    
If it doesn't seem to be working, run `heroku run bash` to open a shell on a new server instance. Then you can try running different commands and see what's going on.

Hire me :)
----------

Lets build something awesome together! My elance profile is https://www.elance.com/s/nfriedly/?rid=1IFCM

However, my avaliability is pretty limited and I have to turn down the majority of the jobs I get invited to. You'll have a better shot if you send me an email first: nathan@[my website (see below)].com


MIT License
------------

Copyright (c) 2014 Nathan Friedly - http://nfriedly.com/

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
