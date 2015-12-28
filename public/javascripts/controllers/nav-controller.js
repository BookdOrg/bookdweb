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

    /**
     * Tell the database that the notifications have been viewed.
     */
    $scope.viewAllNotifications = function () {
        notificationFactory.notificationsViewed().then(
            function (data) {

            }, function (err) {
                console.log(err);
            });

        $scope.newNotifications = [];
        changeAllNotifViewed($scope.notifications);
    };

    /**
     * Change the single notification to viewed=true, send to database.
     * @param index
     */
    $scope.viewNotification = function (index) {
        var id = $scope.notifications[index]._id;
        notificationFactory.notificationViewed(id).then(
            function (data) {

            }, function (err) {
                console.log(err);
            });

        $scope.notifications[index].viewed = true;

        //Remove the notification from the newNotifications array.
        var arrIndex = _.indexOf($scope.newNotifications, _.find($scope.newNotifications, {_id: id}));
        if (arrIndex > -1) {
            $scope.newNotifications.splice(arrIndex, 1);
        }
    };

    if (auth.isLoggedIn()) {
        notificationFactory.getNotifications().then(
            function (data) {
                $rootScope.currentUser.user.notifications = data;
                $scope.notifications = $rootScope.currentUser.user.notifications;
                $scope.newNotifications = _.filter($scope.notifications, {viewed: false});
            },
            function (err) {
                console.log(err);
            });
    }

    /**
     * Change notifications.viewed to true when "Mark all as viewed" is clicked.
     * @param notifications
     */
    function changeAllNotifViewed(notifications) {
        for (var i = 0; i < notifications.length; i++) {
            if (notifications[i].viewed === false) {
                notifications[i].viewed = true;
            }
        }
    }
};

