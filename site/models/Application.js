var mongoose = require('mongoose');

var appSchema = mongoose.Schema({
	name			: String,
	allowed_domain	: String,
	appKey			: String,
	owner			: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	roles			:[{
		user			:{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		role			:{type:String,default:"admin"}
	}],
	b_emails		: [String],
	b_ips			: [String],
	b_words			: [String],
	deleted			: {type: Boolean, default: 'false'}
});

// ARTICLES FUNCTIONS
appSchema.methods.addArticle = function(link, cb) {
	this.update({$push: { 'articles': { 'link': link}}}, cb)
}
appSchema.methods.addComment = function(comment, cb) {

}
appSchema.methods.addRating = function( user, score, cb) {

}
appSchema.methods.editRating = function( user, score, cb) {

}

// ROLES FUNCTIONS
appSchema.methods.addRole = function(user, role, cb) {
	this.update({ $push:  { roles: {user:user._id, role:'admin'}}}, cb);
};
appSchema.methods.deleteRole = function(user, cb) {
	this.update({ $pull: {roles: {user : user._id}}}, cb);
};

// BLACKLISTING FUNCTIONS
appSchema.methods.addBEmail = function(email, cb) {
	this.update({$push: {b_emails: email}}, cb);
};
appSchema.methods.addBIP = function(ip, cb) {
	this.update({$push: {b_ips: ip}}, cb);
};
appSchema.methods.addBWord = function(word, cb) {
	this.update({$push: {b_words: word}}, cb);
};
appSchema.methods.deleteBEmail = function(email, cb) {
	this.update({$pull: {b_emails: email}}, cb);
};
appSchema.methods.deleteBIP = function(ip, cb) {
	this.update({$pull: {b_ips: ip}}, cb);
};
appSchema.methods.deleteBWord = function(word, cb) {
	this.update({$pull: {b_words: word}}, cb);
};

module.exports = mongoose.model('Application', appSchema);
