(function () {

	'use strict';

	angular.module('app')
		.controller('LoginController', function (Users, $state, storage) {
			var vm = this;
			
			vm.creds = {};
			
			vm.login = function login(creds) {
				Users.login(creds)
					.then(function () {
						$state.go('blog');
					}, function (err) {
						vm.loginFailed = true;
					});
			};
		});
}());