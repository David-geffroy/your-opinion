var mongoose = require('mongoose');

var newsletterSchema = mongoose.Schema({
	user: 	{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	domain: String,
	send:	Boolean
});

module.exports = mongoose.model('Newsletter', newsletterSchema);
