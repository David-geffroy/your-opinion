GlobalApp.controller('AccountCtrl', function($scope, $http, $window) {
	$scope.resend = function() {
		$http.get('/account/validateAccount/resendToken')
		.success(function(data) {
			alert(data.ok);
		});
	}
});