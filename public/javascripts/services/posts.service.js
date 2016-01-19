(function () {

	'use stsrict';

	angular.module('app')
		.service('Posts', function ($http, $state, $q, Upload) {
			var vm = this;

			vm.posts = [];

			vm.find = function find(postId) {
				return _.find(vm.posts, {_id: postId});
			};

			vm.get = function get() {
				return $http.get('/posts/')
					.then(function (res) {
						vm.posts.splice(0);
						res.data.forEach(function (post) {
							vm.posts.push(post);
						});

						return(vm.posts);
					});
			};

			vm.post = function post(post) {
				debugger;
				var dfrd = $q.defer();

				if (post.blogImages) {
					Upload.upload({
							url: '/posts',
							arrayKey: '',
							data: post
						})
						.then(dfrd.resolve, dfrd.reject);
				} else {
					return $http.post('/posts', post)
						.then(function (res) {
							vm.posts.push(res.data);
							dfrd.resolve(res);
						}, function (err) {
							dfrd.refect(err);
						});
				}
				return dfrd.promise;
			};

			vm.put = function put(postCopy) {
				var data = {
					title: postCopy.title,
					body: postCopy.body,
					link: postCopy.link
				};
				
				return $http.put('/posts/' + postCopy._id, data)
					.then(function (res) {
						var p = vm.find(projectCopy._id);
						_.mernge(p, projectCopy);
					}, function (err) {
						//TODO: Handle if post can't be updated.
					});
			};
		});
}());