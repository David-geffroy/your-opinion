var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var Application = mongoose.model('Application');
var User = mongoose.model('User');
var Article = mongoose.model('Article');
var Newsletter = mongoose.model('Newsletter');
var util = require('../../util/utils');

module.exports = function(app, passport) {

	app.all('/api/:origin/:appKey/*', function(req, res, next) {
		var origin =  new Buffer(req.params.origin, 'base64');
		var origin =  req.params.origin;
		var domain = origin.replace('http://','').replace('https://','').replace('www.', '').split(/[/?#]/)[0];
		domain = domain.split(":")[0];

		Application.findOne({appKey: req.params.appKey, allowed_domain: domain})
		.exec(function(err, application) {
			if (err) {
				console.log('Erreur dans ALL - "/api/:origin/:appKey/*"');
				next(err);
			} else {
				if(!application) {
					res.json({ko: "Application non trouvée"}, 203);
				} else if (application.deleted) {
					res.json({ko: "Application supprimée"}, 203);
				} else {
					req.isAdminModerator = req.user && application.owner.equals(req.user._id);
					req.app = application;
					req.origin = origin;
					next();
				}
			}
		});
	});

	// RETURN ALL COMMENTS THAT PASSED THE VALIDATION METHOD
	app.get('/api/:origin/:appKey/comments', function(req, res, next) {
		var link = req.origin.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "");
		Comment.find({	'public_part.link': link, 'private_part.appKey': req.params.appKey,
						// Le commentaire doit etre validé par le owner ou alors avoir minimum 2 votes 'Pour' de la communauté.
						$or:[ {'private_part.validatedByOwner': true}, {'private_part.validatedFrom.1': {$exists:true}}] }, { public_part: true })
		.populate("public_part.author","local experiences info").lean()
		.exec(function(err, comments) {
			if(err) {
				console.log('Erreur dans GET - "/api/:origin/:appKey/comments"');
				return next(err);
			}

			comments.forEach(function(c,i){
				comments[i].public_part.downvotes = c.public_part.downvotes.length;
				comments[i].public_part.upvotes = c.public_part.upvotes.length;
			});

			if(req.isAuthenticated()) {
				Comment.count({
					"public_part.author": {$ne:req.user._id},
					"public_part.link":link,
					"private_part.validatedFrom":{$ne:req.user._id},
					"private_part.deletedFrom":{$ne:req.user._id},
					"private_part.denounceFrom.user":{$ne:req.user._id},
					"private_part.ignoredFrom":{$ne:req.user._id}
				}, function(countErr,count) {
					res.json({comments:comments,isAdminModerator:req.isAdminModerator,moderateCount:count});
				});
			} else {
				res.json({comments:comments,isAdminModerator:req.isAdminModerator});
			}
		});
	});

	//PUBLISH NEW ANONYMOUS COMMENT
	app.post('/api/:origin/:appKey/anonComments', function(req, res, next) {
		var link = req.body.link.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "").replace(/\?.*/, "");
		var comment = new Comment({private_part:{appKey:req.params.appKey},public_part:{body:req.body.body, kind:req.body.kind, link: link, img: req.body.img}});

		User.findOne({'local.pseudo': "Anonyme"}, function(err, user) {
			comment.public_part.author = user._id;
		})
		comment.private_part.published = true;

		comment.save(function(err, comment) {
			if(err) {
				console.log('Erreur dans POST - "/api/:origin/:appKey/comments"');
				return next(err);
			}
			res.json(comment);
		});
	});

	// CREATE IF DOESN'T EXIST AND RETURN THE ARTICLE.
	app.get('/api/:origin/:appKey/article', function(req, res, next) {
		var origin = req.origin.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "");
		Article.findOne({link: origin, appId: req.params.appKey})
		.populate('rating.user')
		.exec(function(err, article) {
			if (!article) {
				article = new Article({link: origin, appId:req.params.appKey});
				article.save(function(err, article) {
					res.json({article: article});
				});
			} else {
				res.json({article: article});
			}
		});
	});

	// NEED TO BE AUTH FOR NEXT ACTIONS
	app.all("/api/*",function(req,res,next){
		if(req.isAuthenticated()) {
			req.user.isBanned = req.app.b_emails.indexOf(req.user.local.email) === -1 ? false : true;
			return next();
		} else {
			res.json({ko: "Non connecté"}, 204);
		}
	});

	// RETURN APPLICATION INFOS FOR ADMINISTRATION
	app.get('/api/:origin/:appKey/app', function(req, res, next) {
		if (req.app.owner.equals(req.user._id))
			res.json({app: req.app});
		else
			res.status(304).json({ko: "Not Authorized"});
	});

	//PUBLISH NEW COMMENT
	app.post('/api/:origin/:appKey/comments', function(req, res, next) {
		if (req.isBanned)
			res.json({ko: "User banned"}, 204);

		var link = req.body.link.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "");
		var comment = new Comment({private_part:{appKey:req.params.appKey},public_part:{body:req.body.body, kind:req.body.kind, link: link, img: req.body.img}});

		if(req.user) {
			comment.public_part.author = req.user._id;
			comment.private_part.published = true;
			if (req.isAdminModerator)
				comment.private_part.validatedByOwner = true;
		} else {
			console.log("No User Found for some reasons.");
		}
		comment.save(function(err, comment) {
			if(err) {
				console.log('Erreur dans POST - "/api/:origin/:appKey/comments"');
				return next(err);
			}
			User.findById(req.app.owner, function(err, owner) {
				if (err)
					console.log(err);
				util.sendNewCommentMail(owner.local.email, req.user.local, comment.public_part.link);
			});

			Comment.count({
				"public_part.author": req.user._id,
				"private_part.appKey": req.params.appKey
			}, function(countErr,count) {
				if (countErr) {
					return next(countErr);
				}
				if (count < 2) {
					// +1 en authorCredit pour chaque commentaire sur un site différent.
					User.update({_id:comment.public_part.author},{$inc:{authorCredit:1}}).exec();
					// Ajoute le site dans la newletter
					var newsletter = new Newsletter({user: req.user._id, domain: req.app.allowed_domain, send: false});
					newsletter.save(function(err, newsletter) {
						if (err)
							return next(err);
					});
				}
				// Credibility Changes
				if (req.body.body.length > 139 && req.body.body.length < 501)
					User.update({_id:comment.public_part.author},{$inc:{authorCredit:1}}).exec();
				if (req.body.facebook)
					User.update({_id:comment.public_part.author},{$inc:{authorCredit:1}}).exec();

				User.update({_id:comment.public_part.author},{$inc:{authorCredit:1}}).exec();
				res.json(comment);
			});
		});
	});

	// PARAMETER TO FIND A COMMENT BY ID
	app.param('comment', function(req, res, next, id) {
		Comment.findById(req.params.comment).exec( function(err, comment) {
			if (err) { return next(err); }
			if (!comment) { return next(new Error("Cannot find comment")); }

			req.comment = comment;
			return next();
		});
	});

	app.delete('/api/:origin/:appKey/comments/:comment', function(req, res, next) {
		if (req.comment.public_part.author == req.user.id) {

			// Credibility Changes
			User.update({_id:comment.public_part.author},{$inc:{authorCredit:2}}).exec();

			Comment.update({_id: req.comment._id}, {deleted: true}).exec();
		}
	});

	// GET A COMMENT BY ID
	app.get('/api/:origin/:appKey/comments/:comment', function(req, res, next) {
		res.json(req.comment);
	});

	// UPVOTE
	app.put('/api/:origin/:appKey/comments/:comment/upvote', function(req, res, next) {

		if (req.isBanned)
			return next(new Error("User banned"));

		var downvoteCount = req.comment.public_part.downvotes.length;
		var upvoteCount = req.comment.public_part.upvotes.length;
		var alreadyDownvoted = false;

		if(req.comment.public_part.downvotes.indexOf(req.user._id)!=-1){
			alreadyDownvoted = true;
		}

		Comment.update({_id:req.comment._id,"public_part.author": {$ne:req.user._id},"public_part.upvotes":{$ne:req.user._id}},
			{$push:{"public_part.upvotes":req.user._id},
			$pull:{"public_part.downvotes":req.user._id}}, function(err,count){
				if(err) {
					console.log('Erreur dans PUT - "/api/:origin/:appKey/comments/:comment/upvote"');
					return next(err);
				}
				if(count.nModified == 1) {
					upvoteCount += 1;
					if(alreadyDownvoted)
						downvoteCount -= 1;
				}
				res.json({upvotes:upvoteCount, downvotes:downvoteCount})
			});
	});

	// DOWNVOTE
	app.put('/api/:origin/:appKey/comments/:comment/downvote', function(req, res, next) {

		if (req.isBanned)
			return next(new Error("User banned"));

		var downvoteCount = req.comment.public_part.downvotes.length;
		var upvoteCount = req.comment.public_part.upvotes.length;
		var alreadyUpvoted = false;

		if(req.comment.public_part.upvotes.indexOf(req.user._id)!=-1){
			alreadyUpvoted = true;
		}
		Comment.update({_id: req.comment._id,"public_part.author": {$ne:req.user._id},"public_part.downvotes":{$ne:req.user._id}},
			{$push:{"public_part.downvotes":req.user._id},
			$pull:{"public_part.upvotes":req.user._id}},function(err,count){
				if(err) {
					console.log('Erreur dans PUT - "/api/:origin/:appKey/comments/:comment/downvote"');
					return next(err);
				}
				if (count.nModified == 1) {
					downvoteCount+=1;
					if(alreadyUpvoted)
						upvoteCount-=1;
				}
				res.json({upvotes:upvoteCount,downvotes:downvoteCount});
			});
	});

	// DENONCE A COMMENT
	app.post('/api/:origin/:appKey/comments/:comment/denounce', function(req, res, next) {
		if (req.isBanned)
			return next(new Error("User banned"));
		if (req.comment.private_part.denounceFrom.indexOf(req.user._id) != -1)
			res.json({ko: "Vous avez déjà dénoncé ce commentaire."});
		else
			req.comment.setDenounced(req.user._id, function(err) {
				if (err) return next(err);
				res.json({ok: "Le commentaire à bien été signalé."});
			});
	});

	// VOTE FOR ARTICLE
	app.put('/api/:origin/:appKey/article/rate', function(req, res, next) {
		var origin = req.origin.replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "");
		Article.update({link: origin, 'rating.user': {$ne:req.user._id}},
		{$push:{'rating': {'user': req.user._id, 'score': req.body.rate}}},
		function(err, count) {
			if (count.n == 0) {
				res.json({ok: "Vous avez déjà voté."});
			} else {
				User.update({_id:req.user._id},{$inc:{authorCredit:1}}).exec();
				res.json({ok: "A voté !"});
			}
		});
	});

	// POST A REPLY
	app.post('/api/:origin/:appKey/comments/:comment/reply', function(req, res, next) {
		if (req.isBanned)
			return next(new Error("User banned"));

		var reply = new Comment({public_part:req.body});
		req.comment.addReply(reply,function(err, comment){
			if(err) {
				console.log('Erreur dans POST - "/api/:origin/:appKey/comments/:comment/reply"');
				return next(err);
			}

			res.json(comment.public_part);
		});
	});
};
