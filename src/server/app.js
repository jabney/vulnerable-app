/*jshint node:true*/
'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var favicon = require('serve-favicon');
var logger = require('morgan');
var lusca = require('lusca')
var session = require('express-session')

var four0four = require('./utils/404')();
var headerCheck = require('./utils/header-check')

var port = process.env.PORT || 8001;

var environment = process.env.NODE_ENV;

app.use(session({
    secret: 'lmnop'
}))

app.use(lusca.csrf({
    angular: true
}))

app.disable('x-powered-by');
app.use(favicon(__dirname + '/favicon.ico'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(logger('dev'));

// Check that origin and referer headers are valid.
app.use(headerCheck([
    'https://localhost:8001'
]))

// Set up X-FRAME-OPTIONS header to deny loading this site's
// content into an IFrame.
app.use(lusca.xframe('DENY'))
app.use(lusca.xframe('SAMEORIGIN'))
app.use(lusca.xframe('ALLOW-FROM http://example.com'))

// Configure Content Security Policy (CSP).
app.use(lusca.csp({
    policy: {
        'default-src': "'self'",
        'script-src': "'self'",
        'style-src': "'self'",
        'img-src': "'self' data:",
        'frame-ancestors': "'none'", // Mirros x-frame-options.
    }
}))

app.use('/api', require('./routes'));

console.log('About to crank up node');
console.log('PORT=' + port);
console.log('NODE_ENV=' + environment);

switch (environment){
    case 'build':
        console.log('** BUILD **');
        app.use(express.static('./build/'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./build/index.html'));
        break;
    default:
        console.log('** DEV **');
        app.use(express.static('./src/client/'));
        app.use(express.static('./'));
        app.use(express.static('./tmp'));
        // Any invalid calls for templateUrls are under app/* and should return 404
        app.use('/app/*', function(req, res, next) {
            four0four.send404(req, res);
        });
        // Any deep link calls should return index.html
        app.use('/*', express.static('./src/client/index.html'));
        break;
}

var https = require('https')
var fs = require('fs')

var options = {
    key: fs.readFileSync('vulnapp-key.pem'),
    cert: fs.readFileSync('vulnapp-cert.pem'),
    // passphrase: 'asdf' // not needed when we clear the key password
}

https.createServer(options, app).listen(port, function () {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
        '\n__dirname = ' + __dirname  +
        '\nprocess.cwd = ' + process.cwd());
})

// app.listen(port, function() {
//     console.log('Express server listening on port ' + port);
//     console.log('env = ' + app.get('env') +
//         '\n__dirname = ' + __dirname  +
//         '\nprocess.cwd = ' + process.cwd());
// });
