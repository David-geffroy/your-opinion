// DASHBOARD GLOBAL CONTROLLER
GlobalApp.controller('FiguresCtrl', function($scope, $http, $modal, $window) {
	$scope.openUpgradeAuthorModal = function() {
		var upgradeAuthorModalInstance = $modal.open({
			templateUrl: '/modals/upgrade-author.html',
			controller: 'UpgradeAuthorCtrl'
		});

		upgradeAuthorModalInstance.result.then(function(status) {
			if (status)
				$window.location.reload();
		});
	};
});

// UPGRADE Author MODAL CONTROLLER
GlobalApp.controller('UpgradeAuthorCtrl', function($scope, $http, $modalInstance) {
	$scope.button1 = function() {
		$http.post('/admin/option', {option: 'A', origin: 'Upgrade Author'})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button2 = function() {
		$http.post('/admin/option', {option: 'B', origin: 'Upgrade Author'})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
	$scope.button3 = function(demand) {
		$http.post('/admin/option', {option: 'C', origin: 'Upgrade Author', demand: demand})
		.success(function(data) {
			$modalInstance.close(true);
		});
	}
});
