(function () {

	'use strict';

	angular.module('app')
		.directive('navBar', function (Users) {
			function controller($scope, Users) {
				$scope.logout = Users.logout;
			}

			return {
				restrict: 'E',
				templateUrl: 'partials/directives/nav.html',
				controller: controller
			};
		});

}());