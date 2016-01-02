var mongoose = require('mongoose');

var articleSchema = mongoose.Schema({
	link			: {type: String},
	appId			: {type: String},
	comments		: [{type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}],
	question		: {type: String, default: "Que pensez-vous de l'article ?"},
	ratingType		: {type: Number, default: 0},
	ratingRep		: {
		A			: {type: String, default: 'Pour'},
		B			: {type: String, default: 'Plutôt pour'},
		C			: {type: String, default: 'Sans avis'},
		D			: {type: String, default: 'Plutôt contre'},
		E			: {type: String, default: 'Contre'}
	},
	rating			: [{
		user			: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
		score			: {type: Number, default: 0}
	}]
});

module.exports = mongoose.model('Article', articleSchema);