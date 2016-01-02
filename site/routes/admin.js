/*ADMIN PART
 * - CRUD ciid applications
 * - comments moderation
 *
*/

var express = require('express');
var router = express.Router();

var util = require('../util/utils')
var exportFuncs = require('./exportComments');

var mongoose = require('mongoose');
var Application = mongoose.model('Application');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');
var Article = mongoose.model('Article');
var Newsletters = mongoose.model('Newsletter');

router.get('/', function(req, res) {
	Application.find({$or:[{'owner':req.user._id},{"roles.user":req.user._id}], "deleted": {$ne: true}})
	.exec(function(err, apps){
		if(err){ return next(err); }
			res.render("admin/create_app",{apps:apps,scripts:["/javascripts/admin/angular_admin.js"]});
	});
});

// APP ID PARAMETER DECLARATION
router.param(':appId', function(req, res, next, id) {
	var query = Application.findOne({_id:id,$or:[{owner:req.user._id},{"roles.user":req.user._id}], "deleted": {$ne: true}});
	query.populate("roles.user","local").populate("owner","local").exec(function (err, app) {
		if (err) { return next(err); }
		if (!app) { return next(new Error("can't find app")); }

		req.application = app;
		return next();
	});
});

// COMMENT ID PARAMETER DECLARATION
router.param(':commentId', function(req, res, next, id) {
	var query = Comment.findById(id);
	query.exec(function (err, comment) {
		if (err) { return next(err); }
		if (!comment) { return next(new Error("can't find comment")); }
		if(req.application.appKey!=comment.private_part.appKey){ return next(new Error("comment is not mine")); };
		req.comment = comment;
		return next();
	});
});

// SUPPRIMER UNE APPLICATION
router.put('/:appId/delete', function(req, res, next) {
	req.application.deleted = true;
	req.application.save(function(er,app) {
		res.json({ok: "Application supprimée."});
	});
});

// ADMIN PAGE FOR APPLICATION
router.get('/:appId/', function(req, res) {
	//get list of pages commented for this appkey
	Comment.distinct("public_part.link",{"private_part.appKey":req.application.appKey}).exec(function(err, links) {
   	    if(err) {
	    	return next(err);
	    } else {
	    	res.render("admin/app_settings",{ app:req.application, links:links, scripts:["/javascripts/admin/angular_admin.js"]});
	    }
   });
});

// RETURN ALL INFORMATIONS ON APPLICATION
router.get('/:appId/json', function(req, res) {
	if (req.application)
		res.json({app: req.application});
	else
		res.json({ko: "Application not found"}, 304);
});

// RETURN NUMBER OF COMMENT CURRENTLY IN MODERATION
router.get('/:appId/toMod', function(req, res) {
	var mod = [];
	Comment.find(function(err, comments) {
		for (c in comments) {
			if (comments[c].private_part.appKey != req.application.appKey)
				continue;
			if (!comments[c].private_part.validatedByOwner && !comments[c].private_part.deletedByOwner && comments[c].private_part.validatedFrom.length < 2 && comments[c].private_part.deletedFrom.length < 2) {
				mod.push(comments[c]);
			}
		}
		res.json({comments: mod});
	});
});

// GET THE NEWSLETTER MAILS
router.get("/:appId/newsletter", function(req, res) {
	Newsletters.find({domain: req.application.allowed_domain, send: true}).populate("user", "info local")
	.exec(function(err, newsletters) {
		if (err)
			console.log(err);
		if (newsletters) {
			res.json({newsletters: newsletters});
		} else {
			res.json({ko: "Aucun utilisateurs trouvés"});
		}
	})
});

// UPDATE ALLOWED DOMAINS
router.post('/:appId/uad', function(req, res) {
	req.application.allowed_domain = req.body.domain.replace('http://','').replace('https://','').replace('www.', '').split(/[/?#]/)[0].split(":")[0];

	req.application.save(function(er,app) {
		res.json(app.allowed_domain);
	});
});

// MODERATE OK COMMENT
router.put('/:appId/setCommentOk/:commentId',function(req, res) {
	var author = req.comment.public_part.author;
	var validatedFrom = req.comment.private_part.validatedFrom;
	var deletedFrom = req.comment.private_part.deletedFrom;
	var denounceFromUsers = req.comment.private_part.denounceFrom;
	var denounceFrom = [];
	denounceFromUsers.forEach(function(du) {
		denounceFrom.push(du.user);
	})
	req.comment.setOwnerOk(function(er,comment){
		if(author!=req.user._id){
			User.update({_id:author},{$inc:{commentOkCredit:1}}).exec();
		}
		User.update({_id:{$in:validatedFrom}},{$inc:{validationCredit:1}}).exec();
		User.update({_id:{$in:deletedFrom}},{$inc:{validationCredit:-1}}).exec();
		User.update({_id:{$in:denounceFrom}},{$inc:{validationCredit:-1}}).exec();

		Comment.find({_id: comment._id}).populate("public_part.author","info local").exec(function(err, comments) {
			res.json(comments[0]);
		});
	});
});

// MODERATE KO COMMENT
router.put('/:appId/setCommentKo/:commentId',function(req, res) {
	var author = req.comment.public_part.author;
	var validatedFrom = req.comment.private_part.validatedFrom;
	var deletedFrom = req.comment.private_part.deletedFrom;
	var denounceFromUsers = req.comment.private_part.denounceFrom;
	var denounceFrom = [];
	denounceFromUsers.forEach(function(du){
		denounceFrom.push(du.user);
	})
	req.comment.setOwnerKo(function(er,comment){

		if(req.comment.public_part.author != req.user._id){
			User.update({_id:req.comment.public_part.author},{$inc:{commentOkCredit:-1}}).exec();
		}
		User.update({_id:{$in:validatedFrom}},{$inc:{validationCredit:-1}}).exec();
		User.update({_id:{$in:deletedFrom}},{$inc:{validationCredit:1}}).exec();
		User.update({_id:{$in:denounceFrom}},{$inc:{validationCredit:1}}).exec();

		Comment.find({_id: comment._id}).populate("public_part.author","info local").exec(function(err, comments) {
			res.json(comments[0]);
		});
	});
});

// RETURN A COUNT OF ALL COMMENTS FOR AN APP
router.get('/:appId/commentsCount', function(req, res) {
	Comment.find(function(err, comments) {
		var published = 0;
		var mod = 0;
		var signaled = 0;
		var lastweekpublished = 0;
		var total = 0;

		var enddate = new Date();
		var startdate = new Date(enddate.getTime() - (7 * 24 * 60 * 60 * 1000));

		for (c in comments) {
			if (comments[c].private_part.appKey != req.application.appKey)
				continue;
			else
				total += 1;
			if (comments[c].private_part.validatedByOwner || comments[c].private_part.validatedFrom.length > 1)
				published += 1;
			if (!comments[c].private_part.validatedByOwner && !comments[c].private_part.deletedByOwner && comments[c].private_part.validatedFrom.length < 2 && comments[c].private_part.deletedFrom.length < 2)
				mod += 1;
			if (comments[c].private_part.denounceFrom.length > 0)
				signaled += 1;
			if (comments[c].public_part.created >= startdate && comments[c].public_part.created <= enddate)
				lastweekpublished += 1;
		}
		res.json({total: total, published: published, mod: mod, signaled: signaled, lastweekpublished: lastweekpublished});
	});
});

// RETURN A COUNT OF ALL COMMENTS FOR AN ARTICLE
router.get('/:appId/:link/commentsCount', function(req, res) {
	var link = req.params.link.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/,'');
	var total = 0;
	var mod = 0;
	Comment.find({"private_part.appKey":req.application.appKey,"public_part.link":link}, function(err, comments) {
		for (c in comments) {
			if (!(comments[c].private_part.validatedByOwner) && !(comments[c].private_part.deletedByOwner) && comments[c].private_part.validatedFrom.length < 2 && comments[c].private_part.deletedFrom.length < 2) {
				mod += 1;
			}
			total += 1;
		}

		res.json({total: total, mod: mod});
	})
});

// EXPORT ALL COMMENTS IN CSV FOR A GIVEN APP
router.get('/:appId/comments/export', function(req, res) {
	exportFuncs.getCommentsCSV(req, res);
});

// EXPORT ALL ARTICLES IN CSV FOR A GIVEN APP
router.get('/:appId/articles/export', function(req, res) {
	exportFuncs.getArticlesCSV(req, res);
});

// RETURN ALL ARTICLES FOR A GIVEN APP
router.get('/:appId/:appKey/articles', function(req, res, next) {
	Article.find({'appId': req.params.appKey}, function(err, articles) {
		if (err) return next(err);
		res.json({articles: articles});
	})
});

// CREATE IF DOESN'T EXIST AND RETURN THE ARTICLE.
router.get('/:appId/:link/article', function(req, res, next) {

	Article.findOne({link: req.params.link}, function(err, article) {
		res.json({article: article});
	});
});

// UPDATE ARTICLE
router.put('/:appId/:link/article', function(req, res, next) {

	Article.update({'link': req.params.link},
		{'$set': {
			'question': req.body.article.question,
			'ratingRep': req.body.article.ratingRep,
			'ratingType': req.body.article.ratingType
		}}, function(err, application) {
			if (err) return next(err);
			return res.json({ok: "Question mise à jour."});
	});
});

// RETURN ALL COMMENTS FOR AN APPLICATION
router.get('/:appId/:link', function(req, res) {
	var link = req.params.link.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/,'');
	Comment.find({"private_part.appKey":req.application.appKey,"public_part.link":link}).populate("public_part.author","info local").exec(function(err, comments) {
		if(err) {
			return next(err);
		} else {
			res.json(comments);
		}
	});
});

// ADD AN ADMINISTRATOR TO THE APPLICATION
router.post('/:appId/roles/add', function(req, res) {
	User.findOne({"local.email":req.body.email}, function(err, user) {
		if (err) {
			return res.json({err: err});
		}
		if (user) {
			req.application.addRole(user, "admin", function(err) {
				if (err)
					console.log(err);
				else
					return res.json({ok: "Utilisateur Ajouté."});
			});
		} else {
			return res.json({ko: "Utilisateur non trouvé où déjà présent dans les administrateurs."}, 404);
		}
	});
});

// DELETE AN ADMINISTRATOR FOR THE APPLICATION
router.put("/:appId/roles/delete", function(req, res) {
	User.findOne({"local.email":req.body.email}, function(err, user) {
		if (err)
			return res.json({err: err});
		if (user) {
			req.application.deleteRole(user, function(err) {
				if (err)
					console.log(err);
				else
					return res.json({ok: "Utilisateur supprimé de la liste des administrateurs."});
			})
		}
	})
});

// BLACKLISTING
router.post("/:appId/blacklists/email", function(req, res) {
	if (req.application.b_emails.indexOf(req.body.email) === -1)
		req.application.addBEmail(req.body.email, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "Email ajouté dans la blacklist."});
		});
	else
		res.json({ko: "Email déjà dans la blacklist"}, 401);
});
router.post("/:appId/blacklists/ip", function(req, res) {
	req.application.addBIP(req.body.ip, function(err, email) {
		if (err) res.json({err: err});
		res.json({ok: "IP ajouté dans la blacklist."});
	});
});
router.post("/:appId/blacklists/word", function(req, res) {
	req.application.addBWord(req.body.word, function(err, email) {
		if (err) res.json({err: err});
		res.json({ok: "Mot ajouté dans la blacklist."});
	});
});

// UN-BLACKLISTING
router.put("/:appId/blacklists/email", function(req, res) {
	req.application.deleteBEmail(req.body.email, function(err, email) {
		if (err) res.json({err: err});
		res.json({ok: "Email supprimé de la blacklist."});
	});
});
router.put("/:appId/blacklists/ip", function(req, res) {
	req.application.deleteBIP(req.body.ip, function(err, email) {
		if (err) res.json({err: err});
		res.json({ok: "IP supprimé de la blacklist."});
	});
});
router.put("/:appId/blacklists/word", function(req, res) {
	req.application.deleteBWord(req.body.word, function(err, email) {
		if (err) res.json({err: err});
		res.json({ok: "Mot supprimé de la blacklist."});
	});
});

// CREATE NEW APP
router.post('/c_a', function(req, res) {
	require('crypto').randomBytes(48, function(ex, buf) {
		req.body.appKey = buf.toString('hex');
		req.body.owner = req.user._id;
		req.body.allowed_domain = req.body.domain.replace('http://','').replace('https://','').replace('www.', '').split(/[/?#]/)[0].split(":")[0];

		new Application(req.body).save(function(err,app) {
			if(err)return done(error);
			if(!req.session.apps)req.session.apps = [];
			req.session.apps.push(app);
			res.redirect("/admin/"+app._id);
		});
	});
});

// SEND MAIL TO ADMIN WHEN AN OPTION IS ASKED
router.post('/option', function(req, res) {
	util.sendOptionMail(req.user.local, req.body.option, req.body.origin, req.body.demand);
	res.json({ok: "Mail envoyé"});
});

module.exports = router;