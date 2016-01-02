/*
 * AUTHENTICATION ROUTE
 * - proxy to passport
 * 		signin/signup ciid
 *  	facebook
 *   	google
 * 
 */

module.exports = function(app, passport) {

	app.get('/logout', function(req, res) {
		req.logout();
		req.session.destroy(); 
		res.redirect('/');
	});

	app.get("/closeWindow", function(req, res) {
		res.render('closeWindow');
	});

	app.get("/ssoLogged", function(req, res) {
		res.render('authFrameCloser', {user: req.user});
	});

	app.get('/auth/*', function(req, res, next) {
		if (!req.isAuthenticated()) { return next(); }
		else res.redirect('/');
	})

	app.post('/auth/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/auth/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.post('/auth/login',passport.authenticate('local-login', {
		successRedirect: '/',
		failureRedirect: '/?error_logged=1' }));

	app.get('/auth/facebook', passport.authenticate('facebook', {scope: ['public_profile','email']}));

	app.get('/auth/facebook/callback', passport.authenticate('facebook', {
		successRedirect: '/ssoLogged/',
		failureRedirect: '/'
	}));

	app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	app.get('/auth/google/callback', passport.authenticate('google', {
		successRedirect: '/ssoLogged/',
		failureRedirect: '/'
	}));

	app.get('/auth/twitter', passport.authenticate('twitter', {scope: ['public_profile','email']}));

	app.get('/auth/twitter/callback', passport.authenticate('twitter', {
		successRedirect: '/ssoLogged/',
		failureRedirect: '/'
	}));
};
