/*
 *	ROUTE USED TO VALIDATE ACCOUNT AFTER CREATION
 *
**/

var express = require('express');
var util = require('../util/utils');
var router = express.Router();

var mongoose = require('mongoose');
var User = mongoose.model('User');

router.get('/', function(req, res, next) {
	if(req.isAuthenticated() && !req.user.validation.mail_verified) {
		if(!req.user.validation.mail_sent) {
			if(!req.user.validation.token || req.user.validation.token == "") {
				req.user.generateValidationToken(function(token) {
					req.user.update({"validation.token": token}, function(err,res){});
					util.sendActivationMail(req.user.local.email, req.user.validation.token);
				});
			} else {
				util.sendActivationMail(req.user.local.email, req.user.validation.token);
			}
			req.user.update({"validation.mail_sent":true}, function(err,res){});
		}
		res.render('account_validation', { email: req.user.local.email, scripts: ['/javascripts/admin/angular_accountValidation.js']});
	} else {
		next();
	}
});

router.get('/resendToken', function(req, res, next) {
	util.sendActivationMail(req.user.local.email, req.user.validation.token);
	res.json({ok: "Mail ré-envoyé."});
});

router.post('/sendPasswordMail', function(req, res, next) {
	if (!req.isAuthenticated()) {
		User.findOne({'local.email': req.body.email}, function(err, user) {
			if (err) next(err);
			if (!user) {
				res.json({ko: "Aucun utilisateur avec cet email."});
			} else {
				var newPassword = "";
				var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-%=)(?,.;/:!*£$€#";
				for (var i = 0; i < 8; i++) {
					newPassword += possible.charAt(Math.floor(Math.random() * possible.length));
				}
				user.local.password = user.generateHash(newPassword);
				util.sendPasswordInfo(user, newPassword);
				user.save();
				res.json({ok: "Un mail vous à été envoyer pour ré-initialiser votre mot de passe"});
			}
		});
	} else {
		if (!req.user.validPassword(req.body.oldPassword)) {
			res.json({ko: "L'ancien mot de passe n'est pas correct"});
		} else {
			req.user.local.password = req.user.generateHash(req.body.newPassword);
			req.user.save();
			res.json({ok: "Votre mot de passe a bien été changé."});
		}
	}
});

router.param(function(name, fn) {
	if (fn instanceof RegExp) {
		return function(req, res, next, val) {
			var captures;
			if (captures = fn.exec(String(val))) {
				req.params[name] = captures;
				next();
			} else {
				next('route');
			}
		}
	}
});

router.param('token', /.{128}$/);

router.get('/:token',function(req, res,next) {
	console.log("Validation de mail");
	User.update({"validation.token":req.params.token},{"validation.mail_verified":true},function(err,num) {
		if(err) return next(err);
		if(num==0) return next(new Error("mauvais token d'activation"));
		else {
			res.render('account_validated');
		}
	})
});

module.exports = router;