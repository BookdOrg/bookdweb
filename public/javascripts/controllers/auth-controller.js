module.exports = function ($scope, $state, auth, $uibModalInstance, modalType, state, socketService, $rootScope,
                           userFactory, notificationFactory, tier, $window) {
    $scope.user = {};
    $scope.tabs = [
        {
            title: 'Log In'
        },
        {
            title: 'Sign up'
        }
    ];

    if (modalType === 'login') {
        $scope.tabs[0].active = true;
    } else if (modalType === 'signup') {
        $scope.tabs[1].active = true;
    }
    var onlineData = {
        user: '',
        location: {}
    };
    $scope.refreshErrors = function () {
        $scope.error = null;
        $scope.user = {};
    };
    //TODO handle all the possible error cases
    $scope.facebookLogin = function () {
        OAuth.popup('facebook', {cache: true})
            .done(function (result) {
                //console.log(result);
                result.get('/me?fields=id,name,picture.type(large),email')
                    .done(function (response) {
                        var user = {
                            'username': response.email,
                            'provider': result.provider
                        };
                        auth.logIn(user, response.picture.data.url)
                            .then(function () {
                                onlineData.user = $rootScope.currentUser.user._id;
                                socketService.emit('online', onlineData);
                                $state.go(state, {tier: tier});
                                getNotifications();
                                $uibModalInstance.close();
                            }, function (error) {
                                $scope.error = error.message;
                            });
                    })
                    .fail(function (err) {
                        //console.log(err);
                        //handle error with err
                    });
            })
            .fail(function (err) {
                //console.log(err);
                //handle error with err
            });
    };
    $scope.googleLogin = function () {
        OAuth.popup('google_plus', {cache: true})
            .done(function (result) {
                //console.log(result);
                result.get('plus/v1/people/me')
                    .done(function (response) {
                        var user = {
                            'username': response.emails[0].value,
                            'provider': result.provider
                        };
                        var profilePicture = response.image.url.replace('sz=50', 'sz=200');
                        auth.logIn(user, profilePicture)
                            .then(function () {
                                onlineData.user = $rootScope.currentUser.user._id;
                                socketService.emit('online', onlineData);
                                $state.go(state, {tier: tier});
                                getNotifications();
                                $uibModalInstance.close();
                            }, function (error) {
                                $scope.error = error.message;
                                $window.localStorage.removeItem('oauthio_provider_google_plus');
                            });
                    })
                    .fail(function (err) {
                        //console.log(err);
                        //handle error with err
                    });
            })
            .fail(function (err) {
                //console.log(err);
                //handle error with err
            });
    };
    $scope.facebookSignup = function () {
        OAuth.popup('facebook', {cache: true})
            .done(function (result) {
                result.get('/me?fields=id,name,picture.type(large),email')
                    .done(function (response) {
                        var user = {
                            'username': response.email,
                            'name': response.name,
                            'provider': result.provider,
                            'providerId': response.id
                        };
                        var profilePicture = response.picture.data.url;
                        auth.register(user, profilePicture)
                            .then(function () {
                                onlineData.user = $rootScope.currentUser.user._id;
                                socketService.emit('online', onlineData);
                                $state.go(state, {tier: tier});
                                $rootScope.currentUser.user.notifications = [];
                                $uibModalInstance.close();
                            }, function (error) {
                                $scope.error = error.message;
                            });
                    })
                    .fail(function (err) {
                        //console.log(err);
                    });
            })
            .fail(function (err) {
                //console.log(err);
            });
    };
    $scope.googleSignup = function () {
        OAuth.popup('google_plus', {cache: true})
            .done(function (result) {
                result.get('plus/v1/people/me')
                    .done(function (response) {
                        var user = {
                            'username': response.emails[0].value,
                            'name': response.displayName,
                            'provider': result.provider,
                            'providerId': response.id
                        };
                        auth.register(user, response.image.url)
                            .then(function () {
                                onlineData.user = $rootScope.currentUser.user._id;
                                socketService.emit('online', onlineData);
                                $state.go(state, {tier: tier});
                                $rootScope.currentUser.user.notifications = [];
                                $uibModalInstance.close();
                            }, function (error) {
                                $scope.error = error.message;
                            });
                    })
                    .fail(function (err) {
                        //console.log(err);
                    });
            })
            .fail(function (err) {
                //console.log(err);
            });
    };
    /**
     * Register via Bookd
     */
    $scope.register = function () {
        var user = {
            'username': $scope.user.email,
            'name': $scope.user.firstName + ' ' + $scope.user.lastName,
            'password': $scope.user.password,
            'provider': 'bookd'
        };
        auth.register(user)
            .then(function () {
                onlineData.user = $rootScope.currentUser.user._id;
                socketService.emit('online', onlineData);
                $state.go(state, {tier: tier});
                $rootScope.currentUser.user.notifications = [];
                $uibModalInstance.close();
            }, function (error) {
                $scope.error = error.message;
            });
    };
    /**
     * Login via Bookd
     */
    $scope.logIn = function () {
        var user = {
            'username': $scope.user.email,
            'password': $scope.user.password,
            'provider': 'bookd'
        };
        auth.logIn(user)
            .then(function () {
                onlineData.user = $rootScope.currentUser.user._id;
                socketService.emit('online', onlineData);
                getNotifications();
                $state.go(state, {tier: tier});
                $uibModalInstance.close();
            }, function (error) {
                $scope.error = error.message;
            });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('close');
    };

    var getNotifications = function () {
        notificationFactory.getNotifications().then(
            function (data) {
                $rootScope.currentUser.user.notifications = data;
            },
            function (err) {
                console.log(err);
            }
        );
    };

    $scope.$on('$destroy', function (event) {
        socketService.removeAllListeners();
    });

};
