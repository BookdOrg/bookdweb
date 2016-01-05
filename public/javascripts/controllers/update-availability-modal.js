/**
 * Created by khalilbrown on 12/26/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $uibModalInstance,employee,$rootScope) {
    $scope.employee = employee;

    if(employee._id!==$rootScope.currentUser._id){
        $scope.disableUpdate = true;
    }
    /**
     * Allows employee to add a break on a given day
     *
     * @param day - the day of the week that the day should be created on
     */
    $scope.addBreak = function (day) {
        var gap = {
            start: moment().hour(12).minute(0).format(),
            end: moment().hour(13).minute(0).format()
        };
        day.gaps.push(gap);
    };
    /**
     *
     * Configuration for the time picker object in the employee schedule section.
     *
     * @type {number}
     */
    $scope.hstep = 1;
    $scope.mstep = 15;
    $scope.ismeridian = true;
    $scope.toggleMode = function () {
        $scope.ismeridian = !$scope.ismeridian;
    };
    /**
     * Flag for the update availability spinner
     * @type {boolean}
     */
    $scope.showDone = false;

    /**
     * Send the availability object to the backend so the users available times can be updated.
     *
     * @param availability - Object containing the hours for a given employee for each day of the week and for breaks
     */
    $scope.updateAvailability = function (availability) {
        $scope.showLoading = true;
        userFactory.updateAvailability(availability)
            .then(function (data) {
                auth.saveToken(data.token);
                $scope.showLoading = false;
                $scope.showDone = true;
            });
    };

    $scope.breakStatus = false;
    $scope.deleteGap = function (day, gap, index) {
        day.gaps.splice(index, 1);
    };

    $scope.close = function () {
        $uibModalInstance.dismiss('cancel');
    };
};