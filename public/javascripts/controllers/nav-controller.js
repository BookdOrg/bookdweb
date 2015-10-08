angular.module('cc.nav-controller', ["google.places"])
    .controller('NavCtrl', [
        '$scope',
        'auth',
        '$state',
        'businessFactory',
        '$rootScope',
        function ($scope, auth, $state, businessFactory, $rootScope) {
            $scope.isLoggedIn = auth.isLoggedIn;
            $scope.currentUser = auth.currentUser;
            $scope.logOut = auth.logOut;

            $scope.navbarCollapsed = true;
            $rootScope.show = false;

            $scope.showSearch = function (show) {
                if (show) {
                    $rootScope.show = true;
                } else {
                    $rootScope.show = false;
                }
            };


        }])
    .controller('messagesModalCtrl', function ($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });