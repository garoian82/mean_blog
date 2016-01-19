(function () {
	
	'use strict';

	angular.module('app')
		.controller('PostEditController', function (Posts, post, posts) {
			debugger;
			var vm = this;

			vm.post = post;
			vm.posts = posts;
			vm.postCopy = _.clone(post);
		});
}());