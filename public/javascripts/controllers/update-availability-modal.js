/**
 * Created by khalilbrown on 12/26/15.
 */
module.exports = function ($scope, $state, auth, userFactory, $uibModalInstance, employee, $rootScope, $timeout, business) {
    $scope.employee = employee;
    if (business) {
      $scope.activeAvailability = _.find($scope.employee.availabilityArray, {'businessId': business._id});
        $scope.activeAvailability.availability = formatTimes($scope.activeAvailability.availability);
    } else {
        $scope.activeAvailability = $scope.employee.availabilityArray[0];
        $scope.activeAvailability.availability = formatTimes($scope.activeAvailability.availability);
    }

    $scope.switchAvailability = function (id) {
      $scope.activeAvailability = _.find($scope.employee.availabilityArray, {'businessId': id});
        $scope.activeAvailability.availability = formatTimes($scope.activeAvailability.availability);
    };

    var authorizedIndex = employee.authorizedUsers.indexOf($rootScope.currentUser._id);
    if (employee._id !== $rootScope.currentUser._id && authorizedIndex === -1) {
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
    $scope.mstep = 5;
    $scope.ismeridian = true;
    $scope.toggleMode = function () {
        $scope.ismeridian = !$scope.ismeridian;
    };
    /**
     * Flag for the update availability spinner
     * @type {boolean}
     */
    $scope.showDone = false;
    function formatTimes(availability) {
        var updatedAvailability = angular.copy(availability);
        _.forEach(updatedAvailability, function (availabilityObj) {
            availabilityObj.start = moment(availabilityObj.start, 'hh:mm a');
            availabilityObj.end = moment(availabilityObj.end, 'hh:mm a');
            _.forEach(availabilityObj.gaps, function (gap) {
                gap.start = moment(gap.start, 'hh:mm a');
                gap.end = moment(gap.end, 'hh:mm a');
            });
        });
        return updatedAvailability;
    }

    var unFormatTimes = function (availability) {
        var updatedAvailability = angular.copy(availability);
        _.forEach(updatedAvailability, function (availabilityObj) {
            availabilityObj.start = moment(availabilityObj.start).format('hh:mm a');
            availabilityObj.end = moment(availabilityObj.end).format('hh:mm a');
            _.forEach(availabilityObj.gaps, function (gap) {
                gap.start = moment(gap.start).format('hh:mm a');
                gap.end = moment(gap.end).format('hh:mm a');
            });
        });
        return updatedAvailability;
    };
    /**
     * Send the availability object to the backend so the users available times can be updated.
     *
     * @param availability - Object containing the hours for a given employee for each day of the week and for breaks
     */
    $scope.updateAvailability = function (availability) {
        var updatedAvailability = unFormatTimes(availability);
        var updateObj = {
            businessName: $scope.activeAvailability.businessName,
            businessId: $scope.activeAvailability.businessId,
            id: employee._id,
            availability: updatedAvailability
        };
        //$scope.showLoading = true;
        $scope.showDone = false;
        userFactory.updateAvailability(updateObj)
            .then(function (data) {
                $rootScope.currentUser.availabilityArray = data;
                auth.saveUser(null, $rootScope.currentUser);
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