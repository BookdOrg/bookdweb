module.exports = function ($scope, auth, $state, businessFactory, $rootScope, $uibModal, userFactory) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.logOut = auth.logOut;

    $scope.navbarCollapsed = true;
    $rootScope.show = false;

    $scope.animationEnabled = true;

    if (auth.isLoggedIn()) {
        userFactory.getUserAppts().then(
            function (data) {
                $rootScope.currentUser.user.appointments = data;
            },
            function (errorMessage) {
                console.log(errorMessage);
            }
        );
    }

    $scope.showSearch = function (show) {
        if (show) {
            $rootScope.show = true;
        }
    };

    $scope.open = function (type, state) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationEnabled,
            templateUrl: 'partials/login.html',
            controller: 'AuthCtrl',
            resolve: {
                modalType: function () {
                    return type;
                },
                state: function () {
                    return state;
                }
            }
        });
    };

    $scope.goToClaim = function () {
        if (!auth.isLoggedIn()) {
            $scope.open('login', 'search');
        } else {
            $state.go('search');
        }
    };
};

