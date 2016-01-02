GlobalApp.controller('MyCommentsCtrl', function($scope, $http, $filter) {
	$scope.dateOrder = [
		{value: 0, label: "Date - Plus anciens", predicate: "-public_part.created", reverse: true},
		{value: 1, label: "Date - Plus récents", predicate: "-public_part.created", reverse: false}
	];
	$scope.voteOrder = [
		{value: 0, label: "Les + validés", predicate: "-private_part.validatedFrom", reverse: false},
		{value: 1, label: "Les + limites", predicate: "-private_part.ignoredFrom", reverse: false},
		{value: 2, label: "Les + refusés", predicate: "-private_part.deletedFrom", reverse: false},
		{value: 3, label: "Les + signalés", predicate: "-private_part.denounceFrom", reverse: false}
	];
	$scope.kinds = [
		{ name:"Information", value:0, icon: "fa-info-circle" },
		{ name:"Opinion", value:1, icon: "fa-bullhorn" },
		{ name:"Humour", value:2, icon: "fa-smile-o" }
	];

	var orderBy = $filter('orderBy');
	$scope.order = function(predicate, reverse) {
		$scope.comments = orderBy($scope.comments, predicate, reverse);
	};

	$http.get('/dashboard/mycomments/json')
	.success(function(data) {
		$scope.comments = data;
	});

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

	$scope.$watch('currentDateOrder', function(newV, oldV) {
		if (newV)
			$scope.order(newV.predicate, newV.reverse);
	});
	$scope.$watch('currentVoteOrder', function(newV, oldV) {
		if (newV)
		$scope.order(newV.predicate, newV.reverse);
	});
});
