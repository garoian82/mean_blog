(function () {

	'use strict';

	angular.module('app', ['ui.router', 'ui.bootstrap', 'ngFileUpload'])
		.config(function ($stateProvider, $urlRouterProvider, $httpProvider, storageProvider) {
			
			$urlRouterProvider.otherwise('/blog');

			$stateProvider
				.state('login', {
					url: '/login',
					templateUrl: 'partials/login/index.html',
					controller: 'LoginController',
					controllerAs: 'loginCtrl'
				})
				.state('post', {
					url: '/post',
					templateUrl: 'partials/post/index.html',
					controller: 'PostController',
					controllerAs: 'postCtrl',
					resolve: {
						posts: function(Posts) {
							return Posts.get();
						}
					},
					data: {
						requiresLogin: true
					}					
				})
				.state('edit-post', {
					url: 'post/edit/:postId',
					templateUrl: 'partials/post/edit.html',
					controller: 'PostEditController',
					controllerAs: 'postEditCtrl',
					resolve: {
						posts: function (Posts) {
							return Posts.get();
						},
						post: function (Posts, $stateParams, posts) {
							return Posts.find($stateParams.postId);
						}
					},
					data: {
						requiresLogin: true
					}
				})
				.state('blog', {
					url: '/blog',
					templateUrl: 'partials/blog/index.html',
					controller: 'BlogController',
					controllerAs: 'blogCtrl',
					resolve: {
						posts: function(Posts) {
							return Posts.get();
						},
						post: function(Posts, $stateParams, posts) {
							return Posts.find($stateParams.postId);
						}
					}
				});

			$httpProvider.interceptors.push(function ($injector) {
				return {
					request: function (config) {
						var Users = $injector.get('Users');
						if(Users.isLoggedIn()) config.headers.Authorization = 'Token ' + Users.currentUserToken;
						return config;
					}
				};
			});
		})
		.run(function ($rootScope, Users, $state, storage) {
			$rootScope.$on('$stateChangeStart', function (event, toState) {
				if (toState.data && toState.data.requiresLogin) {
					if (!Users.isLoggedIn()) {
						event.preventDefault();
						$state.go('login');
					}
				}
			});

			Users.stayLoggedIn();

			if (!Users.currentUser || !Users.currentUserToken) {
				$state.go('login');
			}
		});
}());