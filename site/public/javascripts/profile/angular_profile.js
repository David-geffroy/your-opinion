GlobalApp.controller('ProfileCtrl', function($scope, $http, $window, FileUploader, fileReader) {
	$scope.uploader = new FileUploader();
	$scope.newExperience = "";

	$http.get("/profile/json")
	.success(function(data) {
		$scope.userData = data.user;
		$scope.userNews = data.news;
		$http.get('/profile/maxCredit')
		.success(function(data) {
			$scope.credit = data;
			$scope.credibilityWidth = (($scope.userData.authorCredit + $scope.userData.modCredit) * 100 / $scope.credit.max + 5);
			$scope.level = $scope.credibilityWidth > 80 ? 'level5' : $scope.credibilityWidth > 60 ? 'level4' : $scope.credibilityWidth > 40 ? 'level3' : $scope.credibilityWidth > 20 ? 'level2' : 'level1';
			$scope.credibilityWidth = $scope.credibilityWidth > 100 ? "99%" : $scope.credibilityWidth + "%";
		});
	}).error(function(data) {
		console.log(data);
	});

	$scope.open = function($event) {
		$scope.opened = true;
	};

	$scope.dateOptions = {
		formatYear: 'yy',
		startingDay: 1
	};

	$scope.canAddMoreExp = function() {
		if ($scope.userData)
			return $scope.userData.experiences.length < 3 ? true : false;
		else
			return false;
	}

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

	$scope.onNewFile = function(file) {
		$scope.imageCover = { progress:0, name: file.name };
		fileReader.readAsDataUrl(file, $scope)
		.then(function(result) {
			$scope.mybinaryim = result;
			$scope.userData.info.avatar.media = 'custom';
			$scope.userData.info.avatar.link = result;
		});
	};

	$scope.changeAvatar = function(media) {
		$scope.userData.info.avatar.media = media;

		if (media == 'facebook')
			$scope.userData.info.avatar.link = "//avatars.io/facebook/" + $scope.userData.facebook.id + "?size=large";
		else if (media == 'twitter')
			$scope.userData.info.avatar.link = "//avatars.io/twitter/" + $scope.userData.twitter.id;
		else {
			$scope.userData.info.avatar.link = "/images/avatars/default.png";
		}
	}

	$scope.addExperience = function(newExperience) {
		if (newExperience)
			$scope.userData.experiences.push(newExperience);
		$scope.newExperience = "";
	}

	$scope.saveProfile = function() {
		$http.put("/profile/", {userData: $scope.userData, userNews: $scope.userNews})
		.success(function(data, status, headers, config) {
		});
		$scope.modified = false;
		$scope.changePseudo = false;
	};

	$scope.isPasswordOk = function() {
		if ($scope.oldPassword) {
			if ($scope.oldPassword == $scope.confirmPassword) {
				if ($scope.newPassword) {
					$scope.error = "";
					return true;
				} else {
					$scope.error = "Veuillez spécifier un nouveau mot de passe.";
				}
			} else {
				$scope.error = "Le mot de passe et la confirmation diffèrent.";
			}
		} else {
			$scope.error = "";
		}
		return false;
	}

	$scope.changePassword = function(oldPassword, newPassword) {
		$http.post("/account/validateAccount/sendPasswordMail", {oldPassword : oldPassword, newPassword: newPassword})
		.success(function(data) {
			if (data.ok) {
				alert(data.ok);
				$window.location.reload();
			}
			else
				alert(data.ko);
		})
	}

	// Mise en place du watcher pour afficher le bouton d'enregistrement des nouvelles données du profil.
	$scope.$watch("userData", function(oldValue, newValue) {
		if (newValue)
			$scope.modified = true;
	}, true);
	$scope.$watch("userNews", function(oldValue, newValue) {
		if (newValue)
			$scope.modified = true;
	}, true);
});

GlobalApp.controller('ProfilePublicCtrl', function($scope, $http, $window) {
	$http.get($window.location.pathname + "/json")
	.success(function(data) {
		$scope.userData = data.user;

		$http.get('/profile/maxCredit')
		.success(function(data) {
			$scope.credit = data;
			$scope.credibilityWidth = (($scope.userData.authorCredit + $scope.userData.modCredit) * 100 / $scope.credit.max + 5);
			$scope.level = $scope.credibilityWidth > 80 ? 'level5' : $scope.credibilityWidth > 60 ? 'level4' : $scope.credibilityWidth > 40 ? 'level3' : $scope.credibilityWidth > 20 ? 'level2' : 'level1';
			$scope.credibilityWidth = $scope.credibilityWidth > 100 ? "99%" : $scope.credibilityWidth + "%";
		});
	}).error(function(data) {
		alert(data.err);
	});

	$scope.age = function(birthday) {
		now = new Date();
		bday = new Date(birthday);
		var ageDifMs = now.getTime() - bday.getTime();
		var ageDate = new Date(ageDifMs);
		return Math.abs(ageDate.getUTCFullYear() - 1970);
	}
});

// KEEPING THE FOCUS ON THE NG-REPEAT INPUTS
GlobalApp.directive('focus', function () {
	return function (scope, element, attrs) {
		attrs.$observe('focus', function (newValue) {
			newValue === 'true' && element[0].focus();
		});
	}
});

GlobalApp.directive("ngFileSelect", function() {
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

GlobalApp.factory('fileReader', function ($q, $log) {
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
