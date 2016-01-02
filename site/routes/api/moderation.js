var express = require('express');
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var User = mongoose.model('User');

module.exports = function(app, passport) {

	// NEED TO BE AUTH FOR NEXT ACTIONS	
	app.all("/api/*",function(req,res,next){
		if(req.isAuthenticated()){
			return next();
		}
		else{
			res.json({ko: "Not Connected"}, 204);
		}
	});

	app.get('/api/:origin/:appKey/moderation/random', function(req, res) {

		if (!req.user.tutoriel) {
			res.json({tutoriel: 'true'});
		}

		Comment.find({"public_part.author": {$ne:req.user._id},
			"private_part.deleted": false,
			"private_part.denounceFrom.user": {$ne:req.user._id},
			"private_part.validatedFrom": {$ne:req.user._id},
			"private_part.deletedFrom": {$ne:req.user._id},
			"private_part.ignoredFrom": {$ne:req.user._id},
			"private_part.validatedByOwner": false,
			"private_part.deletedByOwner": false
		}).exec(function(err, comments) {
			Math.floor(Math.random() * (comments.length + 1));
			var rand = Math.floor(Math.random() * comments.length);
			res.json({comment:comments[rand]});
		});
	});

	app.get('/tutoriel', function(req, res, next) {
		User.update({_id:req.user._id},{$inc:{modCredit:5},$set:{tutoriel:true}}).exec();
		res.json({ok: true});
	});

	app.put('/api/:origin/:appKey/moderation/:action/:comment', function(req, res, next) {
		Comment.find({_id:req.comment._id,
			"public_part.author": {$ne:req.user._id},
			"private_part.deleted":false,
			"private_part.denounceFrom.user":{$ne:req.user._id},
			"private_part.validatedFrom":{$ne:req.user._id},
			"private_part.deletedFrom":{$ne:req.user._id},
			"private_part.ignoredFrom":{$ne:req.user._id}}, {_id: 1}).limit(1)
		.exec(function(err,commentFind) {
			if (err) { return next(err); }
			if (commentFind.length==0) { 
				return next(new Error("comment already flagged")); 
			} else
			return next();
		});
	});

	app.put('/api/:origin/:appKey/moderation/ok/:comment', function(req, res, next) {

		var author = req.comment.public_part.author;
		var validatedFrom = req.comment.private_part.validatedFrom;
		var deletedFrom = req.comment.private_part.deletedFrom;
		var denounceFromUsers = req.comment.private_part.denounceFrom;
		var denounceFrom = [];
		denounceFromUsers.forEach(function(du) {
			denounceFrom.push(du.user);
		});
		req.comment.setOk(req.user._id,function(err, comment, published) {
			if(err){ return next(err); }
			// Credibility Changes
			User.update({_id:author},{$inc:{authorCredit:2}}).exec();
			User.update({_id:{$in:validatedFrom}},{$inc:{modCredit:1}}).exec();
			User.update({_id:{$in:deletedFrom}},{$inc:{modCredit:-2}}).exec();
			User.update({_id:{$in:denounceFrom}},{$inc:{modCredit:-3}}).exec();
			validatedFrom.push(req.user._id);
			res.json({ok:true});
		});
	});

	app.put('/api/:origin/:appKey/moderation/ko/:comment', function(req, res, next) {
		var author = req.comment.public_part.author;
		var validatedFrom = req.comment.private_part.validatedFrom;
		var deletedFrom = req.comment.private_part.deletedFrom;
		var denounceFromUsers = req.comment.private_part.denounceFrom;
		var denounceFrom = [];
		denounceFromUsers.forEach(function(du){
			denounceFrom.push(du.user);
		})
		req.comment.setKo(req.user._id, function(err, comment, deleted) {
			if(err){ return next(err); }
			// Credibility Changes
			User.update({_id:author},{$inc:{authorCredit:-4}}).exec();
			User.update({_id:{$in:validatedFrom}},{$inc:{modCredit:-2}}).exec();
			User.update({_id:{$in:deletedFrom}},{$inc:{modCredit:1}}).exec();
			User.update({_id:{$in:denounceFrom}},{$inc:{modCredit:1}}).exec();
			deletedFrom.push(req.user._id);
			res.json({ok:true});
		});
	});

	app.put('/api/:origin/:appKey/moderation/pass/:comment', function(req, res, next) {
		req.comment.setIgnored(req.user._id,function(err, comment) {
			if(err){ return next(err); }
			res.json({ok:true});
		});
	});
};
