/*
 * DASHBOARD ROUTE
 * 	- update my experiences
 *  - visualize my comments
 *  - contribute to community moderation
 *
 */

var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');

var Application = mongoose.model('Application');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Article = mongoose.model('Article');

router.param(':comment', function(req, res, next, id) {
	var query = Comment.findById(id);
	query.exec(function (err, comment){
		if (err) { return next(err); }
		if (!comment) { return next(new Error("can't find comment")); }
		req.comment = comment;
		return next();
	});
});

// DASHBOARD - HOME
router.get('/', function(req, res) {
	res.render('dashboard', {scripts:['/javascripts/dashboard/angular_dashboard.js']});
});

router.get('/json', function(req, res) {
	Application.find({"deleted": {$ne: true}}, function(err, apps) {
		Article.find({}, function(err, articles) {
			res.json({apps: apps, articles: articles});
		})
	})
})

router.post('/option', function(req, res) {
	util.sendOptionMail(req.user.local, req.body.option, "l'accueil du dashboard.", req.body.demand);
	res.json({ok: "Mail envoyé"});
});

// DASHBOARD - MYCOMMENTS
router.get('/mycomments', function(req, res) {
	Comment.find({"public_part.author":req.user._id},function(er,comments){
		res.render('dashboard/mycomments', {app:req.application, scripts:["/javascripts/dashboard/angular_mycomments.js"]});
	})
});

router.get('/mycomments/json', function(req, res) {
	Comment.find({"public_part.author":req.user._id},function(er,comments){
		res.json(comments);
	})
});

router.put('/myComments/:comment', function(req, res, next) {
	if (req.comment.public_part.author == req.user.id) {
		req.comment.update({_id: req.comment._id, private_part: {deleted: true} });
	}
});

/**************FIGURES****************/

router.get('/figures', function(req, res) {
	res.render('dashboard/figures',{scripts: ["/javascripts/dashboard/angular_figures.js"]});
});

router.post('/figures/option', function(req, res) {
	util.sendOptionMail(req.user.local, req.body.option, "les stats.", req.body.demand);
	res.json({ok: "Mail envoyé"});
});

/**************RULES****************/

router.get('/rules',function(req, res) {
	res.render('dashboard/rules', { title: 'discover',logged:req.isAuthenticated() });
});


/**************ABOUT****************/

router.get('/about',function(req, res) {
	res.render('dashboard/about', { title: 'discover',logged:req.isAuthenticated() });
});



/**************MENTIONS****************/

router.get('/mentions',function(req, res) {
	res.render('dashboard/mentions', { title: 'discover',logged:req.isAuthenticated() });
});

/**************CREDIBILITY****************/

router.get('/credibility',function(req, res) {
	res.render('dashboard/credibility', { title: 'discover',logged:req.isAuthenticated() });
});

/**************TESTING : AVIS AUTEUR****************/

router.get('/test_ciid',function(req, res) {
	res.render('dashboard/test_ciid', { title: 'discover',logged:req.isAuthenticated() });
});

/**************AVIS ADMIN****************/

router.get('/avis-admin',function(req, res) {
	res.render('admin/avis-admin', { title: 'discover',logged:req.isAuthenticated() });
});

/**************VALIDATION****************/

router.get('/validation', function(req, res) {
	res.render('dashboard/validation',{scripts:["/javascripts/dashboard/angular_validation.js"]});
});

router.get('/validation/random', function(req, res) {
	if (!req.user.tutoriel) {
		res.json({tutoriel: 'true'});
	}

	// Renvoi un commentaire qui n'a pas déjà été modéré par la personne qui fait la requête ou modéré par le proprio.
	Comment.find({	"public_part.author": {$ne:req.user._id},
					"private_part.deleted": false,
					"private_part.denounceFrom.user": {$ne:req.user._id},
					"private_part.validatedFrom": {$ne:req.user._id},
					"private_part.validatedFrom.1": {$exists:false},
					"private_part.deletedFrom": {$ne:req.user._id},
					"private_part.deletedFrom.1": {$exists:false},
					"private_part.ignoredFrom": {$ne:req.user._id},
					"private_part.validatedByOwner": false,
					"private_part.deletedByOwner": false
				}).exec(function(err, comments) {
					var rand = Math.floor(Math.random() * comments.length);
					res.json({comment:comments[rand]});
				});
});

router.get('/validation/all', function(req, res) {
	// Return comments that :
	//    - was not already validated, ignored or deleted by myself
	//	  - is not mine!
	Comment.find({"public_part.author": {$ne:req.user._id},
		"private_part.deleted":false,
		"private_part.denounceFrom.user":{$ne:req.user._id},
		"private_part.validatedFrom":{$ne:req.user._id},
		"private_part.deletedFrom":{$ne:req.user._id},
		"private_part.ignoredFrom":{$ne:req.user._id},
		"private_part.validatedByOwner": false,
		"private_part.deletedByOwner": false})
	.exec(function(err,comments) {
		res.json({comment:comments});
	});
});

router.put('/validation/:action/:comment', function(req, res, next) {
	//TODO let verify that user can flag that comment
	Comment.find({_id:req.comment._id,
			"public_part.author": {$ne:req.user._id},
			"private_part.denounceFrom.user":{$ne:req.user._id},
			"private_part.validatedFrom":{$ne:req.user._id},
			"private_part.deletedFrom":{$ne:req.user._id},
			"private_part.ignoredFrom":{$ne:req.user._id}}, {_id: 1}).limit(1)
	.exec(function(err,commentFind) {
		if (err) { return next(err); }
		if (commentFind.length == 0) {
			return next(new Error("comment already flagged"));
		} else
			return next();
	});
});

router.put('/validation/ok/:comment', function(req, res, next) {
	var author = req.comment.public_part.author;
	var validatedFrom = req.comment.private_part.validatedFrom;
	var deletedFrom = req.comment.private_part.deletedFrom;
	var denounceFrom = req.comment.private_part.denounceFrom;

	req.comment.setOk(req.user._id, function(err, comment, published) {
	    if(err){ return next(err); }

	    if(published){
	    	validatedFrom.push(req.user._id);
	    	User.update({_id:author},{$inc:{commentOkCredit:1}}).exec();
	    	User.update({_id:{$in:validatedFrom}},{$inc:{validationCredit:1}}).exec();
	    	User.update({_id:{$in:deletedFrom}},{$inc:{validationCredit:-1}}).exec();
	    }
	    res.json({ok:true});
	  });
});

router.put('/validation/ko/:comment', function(req, res, next) {
	var author = req.comment.public_part.author;
	var validatedFrom = req.comment.private_part.validatedFrom;
	var deletedFrom = req.comment.private_part.deletedFrom;
	var denounceFrom = req.comment.private_part.denounceFrom;

	req.comment.setKo(req.user._id, function(err, comment, deleted){
		if(err){ return next(err); }

	    if(deleted){
	    	deletedFrom.push(req.user._id);
	    	User.update({_id:author},{$inc:{commentOkCredit:-1}}).exec();
	    	User.update({_id:{$in:validatedFrom}},{$inc:{validationCredit:-1}}).exec();
	    	User.update({_id:{$in:deletedFrom}},{$inc:{validationCredit:1}}).exec();
	    }
		res.json({ok:true});
	});
});

router.put('/validation/pass/:comment', function(req, res, next) {

	req.comment.setIgnored(req.user._id, function(err, comment) {
		if(err){ return next(err); }
		res.json({ok:true});
	});
});

module.exports = router;