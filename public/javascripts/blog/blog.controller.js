(function () {

	'use strict';

	angular.module('app')
		.controller('BlogController', function (Posts, posts, post, Users, $rootScope, $state) {
			var vm = this;

			vm.post = post;
			vm.posts = posts;
			vm.logout = Users.logout;
		});
}());