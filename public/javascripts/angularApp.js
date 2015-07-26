
angular.module('cc', ['ui.router',
  'cc.main-controller',
  'cc.auth-controller',
  'cc.nav-controller',
  'cc.account-controller',
  'cc.auth-factory',
  'cc.business-factory',
  'cc.profile-controller',
  'cc.user-factory',
  'angularFileUpload',
  'cc.thumb-directive',
  'cc.landing-controller',
  'ui.bootstrap',
  'cc.modalInstance',
  'ngGeolocation',
  'cloudinary',
  'cc.location-factory',
  'google.places',
  'cc.bizlist-controller',
  'cc.business-controller',
  'cc.yelp-service',
  'ui.calendar'
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
      url: '/home',
      templateUrl: 'partials/home.html',
      controller: 'MainCtrl',
      resolve: {
        categories: ['business',function(business){
          return business.getCategories();
        }]
      }
    })
    .state('bizlist',{
      url:'/category/{cat}/{location}',
      templateUrl:'partials/bizlist.html',
      controller:'bizlistCtrl',
      resolve: {
        businesses:['$http','$stateParams','yelpService', function($http,$stateParams,yelpService){
          var cat = $stateParams.cat;
          var location = $stateParams.location;
          return businesses = yelpService.search(cat,location);
        }]
      }
    })
    .state('business',{
      url:'/business/{businessid}',
      templateUrl:'partials/business.html',
      controller:'businessCtrl',
      resolve:{
        business:['$http','$stateParams','yelpService', function($http,$stateParams,yelpService){
          var id = $stateParams.businessid;
          return businesses = yelpService.business(id);
        }]
      }
    })
    // .state('posts', {
    //   url: '/posts/{id}',
    //   templateUrl: 'partials/posts.html',
    //   controller: 'PostsCtrl',
    //   resolve: {
    //     post: ['$stateParams', 'posts', function($stateParams, posts) {
    //       return posts.get($stateParams.id);
    //     }]
    //   }
    // })
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
      }]
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
