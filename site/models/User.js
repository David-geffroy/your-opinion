var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

var userSchema = mongoose.Schema({
	local		: {
		pseudo		: String,
		email		: String,
		password	: String,
	},
	facebook	: {
		id			: String,
		token		: String,
		email		: String,
		name		: String,
		first_name	: String,
		last_name	: String,
		birthday	: String,
		gender		: String,
		link		: String,
		verified	: {type:Boolean, default:false}
	},
	twitter		: {
		id			: String,
		token		: String,
		displayName	: String,
		username	: String,
		email		: String,
		verified	: {type:Boolean, default:false}
	},
	google		: {
		id			: String,
		token		: String,
		email		: String,
		name		: String,
		first_name	: String,
		last_name	: String,
		birthday	: String,
		gender		: String,
		link		: String,
		verified	: {type:Boolean, default:false}
	},
	experiences		: [String],
	authorCredit	: {type:Number, default: 0},
	modCredit		: {type:Number, default: 0},
	tutoriel		: {type: Boolean, default: false},
	info			: {
		pseudo			: {type:String},
		gender			: {type:String, default:''},
		first_name		: {type:String, default:''},
		last_name		: {type:String, default:''},
		birthday		: {type:String, default:''},
		phone			: {type:String, default:''},
		language		: {type:String, default:''},
		job				: {type:String, default:''},
		hobbies			: {type:String, default:''},
		summary			: {type:String, default:''},
		avatar			: {
			media		: {type: String, default:'default'},
			link		: {type: String, default:'/images/avatars/default.png'}
		}
	},
	validation		: {
		mail_verified: {type:Boolean,default:false},
		mail_sent: {type:Boolean,default:false},
		phone_verified: {type:Boolean,default:false},
		token: String
	},
	created: {type: Date, default: Date.now}
});

// methods ======================
// generating a hash
userSchema.methods.generateHash = function(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
	return bcrypt.compareSync(password, this.local.password);
};

userSchema.methods.generateValidationToken = function(cb) {
	var user = this;
	require('crypto').randomBytes(64, function(ex, buf) {
		user.validation.token = buf.toString('hex');
		user.save(function(er,res){
			cb.call(user,user.validation.token);
		});
	});
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
