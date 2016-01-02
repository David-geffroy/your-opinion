/* GLOBAL FUNCTION - CLOSE AUTHfRAME WINDOW WHEN DONE */
function onSSOConnected() {
	authFrame.close();
};

/* APPLICATION */
var ciidApp = angular.module('ciidcomment', ['ngRoute', 'ui.bootstrap', 'ngSanitize', '720kb.socialshare'])
.config(function($routeProvider, $locationProvider) {

	$routeProvider.when("/comments", {
		templateUrl: '/api/partials/comments.html'
	}).when("/admin", {
		templateUrl: '/api/partials/admin.html',
	});

}).run(function($rootScope, $location) {
	$rootScope.token = $location.search()['token'];
	$rootScope.origin = $location.search()['loc'];
});

var connectModalInstance;

/* CONTROLLERS */

/* COMMENTS CONTROLLER */
ciidApp.controller('CommentsCtrl', function($scope, $rootScope, $http, $location, $window, $anchorScroll, $filter, fileReader) {

	// VARIABLES
	$scope.comments = [];
	$scope.showMax = 10;
	$scope.newComment = {body:'', kind:1};
	$scope.kinds = [
		{ name:"Information", value:0, icon: "fa-info-circle" },
		{ name:"Opinion", value:1, icon: "fa-bullhorn" },
		{ name:"Humour", value:2, icon: "fa-smile-o" }
	];

	$scope.showComments = [true, true, true];
	$scope.share = {
		caption: "Commentaire",
		description: "",
		text: $window.document.title,
		url: $rootScope.origin
	}

	// GETTING INFOS FROM THE DATABASE
	$http.get('/api/me')
	.success(function(data, status) {
		if (status == 200)
			$rootScope.user = data.user;
	});

	$http.get('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/comments')
	.success(function(data, status) {
		if (status == 203) {
			$scope.badToken = data.ko;
			return;
		}

		var orderBy = $filter('orderBy');
		$scope.comments = orderBy(data.comments, "-public_part.created", false);


		$scope.isAdminModerator = data.isAdminModerator;
		loadArticle();
	});


	var loadArticle = function() {
		$http.get('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/article')
		.success(function(data, status) {
			if (status === 201) {
				loadArticle();
			} else {
				$scope.article = data.article;
				calculateScore();
			}
		}).error(function(data) {
			console.log(data);
		});
	}

	var calculateScore = function() {
		$scope.rateInit = 0;
		for (r in $scope.article.rating)
			$scope.rateInit += $scope.article.rating[r].score / $scope.article.rating.length;

		$scope.scores = {'a': 0, 'b': 0, 'c': 0, 'd': 0, 'e':0, 'total': 0};
		for (r in $scope.article.rating) {
			if ($scope.article.rating[r].score == 5)
				$scope.scores.a += 1;
			if ($scope.article.rating[r].score == 4)
				$scope.scores.b += 1;
			if ($scope.article.rating[r].score == 3)
				$scope.scores.c += 1;
			if ($scope.article.rating[r].score == 2)
				$scope.scores.d += 1;
			if ($scope.article.rating[r].score == 1)
				$scope.scores.e += 1;
			$scope.scores.total += 1;
		}
	}

	$scope.addComment = function() {
		if (!$scope.validComment) {
			$scope.errorComment = "Votre commentaire est vide !";
			return;
		}

		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/comments',
			{body: $scope.newComment.body, kind: $scope.newComment.kind, img: $scope.newComment.img, link: $rootScope.origin, facebook: $scope.newComment.facebook})
		.success(function(data, status, headers, config) {
			$scope.newComment = {body:'', kind:0};
			alert("Votre commentaire a bien été posté, il sera modéré sous peu.");
		})
		.error(function(data, status, headers, config) {
			console.log(data);
			console.log(status);
		});
	};

	$scope.addAnonComment = function() {
		if (!$scope.validComment) {
			$scope.errorComment = "Votre commentaire est vide !";
			return;
		}
		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/anonComments',
			{body: $scope.newComment.body, kind: $scope.newComment.kind, img: $scope.newComment.img, link: $rootScope.origin, facebook: $scope.newComment.facebook})
		.success(function(data, status, headers, config) {
			$scope.newComment = {body:'', kind:0};
			alert("Votre commentaire a bien été posté, il sera modéré sous peu.");
		}).error(function(data, status, headers, config) {
			console.log(data);
			console.log(status);
		})
	}

	$scope.editComment = function() {
		// TODO
	};

	$scope.deleteComment = function() {
		// TODO
	};

	$scope.upvoteComment = function(commentID, arrayID) {
		if (!$rootScope.user)
			return;
		$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/comments/' + commentID + '/upvote')
		.success(function(data) {
			$scope.comments[arrayID].public_part.upvotes = data.upvotes;
			$scope.comments[arrayID].public_part.downvotes = data.downvotes;
		});
	};

	$scope.downvoteComment = function(commentID, arrayID) {
		if (!$rootScope.user)
			return;
		$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/comments/' + commentID + '/downvote')
		.success(function(data) {
			$scope.comments[arrayID].public_part.upvotes = data.upvotes;
			$scope.comments[arrayID].public_part.downvotes = data.downvotes;
		});
	};

	$scope.signalComment = function(commentID, arrayID, reason) {
		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/comments/' + commentID + '/denounce', {user: $rootScope.user, reason: $scope.reason})
		.success(function(data) {
			if (data.ko)
				alert(data.ko);
			if (data.ok)
				alert(data.ok);
		});
	};

	$scope.rateArticle = function(rate) {
		if (!($rootScope.user))
			$scope.openConnectModal(function() {
				$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/article/rate', {rate: rate})
				.success(function(data, status) {
					if (status == 200)
						alert(data.ok);
					$window.location.reload();
				});
			});
		else
			$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/article/rate', {rate: rate})
			.success(function(data, status) {
				if (status == 200)
					alert(data.ok);
				$window.location.reload();
			});
	}

	$scope.showMore = function() {
		$scope.showMax += 10;
	}

	$scope.getPersonRate = function(pseudo) {
		if ($scope.article)  {
			for (var i = 0; i < $scope.article.rating.length; i++) {
				if ($scope.article.rating[i].user.local.pseudo == pseudo) {
					return $scope.article.rating[i].score;
				}
			}
		}
		return 0;
	}

	// SCROLL TO ID
	$scope.goToId = function(id) {
		$location.hash(id);
		$anchorScroll();
	};

	// USELESS FOR NOW
	$scope.onFileSelect = function ($files, isCover) {
		console.log("onFileSelect");
		for (var i = 0; i < $files.length; i++) {
			(function (index) {
				var $file = $files[index];
				var upload =  $upload.upload({
					url: "/images/store_img", // webapi url
					method: "POST",
					data: { fileUploadObj: $scope.fileUploadObj },
					file: $file
				}).progress(function(evt) {
					$scope.progress = parseInt(100.0 * evt.loaded / evt.total);
				});
				console.log($file.name + 'percent: ' + parseInt(100.0 * evt.loaded / evt.total));
			}).success(function (data, status, headers, config) {
			}).error(function (data, status, headers, config) {
				console.log(data);
			});
		}(i);
	}

	// CALLBACK TO ADD A PHOTO
	$scope.onNewFile = function(file) {
		$scope.imageCover = { progress:0, name: file.name };
		fileReader.readAsDataUrl(file, $scope)
		.then(function(result) {
			$scope.newComment.img = result;
		});
	};

	// FUNCTION TO FOCUS ON INPUT FIELD
	$scope.focusId = function(id) {
		$window.document.getElementById(id).focus();
	}

	/* WATCHERS : CHECK IF COMMENT IS VALID */
	$scope.$watch('newComment.body', function(oldValue, newValue) {
		if (oldValue.length < 1)
			$scope.validComment = false;
		else {
			$scope.validComment = true;
			delete $scope.erroComment;
		}

		if ($rootScope.user)
			$scope.share.description = $rootScope.user.local.pseudo + " a écrit un commentaire : " + oldValue;
	});
});

// MODERATION CONTROLLER
ciidApp.controller('ModerationCtrl', function($scope, $rootScope, $http) {

	// VARIABLES
	$scope.currentComment = {};
	$scope.tutoriels = [
	{body: "JE TROUVE CA INADMISIBLE QUE L'ON PUISSE FAIRE UN ARTICLE SUR CE GENRE DE CHOSES DE NOS JOURS, LA JEUNE GENERATION N'EST CAPABLE DE RIEN, HEUREUSEMENT DE MON TEMPS LES GENS BOSSAIENT DUR AU LIEU DE FAIRE SA FEIGNASSE ET REGARDER DES SERIES TELE",
	help: "Afin de faciliter la lecture sur le site il est préférable d'avoir une syntaxe correcte. Il n'est pas néccéssaire de mettre des majuscules partout pour se faire entendre, mais plutôt d'avoir un discours intélligible.", answer: false},
	{body: "C'est vraiment un article de merde. Le mec qui a écrit ça est un sacré attardé. Et les gens qui commentent sont encore pire. Apple est une entreprise très saine qui valorise les droits de l'homme, à mort Windows et aux chiottes Linux.",
	help: "Les insultes et incitation à la haine ne sont et ne seront pas tolérées.", answer: false},
	{body: "Tant sur le fond que sur la forme, je ne suis pas du tout d'accord avc vous. Les échanges entre Abed et Troy sont riches, fins et sans équivoque les meilleurs dialogues toute sitcom confondues et ce même après la saison 3.",
	help: "Il ne s'agit pas ici de moderer en fonction de son avis mais bien en fonction des règles de la communauté.", answer: true},
	];

	// FUNCTION TO GET A COMMENT TO MODERATE
	$scope.getRandomComment = function() {
		$http.get('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/moderation/random')
		.success(function(data, status) {
			if (status === 204) {
				$scope.notConnected = true;
			} else if (status == 203) {
				$scope.badToken = data.ko;
			} else {
				$scope.currentComment = data.comment;
			}
			$scope.tutoriel = data.tutoriel;
			$scope.currentTuto = 0;
		});
	};

	// FUNCTION TO MODERATE COMMENTS
	$scope.setComment = function(action) {
		if (action === "OK") {
			$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/moderation/ok/' + $scope.currentComment._id)
			.success(function(data) {
			});
		} else if (action === "KO") {
			$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/moderation/ko/' + $scope.currentComment._id)
			.success(function(data) {
			});
		} else {
			$http.put('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/moderation/pass/' + $scope.currentComment._id)
			.success(function(data) {
			});
		}
		$scope.getRandomComment();
	};

	// FUNCTION TO ADVANCE IN TUTORIEL
	$scope.setTutoComment = function(action) {

		if ((action === "OK" && !$scope.tutoriels[$scope.currentTuto].answer) || (action === "KO" && $scope.tutoriels[$scope.currentTuto].answer) || action === 'HELP') {
			$scope.tutoriels[$scope.currentTuto].doHelp = true;
			return;
		}

		if ($scope.currentTuto < 2) {
			$scope.currentTuto += 1;
		} else {
			if ($scope.tutoriel)
				$http.get('/tutoriel')
				.success(function (data) {
					$scope.getRandomComment();
					alert('Félicitations ! Vous avez complété le tutoriel.\nVous avez gagné de la réputation.');
				});
			else
				$scope.currentTuto = 0;
		}
	};

	// Automatically get a comment in moderation at the beginning
	$scope.getRandomComment();
});

// CONNECTION CONTROLLER
ciidApp.controller('ConnectCtrl', function($scope, $http, $modalInstance) {

	$scope.connectLocal = function() {
		$http.post("/api/auth/login", {email: $scope.email, password: $scope.password})
		.success(function(data, status, headers, config) {
			$modalInstance.close(true);
		})
		.error(function(data, status, headers, config) {
			console.log(data);
		});
	}

	$scope.createAccount = function() {
		$http.post('/api/auth/signup', {pseudo: $scope.pseudo, email:$scope.email, password: $scope.password})
		.success(function(data, status) {
			$modalInstance.close(true);
			alert("Un email de confirmation vous a été envoyé, veuillez d'abord confirmer votre mail puis vous connecter.");
		}).error(function(data, status) {
			console.log(data);
		});
	}

	// CHECK REGISTRATION FORM VALIDITY
	$scope.isRegisterOk = function() {
		if ($scope.pseudo && $scope.email && $scope.password && $scope.password === $scope.confirmPassword)
			return true;
		return false;
	}

	$scope.connectFacebook = function() {
		authFrame = window.open('/api/auth/facebook','fbconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		authFrame.onunload = function(){
			$modalInstance.close(true);
		}
	}

	$scope.connectGoogle = function() {
		authFrame = window.open('/api/auth/google','googleconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		authFrame.onunload = function() {
			$modalInstance.close(true);
		}
	}

	// A VOIR LORSQUE TWITTER DIVULGERA LES EMAILS
/*	$scope.connectTwitter = function() {
		authFrame = window.open('/auth/twitter','twitterconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		authFrame.onunload = function(){
			$modalInstance.close(true);
		}
	}*/

	// RENVOIE UN NOUVEAU MOT DE PASSE
	$scope.doResendPassword = function() {
		$http.post('/account/validateAccount/sendPasswordMail', {email: $scope.email})
		.success(function(data) {
			alert(data.ok);
		})
	}
});

// GLOBAL CONTROLLER
ciidApp.controller('ApiCtrl', function($scope, $rootScope, $modal, $http, $window, $anchorScroll) {

	// VARIABLES
	$scope.url = {token: $rootScope.token, loc: $rootScope.origin}

	$http.get('/api/me').success(function(data) {
		$rootScope.user = data.user;
	});

	// OUVRE UNE PROMESSE MODALE DE CONNEXION
	$scope.openConnectModal = function(callback) {
		$anchorScroll();
		connectModalInstance = $modal.open({
			templateUrl: '/api/modals/connect.html',
			controller: 'ConnectCtrl'
		});

		connectModalInstance.result.then(function(status) {
			if (status) {
				$http.get('/api/me').success(function(data) {
					$rootScope.user = data.user;
					if (callback) {
						callback();
						$window.location.reload();
					}
				});
			}
		});
	};

	$scope.logout = function() {
		$http.get('/api/auth/logout')
		.success(function(data, status) {
			delete $rootScope.user;
			$window.location.reload();
		}).error(function(data, status) {
			console.log(data);
		});
	};

	// FONCTIONS POUR LES DROPDOWNS MENUS
	$scope.toggled = function(open) {
	};

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};

	$scope.status = {
		isopen: false
	};

	$scope.toggleDropdown = function($event) {
		$event.preventDefault();
		$event.stopPropagation();
		$scope.status.isopen = !$scope.status.isopen;
	};
});

/* DIRECTIVES */

// IMPORT D'IMAGES
ciidApp.directive("ngFileSelect", function() {
	return {
		link: function($scope, element) {
			$scope.files = [];
			element.bind("change", function(e) {
				var files = (e.srcElement || e.target).files;
				var id = (e.srcElement || e.target).id;
				$scope.onNewFile(files[0]);
			});
		}
	}
});

// ZONE DE TEXTE MODULABLE : <DIV> EDITABLE
ciidApp.directive('contenteditable', function () {
	return {
		restrict: 'A',
		require: '?ngModel',
		link: function (scope, element, attrs, ngModel) {
			if (!ngModel) return;
			ngModel.$render = function () {
				element.html(ngModel.$viewValue || '');
			};
			element.on('blur keyup change', function () {
				scope.$apply(readViewText);
			});
			function readViewText() {
				var html = element.html();
				html = html.replace(/<(?!br\s*\/?)[^>]+>/ig, '').replace(/&nbsp;/g, '');
				ngModel.$setViewValue(html);
			}
		}
	};
});

/* FACTORY */
// FILEREADER EST LA FACTORY POUR L'IMPORT D'IMAGES
ciidApp.factory('fileReader', function ($q, $log) {
	var onLoad = function(reader, deferred, scope) {
		return function () {
			scope.$apply(function () {
				deferred.resolve(reader.result);
			});
		};
	};

	var onError = function (reader, deferred, scope) {
		return function () {
			scope.$apply(function () {
				deferred.reject(reader.result);
			});
		};
	};

	var onProgress = function(reader, scope) {
		return function (event) {
			scope.$broadcast("fileProgress", {
				total: event.total,
				loaded: event.loaded
			});
		};
	};

	var getReader = function(deferred, scope) {
		var reader = new FileReader();
		reader.onload = onLoad(reader, deferred, scope);
		reader.onerror = onError(reader, deferred, scope);
		reader.onprogress = onProgress(reader, scope);
		return reader;
	};

	var readAsDataURL = function (file, scope) {
		var deferred = $q.defer();

		var reader = getReader(deferred, scope);
		reader.readAsDataURL(file);

		return deferred.promise;
	};

	return {
		readAsDataUrl: readAsDataURL
	};
});

/* FILTERS */
ciidApp.filter('decodeURIComponent', function() {
	return window.decodeURIComponent;
});
