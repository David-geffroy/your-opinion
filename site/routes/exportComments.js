var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var Article = mongoose.model('Article');

module.exports.getCommentsCSV = function (req, res) {
	function CSVEscape(field) {
		return '"' + String(field || "").replace(/\"/g, '""') + '"';
	}

	var headers = [
		'Link',
		'Author',
		'Body',
		'Upvotes',
		'Downvotes',
		'Created',
		'Kind',
		'Validated By Owner',
		'Deleted By Owner',
		'Validated',
		'Deleted',
		'Denounced',
		'Ignored'
	].map(CSVEscape).join(';');

	function docToCSV(comment) {
		var kind = comment.public_part.kind == 0 ? 'Information' : comment.public_part.kind == 1 ? 'Opinion' : 'Humour';

		return [
			comment.public_part.link,
			comment.public_part.author.local.pseudo,
			comment.public_part.body,
			comment.public_part.upvotes.length,
			comment.public_part.downvotes.length,
			comment.public_part.created.toUTCString(),
			kind,
			comment.private_part.validatedByOwner,
			comment.private_part.deletedByOwner,
			comment.private_part.validatedFrom.length,
			comment.private_part.deletedFrom.length,
			comment.private_part.denounceFrom.length,
			comment.private_part.ignoredFrom.length
		].map(CSVEscape).join(';');
	}

	var started = false;
	function start(response) {
		response.setHeader('Content-disposition', 'attachment; filename=comments.csv');
		response.contentType('csv');
		response.write(headers + '\n');
		started = true;
	}

	Comment.find({"private_part.appKey": req.application.appKey}).populate("public_part.author","local")
	.stream().on('data', function (comment) {
		if (!started) { start(res); }
		res.write(docToCSV(comment) + '\n');
	})
	.on('close', function () {
		res.end();
	})
	.on('error', function (err) {
		res.send(500, {err: err, msg: "Failed to get campaigns from db"});
	});
};

module.exports.getArticlesCSV = function (req, res) {
	function CSVEscape(field) {
		return '"' + String(field || "").replace(/\"/g, '""') + '"';
	}

	var headers = [
		'Link',
		'Question',
		'Rating Type',
		'Response A',
		'Response B',
		'Response C',
		'Response D',
		'Response E',
		'Ratings'
	].map(CSVEscape).join(';');

	function docToCSV(article) {
		var ratings = [];
		var ratingType = "";
		ratingType = article.ratingType == 0 ? 'Stars' : 'Text';
		for (var i = 0; i < article.rating.length; i++) {
			ratings.push(article.rating[i].score)
		}

		return [
			article.link,
			article.question,
			ratingType,
			article.ratingRep.A,
			article.ratingRep.B,
			article.ratingRep.C,
			article.ratingRep.D,
			article.ratingRep.E,
			ratings.toString(),
		].map(CSVEscape).join(';');
	}

	var started = false;
	function start(response) {
		response.setHeader('Content-disposition', 'attachment; filename=articles.csv');
		response.contentType('csv');
		response.write(headers + '\n');
		started = true;
	}

	Article.find({"appId": req.application.appKey})
	.stream()
	.on('data', function (article) {
		if (!started) { start(res); }
		res.write(docToCSV(article) + '\n');
	})
	.on('close', function () {
		res.end();
	})
	.on('error', function (err) {
		res.send(500, {err: err, msg: "Failed to get campaigns from db"});
	});
};