angular.module('cc.auth-controller', [])
    .controller('AuthCtrl', [
        '$scope',
        '$state',
        'auth',
        '$modalInstance',
        function ($scope, $state, auth, $modalInstance) {
            $scope.user = {};
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
