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
            $scope.facebookLogin = function(){
                OAuth.popup('facebook')
                    .done(function(result) {
                        result.get('/me')
                            .done(function (response) {
                                //this will display "John Doe" in the console
                                console.log(response.name);
                            })
                            .fail(function (err) {
                                console.log(err);
                                //handle error with err
                            });
                    })
                    .fail(function (err) {
                        console.log(err);
                        //handle error with err
                    });
            };
            $scope.googleLogin = function(){
                OAuth.popup('google_plus')
                    .done(function(result) {
                        //result.get('/me')
                        //    .done(function (response) {
                        //        //this will display "John Doe" in the console
                        //        console.log(response.name);
                        //    })
                        //    .fail(function (err) {
                        //        console.log(err);
                        //        //handle error with err
                        //    });
                    })
                    .fail(function (err) {
                        console.log(err);
                        //handle error with err
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
                auth.register($scope.user)
                    .then(function () {
                        onlineData.user = $rootScope.currentUser._id;
                        onlineData.location = $rootScope.currLocation;
                        socket.emit('online',onlineData);
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
                auth.logIn($scope.user)
                    .then(function () {
                        onlineData.user = $rootScope.currentUser._id;
                        onlineData.location = $rootScope.currLocation;
                        socket.emit('online',onlineData);
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
