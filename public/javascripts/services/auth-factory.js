/*
 *
 * Created by: Khalil Brown
 *
 * AUTH Factory - Handles user authentication, login, registration, tokens.
 *
 */

angular.module('cc.auth-factory', [])
    .factory('auth', ['$http', '$window', '$rootScope', '$state', '$q', function ($http, $window, $rootScope, $state, $q) {
        var auth = {
            saveToken: function (token) {
                $window.localStorage['cc-token'] = token;
            },
            getToken: function () {
                return $window.localStorage['cc-token'];
            },
            isLoggedIn: function () {
                var token = auth.getToken();

                if (token !== 'undefined' && angular.isDefined(token)) {
                    var payload = angular.fromJson($window.atob(token.split('.')[1]));

                    return payload.exp > Date.now() / 1000;
                } else {
                    return false;
                }
            },
            currentUser: function () {
                if (auth.isLoggedIn()) {
                    var token = auth.getToken();
                    return angular.fromJson($window.atob(token.split('.')[1]));
                }
            },
            register: function (user) {
                return $http.post('/register', user)
                    .then(function (data) {
                        auth.saveToken(data.data.token);
                        $rootScope.currentUser = auth.currentUser();
                    }, function (response) {
                        //TODO Handle error
                        console.log(response);
                    });
            },
            logIn: function (user) {
                return $http.post('/login', user)
                    .then(function (data) {
                        auth.saveToken(data.data.token);
                        $rootScope.currentUser = auth.currentUser();
                    }, function (error) {
                        console.log('Login error: ' + error.data);
                        throw error.status + ' : ' + error.data;
                    });
            },
            logOut: function () {
                $window.localStorage.removeItem('cc-token');
                $rootScope.currentUser = null;
                $state.go('landing');
            }
        };

        return auth;
    }]);