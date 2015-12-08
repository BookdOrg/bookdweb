/*
 *
 * Created by: Khalil Brown
 *
 * AUTH Factory - Handles user authentication, login, registration, tokens.
 *
 */

module.exports = function ($http, $window, $rootScope, $state, $q) {
    var auth = {
        saveToken: function (token) {
            $window.localStorage['cc-token'] = token;
        },
        getToken: function () {
            return $window.localStorage['cc-token'];
        },
        saveProviderInfo: function (info) {
            $window.localStorage['providerInfo'] = info;
        },
        getProviderInfo: function () {
            return $window.localStorage['providerInfo'];
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
                var data = {
                    'user': angular.fromJson($window.atob(token.split('.')[1])),
                    'providerInfo': auth.getProviderInfo()
                };
                return data;
            }
        },
        register: function (user, info) {
            return $http.post('/register', user)
                .then(function (data) {
                    auth.saveToken(data.data.token);
                    if (info) {
                        auth.saveProviderInfo(info);
                    }
                    $rootScope.currentUser = auth.currentUser();
                    $rootScope.currentUser.providerInfo = auth.getProviderInfo();
                }, function (error) {
                    throw error.data;
                });
        },
        logIn: function (user, info) {
            return $http.post('/login', user)
                .then(function (data) {
                    auth.saveToken(data.data.token);
                    if (info) {
                        auth.saveProviderInfo(info);
                    }
                    $rootScope.currentUser = auth.currentUser();
                    $rootScope.currentUser.providerInfo = auth.getProviderInfo();
                }, function (error) {
                    throw error.data;
                });
        },
        logOut: function () {
            $window.localStorage.removeItem('cc-token');
            $rootScope.currentUser = null;
            $state.go('landing');
        }
    };

    return auth;
};