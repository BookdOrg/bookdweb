/*
 *
 * Created by: Khalil Brown
 *
 * AUTH Factory - Handles user authentication, login, registration, tokens.
 *
 */

module.exports = function ($http, $window, $rootScope, $state, $q, socketService) {
    var auth = {
        /**
         * Save the users authentication token
         *
         * @param token
         */
        saveToken: function (token) {
            $window.localStorage['cc-token'] = token;
        },
        /**
         * Retrieve the authentication token currently stored
         *
         * @returns {*}
         */
        getToken: function () {
            return $window.localStorage['cc-token'];
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
                var token = auth.getToken();
                return {
                    'user': angular.fromJson($window.atob(token.split('.')[1])),
                    'providerInfo': auth.getProviderInfo()
                };
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
                    socketService.emit('authorizationRes', $rootScope.currentUser.user._id);
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
                    $window.localStorage.setItem('monthYear', '');
                    $window.localStorage.setItem('masterList', {});
                    $window.localStorage.setItem('monthYearArray', '');
                    $window.localStorage.setItem('previousBusiness', '');
                    $window.localStorage.setItem('previousPersonalMonthYear', '');
                    $rootScope.currentUser = auth.currentUser();
                    $rootScope.currentUser.providerInfo = auth.getProviderInfo();
                    socketService.emit('authorizationRes', $rootScope.currentUser.user._id);
                }, function (error) {
                    throw error.data;
                });
        },
        logOut: function () {
            $window.localStorage.removeItem('cc-token');
            $window.localStorage.removeItem('monthYear');
            $window.localStorage.removeItem('masterList');
            $window.localStorage.removeItem('monthYearArray');
            $window.localStorage.removeItem('providerInfo');
            $window.localStorage.removeItem('previousBusiness');
            $window.localStorage.removeItem('previousPersonalMonthYear');
            $rootScope.currentUser = null;
            //socketService.disconnect();
            $state.go('landing');
        }
    };

    return auth;
};