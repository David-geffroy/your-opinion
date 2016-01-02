/*
 * AUTHENTICATION ROUTE
 * - proxy to passport
 * 		signin/signup ciid
 *  	facebook
 *   	google
 *
 */

module.exports = function(app, passport) {

	app.get('/api/me', function(req, res) {
		if (req.isAuthenticated()) {
			res.json({user:req.user});
		} else {
			res.json({ko: "Non connecté"}, 204);
		}
	});

	app.get("/ssoLogged",function(req,res,next) {
		res.render('authFrameCloser', {})
	});


	app.get('/api/auth/logout', function(req, res) {
		req.logout();
		req.session.destroy();
		res.json({msg: "Logged Out"});
	});

	app.get('/api/auth/*',function(req,res,next){
		 if (!req.isAuthenticated()) { return next(); }
		 else res.redirect('/');
	})

	app.post('/api/auth/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to the secure profile section
		failureRedirect : '/auth/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.post('/api/auth/login',passport.authenticate('local-login'), function(req, res) {
		if (req.isAuthenticated()) {
			res.json({user: req.user.info});
		} else {
			res.json({err: "Couldn't connect."});
		}
	});

	app.get('/api/auth/facebook', passport.authenticate('facebook', {scope: ['public_profile','email','user_friends','user_birthday','publish_actions']}));

	app.get('/api/auth/facebook/callback', passport.authenticate('facebook', {
			successRedirect : '/ssoLogged',
			failureRedirect: '/'
		})
	);

	app.get('/api/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

	// the callback after google has authenticated the user
	app.get('/api/auth/google/callback', passport.authenticate('google', {
			successRedirect : '/ssoLogged',
			failureRedirect: '/'
		})
	);

	app.get('/auth/twitter', passport.authenticate('twitter', {scope: ['public_profile','email']}));

	app.get('/auth/twitter/callback', passport.authenticate('twitter', {
		successRedirect: '/ssoLogged/',
		failureRedirect: '/'
	}));
};
