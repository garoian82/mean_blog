(function () {

	'use strict';

	angular.module('app')
		.controller('PostController', function (Posts, posts, Users, $rootScope, $state) {	
			var vm = this;

			vm.post = {};

			vm.posts = posts;
			vm.add = Posts.post;
			vm.logout = Users.logout;
			vm.added = false;
		});
}());