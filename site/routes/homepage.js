/*
 * MAIN ROUTE
 * 		- redirect to dashboard if logged
 * 		- otherwise redirect to dashboard
 */

var express = require('express');
var router = express.Router();


var mongoose = require('mongoose');
var User = mongoose.model('User');

var asyncValidator = require('async-validate');
var ValidationError = asyncValidator.error;
var passport = require('passport');

router.get('/', function(req, res) {
	if(!req.isAuthenticated()){
		res.render("homepage");
	}
	else{
		res.redirect('/dashboard');
	}
});


	
/**************Integration****************/	
router.get('/integration',function(req, res) {
	if(!req.isAuthenticated()){
		res.render('promote/integration');
	}
	else{
		res.redirect('/dashboard');
	}
});
	
/**************rules****************/	
router.get('/rules',function(req, res) {
	if(!req.isAuthenticated()){
		res.render('promote/rules');
	}
	else{
		res.redirect('dashboard/rules');
	}
});

/**************credibility****************/	
router.get('/credibility',function(req, res) {
	if(!req.isAuthenticated()){
		res.render('promote/credibility');
	}
	else{
		res.redirect('dashboard/credibility');
	}
});

/**************about****************/	
router.get('/about',function(req, res) {
	if(!req.isAuthenticated()){
		res.render('promote/about');
	}
	else{
		res.redirect('dashboard/about');
	}
});

/**************rules****************/	
router.get('/mentions',function(req, res) {
	if(!req.isAuthenticated()){
		res.render('promote/mentions');
	}
	else{
		res.redirect('dashboard/mentions');
	}
});
	
/**************rules****************/	
router.get('/demo',function(req, res) {
		res.render('promote/demo');

});
	

module.exports = router;