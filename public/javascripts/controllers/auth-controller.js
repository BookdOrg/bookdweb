angular.module('cc.auth-controller', [])
    .controller('AuthCtrl', [
        '$scope',
        '$state',
        'auth',
        '$modalInstance',
        'modalType',
        'state',
        function ($scope, $state, auth, $modalInstance, modalType,state) {
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

            /**
             *
             */
            $scope.register = function () {
                auth.register($scope.user)
                    .then(function () {
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
                        $state.go(state);
                        $modalInstance.close();
                }, function (error) {
                    console.log(error)
                    $scope.error = error.message;
                });
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('close');
            };

        }]);
