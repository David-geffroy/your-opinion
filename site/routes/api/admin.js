var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var Application = mongoose.model('Application');
var User = mongoose.model('User');
var Article = mongoose.model('Article');
var Newsletter = mongoose.model('Newsletter');
var util = require('../../util/utils');

module.exports = function(app, passport) {

	app.get('/:origin/:appKey/toMod', function(req, res) {
		var mod = [];
		Comment.find(function(err, comments) {
			for (c in comments) {
				if (comments[c].private_part.appKey != req.app.appKey)
					continue;
				if (!comments[c].private_part.validatedByOwner && !comments[c].private_part.deletedByOwner && comments[c].private_part.validatedFrom.length < 2 && comments[c].private_part.deletedFrom.length < 2) {
					mod.push(comments[c]);
				}
			}
			res.json({comments: mod});
		});
	});


	// UPDATE ALLOWED DOMAINS
	app.post('/api/:origin/:appKey/uad', function(req, res) {
		req.app.allowed_domain = req.body.domain.replace('http://','').replace('https://','').replace('www.', '').split(/[/?#]/)[0].split(":")[0];

		req.app.save(function(er,app) {
			res.json(app.allowed_domain);
		});
	});

	app.get('/api/:origin/:appKey/articles', function(req, res, next) {
		Article.find({'appId': req.params.appKey}, function(err, articles) {
			if (err) return next(err);
			res.json({articles: articles});
		})
	});

	// MODERATE OK COMMENT
	app.put('/api/:origin/:appKey/setCommentOk/:comment',function(req, res) {
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
			res.json(comment);
		});
	});

	// MODERATE KO COMMENT
	app.put('/api/:origin/:appKey/setCommentKo/:comment',function(req, res) {
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
	app.get('/api/:origin/:appKey/commentsCount', function(req, res) {
		Comment.find(function(err, comments) {
			var published = 0;
			var mod = 0;
			var signaled = 0;
			var lastweekpublished = 0;
			var total = 0;

			var enddate = new Date();
			var startdate = new Date(enddate.getTime() - (7 * 24 * 60 * 60 * 1000));

			for (c in comments) {
				if (comments[c].private_part.appKey != req.app.appKey)
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
	app.get('/api/:origin/:appKey/:link/commentsCount', function(req, res) {
		var link = decodeURIComponent(req.params.link);
		var total = 0;
		var mod = 0;
		Comment.find({"private_part.appKey": req.app.appKey, "public_part.link":link}, function(err, comments) {
			for (c in comments) {
				if (!(comments[c].private_part.validatedByOwner) && !(comments[c].private_part.deletedByOwner) && comments[c].private_part.validatedFrom.length < 2 && comments[c].private_part.deletedFrom.length < 2) {
					mod += 1;
				}
				total += 1;
			}
			res.json({total: total, mod: mod});
		})
	});

	app.get('/api/:origin/:appKey/comments/export', function(req, res) {
		exportFuncs.getCommentsCSV(req, res);
	});

	app.get('/api/:origin/:appKey/articles/export', function(req, res) {
		exportFuncs.getArticlesCSV(req, res);
	});

	// RETURN THE ARTICLE.
	app.get('/api/:origin/:appKey/:link/article', function(req, res, next) {

		Article.findOne({link: req.params.link}, function(err, article) {
			res.json({article: article});
		});
	});

	// UPDATE ARTICLE
	app.put('/api/:origin/:appKey/:link/article', function(req, res, next) {
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
	app.get('/api/:origin/:appKey/:link', function(req, res) {
		var link = req.params.link.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/,'');
		Comment.find({"private_part.appKey":req.params.appKey,"public_part.link": link}).populate("public_part.author","info local").exec(function(err, comments) {
			if(err) {
				return next(err);
			} else {
				res.json({comments: comments});
			}
		});
	});

	// ADD AN ADMINISTRATOR TO THE APPLICATION
	app.post('/api/:origin/:appKey/roles/add', function(req, res) {
		User.findOne({"local.email":req.body.email}, function(err, user) {
			if (err) {
				return res.json({err: err});
			}
			if (user) {
				req.app.addRole(user, "admin", function(err) {
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
	app.put("/api/:origin/:appKey/roles/delete", function(req, res) {
		User.findOne({"local.email":req.body.email}, function(err, user) {
			if (err)
				return res.json({err: err});
			if (user) {
				req.app.deleteRole(user, function(err) {
					if (err)
						console.log(err);
					else
						return res.json({ok: "Utilisateur supprimé de la liste des administrateurs."});
				})
			}
		})
	});

	// BLACKLISTING
	app.post("/api/:origin/:appKey/blacklists/email", function(req, res) {
		if (req.app.b_emails.indexOf(req.body.email) === -1)
			req.app.addBEmail(req.body.email, function(err, email) {
				if (err) res.json({err: err});
				res.json({ok: "Email ajouté dans la blacklist."});
			});
		else
			res.json({ko: "Email déjà dans la blacklist"}, 401);
	});
	app.post("/api/:origin/:appKey/blacklists/ip", function(req, res) {
		req.app.addBIP(req.body.ip, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "IP ajouté dans la blacklist."});
		});
	});
	app.post("/api/:origin/:appKey/blacklists/word", function(req, res) {
		req.app.addBWord(req.body.word, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "Mot ajouté dans la blacklist."});
		});
	});

	// UN-BLACKLISTING
	app.put("/api/:origin/:appKey/blacklists/email", function(req, res) {
		req.app.deleteBEmail(req.body.email, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "Email supprimé de la blacklist."});
		});
	});
	app.put("/api/:origin/:appKey/blacklists/ip", function(req, res) {
		req.app.deleteBIP(req.body.ip, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "IP supprimé de la blacklist."});
		});
	});
	app.put("/api/:origin/:appKey/blacklists/word", function(req, res) {
		req.app.deleteBWord(req.body.word, function(err, email) {
			if (err) res.json({err: err});
			res.json({ok: "Mot supprimé de la blacklist."});
		});
	});

	app.post('/api/:origin/:appKey/option', function(req, res) {
		console.log("Test");
		util.sendOptionMail(req.user.local, req.body.option, req.body.origin, req.body.demand);
		res.json({ok: "Mail envoyé"});
	});
};