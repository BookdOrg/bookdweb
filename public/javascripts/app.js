window.jQuery = require('jquery');
window.$ = global.jQuery;
window._ = require('lodash');
window.io = require('socket.io-client');

var angular = require('angular');
require('angular-ui-router');
require('angular-file-upload');
require('angular-stripe-checkout');
require('angular-timer');
require('ngmap');
require('bootstrap');

var app = angular.module('cc', ['ui.router',
    'google.places',
    'ngGeolocation',
    'ui.calendar',
    'ui.bootstrap',
    'ngMap',
    'angularFileUpload',
    'angularjs-dropdown-multiselect',
    'stripe.checkout',
    'timer',
    'ngTouch'
]);

app.constant('CLOUDINARY_BASE', 'https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v')
    .constant('CLOUDINARY_Default', 'https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_300,w_300/v1432411957/profile/placeholder.jpg')
    .constant('localDevHost', 'localhost')
    .constant('devHost', 'dev.bookd.me')
    .constant('devPort', '8112')
    .constant('facebookApi', 'https://graph.facebook.com/')
    .constant('googleApi', 'https://www.googleapis.com/plus/v1/people/');


require('./services');
require('./controllers');
require('./directives');
require('./filters');

app.config([
    '$stateProvider',
    '$urlRouterProvider',
    '$locationProvider',
    function ($stateProvider, $urlRouterProvider, $locationProvider) {
        $locationProvider.html5Mode(true);
        $stateProvider
            .state('landing', {
                url: '/',
                views: {
                    'nav': {
                        templateUrl: '/partials/landingNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/landing.html',
                        controller: 'LandingCtrl'
                    }
                }
            })
            .state('feed', {
                url: '/feed',
                controller: 'MainCtrl',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/feed.html',
                        controller: 'MainCtrl'
                    }
                }
            })
            .state('business', {
                url: '/business/{businessid}',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/business.html',
                        controller: 'businessCtrl'
                    }
                },
                resolve: {
                    business: ['$stateParams', 'businessFactory', function ($stateParams, businessFactory) {
                        return businessFactory.getBusiness($stateParams.businessid);
                    }]
                }
            })
            .state('user', {
                url: '/user/:id/profile',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/profile.html',
                        controller: 'ProfileCtrl'
                    }
                },
                resolve: {
                    isAuthenticated: function ($state, $q, auth) {
                        var redirect = false;
                        if (!auth.isLoggedIn()) {
                            redirect = true;
                            return $q.reject({
                                state: 'error'
                            });
                        }
                        return redirect;
                    }
                }
            })
            .state('account', {
                url: '/user/:id/account',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/account.html',
                        controller: 'AccountCtrl'
                    }
                },
                resolve: {
                    isAuthenticated: function ($state, $q, auth) {
                        var redirect = false;
                        if (!auth.isLoggedIn()) {
                            redirect = true;
                            return $q.reject({
                                state: 'error'
                            });
                        }
                        return redirect;
                    }
                }
            })
            .state('partner', {
                url: '/partner',
                controller: 'NavCtrl as NavCtrl',
                views: {
                    'nav': {
                        templateUrl: '/partials/landingNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/partner.html',
                        controller: 'NavCtrl'
                    }
                }
            })
            .state('dashboard', {
                url: '/dashboard',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/dashboard.html',
                        controller: 'dashboardCtrl'
                    }
                },
                resolve: {
                    businesses: ['userFactory', function (userFactory) {
                        return userFactory.getDashboard();
                    }],
                    isAuthenticated: function ($state, $q, auth) {
                        var redirect = false;
                        if (!auth.isLoggedIn()) {
                            redirect = true;
                            return $q.reject({
                                state: 'error'
                            });
                        }
                        return redirect;
                    }
                }
            })
            .state('favorites', {
                url: '/favorites',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/favorites.html',
                    }
                }
            })
            .state('calendar', {
                url: '/calendar',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/calendar.html',
                        controller: 'calendarCtrl'
                    }
                },
                resolve: {
                    isAuthenticated: function ($state, $q, auth) {
                        var redirect = false;
                        if (!auth.isLoggedIn()) {
                            redirect = true;
                            return $q.reject({
                                state: 'error'
                            });
                        }
                        return redirect;
                    }
                }
            })
            .state('search', {
                url: '/join',
                views: {
                    'nav': {
                        templateUrl: '/partials/bookdNav.html',
                        controller: 'NavCtrl'
                    },
                    'content': {
                        templateUrl: '/partials/search.html',
                        controller: 'searchCtrl'
                    }
                }
            })
            .state('about', {
                url: '/about',
                templateUrl: 'partials/about.html'
            })
            .state('contact', {
                url: '/contactUs',
                templateUrl: 'partials/contact.html'
            });
        $urlRouterProvider.otherwise('/');
    }]).run(function ($rootScope, auth, $templateCache, devHost, $geolocation, $http, $state, location, businessFactory,
                      $controller, $uibModal, notificationFactory) {
    OAuth.initialize('mPBNkFFrqBA1L6cT0C7og9-xdQM');
    $rootScope.currentUser = auth.currentUser();
    $rootScope.cloudinaryBaseUrl = 'https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_200,r_10,w_200/v';
    $rootScope.cloudinaryDefaultPic = 'https://res.cloudinary.com/dvvtn4u9h/image/upload/c_thumb,h_200,r_10,w_200/v1432411957/profile/placeholder.jpg';

    if (auth.isLoggedIn()) {
        notificationFactory.getNotifications().then(
            function (data) {
                $rootScope.currentUser.user.notifications = data;
            },
            function (err) {
                console.log(err);
            }
        );
    }

    $rootScope.$on('$routeChangeStart', function (event, next, current) {
        if (typeof(current) !== 'undefined') {
            $templateCache.remove(current.templateUrl);
        }
    });
    if ($state.current.name === 'landing') {
        $rootScope.showLandingNav = true;
    } else {
        $rootScope.showLandingNav = false;
    }
    $rootScope.$on('$stateChangeError', function (event, toState, toStateParams,
                                                  fromState, fromStateParams, error) {

        if (error) {
            console.log(error);
            $state.go('landing');
            var navViewModel = $rootScope.$new();
            $controller('NavCtrl', {$scope: navViewModel});
            navViewModel.open('md', 'landing');
        }

    });

    //TODO Move this to a service!
    $rootScope.query = {
        location: null,
        term: null
    };
    if (!location.currPosition) {
        $geolocation.watchPosition({
            timeout: 60000,
            maximumAge: 250,
            enableHighAccuracy: true
        });
        $rootScope.myPosition = $geolocation.position;
        /**
         *
         * Watch for when the users location changes, make a call to the google maps api to
         * get information about the users current location.
         *
         * Auto populate that information in the query location object, to be displayed in the navbar.
         *
         */
        $rootScope.$watch('myPosition.coords.latitude', function (newVal, oldVal) {
            $rootScope.loadingLocation = true;
            if (newVal) {
                $rootScope.loadingLocation = false;
                $http.get('https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyAK1BOzJxHB8pOFmPFufYdcVdAuLr_6z2U&latlng='
                        + $rootScope.myPosition.coords.latitude + ','
                        + $rootScope.myPosition.coords.longitude)
                    .then(function (data) {
                        $rootScope.loadingLocation = false;
                        if (data) {
                            location.setPosition(data.data.results);
                            $rootScope.currLocation = location.currPosition;
                            $rootScope.query.location = $rootScope.currLocation.city;

                        }
                    }, function (error) {
                        //TODO Google wants us to access this API from a server, not a client.
                        console.log("If seeing this, probably CORS error with googleapis geocode");
                        console.log(error);
                    });
            }
        });
    }
    /**
     *
     * Concatenates the query term and query location entered in the Navbar
     * to create the query string being sent to the Places API on the backend.
     *
     * If the typeOf the queryLocation is a string, (User typed it in) then concatenate
     * query.location with query.term
     *
     * If the typeOf the queryLocation is !string (an Object) then concatenate query.location.vicinity
     * with query.term
     *
     * @param query - Object with term and location properties. Location will either be a string or an object.
     */

    $rootScope.search = function (query) {
        $rootScope.fetchingQuery = true;
        var formattedQuery;
        if (typeof query.location === 'string') {
            formattedQuery = query.term + ' ' + query.location;
        } else {
            formattedQuery = query.term + ' ' + query.location.vicinity;
        }

        businessFactory.search(formattedQuery)
            .then(function (data) {
                $rootScope.fetchingQuery = false;
                if (!$state.is('feed')) {
                    $state.go('feed');
                    $rootScope.results = data;
                }
            });
    };

    $rootScope.openMessages = function (size) {
        var modalInstance = $uibModal.open({
            //animation: $scope.animationsEnabled,
            templateUrl: 'messagesModal.html',
            controller: 'messagesModalCtrl',
            size: size,
            resolve: {
                //messages: function(){
                //    return
                //}
            }
        });
    };
});
