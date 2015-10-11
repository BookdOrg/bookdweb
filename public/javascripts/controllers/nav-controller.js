angular.module('cc.nav-controller', ["google.places"])
    .controller('NavCtrl', [
        '$scope',
        'auth',
        '$state',
        'businessFactory',
        '$rootScope',
        '$modal',
        function ($scope, auth, $state, businessFactory, $rootScope, $modal) {
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.currentUser = auth.currentUser;
            $scope.logOut = auth.logOut;

            $scope.navbarCollapsed = true;
            $rootScope.show = false;

            $scope.animationEnabled = true;

            $scope.showSearch = function (show) {
                if (show) {
                    $rootScope.show = true;
                } else {
                    $rootScope.show = false;
                }
            };

            $scope.openLogin = function(size) {
                var modalInstance = $modal.open({
                    animation: $scope.animationEnabled,
                    templateUrl: 'partials/login.html',
                    controller: 'AuthCtrl',
                    size: size
                })
            };

            $scope.openSignup = function(size) {
                var modalInstance = $modal.open({
                    animation: $scope.animationEnabled,
                    templateUrl: 'partials/register.html',
                    controller: 'AuthCtrl',
                    size: size
                })
            }


        }])
    .controller('messagesModalCtrl', function ($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });