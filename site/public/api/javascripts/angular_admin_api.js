// ADMIN CONTROLLER
ciidApp.controller('AdminCtrl', function($scope, $rootScope, $http, $modal, $window) {

	// GETTING APPLICATION INFOS
	$http.get('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/app')
	.success(function(data, status) {
		if (status == 200) {
			$scope.app = data.app;
		}
		else {
			$scope.apiStatus = status;
			$scope.error = data.ko;
		}
	});

	$scope.show = {home: false, comments: false, blacklists: false, roles: false, script: false};
	$scope.isBanned = function(emails, email) {
		return emails.indexOf(email) === -1 ? false : true;
	};

	$scope.getPageName = function(string, allowed_domain) {
		var pageName = string.replace(allowed_domain, '').replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, "");
		pageName = pageName.split('/').pop();
		if (pageName == '')
			return 'Index';
		else if (pageName.length > 14)
			return pageName.substring(0,10) + "...";
		else
			return pageName;
	};

	$scope.showHome = function() {
		$scope.show.home = true;
		$scope.show.comments = false;
		$scope.show.blacklists = false;
		$scope.show.roles = false;
		$scope.show.script = false;
	}

	$scope.showComments = function(token, pageid) {
		$scope.show.home = false;
		$scope.show.comments = true;
		$scope.show.blacklists = false;
		$scope.show.roles = false;
		$scope.show.script = false;
		$rootScope.pageid = pageid;
	};

	$scope.showBlacklists = function() {
		$scope.show.home = false;
		$scope.show.comments = false;
		$scope.show.blacklists = true;
		$scope.show.roles = false;
		$scope.show.script = false;
	};

	$scope.showRoles = function() {
		$scope.show.home = false;
		$scope.show.comments = false;
		$scope.show.blacklists = false;
		$scope.show.roles = true;
		$scope.show.script = false;
	};

	$scope.showScript = function() {
		$scope.show.home = false;
		$scope.show.comments = false;
		$scope.show.blacklists = false;
		$scope.show.roles = false;
		$scope.show.script = true;
	};

	$scope.currentArticles = 1;
	$scope.articlePagination = function(num) {
		return (Math.ceil(num / 12) == $scope.currentArticles);
	}

	$scope.deleteApp = function(token) {
		if (confirm("Voulez-vous vraiment supprimer l'application ?"))
			$http.put('/api/' + token + '/delete')
			.success(function(data) {
				alert(data.ok);
			});
	}

	$scope.updateAllowedDomain = function(token, domain) {
		$http.post("/api/" + token + "/uad", {domain: domain})
		.success(function(data) {
			$scope.domain = data;
		});
	};

	$scope.openUpgradeModal = function() {
		upgradeModalInstance = $modal.open({
			templateUrl: '/modals/upgrade.html',
			controller: 'UpgradeCtrl'
		});

		upgradeModalInstance.result.then(function(status) {
			if (status) {
				alert("Votre demande a été prise en compte.");
				$window.location.reload();
			}
		});
	};

	$scope.openImportExportModal = function() {
		importExportModalInstance = $modal.open({
			templateUrl: '/modals/importExport.html',
			controller: 'ImportExportCtrl'
		});

		importExportModalInstance.result.then(function(status) {
			if (status)
				$window.location.reload();
		});
	};

	$rootScope.$watch('token', function(oldV, newV) {
		$http.get("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/commentsCount")
		.success(function(data) {
			$scope.commentCount = data;
			$scope.commentCount.total > 0 ? $scope.show.home = true : $scope.show.script = true;
		});
	});

	$rootScope.$watch('origin', function(oldV, newV) {
		$http.get("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/articles")
		.success(function(data) {
			$scope.articles = data.articles;
			for (a in $scope.articles) {
				(function(a) {
					var pageName = decodeURIComponent($scope.articles[a].link).replace('http://','').replace('https://','').replace('www.', '').replace(/\?.*/, '');
					$http.get('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/' + encodeURIComponent(pageName) + '/commentsCount')
					.success(function(data) {
						$scope.articles[a].totalNumber = data.total;
						$scope.articles[a].modNumber = data.mod;
					});
				})(a);
			}
		}).error(function(data) {
			console.log(data);
		});
	})
});

// CONTROLLER COMMENTAIRES
ciidApp.controller('AdminCommentsCtrl', function($scope, $rootScope, $http, $window, $filter) {
	$scope.dateOrder = [
		{value: 0, label: "Date - Plus anciens", predicate: "-public_part.created", reverse: true},
		{value: 1, label: "Date - Plus récents", predicate: "-public_part.created", reverse: false}
	];
	$scope.voteOrder = [
		{value: 0, label: "Les + validés", predicate: "-private_part.validatedFrom.length", reverse: false},
		{value: 0, label: "Les + limites", predicate: "-private_part.ignoredFrom.length", reverse: false},
		{value: 0, label: "Les + refusés", predicate: "-private_part.deletedFrom.length", reverse: false},
		{value: 0, label: "Les + signalés", predicate: "-private_part.denounceFrom.length", reverse: false},
	];
	$scope.kinds = [
		{ name:"Information", value:0, icon: "fa-info-circle" },
		{ name:"Opinion", value:1, icon: "fa-bullhorn" },
		{ name:"Humour", value:2, icon: "fa-smile-o" }
	];

	$scope.modifyQuestion = false;
	$scope.showModifyQuestion = function() {
		$scope.modifyQuestion = !$scope.modifyQuestion;
	}

	$scope.loadComments = function() {
		$http.get("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/' + encodeURIComponent($rootScope.pageid))
		.success(function(data) {
			$scope.currentPageComments = data.comments;
			console.log(data.comments);
		}).error(function(data) {
			console.log(data);
		});
	}

	$scope.loadModComments = function() {
		$http.get("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/toMod")
		.success(function(data) {
			$scope.commentsToMod = data.comments;
		});
	}

	$scope.loadArticle = function() {
		$http.get("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/article")
		.success(function(data, status) {
			if (status === 201)
				loadArticle();
			else  {
				$scope.article = data.article;
				calculateScore();
				$scope.loadComments();
			}
		});
	};

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

	var orderBy = $filter('orderBy');
	$scope.order = function(predicate, reverse) {
		$scope.currentPageComments = orderBy($scope.currentPageComments, predicate, reverse);
	};

	$scope.setCommentOwnerOk = function(appid, comment) {
		$http.put("/api/"  + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/setCommentOk/" + comment._id)
		.success(function(data) {
			angular.copy(data,comment);
		});
	};

	$scope.setCommentOwnerKo = function(appid, comment) {
		$http.put("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + "/setCommentKo/" + comment._id)
		.success(function(data) {
			angular.copy(data,comment);
		});
	};

	$scope.isPublished = function(comment) {
		if (!comment || !comment.private_part)
			return false;
		if (comment.private_part.validatedByOwner == true)
			return true;
		if (comment.private_part.deletedByOwner == true)
			return false;
		if (comment.private_part.validatedFrom.length > 1)
			return true;
		return false;
	};

	$scope.updateArticle = function() {
		$http.put("/api/" + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/' + encodeURIComponent($scope.article.link) + "/article", {article: $scope.article})
		.success(function(data, status) {
		});
	};

	$scope.$watch('currentDateOrder', function(newV, oldV) {
		if (newV)
			$scope.order(newV.predicate, newV.reverse);
	});
	$scope.$watch('currentVoteOrder', function(newV, oldV) {
		if (newV)
		$scope.order(newV.predicate, newV.reverse);
	});

	$rootScope.$watch('pageid', function(newV, oldV) {
		if (newV)
			$scope.loadArticle();
		else
			$scope.loadModComments();
	});
});

// CONTROLLER BLACKLISTS
ciidApp.controller('AdminBlacklistsCtrl', function($scope, $rootScope, $http, $window, $filter) {
	$scope.banEmail = function(token, email) {
		$http.post("/api/" + token + "/blacklists/email", {email: email})
		.success(function(data) {
			delete $scope.b_email;
			alert(data.ok);
			$window.location.reload();
		}).error(function(data) {
			console.log(data);
		});
	}

	$scope.unbanEmail = function(token, email) {
		$http.put("/api/" + token + "/blacklists/email", {email: email})
		.success(function(data) {
			alert(data.ok);
			$window.location.reload();
		}).error(function(data) {
			console.log(data);
		});
	}
});

// CONTROLLER ROLES
ciidApp.controller('AdminRolesCtrl', function($scope, $rootScope, $http, $window, $filter) {
	$scope.addNewAdmin = function(token) {
		$http.post("/api/" + token + "/roles/add",{email:$scope.newAdmin})
		.success(function(data) {
			alert(data.ok);
			$window.location.reload();
		});
	}
	$scope.deleteAdmin = function(token, email) {
		$http.put("/api/" + token + "/roles/delete", {email: email})
		.success(function(data) {
			alert(data.ok);
			$window.location.reload();
		});
	}
});

// UPGRADE MODAL CONTROLLER
ciidApp.controller('UpgradeCtrl', function($scope, $rootScope, $http, $modalInstance) {
	$scope.button1 = function(demand) {
		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/option', {option: 'A', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button2 = function(demand) {
		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/option', {option: 'B', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button3 = function(demand) {
		$http.post('/api/' + encodeURIComponent($rootScope.origin) + '/' + $rootScope.token + '/option', {option: 'C', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
});

// IMPORT EXPORT MODAL CONTROLLER
ciidApp.controller('ImportExportCtrl', function($scope, $rootScope, $http, $window) {

	var download = function(type) {
		$http.get('/api/' + $rootScope.token + '/' + type + '/export/')
		.success(function(data) {
			var anchor = angular.element('<a/>');
			anchor.attr({
				href: 'data:attachment/csv; base64,' + encodeURI($window.btoa(data)),
				target: '_blank',
				download: type + '.csv'
			})[0].click();
		}).
		error(function(data) {
			console.log(data);
		});
	}


	$scope.exportArticles = function() {
		download('articles');
	}

	$scope.exportComments = function() {
		download('comments');
	}
});
