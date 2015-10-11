angular.module('cc.auth-controller', [])
    .controller('AuthCtrl', [
        '$scope',
        '$state',
        'auth',
        '$modalInstance',
        'modalType',
        function ($scope, $state, auth, $modalInstance, modalType) {
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
                //auth.register($scope.user).error(function (error) {
                //    $scope.error = error;
                //}).then(function () {
                //    $state.go('landing');
                //});
                auth.register($scope.user).then(function () {
                    $state.go('landing');
                    $modalInstance.close();
                });
            };
            /**
             *
             */
            $scope.logIn = function () {
                //auth.logIn($scope.user).error(function (error) {
                //    $scope.error = error;
                //}).then(function () {
                //    $state.go('feed');
                //});
                auth.logIn($scope.user).then(function () {
                    $state.go('feed');
                    $modalInstance.close();
                }, function (err) {
                    //TODO Handle error
                });
            };

            $scope.cancel = function() {
                $modalInstance.dismiss('close');
            };

        }]);
