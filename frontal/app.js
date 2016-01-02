var express = require('express');
var evh = require('express-vhost');

var server = express();
server.use(evh.vhost());
var site = require('../site/app.js');


process.on('uncaughtException', function(err) {
	console.log('Caught exception: ' + err);
});

if(!process.env.PROD) {
	evh.register('local.what-is-your-opinion.com', site);
} else {
	evh.register('what-is-your-opinion.com', site);
}

server.listen(80);
