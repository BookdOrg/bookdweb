angular.module('cc', ['ui.router',
  'cc.config',
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
  'ui.calendar',
  'cc.claim-controller',
  'cc.admin-controller',
  'cc.admin-service',
  'cc.search-controller',
  'cc.dashboard-controller',
  'cc.socket-service',
  'angularjs-dropdown-multiselect',
  'angularMoment',
  'stripe.checkout',
  ])
.config([
'$stateProvider',
'$urlRouterProvider',
'$locationProvider',
function($stateProvider, $urlRouterProvider,$locationProvider) {
  $locationProvider.html5Mode(true);
  $stateProvider
    .state('landing',{
      url:'/',
      templateUrl: 'partials/landing.html',
      controller: 'landingCtrl'
    })
    .state('feed', {
      url: '/feed',
      templateUrl: 'partials/feed.html',
      controller: 'MainCtrl'
//      resolve: {
//        categories: ['businessFactory',function(businessFactory){
//          return businessFactory.getCategories();
//        }]
//      }
    })
    .state('bizlist',{
      url:'/category/{cat}/{location}',
      templateUrl:'partials/bizlist.html',
      controller:'bizlistCtrl'
      // resolve: {
      //   businesses:['$http','$stateParams',function($http,$stateParams){
      //     var cat = $stateParams.cat;
      //     var location = $stateParams.location;
      //     return businesses = yelpService.search(cat,location);
      //   }]
      // }
    })
    .state('business',{
      url:'/business/{businessid}',
      templateUrl:'partials/business.html',
      controller:'businessCtrl',
       resolve:{
         business:['$stateParams','businessFactory',function($stateParams,businessFactory){
           var business;
           return business = businessFactory.getBusiness($stateParams.businessid);
         }]
       }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'partials/login.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('feed');
        }
      }]
    })
    .state('register', {
      url: '/register',
      templateUrl: 'partials/register.html',
      controller: 'AuthCtrl',
      onEnter: ['$state', 'auth', function($state, auth){
        if(auth.isLoggedIn()){
          $state.go('feed');
        }
      }]
    })
    .state('user',{
      url:'/user/:username/profile',
      templateUrl:'partials/profile.html',
      controller:'ProfileCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.isLoggedIn()){
          $state.go('landing');
        }
      }]
    })
    .state('account',{
      url:'/user/:username/account',
      templateUrl:'partials/account.html',
      controller:'AccountCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.isLoggedIn()){
          $state.go('landing');
        }
      }]
    })
//    .state('claim',{
//      url:'/claim/:business',
//      templateUrl:'partials/claim.html',
//      controller:'claimController',
//      onEnter: ['$state','auth',function($state,auth){
//        if(!auth.isLoggedIn()){
//          $state.go('landing');
//        }
//      }],
//      resolve:{
//        claimInfo:['$http','$stateParams','yelpService', function($http,$stateParams,yelpService){
//          var id = $stateParams.business;
//          return claimInfo = yelpService.business(id);
//        }]
//      }
//    })
    .state('admin',{
      url:'/admin',
      templateUrl:'partials/admin.html',
      controller:'AdminCtrl',
      onEnter: ['$state','auth',function($state,auth){
        if(!auth.currentUser().isAdmin){
          $state.go('landing');
        }
      }],
      resolve:{
        pendingRequests:['$http','adminService', function($http,businessFactory){
          var pendingRequests;
          return pendingRequests = businessFactory.getRequests();
        }]
      }
    })
    .state('dashboard',{
      url:'/dashboard',
      templateUrl:'partials/dashboard.html',
      controller:'dashboardCtrl',
      resolve:{
          businesses:['user',function(user){
              var businesses;
              return businesses = user.getDashboard();
          }]
      }
    })
    .state('search',{
      url:'/join',
      templateUrl:'partials/search.html',
      controller:'searchCtrl'
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
}]).run(function($rootScope,auth,$templateCache,devHost,$modal){
  $rootScope.currentUser = auth.currentUser();
  $rootScope.cloudinaryBaseUrl = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_150,r_10,w_150/v";
  $rootScope.cloudinaryDefaultPic = "http://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_100,r_10,w_100/v1432411957/profile/placeholder.jpg";
//  var socket = io.connect('//'+devHost+':8112');
  $rootScope.$on('$routeChangeStart', function(event, next, current) {
        if (typeof(current) !== 'undefined'){
            $templateCache.remove(current.templateUrl);
        }
    });

    $rootScope.openMessages = function(size){
        var modalInstance = $modal.open({
            //animation: $scope.animationsEnabled,
            templateUrl: 'messagesModal.html',
            controller: 'messagesModalCtrl',
            size: size,
            resolve:{
                //messages: function(){
                //    return
                //}
            }
        });
    }
});
