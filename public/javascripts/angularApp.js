
angular.module('oddJob', ['ui.router',
  'oddjob.main-controller',
  'oddjob.auth-controller',
  'oddjob.nav-controller',
  'oddjob.post-controller',
  'oddjob.auth-factory',
  'oddjob.post-factory',
  'oddjob.profile-controller',
  'oddjob.user-factory',
  'angularFileUpload',
  'oddjob.thumb-directive'
  ])
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['posts', function(posts){
          return posts.getAll();
        }]
      }
    })
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: '/posts.html',
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: '/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: '/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('user',{
      url:'/user/:id/profile',
      templateUrl:'/user.html',
      controller:'ProfileCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    });

  $urlRouterProvider.otherwise('home');
}]);
