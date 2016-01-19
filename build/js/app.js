(function () {

	'use strict';

	angular.module('app', ['ui.router', 'ui.bootstrap', 'ngFileUpload'])
		.config(["$stateProvider", "$urlRouterProvider", "$httpProvider", "storageProvider", function ($stateProvider, $urlRouterProvider, $httpProvider, storageProvider) {
			
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
						posts: ["Posts", function(Posts) {
							return Posts.get();
						}]
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
						posts: ["Posts", function (Posts) {
							return Posts.get();
						}],
						post: ["Posts", "$stateParams", "posts", function (Posts, $stateParams, posts) {
							return Posts.find($stateParams.postId);
						}]
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
						posts: ["Posts", function(Posts) {
							return Posts.get();
						}],
						post: ["Posts", "$stateParams", "posts", function(Posts, $stateParams, posts) {
							return Posts.find($stateParams.postId);
						}]
					}
				});

			$httpProvider.interceptors.push(["$injector", function ($injector) {
				return {
					request: function (config) {
						var Users = $injector.get('Users');
						if(Users.isLoggedIn()) config.headers.Authorization = 'Token ' + Users.currentUserToken;
						return config;
					}
				};
			}]);
		}])
		.run(["$rootScope", "Users", "$state", "storage", function ($rootScope, Users, $state, storage) {
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
		}]);
}());
(function () {

	'use strict';

	angular.module('app')
		.controller('BlogController', ["Posts", "posts", "post", "Users", "$rootScope", "$state", function (Posts, posts, post, Users, $rootScope, $state) {
			debugger;
			var vm = this;

			vm.post = post;
			vm.posts = posts;
			vm.logout = Users.logout;
		}]);
}());
(function () {

	'use strict';

	angular.module('app')
		.directive('navBar', ["Users", function (Users) {
			controller.$inject = ["$scope", "Users"];
			function controller($scope, Users) {
				$scope.logout = Users.logout;
			}

			return {
				restrict: 'E',
				templateUrl: 'partials/directives/nav.html',
				controller: controller
			};
		}]);

}());
(function () {

  'use strict';

  angular.module('app')
    .filter('niceDate', function () {
      return function (timeStamp, format) {
        format = format || 'MMMM Do, YYYY';
        var m = moment(timeStamp);
        return m.format(format);
      };
    });
}());
(function () {

	'use strict';

	angular.module('app')
		.controller('LoginController', ["Users", "$state", "storage", function (Users, $state, storage) {
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
		}]);
}());
(function () {
	
	'use strict';

	angular.module('app')
		.controller('PostEditController', ["Posts", "post", "posts", function (Posts, post, posts) {
			debugger;
			var vm = this;

			vm.post = post;
			vm.posts = posts;
			vm.postCopy = _.clone(post);
		}]);
}());
(function () {

	'use strict';

	angular.module('app')
		.controller('PostController', ["Posts", "posts", "Users", "$rootScope", "$state", function (Posts, posts, Users, $rootScope, $state) {	
			var vm = this;

			vm.post = {};

			vm.posts = posts;
			vm.add = Posts.post;
			vm.logout = Users.logout;
			vm.added = false;
		}]);
}());
(function () {

  'use strict';

  angular.module('app')
    .provider('storage', function () {
      var vm = this,
        prefix = '',
        delimiter = '.';

      /**
       * Set a prefix for our localStorage that will be used when
       * setting and getting keys.
       *
       * @param _prefix
       * @param _delimiter
       */
      vm.setPrefix = function setPrefix(_prefix, _delimiter) {
        if (!_prefix) return;
        prefix = _prefix;

        if (_delimiter) delimiter = _delimiter;
      };

      /**
       * Convenience method for finding our storage keys.
       *
       * @param key
       * @returns {*}
       */
      function getKey(key) {
        return prefix ? prefix + delimiter + key : key;
      }

      /**
       * The required $get method for our service provider.
       *
       * @returns {{set: Function, get: Function, forget: Function}}
       */
      vm.$get = function $get() {
        return {
          /**
           * Set a value into the local storage.  Simple json stringify for objects.
           *
           * @param key
           * @param val
           */
          set: function set(key, val) {
            localStorage.setItem(getKey(key), JSON.stringify(val));
          },

          /**
           * Get a value from localStorage.  If a converter is provided the
           * retrieved object will be passed through given function and
           * the result of THAT function will be used.
           *
           * @param key
           * @param converter
           * @returns {*}
           */
          get: function get(key, converter) {
            converter = angular.isFunction(converter) ? converter : angular.identity;
            return converter(JSON.parse(localStorage.getItem(getKey(key))));
          },

          /**
           * Remove an item from localStorage.
           *
           * @param key
           */
          forget: function forget(key) {
            localStorage.removeItem(getKey(key));
          }
        };
      };
    });
}());
(function () {

	'use stsrict';

	angular.module('app')
		.service('Posts', ["$http", "$state", "$q", "Upload", function ($http, $state, $q, Upload) {
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
		}]);
}());
(function () {

	'use strict';

	angular.module('app')
		.service('Users', ["$http", "$state", "storage", "$rootScope", function ($http, $state, storage, $rootScope) {
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
		}]);
}());
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJibG9nL2Jsb2cuY29udHJvbGxlci5qcyIsImRpcmVjdGl2ZXMvbmF2LmRpcmVjdGl2ZS5qcyIsImZpbHRlcnMvZGF0ZS5maWx0ZXIuanMiLCJsb2dpbi9sb2dpbi5jb250cm9sbGVyLmpzIiwicG9zdC9wb3N0LWVkaXQuY29udHJvbGxlci5qcyIsInBvc3QvcG9zdC5jb250cm9sbGVyLmpzIiwic2VydmljZXMvbG9jYWxzdG9yYWdlLnNlcnZpY2UuanMiLCJzZXJ2aWNlcy9wb3N0cy5zZXJ2aWNlLmpzIiwic2VydmljZXMvdXNlcnMuc2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxDQUFBLFlBQUE7O0NBRUE7O0NBRUEsUUFBQSxPQUFBLE9BQUEsQ0FBQSxhQUFBLGdCQUFBO0dBQ0Esb0ZBQUEsVUFBQSxnQkFBQSxvQkFBQSxlQUFBLGlCQUFBOztHQUVBLG1CQUFBLFVBQUE7O0dBRUE7S0FDQSxNQUFBLFNBQUE7S0FDQSxLQUFBO0tBQ0EsYUFBQTtLQUNBLFlBQUE7S0FDQSxjQUFBOztLQUVBLE1BQUEsUUFBQTtLQUNBLEtBQUE7S0FDQSxhQUFBO0tBQ0EsWUFBQTtLQUNBLGNBQUE7S0FDQSxTQUFBO01BQ0EsaUJBQUEsU0FBQSxPQUFBO09BQ0EsT0FBQSxNQUFBOzs7S0FHQSxNQUFBO01BQ0EsZUFBQTs7O0tBR0EsTUFBQSxhQUFBO0tBQ0EsS0FBQTtLQUNBLGFBQUE7S0FDQSxZQUFBO0tBQ0EsY0FBQTtLQUNBLFNBQUE7TUFDQSxpQkFBQSxVQUFBLE9BQUE7T0FDQSxPQUFBLE1BQUE7O01BRUEseUNBQUEsVUFBQSxPQUFBLGNBQUEsT0FBQTtPQUNBLE9BQUEsTUFBQSxLQUFBLGFBQUE7OztLQUdBLE1BQUE7TUFDQSxlQUFBOzs7S0FHQSxNQUFBLFFBQUE7S0FDQSxLQUFBO0tBQ0EsYUFBQTtLQUNBLFlBQUE7S0FDQSxjQUFBO0tBQ0EsU0FBQTtNQUNBLGlCQUFBLFNBQUEsT0FBQTtPQUNBLE9BQUEsTUFBQTs7TUFFQSx5Q0FBQSxTQUFBLE9BQUEsY0FBQSxPQUFBO09BQ0EsT0FBQSxNQUFBLEtBQUEsYUFBQTs7Ozs7R0FLQSxjQUFBLGFBQUEsbUJBQUEsVUFBQSxXQUFBO0lBQ0EsT0FBQTtLQUNBLFNBQUEsVUFBQSxRQUFBO01BQ0EsSUFBQSxRQUFBLFVBQUEsSUFBQTtNQUNBLEdBQUEsTUFBQSxjQUFBLE9BQUEsUUFBQSxnQkFBQSxXQUFBLE1BQUE7TUFDQSxPQUFBOzs7OztHQUtBLGlEQUFBLFVBQUEsWUFBQSxPQUFBLFFBQUEsU0FBQTtHQUNBLFdBQUEsSUFBQSxxQkFBQSxVQUFBLE9BQUEsU0FBQTtJQUNBLElBQUEsUUFBQSxRQUFBLFFBQUEsS0FBQSxlQUFBO0tBQ0EsSUFBQSxDQUFBLE1BQUEsY0FBQTtNQUNBLE1BQUE7TUFDQSxPQUFBLEdBQUE7Ozs7O0dBS0EsTUFBQTs7R0FFQSxJQUFBLENBQUEsTUFBQSxlQUFBLENBQUEsTUFBQSxrQkFBQTtJQUNBLE9BQUEsR0FBQTs7OztBQ3JGQSxDQUFBLFlBQUE7O0NBRUE7O0NBRUEsUUFBQSxPQUFBO0dBQ0EsV0FBQSw4RUFBQSxVQUFBLE9BQUEsT0FBQSxNQUFBLE9BQUEsWUFBQSxRQUFBO0dBQ0E7R0FDQSxJQUFBLEtBQUE7O0dBRUEsR0FBQSxPQUFBO0dBQ0EsR0FBQSxRQUFBO0dBQ0EsR0FBQSxTQUFBLE1BQUE7OztBQ1hBLENBQUEsWUFBQTs7Q0FFQTs7Q0FFQSxRQUFBLE9BQUE7R0FDQSxVQUFBO29FQUFBLFVBQUEsT0FBQTtHQUNBLFNBQUEsV0FBQSxRQUFBLE9BQUE7SUFDQSxPQUFBLFNBQUEsTUFBQTs7O0dBR0EsT0FBQTtJQUNBLFVBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTs7Ozs7QUNiQSxDQUFBLFlBQUE7O0VBRUE7O0VBRUEsUUFBQSxPQUFBO0tBQ0EsT0FBQSxZQUFBLFlBQUE7TUFDQSxPQUFBLFVBQUEsV0FBQSxRQUFBO1FBQ0EsU0FBQSxVQUFBO1FBQ0EsSUFBQSxJQUFBLE9BQUE7UUFDQSxPQUFBLEVBQUEsT0FBQTs7OztBQ1RBLENBQUEsWUFBQTs7Q0FFQTs7Q0FFQSxRQUFBLE9BQUE7R0FDQSxXQUFBLGtEQUFBLFVBQUEsT0FBQSxRQUFBLFNBQUE7R0FDQSxJQUFBLEtBQUE7O0dBRUEsR0FBQSxRQUFBOztHQUVBLEdBQUEsUUFBQSxTQUFBLE1BQUEsT0FBQTtJQUNBLE1BQUEsTUFBQTtNQUNBLEtBQUEsWUFBQTtNQUNBLE9BQUEsR0FBQTtRQUNBLFVBQUEsS0FBQTtNQUNBLEdBQUEsY0FBQTs7Ozs7QUNmQSxDQUFBLFlBQUE7O0NBRUE7O0NBRUEsUUFBQSxPQUFBO0dBQ0EsV0FBQSxpREFBQSxVQUFBLE9BQUEsTUFBQSxPQUFBO0dBQ0E7R0FDQSxJQUFBLEtBQUE7O0dBRUEsR0FBQSxPQUFBO0dBQ0EsR0FBQSxRQUFBO0dBQ0EsR0FBQSxXQUFBLEVBQUEsTUFBQTs7O0FDWEEsQ0FBQSxZQUFBOztDQUVBOztDQUVBLFFBQUEsT0FBQTtHQUNBLFdBQUEsc0VBQUEsVUFBQSxPQUFBLE9BQUEsT0FBQSxZQUFBLFFBQUE7R0FDQSxJQUFBLEtBQUE7O0dBRUEsR0FBQSxPQUFBOztHQUVBLEdBQUEsUUFBQTtHQUNBLEdBQUEsTUFBQSxNQUFBO0dBQ0EsR0FBQSxTQUFBLE1BQUE7R0FDQSxHQUFBLFFBQUE7OztBQ2JBLENBQUEsWUFBQTs7RUFFQTs7RUFFQSxRQUFBLE9BQUE7S0FDQSxTQUFBLFdBQUEsWUFBQTtNQUNBLElBQUEsS0FBQTtRQUNBLFNBQUE7UUFDQSxZQUFBOzs7Ozs7Ozs7TUFTQSxHQUFBLFlBQUEsU0FBQSxVQUFBLFNBQUEsWUFBQTtRQUNBLElBQUEsQ0FBQSxTQUFBO1FBQ0EsU0FBQTs7UUFFQSxJQUFBLFlBQUEsWUFBQTs7Ozs7Ozs7O01BU0EsU0FBQSxPQUFBLEtBQUE7UUFDQSxPQUFBLFNBQUEsU0FBQSxZQUFBLE1BQUE7Ozs7Ozs7O01BUUEsR0FBQSxPQUFBLFNBQUEsT0FBQTtRQUNBLE9BQUE7Ozs7Ozs7VUFPQSxLQUFBLFNBQUEsSUFBQSxLQUFBLEtBQUE7WUFDQSxhQUFBLFFBQUEsT0FBQSxNQUFBLEtBQUEsVUFBQTs7Ozs7Ozs7Ozs7O1VBWUEsS0FBQSxTQUFBLElBQUEsS0FBQSxXQUFBO1lBQ0EsWUFBQSxRQUFBLFdBQUEsYUFBQSxZQUFBLFFBQUE7WUFDQSxPQUFBLFVBQUEsS0FBQSxNQUFBLGFBQUEsUUFBQSxPQUFBOzs7Ozs7OztVQVFBLFFBQUEsU0FBQSxPQUFBLEtBQUE7WUFDQSxhQUFBLFdBQUEsT0FBQTs7Ozs7O0FDdkVBLENBQUEsWUFBQTs7Q0FFQTs7Q0FFQSxRQUFBLE9BQUE7R0FDQSxRQUFBLDZDQUFBLFVBQUEsT0FBQSxRQUFBLElBQUEsUUFBQTtHQUNBLElBQUEsS0FBQTs7R0FFQSxHQUFBLFFBQUE7O0dBRUEsR0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBO0lBQ0EsT0FBQSxFQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsS0FBQTs7O0dBR0EsR0FBQSxNQUFBLFNBQUEsTUFBQTtJQUNBLE9BQUEsTUFBQSxJQUFBO01BQ0EsS0FBQSxVQUFBLEtBQUE7TUFDQSxHQUFBLE1BQUEsT0FBQTtNQUNBLElBQUEsS0FBQSxRQUFBLFVBQUEsTUFBQTtPQUNBLEdBQUEsTUFBQSxLQUFBOzs7TUFHQSxPQUFBLEdBQUE7Ozs7R0FJQSxHQUFBLE9BQUEsU0FBQSxLQUFBLE1BQUE7SUFDQTtJQUNBLElBQUEsT0FBQSxHQUFBOztJQUVBLElBQUEsS0FBQSxZQUFBO0tBQ0EsT0FBQSxPQUFBO09BQ0EsS0FBQTtPQUNBLFVBQUE7T0FDQSxNQUFBOztPQUVBLEtBQUEsS0FBQSxTQUFBLEtBQUE7V0FDQTtLQUNBLE9BQUEsTUFBQSxLQUFBLFVBQUE7T0FDQSxLQUFBLFVBQUEsS0FBQTtPQUNBLEdBQUEsTUFBQSxLQUFBLElBQUE7T0FDQSxLQUFBLFFBQUE7U0FDQSxVQUFBLEtBQUE7T0FDQSxLQUFBLE9BQUE7OztJQUdBLE9BQUEsS0FBQTs7O0dBR0EsR0FBQSxNQUFBLFNBQUEsSUFBQSxVQUFBO0lBQ0EsSUFBQSxPQUFBO0tBQ0EsT0FBQSxTQUFBO0tBQ0EsTUFBQSxTQUFBO0tBQ0EsTUFBQSxTQUFBOzs7SUFHQSxPQUFBLE1BQUEsSUFBQSxZQUFBLFNBQUEsS0FBQTtNQUNBLEtBQUEsVUFBQSxLQUFBO01BQ0EsSUFBQSxJQUFBLEdBQUEsS0FBQSxZQUFBO01BQ0EsRUFBQSxPQUFBLEdBQUE7UUFDQSxVQUFBLEtBQUE7Ozs7OztBQzVEQSxDQUFBLFlBQUE7O0NBRUE7O0NBRUEsUUFBQSxPQUFBO0dBQ0EsUUFBQSxzREFBQSxVQUFBLE9BQUEsUUFBQSxTQUFBLFlBQUE7R0FDQSxJQUFBLEtBQUE7O0dBRUEsR0FBQSxjQUFBO0dBQ0EsR0FBQSxtQkFBQTs7R0FFQSxHQUFBLFFBQUE7O0dBRUEsR0FBQSxPQUFBLFNBQUEsS0FBQSxRQUFBO0lBQ0EsT0FBQSxFQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsS0FBQTs7OztHQUlBLEdBQUEsTUFBQSxTQUFBLE1BQUE7SUFDQSxPQUFBLE1BQUEsSUFBQTtNQUNBLEtBQUEsVUFBQSxLQUFBO01BQ0EsR0FBQSxNQUFBLE9BQUE7O01BRUEsSUFBQSxLQUFBLFFBQUEsVUFBQSxNQUFBO09BQ0EsR0FBQSxNQUFBLEtBQUEsSUFBQSxLQUFBOztNQUVBLE9BQUEsR0FBQTs7Ozs7R0FLQSxHQUFBLFFBQUEsU0FBQSxNQUFBLE9BQUE7SUFDQSxPQUFBLE1BQUEsS0FBQSxVQUFBO01BQ0EsS0FBQSxVQUFBLEtBQUE7TUFDQSxHQUFBLGNBQUEsSUFBQSxLQUFBO01BQ0EsR0FBQSxtQkFBQSxJQUFBLEtBQUE7TUFDQSxXQUFBLGNBQUEsR0FBQTtNQUNBLFFBQUEsSUFBQSxTQUFBLElBQUEsS0FBQTtNQUNBLFFBQUEsSUFBQSxlQUFBLElBQUEsS0FBQTs7OztHQUlBLEdBQUEsZUFBQSxTQUFBLGFBQUEsT0FBQTtJQUNBLEdBQUEsY0FBQSxRQUFBLElBQUE7SUFDQSxHQUFBLG1CQUFBLFFBQUEsSUFBQTtJQUNBLFdBQUEsY0FBQSxHQUFBOzs7R0FHQSxHQUFBLFNBQUEsU0FBQSxTQUFBO0lBQ0E7SUFDQSxHQUFBLGdCQUFBO0lBQ0EsR0FBQSxjQUFBO0lBQ0EsR0FBQSxtQkFBQTtJQUNBLFdBQUEsY0FBQTtJQUNBLFFBQUEsT0FBQTtJQUNBLFFBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQTs7OztHQUlBLEdBQUEsYUFBQSxTQUFBLGFBQUE7SUFDQSxPQUFBLENBQUEsQ0FBQSxHQUFBOzs7S0FHQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnYXBwJywgWyd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nRmlsZVVwbG9hZCddKVxuXHRcdC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsIHN0b3JhZ2VQcm92aWRlcikge1xuXHRcdFx0XG5cdFx0XHQkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYmxvZycpO1xuXG5cdFx0XHQkc3RhdGVQcm92aWRlclxuXHRcdFx0XHQuc3RhdGUoJ2xvZ2luJywge1xuXHRcdFx0XHRcdHVybDogJy9sb2dpbicsXG5cdFx0XHRcdFx0dGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9sb2dpbi9pbmRleC5odG1sJyxcblx0XHRcdFx0XHRjb250cm9sbGVyOiAnTG9naW5Db250cm9sbGVyJyxcblx0XHRcdFx0XHRjb250cm9sbGVyQXM6ICdsb2dpbkN0cmwnXG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5zdGF0ZSgncG9zdCcsIHtcblx0XHRcdFx0XHR1cmw6ICcvcG9zdCcsXG5cdFx0XHRcdFx0dGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9wb3N0L2luZGV4Lmh0bWwnLFxuXHRcdFx0XHRcdGNvbnRyb2xsZXI6ICdQb3N0Q29udHJvbGxlcicsXG5cdFx0XHRcdFx0Y29udHJvbGxlckFzOiAncG9zdEN0cmwnLFxuXHRcdFx0XHRcdHJlc29sdmU6IHtcblx0XHRcdFx0XHRcdHBvc3RzOiBmdW5jdGlvbihQb3N0cykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUG9zdHMuZ2V0KCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRyZXF1aXJlc0xvZ2luOiB0cnVlXG5cdFx0XHRcdFx0fVx0XHRcdFx0XHRcblx0XHRcdFx0fSlcblx0XHRcdFx0LnN0YXRlKCdlZGl0LXBvc3QnLCB7XG5cdFx0XHRcdFx0dXJsOiAncG9zdC9lZGl0Lzpwb3N0SWQnLFxuXHRcdFx0XHRcdHRlbXBsYXRlVXJsOiAncGFydGlhbHMvcG9zdC9lZGl0Lmh0bWwnLFxuXHRcdFx0XHRcdGNvbnRyb2xsZXI6ICdQb3N0RWRpdENvbnRyb2xsZXInLFxuXHRcdFx0XHRcdGNvbnRyb2xsZXJBczogJ3Bvc3RFZGl0Q3RybCcsXG5cdFx0XHRcdFx0cmVzb2x2ZToge1xuXHRcdFx0XHRcdFx0cG9zdHM6IGZ1bmN0aW9uIChQb3N0cykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUG9zdHMuZ2V0KCk7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0cG9zdDogZnVuY3Rpb24gKFBvc3RzLCAkc3RhdGVQYXJhbXMsIHBvc3RzKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBQb3N0cy5maW5kKCRzdGF0ZVBhcmFtcy5wb3N0SWQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0cmVxdWlyZXNMb2dpbjogdHJ1ZVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSlcblx0XHRcdFx0LnN0YXRlKCdibG9nJywge1xuXHRcdFx0XHRcdHVybDogJy9ibG9nJyxcblx0XHRcdFx0XHR0ZW1wbGF0ZVVybDogJ3BhcnRpYWxzL2Jsb2cvaW5kZXguaHRtbCcsXG5cdFx0XHRcdFx0Y29udHJvbGxlcjogJ0Jsb2dDb250cm9sbGVyJyxcblx0XHRcdFx0XHRjb250cm9sbGVyQXM6ICdibG9nQ3RybCcsXG5cdFx0XHRcdFx0cmVzb2x2ZToge1xuXHRcdFx0XHRcdFx0cG9zdHM6IGZ1bmN0aW9uKFBvc3RzKSB7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBQb3N0cy5nZXQoKTtcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0XHRwb3N0OiBmdW5jdGlvbihQb3N0cywgJHN0YXRlUGFyYW1zLCBwb3N0cykge1xuXHRcdFx0XHRcdFx0XHRyZXR1cm4gUG9zdHMuZmluZCgkc3RhdGVQYXJhbXMucG9zdElkKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHQkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcblx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRyZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG5cdFx0XHRcdFx0XHR2YXIgVXNlcnMgPSAkaW5qZWN0b3IuZ2V0KCdVc2VycycpO1xuXHRcdFx0XHRcdFx0aWYoVXNlcnMuaXNMb2dnZWRJbigpKSBjb25maWcuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ1Rva2VuICcgKyBVc2Vycy5jdXJyZW50VXNlclRva2VuO1xuXHRcdFx0XHRcdFx0cmV0dXJuIGNvbmZpZztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9KTtcblx0XHR9KVxuXHRcdC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIFVzZXJzLCAkc3RhdGUsIHN0b3JhZ2UpIHtcblx0XHRcdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSkge1xuXHRcdFx0XHRpZiAodG9TdGF0ZS5kYXRhICYmIHRvU3RhdGUuZGF0YS5yZXF1aXJlc0xvZ2luKSB7XG5cdFx0XHRcdFx0aWYgKCFVc2Vycy5pc0xvZ2dlZEluKCkpIHtcblx0XHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0XHQkc3RhdGUuZ28oJ2xvZ2luJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0VXNlcnMuc3RheUxvZ2dlZEluKCk7XG5cblx0XHRcdGlmICghVXNlcnMuY3VycmVudFVzZXIgfHwgIVVzZXJzLmN1cnJlbnRVc2VyVG9rZW4pIHtcblx0XHRcdFx0JHN0YXRlLmdvKCdsb2dpbicpO1xuXHRcdFx0fVxuXHRcdH0pO1xufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnYXBwJylcblx0XHQuY29udHJvbGxlcignQmxvZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoUG9zdHMsIHBvc3RzLCBwb3N0LCBVc2VycywgJHJvb3RTY29wZSwgJHN0YXRlKSB7XG5cdFx0XHRkZWJ1Z2dlcjtcblx0XHRcdHZhciB2bSA9IHRoaXM7XG5cblx0XHRcdHZtLnBvc3QgPSBwb3N0O1xuXHRcdFx0dm0ucG9zdHMgPSBwb3N0cztcblx0XHRcdHZtLmxvZ291dCA9IFVzZXJzLmxvZ291dDtcblx0XHR9KTtcbn0oKSk7IiwiKGZ1bmN0aW9uICgpIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2FwcCcpXG5cdFx0LmRpcmVjdGl2ZSgnbmF2QmFyJywgZnVuY3Rpb24gKFVzZXJzKSB7XG5cdFx0XHRmdW5jdGlvbiBjb250cm9sbGVyKCRzY29wZSwgVXNlcnMpIHtcblx0XHRcdFx0JHNjb3BlLmxvZ291dCA9IFVzZXJzLmxvZ291dDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICdwYXJ0aWFscy9kaXJlY3RpdmVzL25hdi5odG1sJyxcblx0XHRcdFx0Y29udHJvbGxlcjogY29udHJvbGxlclxuXHRcdFx0fTtcblx0XHR9KTtcblxufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICBhbmd1bGFyLm1vZHVsZSgnYXBwJylcbiAgICAuZmlsdGVyKCduaWNlRGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAodGltZVN0YW1wLCBmb3JtYXQpIHtcbiAgICAgICAgZm9ybWF0ID0gZm9ybWF0IHx8ICdNTU1NIERvLCBZWVlZJztcbiAgICAgICAgdmFyIG0gPSBtb21lbnQodGltZVN0YW1wKTtcbiAgICAgICAgcmV0dXJuIG0uZm9ybWF0KGZvcm1hdCk7XG4gICAgICB9O1xuICAgIH0pO1xufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnYXBwJylcblx0XHQuY29udHJvbGxlcignTG9naW5Db250cm9sbGVyJywgZnVuY3Rpb24gKFVzZXJzLCAkc3RhdGUsIHN0b3JhZ2UpIHtcblx0XHRcdHZhciB2bSA9IHRoaXM7XG5cdFx0XHRcblx0XHRcdHZtLmNyZWRzID0ge307XG5cdFx0XHRcblx0XHRcdHZtLmxvZ2luID0gZnVuY3Rpb24gbG9naW4oY3JlZHMpIHtcblx0XHRcdFx0VXNlcnMubG9naW4oY3JlZHMpXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRcdFx0JHN0YXRlLmdvKCdibG9nJyk7XG5cdFx0XHRcdFx0fSwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdFx0dm0ubG9naW5GYWlsZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0fTtcblx0XHR9KTtcbn0oKSk7IiwiKGZ1bmN0aW9uICgpIHtcblx0XG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnYXBwJylcblx0XHQuY29udHJvbGxlcignUG9zdEVkaXRDb250cm9sbGVyJywgZnVuY3Rpb24gKFBvc3RzLCBwb3N0LCBwb3N0cykge1xuXHRcdFx0ZGVidWdnZXI7XG5cdFx0XHR2YXIgdm0gPSB0aGlzO1xuXG5cdFx0XHR2bS5wb3N0ID0gcG9zdDtcblx0XHRcdHZtLnBvc3RzID0gcG9zdHM7XG5cdFx0XHR2bS5wb3N0Q29weSA9IF8uY2xvbmUocG9zdCk7XG5cdFx0fSk7XG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuXHRcdC5jb250cm9sbGVyKCdQb3N0Q29udHJvbGxlcicsIGZ1bmN0aW9uIChQb3N0cywgcG9zdHMsIFVzZXJzLCAkcm9vdFNjb3BlLCAkc3RhdGUpIHtcdFxuXHRcdFx0dmFyIHZtID0gdGhpcztcblxuXHRcdFx0dm0ucG9zdCA9IHt9O1xuXG5cdFx0XHR2bS5wb3N0cyA9IHBvc3RzO1xuXHRcdFx0dm0uYWRkID0gUG9zdHMucG9zdDtcblx0XHRcdHZtLmxvZ291dCA9IFVzZXJzLmxvZ291dDtcblx0XHRcdHZtLmFkZGVkID0gZmFsc2U7XG5cdFx0fSk7XG59KCkpOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGFuZ3VsYXIubW9kdWxlKCdhcHAnKVxuICAgIC5wcm92aWRlcignc3RvcmFnZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciB2bSA9IHRoaXMsXG4gICAgICAgIHByZWZpeCA9ICcnLFxuICAgICAgICBkZWxpbWl0ZXIgPSAnLic7XG5cbiAgICAgIC8qKlxuICAgICAgICogU2V0IGEgcHJlZml4IGZvciBvdXIgbG9jYWxTdG9yYWdlIHRoYXQgd2lsbCBiZSB1c2VkIHdoZW5cbiAgICAgICAqIHNldHRpbmcgYW5kIGdldHRpbmcga2V5cy5cbiAgICAgICAqXG4gICAgICAgKiBAcGFyYW0gX3ByZWZpeFxuICAgICAgICogQHBhcmFtIF9kZWxpbWl0ZXJcbiAgICAgICAqL1xuICAgICAgdm0uc2V0UHJlZml4ID0gZnVuY3Rpb24gc2V0UHJlZml4KF9wcmVmaXgsIF9kZWxpbWl0ZXIpIHtcbiAgICAgICAgaWYgKCFfcHJlZml4KSByZXR1cm47XG4gICAgICAgIHByZWZpeCA9IF9wcmVmaXg7XG5cbiAgICAgICAgaWYgKF9kZWxpbWl0ZXIpIGRlbGltaXRlciA9IF9kZWxpbWl0ZXI7XG4gICAgICB9O1xuXG4gICAgICAvKipcbiAgICAgICAqIENvbnZlbmllbmNlIG1ldGhvZCBmb3IgZmluZGluZyBvdXIgc3RvcmFnZSBrZXlzLlxuICAgICAgICpcbiAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAqIEByZXR1cm5zIHsqfVxuICAgICAgICovXG4gICAgICBmdW5jdGlvbiBnZXRLZXkoa2V5KSB7XG4gICAgICAgIHJldHVybiBwcmVmaXggPyBwcmVmaXggKyBkZWxpbWl0ZXIgKyBrZXkgOiBrZXk7XG4gICAgICB9XG5cbiAgICAgIC8qKlxuICAgICAgICogVGhlIHJlcXVpcmVkICRnZXQgbWV0aG9kIGZvciBvdXIgc2VydmljZSBwcm92aWRlci5cbiAgICAgICAqXG4gICAgICAgKiBAcmV0dXJucyB7e3NldDogRnVuY3Rpb24sIGdldDogRnVuY3Rpb24sIGZvcmdldDogRnVuY3Rpb259fVxuICAgICAgICovXG4gICAgICB2bS4kZ2V0ID0gZnVuY3Rpb24gJGdldCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBTZXQgYSB2YWx1ZSBpbnRvIHRoZSBsb2NhbCBzdG9yYWdlLiAgU2ltcGxlIGpzb24gc3RyaW5naWZ5IGZvciBvYmplY3RzLlxuICAgICAgICAgICAqXG4gICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAqIEBwYXJhbSB2YWxcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIHNldChrZXksIHZhbCkge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oZ2V0S2V5KGtleSksIEpTT04uc3RyaW5naWZ5KHZhbCkpO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBHZXQgYSB2YWx1ZSBmcm9tIGxvY2FsU3RvcmFnZS4gIElmIGEgY29udmVydGVyIGlzIHByb3ZpZGVkIHRoZVxuICAgICAgICAgICAqIHJldHJpZXZlZCBvYmplY3Qgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCBnaXZlbiBmdW5jdGlvbiBhbmRcbiAgICAgICAgICAgKiB0aGUgcmVzdWx0IG9mIFRIQVQgZnVuY3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgICAqXG4gICAgICAgICAgICogQHBhcmFtIGtleVxuICAgICAgICAgICAqIEBwYXJhbSBjb252ZXJ0ZXJcbiAgICAgICAgICAgKiBAcmV0dXJucyB7Kn1cbiAgICAgICAgICAgKi9cbiAgICAgICAgICBnZXQ6IGZ1bmN0aW9uIGdldChrZXksIGNvbnZlcnRlcikge1xuICAgICAgICAgICAgY29udmVydGVyID0gYW5ndWxhci5pc0Z1bmN0aW9uKGNvbnZlcnRlcikgPyBjb252ZXJ0ZXIgOiBhbmd1bGFyLmlkZW50aXR5O1xuICAgICAgICAgICAgcmV0dXJuIGNvbnZlcnRlcihKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKGdldEtleShrZXkpKSkpO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICAvKipcbiAgICAgICAgICAgKiBSZW1vdmUgYW4gaXRlbSBmcm9tIGxvY2FsU3RvcmFnZS5cbiAgICAgICAgICAgKlxuICAgICAgICAgICAqIEBwYXJhbSBrZXlcbiAgICAgICAgICAgKi9cbiAgICAgICAgICBmb3JnZXQ6IGZ1bmN0aW9uIGZvcmdldChrZXkpIHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKGdldEtleShrZXkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgIH0pO1xufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG5cdCd1c2Ugc3RzcmljdCc7XG5cblx0YW5ndWxhci5tb2R1bGUoJ2FwcCcpXG5cdFx0LnNlcnZpY2UoJ1Bvc3RzJywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUsICRxLCBVcGxvYWQpIHtcblx0XHRcdHZhciB2bSA9IHRoaXM7XG5cblx0XHRcdHZtLnBvc3RzID0gW107XG5cblx0XHRcdHZtLmZpbmQgPSBmdW5jdGlvbiBmaW5kKHBvc3RJZCkge1xuXHRcdFx0XHRyZXR1cm4gXy5maW5kKHZtLnBvc3RzLCB7X2lkOiBwb3N0SWR9KTtcblx0XHRcdH07XG5cblx0XHRcdHZtLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3Bvc3RzLycpXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlcykge1xuXHRcdFx0XHRcdFx0dm0ucG9zdHMuc3BsaWNlKDApO1xuXHRcdFx0XHRcdFx0cmVzLmRhdGEuZm9yRWFjaChmdW5jdGlvbiAocG9zdCkge1xuXHRcdFx0XHRcdFx0XHR2bS5wb3N0cy5wdXNoKHBvc3QpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdHJldHVybih2bS5wb3N0cyk7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXG5cdFx0XHR2bS5wb3N0ID0gZnVuY3Rpb24gcG9zdChwb3N0KSB7XG5cdFx0XHRcdGRlYnVnZ2VyO1xuXHRcdFx0XHR2YXIgZGZyZCA9ICRxLmRlZmVyKCk7XG5cblx0XHRcdFx0aWYgKHBvc3QuYmxvZ0ltYWdlcykge1xuXHRcdFx0XHRcdFVwbG9hZC51cGxvYWQoe1xuXHRcdFx0XHRcdFx0XHR1cmw6ICcvcG9zdHMnLFxuXHRcdFx0XHRcdFx0XHRhcnJheUtleTogJycsXG5cdFx0XHRcdFx0XHRcdGRhdGE6IHBvc3Rcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQudGhlbihkZnJkLnJlc29sdmUsIGRmcmQucmVqZWN0KTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gJGh0dHAucG9zdCgnL3Bvc3RzJywgcG9zdClcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcblx0XHRcdFx0XHRcdFx0dm0ucG9zdHMucHVzaChyZXMuZGF0YSk7XG5cdFx0XHRcdFx0XHRcdGRmcmQucmVzb2x2ZShyZXMpO1xuXHRcdFx0XHRcdFx0fSwgZnVuY3Rpb24gKGVycikge1xuXHRcdFx0XHRcdFx0XHRkZnJkLnJlZmVjdChlcnIpO1xuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIGRmcmQucHJvbWlzZTtcblx0XHRcdH07XG5cblx0XHRcdHZtLnB1dCA9IGZ1bmN0aW9uIHB1dChwb3N0Q29weSkge1xuXHRcdFx0XHR2YXIgZGF0YSA9IHtcblx0XHRcdFx0XHR0aXRsZTogcG9zdENvcHkudGl0bGUsXG5cdFx0XHRcdFx0Ym9keTogcG9zdENvcHkuYm9keSxcblx0XHRcdFx0XHRsaW5rOiBwb3N0Q29weS5saW5rXG5cdFx0XHRcdH07XG5cdFx0XHRcdFxuXHRcdFx0XHRyZXR1cm4gJGh0dHAucHV0KCcvcG9zdHMvJyArIHBvc3RDb3B5Ll9pZCwgZGF0YSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdFx0XHR2YXIgcCA9IHZtLmZpbmQocHJvamVjdENvcHkuX2lkKTtcblx0XHRcdFx0XHRcdF8ubWVybmdlKHAsIHByb2plY3RDb3B5KTtcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAoZXJyKSB7XG5cdFx0XHRcdFx0XHQvL1RPRE86IEhhbmRsZSBpZiBwb3N0IGNhbid0IGJlIHVwZGF0ZWQuXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXHRcdH0pO1xufSgpKTsiLCIoZnVuY3Rpb24gKCkge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRhbmd1bGFyLm1vZHVsZSgnYXBwJylcblx0XHQuc2VydmljZSgnVXNlcnMnLCBmdW5jdGlvbiAoJGh0dHAsICRzdGF0ZSwgc3RvcmFnZSwgJHJvb3RTY29wZSkge1xuXHRcdFx0dmFyIHZtID0gdGhpcztcblxuXHRcdFx0dm0uY3VycmVudFVzZXIgPSBudWxsO1xuXHRcdFx0dm0uY3VycmVudFVzZXJUb2tlbiA9IG51bGw7XG5cblx0XHRcdHZtLnVzZXJzID0gW107XG5cblx0XHRcdHZtLmZpbmQgPSBmdW5jdGlvbiBmaW5kKHVzZXJJZCkge1xuXHRcdFx0XHRyZXR1cm4gXy5maW5kKHZtLnVzZXJzLCB7X2lkOiB1c2VySWR9KTtcblx0XHRcdH07XG5cdFx0XHRcblx0XHRcdC8vR2V0IGFsbCB1c2VycyBmcm9tIHRoZSBkYXRhYmFzZS5cblx0XHRcdHZtLmdldCA9IGZ1bmN0aW9uIGdldCgpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3VzZXJzJylcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdFx0XHR2bS51c2Vycy5zcGxpY2UoMCk7XG5cblx0XHRcdFx0XHRcdHJlcy5kYXRhLmZvckVhY2goZnVuY3Rpb24gKHVzZXIpIHtcblx0XHRcdFx0XHRcdFx0dm0udXNlcnMucHVzaChuZXcgVXNlcih1c2VyKSk7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHJldHVybiB2bS51c2Vycztcblx0XHRcdFx0XHR9KTtcblx0XHRcdH07XG5cblx0XHRcdC8vTG9naW4gYSB1c2VyIHdpdGggcHJvdmlkZWQgY3JlZGVudGlhbHMuXG5cdFx0XHR2bS5sb2dpbiA9IGZ1bmN0aW9uIGxvZ2luKGNyZWRzKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkcylcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzKSB7XG5cdFx0XHRcdFx0XHR2bS5jdXJyZW50VXNlciA9IHJlcy5kYXRhLnVzZXI7XG5cdFx0XHRcdFx0XHR2bS5jdXJyZW50VXNlclRva2VuID0gcmVzLmRhdGEudG9rZW47XG5cdFx0XHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gdm0uY3VycmVudFVzZXI7XG5cdFx0XHRcdFx0XHRzdG9yYWdlLnNldCgndG9rZW4nLCByZXMuZGF0YS50b2tlbik7XG5cdFx0XHRcdFx0XHRzdG9yYWdlLnNldCgnY3VycmVudFVzZXInLCByZXMuZGF0YS51c2VyKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdH07XG5cblx0XHRcdHZtLnN0YXlMb2dnZWRJbiA9IGZ1bmN0aW9uIHN0YXlMb2dnZWRJbihjcmVkcykge1xuXHRcdFx0XHR2bS5jdXJyZW50VXNlciA9IHN0b3JhZ2UuZ2V0KCdjdXJyZW50VXNlcicpO1xuXHRcdFx0XHR2bS5jdXJyZW50VXNlclRva2VuID0gc3RvcmFnZS5nZXQoJ3Rva2VuJyk7XG5cdFx0XHRcdCRyb290U2NvcGUuY3VycmVudFVzZXIgPSB2bS5jdXJyZW50VXNlcjtcblx0XHRcdH07XG5cblx0XHRcdHZtLmxvZ291dCA9IGZ1bmN0aW9uIGxvZ291dCgpIHtcblx0XHRcdFx0ZGVidWdnZXI7XG5cdFx0XHRcdHZtLmxvZ091dFN1Y2Nlc3MgPSB0cnVlO1xuXHRcdFx0XHR2bS5jdXJyZW50VXNlciA9IG51bGw7XG5cdFx0XHRcdHZtLmN1cnJlbnRVc2VyVG9rZW4gPSBudWxsO1xuXHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblx0XHRcdFx0c3RvcmFnZS5mb3JnZXQoJ2N1cnJlbnRVc2VyJyk7XG5cdFx0XHRcdHN0b3JhZ2UuZm9yZ2V0KCd0b2tlbicpO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2Jsb2cnKTtcblx0XHRcdH07XG5cblx0XHRcdC8vY2hlY2tzIHRvIHNlZSBpZiBjdXJyZW50IHVzZXIgaXMgbG9nZ2VkIGluLlxuXHRcdFx0dm0uaXNMb2dnZWRJbiA9IGZ1bmN0aW9uIGlzTG9nZ2VkSW4oKSB7XG5cdFx0XHRcdHJldHVybiAhIXZtLmN1cnJlbnRVc2VyO1xuXHRcdFx0fTtcdFxuXHRcdH0pO1xufSgpKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
