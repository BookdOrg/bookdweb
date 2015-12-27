module.exports = function ($scope, auth, $state, businessFactory, $rootScope, $uibModal, userFactory, socketService,
                           $timeout, notificationFactory) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.logOut = auth.logOut;

    $scope.navbarCollapsed = true;
    $rootScope.show = false;

    $scope.animationEnabled = true;
    if ($state.current.name == 'landing') {
        $scope.forBusiness = true;
    } else {
        $scope.forBusiness = false;
    }
    socketService.on('clientUpdate', function (data) {
        auth.saveToken(data.token);
        $rootScope.currentUser = auth.currentUser();
    });

    /**
     * If the user is logged in we want to retrieve their
     * appointments and update the current user with those appointments
     * so that they can be used in the navbar.
     */
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
    /**
     * Helper function, used to determine which pages we should show the search
     * bar in the navbar. Gets called in the template
     *
     * @param show
     */
    $scope.showSearch = function (show) {
        if (show) {
            $rootScope.show = true;
        }
    };

    $scope.checkStateandLogin = function (type) {
        var state = $state.current.name;
        $scope.open(type, state);
    };
    /**
     * Function used to open the auth modal for registration and login.
     *
     * Called from the template when users click the login/sign up button
     *
     * @param type
     * @param state
     */
    $scope.open = function (type, state) {
        var modalInstance = $uibModal.open({
            animation: $scope.animationEnabled,
            templateUrl: 'partials/modals/auth-modal.html',
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
    /**
     * Takes the user to the claim business page, first checks to see if they
     * are authenticated. If they aren't we open the login modal, then take them to search
     *
     */
    $scope.goToClaim = function () {
        if (!auth.isLoggedIn()) {
            $scope.open('login', 'search');
        } else {
            $state.go('search');
        }
    };

    $scope.removeNotification = function (index) {

        var viewedNotification = $scope.notifications.splice(index, 1);
        $rootScope.currentUser.user.notifications = $scope.notifications;
        notificationFactory.notificationViewed(viewedNotification[0]._id).then(
            function (data) {

            }, function (err) {
                console.log(err);
            });
    };

    if (auth.isLoggedIn()) {
        notificationFactory.getNewNotifications().then(
            function (data) {
                $rootScope.currentUser.user.notifications = data;
                $scope.notifications = $rootScope.currentUser.user.notifications;
            },
            function (err) {
                console.log(err);
            });
    }
};

