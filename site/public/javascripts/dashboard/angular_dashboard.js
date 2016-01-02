// DASHBOARD GLOBAL CONTROLLER
GlobalApp.controller('DashboardCtrl', function($scope, $http, $modal, $window) {
	$http.get('/dashboard/json')
	.success(function(data) {
		$scope.apps = data.apps;
		$scope.articles = data.articles;
	});

	$http.get("/profile/json")
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
		console.log(data);
	});

	$scope.currentApps = 1;
	$scope.appsPagination = function(num) {
		return (Math.ceil(num / 7) == $scope.currentApps);
	}

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
});

// UPGRADE MODAL CONTROLLER
GlobalApp.controller('UpgradeCtrl', function($scope, $http, $modalInstance) {
	$scope.button1 = function(demand) {
		$http.post('/admin/option', {option: 'A', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button2 = function(demand) {
		$http.post('/admin/option', {option: 'B', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button3 = function(demand) {
		$http.post('/admin/option', {option: 'C', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
});
