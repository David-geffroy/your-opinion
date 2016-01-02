GlobalApp.controller('ValidationCtrl', ['$scope','$http', function($scope, $http) {

	$scope.commentloaded = false;
	$scope.comment = false;

	$scope.getRandomComment = function() {
		$http.get("/dashboard/validation/random")
		.success(function(data) {
			$scope.comment = data.comment;
			$scope.commentloaded = true;
			$scope.tutoriel = data.tutoriel;
			$scope.currentTuto = 0;
		});
	}

	$scope.markAsYes = function() {
		$scope.commentloaded = false;
		$http.put("/dashboard/validation/ok/"+$scope.comment._id)
		.success(function(data) {
			//load another one
			$scope.getRandomComment();
		});
	}

	$scope.markAsNo = function() {
		$scope.commentloaded = false;
		$http.put("/dashboard/validation/ko/"+$scope.comment._id)
		.success(function(data) {
			//load another one
			$scope.getRandomComment();
		});
	}

	$scope.markAsIgnored = function() {
		$scope.commentloaded = false;
		$http.put("/dashboard/validation/pass/"+$scope.comment._id)
		.success(function(data) {
			//load another one
			$scope.getRandomComment();
		});
	}

	$scope.currentTuto = 0;
	$scope.tutoriels = [
		{body: "JE TROUVE CA INADMISIBLE QUE L'ON PUISSE FAIRE UN ARTICLE SUR CE GENRE DE CHOSES DE NOS JOURS, LA JEUNE GENERATION N'EST CAPABLE DE RIEN, HEUREUSEMENT DE MON TEMPS LES GENS BOSSAIENT DUR AU LIEU DE FAIRE SA FEIGNASSE ET REGARDER DES SERIES TELE",
		 help: "Afin de faciliter la lecture sur le site il est préférable d'avoir une syntaxe correcte. Il n'est pas néccéssaire de mettre des majuscules partout pour se faire entendre, mais plutôt d'avoir un discours intélligible.", answer: false},
		{body: "C'est vraiment un article de merde. Le mec qui a écrit ça est un sacré attardé. Et les gens qui commentent sont encore pire. Apple est une entreprise très saine qui valorise les droits de l'homme, à mort Windows et aux chiottes Linux.",
		 help: "Les insultes et incitation à la haine ne sont et ne seront pas tolérées.", answer: false},
		{body: "Tant sur le fond que sur la forme, je ne suis pas du tout d'accord avc vous. Les échanges entre Abed et Troy sont riches, fins et sans équivoque les meilleurs dialogues toute sitcom confondues et ce même après la saison 3.",
		 help: "Il ne s'agit pas ici de moderer en fonction de son avis mais bien en fonction des règles de la communauté.", answer: true},
	];

	$scope.setTutoComment = function(action) {

		if ((action === "OK" && !$scope.tutoriels[$scope.currentTuto].answer) || (action === "KO" && $scope.tutoriels[$scope.currentTuto].answer) || action === 'HELP') {
			$scope.tutoriels[$scope.currentTuto].doHelp = true;
			return;
		}

		if ($scope.currentTuto < 2) {
			$scope.currentTuto += 1;
		} else {
			$http.get('/tutoriel')
			.success(function (data) {
				$scope.getRandomComment();
				alert('Félicitations ! Vous avez complété le tutoriel.\nVous avez gagné de la réputation.');
			});
		}
	};

	$scope.getRandomComment();
}]);

