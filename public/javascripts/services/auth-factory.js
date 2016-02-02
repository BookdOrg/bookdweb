/*
 *
 * Created by: Khalil Brown
 *
 * AUTH Factory - Handles user authentication, login, registration, tokens.
 *
 */

module.exports = function ($http, $window, $rootScope, $state, $q, socketService, $interval) {
    var auth = {
        /**
         * Save the users authentication token
         *
         * @param token
         * @param user
         */
        saveUser: function (token, user) {
            if (user) {
                $window.localStorage['user'] = angular.toJson(user);
            }
            if (token) {
                $window.localStorage['bookd-token'] = token;
            }
        },
        /**
         * Retrieve the authentication token currently stored
         *
         * @returns {*}
         */
        getToken: function () {
            return $window.localStorage['bookd-token'];
        },
        getUser: function () {
            return $window.localStorage['user'];
        },
        /**
         * Save the provider information so it's not lost when the
         * bookd token changes
         *
         * @param info
         */
        saveProviderInfo: function (info) {
            $window.localStorage['providerInfo'] = info;
        },
        /**
         * Retrieve the provider info
         *
         * @returns {*}
         */
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
                var user = angular.fromJson(auth.getUser());
                user.providerInfo = auth.getProviderInfo();
                return user;
            }
        },
        register: function (user, info) {
            return $http.post('/register', user)
                .then(function (data) {
                    auth.saveUser(data.data.token, data.data.user);
                    if (info) {
                        auth.saveProviderInfo(info);
                    }
                    $rootScope.currentUser = angular.fromJson(auth.currentUser());
                    $rootScope.currentUser.providerInfo = auth.getProviderInfo();
                    socketService.emit('authorizationRes', $rootScope.currentUser._id);
                }, function (error) {
                    throw error.data;
                });
        },
        logIn: function (user, info) {
            return $http.post('/login', user)
                .then(function (data) {
                    auth.saveUser(data.data.token, data.data.user);
                    if (info) {
                        auth.saveProviderInfo(info);
                    }
                    $window.localStorage.setItem('monthYear', '');
                    $window.localStorage.setItem('masterList', angular.toJson({}));
                    $window.localStorage.setItem('monthYearArray', '');
                    $window.localStorage.setItem('previousBusiness', '');
                    $window.localStorage.setItem('previousPersonalMonthYear', '');
                    $rootScope.currentUser = angular.fromJson(auth.currentUser());
                    $rootScope.currentUser.providerInfo = auth.getProviderInfo();
                    socketService.emit('authorizationRes', $rootScope.currentUser._id);
                }, function (error) {
                    throw error.data;
                });
        },
        logOut: function () {
            $window.localStorage.removeItem('bookd-token');
            $window.localStorage.removeItem('monthYear');
            $window.localStorage.removeItem('masterList');
            $window.localStorage.removeItem('monthYearArray');
            $window.localStorage.removeItem('providerInfo');
            $window.localStorage.removeItem('previousBusiness');
            $window.localStorage.removeItem('previousPersonalMonthYear');
            $window.localStorage.removeItem('oauthio_provider_google_plus');
            $rootScope.currentUser = null;
            $state.go('landing');
        },
        reset: function (email) {
            var data = {
                email: email
            };
            return $http.post('/reset', data)
                .then(function (data) {
                    console.log(data);
                }, function (error) {
                    throw error.data;
                });
        }
    };

    return auth;
};