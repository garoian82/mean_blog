(function () {

	'use strict';

	angular.module('app')
		.service('Users', function ($http, $state, storage, $rootScope) {
			var vm = this;

			vm.currentUser = null;
			vm.currentUserToken = null;

			vm.users = [];

			vm.find = function find(userId) {
				return _.find(vm.users, {_id: userId});
			};
			
			//Get all users from the database.
			vm.get = function get() {
				return $http.get('/users')
					.then(function (res) {
						vm.users.splice(0);

						res.data.forEach(function (user) {
							vm.users.push(new User(user));
						});
						return vm.users;
					});
			};

			//Login a user with provided credentials.
			vm.login = function login(creds) {
				return $http.post('/login', creds)
					.then(function (res) {
						vm.currentUser = res.data.user;
						vm.currentUserToken = res.data.token;
						$rootScope.currentUser = vm.currentUser;
						storage.set('token', res.data.token);
						storage.set('currentUser', res.data.user);
					});
			};

			vm.stayLoggedIn = function stayLoggedIn(creds) {
				vm.currentUser = storage.get('currentUser');
				vm.currentUserToken = storage.get('token');
				$rootScope.currentUser = vm.currentUser;
			};

			vm.logout = function logout() {
				debugger;
				vm.logOutSuccess = true;
				vm.currentUser = null;
				vm.currentUserToken = null;
				$rootScope.currentUser = null;
				storage.forget('currentUser');
				storage.forget('token');
				$state.go('blog');
			};

			//checks to see if current user is logged in.
			vm.isLoggedIn = function isLoggedIn() {
				return !!vm.currentUser;
			};	
		});
}());