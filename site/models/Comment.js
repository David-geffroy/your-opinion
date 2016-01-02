var mongoose = require('mongoose');

var CommentModel;
var CommentSchema = new mongoose.Schema();
CommentSchema.add({
	public_part:{
		body:		String,
		author: 	{ type: mongoose.Schema.Types.ObjectId, ref: 'User' },
		link:		String,
		upvotes:  	[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		downvotes:	[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		kind:		String,
		img:		String,
		comments:	[CommentSchema],
		created: 	{type:Date, default: Date.now}
	},
	private_part:{
		appKey: 				String,
		published: 				{type: Boolean, default: false},
		deleted: 				{type: Boolean, default: false},
		validatedByOwner: 		{type: Boolean, default: false},
		deletedByOwner: 		{type: Boolean, default: false},
		denounceFrom: 			[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		validatedFrom: 			[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		deletedFrom: 			[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		ignoredFrom: 			[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
	}
});

CommentSchema.methods.addReply = function(reply, cb) {
	this.update({ $push: { 'public_part.comments': reply }},cb);
};

CommentSchema.methods.setOwnerOk = function(cb) {
	this.private_part.validatedByOwner = true;
	this.private_part.deletedByOwner = false;
	this.save(cb);
};

CommentSchema.methods.setOwnerKo = function(cb) {
	this.private_part.validatedByOwner = false;
	this.private_part.deletedByOwner = true;
	this.save(cb);
};

CommentSchema.methods.setOk = function(user_id, cb) {
	this.private_part.validatedFrom.push(user_id);
	this.save(cb);
};

CommentSchema.methods.setKo = function(user_id, cb) {
	this.private_part.deletedFrom.push(user_id);
	this.save(cb);
};

CommentSchema.methods.setIgnored = function(user_id, cb) {
	this.private_part.ignoredFrom.push(user_id);
	this.save(cb);
};

CommentSchema.methods.setDenounced = function(user_id, cb) {
	this.private_part.denounceFrom.push(user_id);
	this.save(cb);
};

CommentModel = mongoose.model('Comment', CommentSchema);