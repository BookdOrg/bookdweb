/**
 * Created by khalilbrown on 12/26/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $uibModalInstance, employee, $rootScope, $timeout, business) {
    $scope.employee = employee;
    var businessInfo = business;
    if (business) {
        $scope.activeAvailability = _.findWhere($scope.employee.availabilityArray, {'businessId': businessInfo._id});
    } else {
        $scope.activeAvailability = $scope.employee.availabilityArray[0];
    }

    $scope.switchAvailability = function (id) {
        $scope.activeAvailability = _.findWhere($scope.employee.availabilityArray, {'businessId': id});
    };
    if(employee._id!==$rootScope.currentUser.user._id){
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
    //$scope.showLoading = false;
    /**
     * Send the availability object to the backend so the users available times can be updated.
     *
     * @param availability - Object containing the hours for a given employee for each day of the week and for breaks
     */
    $scope.updateAvailability = function (availability) {
        var updateObj = {
            businessName: $scope.activeAvailability.businessName,
            businessId: $scope.activeAvailability.businessId,
            id: employee._id,
            availability: availability
        };
        //$scope.showLoading = true;
        $scope.showDone = false;
        userFactory.updateAvailability(updateObj)
            .then(function (data) {
                //$scope.showLoading = false;
                $scope.showDone = true;
                $timeout(function () {
                    $scope.showDone = false;
                }, 2000);
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