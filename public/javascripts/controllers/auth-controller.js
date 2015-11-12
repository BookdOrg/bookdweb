angular.module('cc.auth-controller', [])
    .controller('AuthCtrl', [
        '$scope',
        '$state',
        'auth',
        '$modalInstance',
        'modalType',
        'state',
        'socket',
        '$rootScope',
        function ($scope, $state, auth, $modalInstance, modalType,state,socket,$rootScope) {
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
            //TODO handle all the possible error cases
            $scope.facebookLogin = function(){
                OAuth.popup('facebook',{cache: true})
                    .done(function(result) {
                        //console.log(result);
                        result.get('/me?fields=id,name,picture,email')
                            .done(function (response) {
                                var user = {
                                    'email':response.email,
                                    'provider': result.provider
                                };
                                auth.logIn(user)
                                    .then(function () {
                                        $state.go(state);
                                        $modalInstance.close();
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
            $scope.googleLogin = function(){
                OAuth.popup('google_plus',{cache: true})
                    .done(function(result) {
                        //console.log(result);
                        result.get('plus/v1/people/me')
                            .done(function (response) {
                                var user = {
                                    'email':response.emails[0].value,
                                    'provider': result.provider
                                };
                                auth.logIn(user)
                                    .then(function () {
                                        $state.go(state);
                                        $modalInstance.close();
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
            $scope.facebookSignup = function(){
                OAuth.popup('facebook',{cache: true})
                    .done(function(result) {
                        result.get('/me?fields=id,name,picture,email')
                            .done(function (response) {
                                var user = {
                                    'email':response.email,
                                    'name':response.name,
                                    'provider': result.provider
                                };
                                auth.register(user)
                                    .then(function () {
                                        $state.go(state);
                                        $modalInstance.close();
                                    },function(error){
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
            $scope.googleSignup = function(){
                OAuth.popup('google_plus',{cache: true})
                    .done(function(result) {
                        result.get('plus/v1/people/me')
                            .done(function (response) {
                                var user = {
                                    'email':response.emails[0].value,
                                    'name':response.displayName,
                                    'provider':result.provider
                                };
                                auth.register(user)
                                    .then(function () {
                                        $state.go(state);
                                        $modalInstance.close();
                                    },function(error){
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
            var onlineData ={
                user:'',
                location:{

                }
            };
            /**
             *
             */
            $scope.register = function () {
                var user = {
                    'email': $scope.user.email,
                    'name': $scope.user.firstName + ' ' + $scope.user.lastName,
                    'password': $scope.user.password,
                    'provider': 'bookd'
                };
                auth.register(user)
                    .then(function () {
                        //onlineData.user = $rootScope.currentUser._id;
                        //onlineData.location = $rootScope.currLocation;
                        //socket.emit('online',onlineData);
                        $state.go(state);
                        $modalInstance.close();
                },function(error){
                    $scope.error = error.message;
                });
            };
            /**
             *
             */
            $scope.logIn = function () {
                var user = {
                    'email': $scope.user.email,
                    'password': $scope.user.password
                };
                auth.logIn(user)
                    .then(function () {
                        //onlineData.user = $rootScope.currentUser._id;
                        //onlineData.location = $rootScope.currLocation;
                        //socket.emit('online',onlineData);
                        $state.go(state);
                        $modalInstance.close();
                }, function (error) {
                    $scope.error = error.message;
                });
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('close');
            };

        }]);
