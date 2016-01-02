GlobalApp.controller('HomepageCtrl', function($scope, $modal, $window, $location, $anchorScroll) {

	$scope.openConnectModal = function() {
		$anchorScroll();
		connectModalInstance = $modal.open({
			templateUrl: '/modals/connect.html',
			controller: 'ConnectCtrl'
		});

		connectModalInstance.result.then(function(status) {
			if (status)
				$window.location.reload();
		});
	};

	$scope.goToId = function(id) {
		$location.hash(id);
		$anchorScroll();
		$location.hash('');
	};
});

GlobalApp.controller('ConnectCtrl', function($scope, $http, $modalInstance) {

	$scope.connectLocal = function() {
		$http.post("/auth/login", {email: $scope.email, password: $scope.password})
		.success(function(data, status, headers, config) {
			$modalInstance.close(true);
		})
		.error(function(data, status, headers, config) {
			console.log(data);
		});
	}

	$scope.createAccount = function() {
		$http.post('/auth/signup', {pseudo: $scope.pseudo, email:$scope.email, password: $scope.password})
		.success(function(data, status) {
			$modalInstance.close(true);
		}).error(function(data, status) {
			console.log(data);
		});
	}

	$scope.isRegisterOk = function() {
		if ($scope.pseudo && $scope.email && $scope.password && $scope.password === $scope.confirmPassword)
			return true;

		return false;
	}

	$scope.connectFacebook = function() {
		authFrame = window.open('/auth/facebook','fbconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		window.onbeforeunload = function(){
			$modalInstance.close(true);
		}
	}

	$scope.connectGoogle = function() {
		authFrame = window.open('/auth/google','googleconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		window.onbeforeunload = function(){
			$modalInstance.close(true);
		}
	}

/*	$scope.connectTwitter = function() {
		authFrame = window.open('/auth/twitter','twitterconnect','menubar=no, status=no, scrollbars=no, menubar=no, width=700, height=480');
		window.onbeforeunload = function(){
			$modalInstance.close(true);
		}
	}*/

	$scope.doResendPassword = function() {
		$http.post('/account/validateAccount/sendPasswordMail', {email: $scope.email})
		.success(function(data) {
			console.log(data);
		})
	}
});

/* DIVERS FONCTIONS */
function onSSOConnected() {
	authFrame.close();
	window.location.reload();
};

(function($) {
    "use strict"; // Start of use strict

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    })

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Fit Text Plugin for Main Header
    $("h1").fitText(
        1.2, {
            minFontSize: '35px',
            maxFontSize: '65px'
        }
    );

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 100
        }
    })

    // Initialize WOW.js Scrolling Animations
    new WOW().init();

})(jQuery); // End of use strict
