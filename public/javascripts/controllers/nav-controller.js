var NavCtrl = function ($scope, auth, $state, businessFactory, $rootScope, $uibModal, userFactory) {
    $scope.isLoggedIn = auth.isLoggedIn;
    $scope.logOut = auth.logOut;

    $scope.navbarCollapsed = true;
    $rootScope.show = false;

    $scope.animationEnabled = true;

    if (auth.isLoggedIn()) {
        userFactory.getUserAppts().then(
            function (data) {
                $rootScope.currentUser.userFactory.appointments = data;
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
module.exports = NavCtrl;

var messageModalCtrl = function ($scope, $uibModalInstance) {
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};
module.exports = messageModalCtrl;

var notifFilter = function () {
    /**
     * Filter out appointments that occur before today.
     * Return array of appointments occurring today or later.
     * We append the number of days between the appointment day and today to each filtered appointment.
     * @param dates - An array of dates in MM/DD/YYYY format.
     */
    return function (dates) {
        if (!dates) {
            return;
        }
        var newDates = [],
            today = moment().startOf('day');

        for (var currDateIndex = 0; currDateIndex < dates.length; currDateIndex++) {
            var startDay = moment(dates[currDateIndex].start.date, 'MM/DD/YYYY'),
                numDaysAway = startDay.diff(today, 'days');

            if (numDaysAway > 0) {
                newDates.push(dates[currDateIndex]);
                newDates[newDates.length - 1].dayDiff = numDaysAway;
            }
        }
        return newDates;
    };
};
module.exports = notifFilter;
