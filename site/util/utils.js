var nodemailer = require('nodemailer');

var sendWithNodemailer = function(mailOptions) {
	var transporter = nodemailer.createTransport({
	    host: 'smtp.sendgrid.net',
	    port: 2525,
	    auth: {
	        user: 'wiy-opinion',
	        pass: 'romain88'
	    }
	});

	transporter.sendMail(mailOptions, function(error, info) {
	    if(error) {
	        console.log(error);
	    }
	    console.log('Message sent: ' + info.response);
	});
}

exports.sendActivationMail = function(email, token) {
	var mailOptions = {
	    from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
	    to: email,
	    subject: 'Activation de votre compte What is Your OPINION',
	    html: '<p style="margin: 20px 0;">Merci d\'avoir créé votre compte sur What is your opinion !</p><p>Veuillez cliquer sur ce lien pour finaliser l\'inscription :</p><br><a href="http://what-is-your-opinion.com/account/validateAccount/' + token + '" style="color: #6E5BAA; margin: 20px 0;">Cliquez ici !!!</a><br><p style="margin: 20px 0;">L\'équipe <a href="http://what-is-your-opinion.com" style="color: #6E5BAA;">What is your opinion</a></p>'
	};

	sendWithNodemailer(mailOptions);
};

exports.sendOptionMail = function(user, option, location, demand) {

	var demand = demand ? '<p style="margin: 20px 0;">La demande particulière : </p><p>' + demand + '</p>' : '';

	var mailOptions = {
	    from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
	    to: 'dav.geffroy@gmail.com',
	    replyTo: user.email,
	    subject: user.pseudo + ' à choisi l\'option ' + option,
	    html: demand + '</p><br><p>Fait depuis ' + location + '</p>'
	};

	sendWithNodemailer(mailOptions);
};

exports.sendTwitterMail = function() {
	var mailOptions = {
		from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
		to: 'dav.geffroy@gmail.com',
		subject: 'Quelqu\'un veux se connecter avec Twitter',
		text: 'Et ouais. 1 de plus'
	}

	sendWithNodemailer(mailOptions);
};

exports.sendNewCommentMail = function(admin, user, link) {
	var mailOptions = {
		from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
		to: admin,
		subject: user.pseudo + ' a posté un nouveau commentaire',
		html: user.pseudo + ' a posté un commentaire sur <a href="' + link + '"> cet article</a> Il est en attente de modération de votre part ou par la communauté.'
	}
	sendWithNodemailer(mailOptions);
};

exports.sendCommentValidMail = function(user, comment, validation, community) {
	var isVal = validation == true ? 'a été validé': 'a été modéré';
	var who = community == true ? 'par la communauté' : 'le propietaire de l\'application';
	var mailOptions = {
		from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
		to: user.email,
		subject: 'Votre commentaire ' + isVal,
		html: 'Votre commentaire :<br>' + comment + '<br>' + isVal + ' ' + who
	}
	sendWithNodemailer(mailOptions);
}

exports.sendPasswordInfo = function(user, newPassword) {
	var facebook = user.facebook.verified ? 'avez' : 'n\'avez pas';
	var google = user.google.verified ? 'avez' : 'n\'avez pas';
	var mdp = user.local.password ? 'changer' : 'définir';

	var mailOptions = {
		from: 'Admin What is your opinion <contact@what-is-your-opinion.com>',
		to: user.local.email,
		subject: 'Récupération de mot de passe',
		html: 'Bonjour ' + user.local.pseudo + ',<br>Votre nouveau mot de passe est : ' + newPassword + '<br>Vous devriez vous connecter afin de le changer.<br>Vous ' + facebook + ' synchronisé votre compte facebook.<br>' +
				'Vous ' + google + ' synchronisé votre compte Google+'
	};
	sendWithNodemailer(mailOptions);
}