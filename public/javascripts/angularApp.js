
angular.module('oddJob', ['ui.router',
  'oddjob.main-controller',
  'oddjob.auth-controller',
  'oddjob.nav-controller',
  'oddjob.post-controller',
  'oddjob.account-controller',
  'oddjob.auth-factory',
  'oddjob.post-factory',
  'oddjob.profile-controller',
  'oddjob.user-factory',
  'angularFileUpload',
  'oddjob.thumb-directive',
  'oddjob.landing-controller',
  'ui.bootstrap',
  'oddjob.modalInstance'
  ])
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('landing',{
      url:'/',
      templateUrl: 'partials/landing.html',
      controller: 'landingCtrl',
    })
    .state('home', {
      url: '/jobs',
      templateUrl: 'partials/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['posts', function(posts){
          return posts.getAll();
        }]
      }
    })
    .state('posts', {
      url: '/posts/{id}',
      templateUrl: 'partials/posts.html',
      controller: 'PostsCtrl',
      resolve: {
        post: ['$stateParams', 'posts', function($stateParams, posts) {
          return posts.get($stateParams.id);
        }]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'partials/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: 'partials/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('home');
        }
      }]
    })
    .state('user',{
      url:'/user/:id/profile',
      templateUrl:'partials/profile.html',
      controller:'ProfileCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.isLoggedIn()){
          $state.go('landing');
        }
      }],
      resolve:{
        myPosts:['$stateParams','posts',function($stateParams,posts){
          return posts.getUserPosts($stateParams.id);
        }]
      }
    })
    .state('account',{
      url:'/user/:id/account',
      templateUrl:'partials/account.html',
      controller:'AccountCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.isLoggedIn()){
          $state.go('landing');
        }
      }]
    })
    .state('about',{
      url:'/about',
      templateUrl:'partials/about.html'
    })
    .state('contact',{
      url:'/contactUs',
      templateUrl:'partials/contact.html'
    })


  $urlRouterProvider.otherwise('/');
}]);
