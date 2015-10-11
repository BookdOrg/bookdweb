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

            $scope.open = function(type) {
                var modalInstance = $modal.open({
                    animation: $scope.animationEnabled,
                    templateUrl: 'partials/login.html',
                    controller: 'AuthCtrl',
                    resolve: {
                        modalType: function() {
                            return type;
                        }
                    }
                })
            };

        }])
    .controller('messagesModalCtrl', function ($scope, $modalInstance) {
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    });