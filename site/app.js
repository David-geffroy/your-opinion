var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var flash    = require('connect-flash');
var mongoose = require('mongoose');
var findorcreate = require('mongoose-findorcreate');

/*--------------------DB CONNECTION--------------------*/
var db = mongoose.connection;
db.on('disconnected', function() {
    console.log('MongoDB disconnected!');
    mongoose.connect("mongodb://localhost/ciid", {server:{auto_reconnect:true}});
});

mongoose.connect('mongodb://localhost/ciid');

/*--------------------MODELS DEFINITIONS--------------------*/
require('./models/User');
require('./models/Application');
require('./models/Comment');
require('./models/Article');
require('./models/Newsletter');

var MongoStore = require('connect-mongo')(session);
var conf = {
	db: {
		db: 'ciid',
		host: 'localhost',
		port: 27017,  // optional, default: 27017
		collection: 'sess', // optional, default: sessions
		auto_reconnect: true
	},
	secret: '076ee61d63ui10a125ea8563481e433b9'
};
var User = mongoose.model('User');
// Creation d'un utilisateur anonyme
User.update({'local.pseudo': "Anonyme"}, {'local.pseudo': "Anonyme"}, {upsert: true});

var Application = mongoose.model('Application');


/*--------------------ROUTES LOADING--------------------*/
require('./auth/passport')(passport);

var homepage = require('./routes/homepage');
var admin = require('./routes/admin');
var profile = require('./routes/profile');
var dashboard = require('./routes/dashboard');
var account_validation = require('./routes/account_validation');

/*--------------------APP SETTINGS--------------------*/
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
	saveUninitialized: true,
	resave: true,
    key: "ciidsessionstorekey",
    secret: conf.secret,
    store: new MongoStore(conf.db),
    cookie: {
        domain: 'what-is-your-opinion.com',
        maxAge   : 1000*60*60*24*30*12
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(express.static(path.join(__dirname, 'public')));

var configProfile = require('./config/'+(process.env.PROD || "dev"));
var baseUrl = configProfile.base_url;

/*--------------------ROUTES MAPPING--------------------*/
// API ROUTES

require('./routes/api/auth.js')(app,passport);
require('./routes/api/comment.js')(app,passport);
require('./routes/api/admin.js')(app,passport);
require('./routes/api/moderation.js')(app,passport);

app.use("/account/validateAccount",account_validation);

app.all("/*",function(req,res,next){
	res.locals.logged = req.isAuthenticated();
	res.locals.user = req.user;
	app.locals.baseUrl = baseUrl;

	if(req.isAuthenticated()) {
		//let inject user apps for shortcut access
		if(!req.session.apps || true) {
			Application.find({$or:[{'owner':req.user._id},{"roles.user":req.user._id}], "deleted": {$ne: true}}, function(err,apps) {
				req.session.apps = apps;
				res.locals.apps = req.session.apps;
				next();
			});
		} else {
			res.locals.apps = req.session.apps;
			next();
		}
	} else {
		req.session.apps = null;
		res.locals.apps = req.session.apps;
		next();
	}
});

require('./routes/auth.js')(app, passport);

/*****ROUTE : ACCOUNT CREATED BUT NEED VALIDATION***********/
app.all("/*",function(req,res,next){
	if(req.isAuthenticated() && !req.user.validation.mail_verified){
		console.log("validate account restriction");
		res.redirect("/account/validateAccount")
	}
	else{
		next();
	}
});

app.use('/', homepage);
app.use('/profile', profile);

/*----------------------------------PROTECTED ROUTES---------*/

app.all("/*",function(req,res,next){
	if(!req.isAuthenticated()){
		res.redirect("/");
	}
	else{
		next();
	}
});

app.use('/dashboard', dashboard);
app.use('/admin', admin);

// 404 Handler
app.use(function(req, res, next){
  res.status(404);

  // respond with html page
  if (req.accepts('html')) {
    res.render('404', { url: req.url });
    return;
  }

  // respond with json
  if (req.accepts('json')) {
    res.send({ error: 'Not found' });
    return;
  }

  // default to plain-text. send()
  res.type('txt').send('Not found');
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
