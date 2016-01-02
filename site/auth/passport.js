var LocalStrategy		= require('passport-local').Strategy;
var FacebookStrategy	= require('passport-facebook').Strategy;
var GoogleStrategy		= require('passport-google-oauth').OAuth2Strategy;
// var TwitterStrategy		= require('passport-twitter').Strategy;
var User				= require('../models/User');
var configAuth			= require('./auth_'+(process.env.PROD || 'dev'));

module.exports = function(passport) {
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});

	// SIGN UP NEW USER
	passport.use('local-signup', new LocalStrategy({
		usernameField	: 'email', // By default, local strategy uses username and password, we will override with email
		passwordField	: 'password',
		passReqToCallback : true // Allows us to pass back the entire request to the callback
	}, function(req, email, password, done) {
		process.nextTick(function() {
			User.findOne({ 'local.email' :  email}, function(err, user) {
				if (err) return done(err);
				if (user) {
					return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
				} else {
					var newUser				= new User();
					newUser.local.email		= email;
					newUser.local.password	= newUser.generateHash(password);
					newUser.local.pseudo	= req.body.pseudo;
					newUser.info.pseudo		= req.body.pseudo;
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	// LOCAL LOGIN EXISTING USER
	passport.use('local-login', new LocalStrategy({
		usernameField	: 'email', // By default, local strategy uses username and password, we will override with email
		passwordField	: 'password',
		passReqToCallback : true // Allows us to pass back the entire request to the callback
	}, function(req, email, password, done) {
		User.findOne({ 'local.email' :  email }, function(err, user) {
			if (err) return done(err);
			if (!user)
				return done(null, false, { message: 'Aucun utilisateur avec cet email.' });
			try {
				if (!user.validPassword(password))
					return done(null, false, { message: 'Mot de passe incorrect' });
			} catch (e) {
				return done(null, false, { message: 'Mot de passe incorrect' });
			}
			return done(null, user);
		});
	}));

	// FACEBOOK CREATE IF NOT EXIST OR JOIN ACCOUNT
	passport.use(new FacebookStrategy({
		clientID		: configAuth.facebookAuth.clientID,
		clientSecret	: configAuth.facebookAuth.clientSecret,
		callbackURL		: configAuth.facebookAuth.callbackURL
	}, function(token, refreshToken, profile, done) {
		var json = profile._json;
		process.nextTick(function() {
			User.findOne({ 'local.email' : profile.emails[0].value }, function(err, user) {
				if (err) return done(err);
				if (user) {
					if(!user.facebook.email) {
						user.facebook.id			= profile.id;
						user.facebook.token			= token;
						user.facebook.name			= profile.name.givenName + ' ' + profile.name.familyName;
						user.facebook.email			= profile.emails[0].value;
						user.facebook.first_name	= json.first_name;
						user.facebook.last_name		= json.last_name;
						user.facebook.birthday		= json.birthday;
						user.facebook.gender		= json.gender;
						user.facebook.verified		= json.verified;

						if(typeof(user.info)=='undefined') user.info = {};

						for(var att in user.facebook){
							if(!user.info[att])user.info[att] = user.facebook[att];
						};

						user.save(function(err) {
							if (err) throw err;
							return done(null, user);
						});
					}
					return done(null, user);
				} else {
					var newUser						= new User();
					newUser.local.pseudo			= profile.name.givenName;
					newUser.local.email				= profile.emails[0].value;
					newUser.validation.mail_verified= json.verified;
					newUser.facebook.id				= profile.id;
					newUser.facebook.token			= token;
					newUser.facebook.name			= profile.name.givenName + ' ' + profile.name.familyName;
					newUser.facebook.email			= profile.emails[0].value;
					newUser.facebook.first_name		= json.first_name;
					newUser.facebook.last_name		= json.last_name;
					newUser.facebook.birthday		= json.birthday;
					newUser.facebook.gender			= json.gender;
					newUser.facebook.link			= json.link;
					newUser.facebook.verified		= json.verified;
					newUser.info					= {};

					for(var att in newUser.facebook){
						newUser.info[att] = newUser.facebook[att];
					};

					newUser.info.pseudo = profile.name.givenName;
					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	// GOOGLE CREATE IF NOT EXIST OR JOIN ACCOUNT
	passport.use(new GoogleStrategy({
		clientID        : configAuth.googleAuth.clientID,
		clientSecret    : configAuth.googleAuth.clientSecret,
		callbackURL     : configAuth.googleAuth.callbackURL,
	}, function(token, refreshToken, profile, done) {
		var json = profile._json;
		process.nextTick(function() {
			User.findOne({ 'local.email' : profile.emails[0].value }, function(err, user) {
				if (err) return done(err);
				if (user) {
					if (!user.google.email) {
						user.google.id    = profile.id;
						user.google.token = token;
						user.google.name  = profile.displayName;
						user.google.email = profile.emails[0].value;
						user.google.first_name = json.given_name;
						user.google.last_name = json.family_name;
						user.google.gender = json.gender;
						user.google.verified = json.verified_email;
						user.validation.mail_verified = json.verified_email;

						if(typeof(user.info)=='undefined')user.info = {};

						for(var att in user.google){
							if(!user.info[att])user.info[att] = user.google[att];
						};

						user.save(function(err) {
							if (err) throw err;
							return done(null, user);
						});
					}
					return done(null, user);
				} else {
					var newUser = new User();
					newUser.local.pseudo = profile.displayName;
					newUser.local.email = profile.emails[0].value;
					newUser.google.id    = profile.id;
					newUser.google.token = token;
					newUser.google.name  = profile.displayName;
					newUser.google.email = profile.emails[0].value; // fa
					newUser.google.first_name = json.given_name;
					newUser.google.last_name = json.family_name;
					newUser.google.gender = json.gender;
					newUser.google.verified = json.verified_email;
					newUser.validation.mail_verified = json.verified_email;
					newUser.info = {};

					for(var att in newUser.google){
						newUser.info[att] = newUser.google[att];
					};

					newUser.info.pseudo = profile.displayName;

					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
	}));

	// TWITTER CREATE IF NOT EXIST OR JOIN ACCOUNT
/*	passport.use(new TwitterStrategy({
		consumerKey        : configAuth.twitterAuth.consumerKey,
		consumerSecret    : configAuth.twitterAuth.consumerSecret,
		callbackURL     : configAuth.twitterAuth.callbackURL,
	}, function(token, refreshToken, profile, done) {
		console.log(profile._json);
		var json = profile._json;
		process.nextTick(function() {
			User.findOne({ 'local.email' : profile.email }, function(err, user) {
				if (err) return done(err);
				if (user) {
					if (!user.twitter.email) {
						user.twitter.id				= profile.id;
						user.twitter.token			= token;
						user.twitter.username		= profile.username;
						user.twitter.email			= json.email;
						user.twitter.verified		= json.verified;
						user.validation.mail_verified = json.verified;

						if(typeof(user.info)=='undefined')user.info = {};

						for(var att in user.twitter){
							if(!user.info[att])user.info[att] = user.twitter[att];
						};

						user.save(function(err) {
							if (err) throw err;
							return done(null, user);
						});
					}
					return done(null, user);
				} else {
					var newUser = new User();
					user.twitter.id				= profile.id;
					user.twitter.token			= token;
					user.twitter.displayName	= profile.username;
					user.twitter.email			= json.email;
					user.twitter.verified		= json.verified;
					user.validation.mail_verified = json.verified;
					newUser.info = {};

					for(var att in newUser.twitter) {
						newUser.info[att] = newUser.twitter[att];
					};

					newUser.info.pseudo = profile.displayName;

					newUser.save(function(err) {
						if (err) throw err;
						return done(null, newUser);
					});
				}
			});
		});
}));*/
};