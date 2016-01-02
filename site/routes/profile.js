/*
 *
 * ACCESS USER PROFILE INFORMATIONS
 */

var express = require('express');
var router 	= express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Newsletter = mongoose.model('Newsletter');

// JSON VERSIONS
router.get('/json', function(req, res) {
	User.find({_id: req.user._id})
	.exec(function(err, users) {
		if(err){ return next(err); }

		Newsletter.find({user: req.user._id}, function(err, newsletters) {
			res.json({ user: users[0], news: newsletters });
		});
	});
});

// GET MAX CREDIT & LEVELS
router.get('/maxCredit', function(req, res) {
	User.findOne().sort('-authorCredit').exec(function (err, userMaxAuthor) {
		User.findOne().sort('-modCredit').exec(function (err, userMaxMod) {
			var maxCredit = userMaxAuthor.authorCredit + userMaxMod.modCredit;
			if (maxCredit < 100) {
				res.json({max: 100, level1: 0, level2: 20, level3: 40, level4: 60, level5: 80});
			} else {
				res.json({max: maxCredit, level1: maxCredit / 100, level2: maxCredit * 20 / 100, level3:  maxCredit * 40 / 100, level4:  maxCredit * 60 / 100, level5:  maxCredit * 80 / 100});
			}
		});
	});
});

// GET PUBLIC PROFILE OF USER
router.get('/:userId', function(req, res) {
	res.render('dashboard/profile_public', {scripts: ["/javascripts/profile/angular_profile.js"]})
});

router.get('/:userId/json', function(req, res, next) {
	res.json({ user: req.userPublic});
});

// NEED TO BE AUTH FOR NEXT ACTIONS
router.all('/*',function(req,res,next){
	if(req.isAuthenticated())
		return next();
	else
		return next(new Error("Not Logged In"));
});

router.param(':userId', function(req, res, next, id) {
	var query = User.findOne({ _id: id })
	.exec(function(err, user) {
		if (err) return next(err);
		if (!user) return next(new Error("No user with this ID"));
		Comment.find({ 'public_part.author': user._id })
		.exec(function(err, userComments) {
			req.userPublic = { 	_id: user._id,
								pseudo: user.local.pseudo,
								authorCredit: user.authorCredit,
								modCredit: user.modCredit,
								experiences: user.experiences,
								info: {	avatar: user.info.avatar,
										summary: user.info.summary,
										hobbies: user.info.hobbies,
										job: user.info.job,
										birthday: user.info.birthday,
										gender: user.info.gender
									  },
								comments: userComments
							 };
			return next();
		});
	});
});

// GET CURRENT USER PROFILE
router.get('/', function(req, res) {
	res.render('dashboard/profile', {scripts:["/javascripts/profile/angular_profile.js"]});
});

// EDIT PROFILE
router.put('/', function(req, res) {
	var userData = req.body.userData;
	var userNews = req.body.userNews;
	User.update({_id: req.user._id}, { $set:{
		'experiences': userData.experiences,
		'local.pseudo': userData.local.pseudo,
		'info.gender': userData.info.gender,
		'info.first_name': userData.info.first_name,
		'info.last_name': userData.info.last_name,
		'info.birthday': userData.info.birthday,
		'info.phone': userData.info.phone,
		'info.language': userData.info.language,
		'info.job': userData.info.job,
		'info.hobbies': userData.info.hobbies,
		'info.summary': userData.info.summary,
		'info.avatar.media': userData.info.avatar.media,
		'info.avatar.link': userData.info.avatar.link
	}}, function(err, count, status) {
		if (err) res.json(err);
	});

	userNews.forEach(function(element, index, array) {
		Newsletter.update({_id: element._id}, { $set:{
			'send': element.send
		}}, function(err, count, status) {
			if (err) res.json(err);
		});
	});
})

module.exports = router;