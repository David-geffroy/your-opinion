GlobalApp.controller('NavBarCtrl', function($scope, $window, $location) {
	$scope.isActive = function(page) {
		return page === $window.location.pathname ? true : false;
	};

	$scope.pHover = false;
	$scope.cHover = false;
	$scope.vHover = false;
	$scope.fHover = false;
	$scope.rHover = false;
	$scope.lHover = false;
});
