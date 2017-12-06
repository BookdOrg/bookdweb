/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, userFactory, socketService, $http, businessInfo,
                           notificationFactory) {

    /**
     * Creates a new employee,
     *
     * @param id - ID of the user to be added as an employee
     */
    $scope.create = function (id) {
        /**
         * The employee object being sent to the backend
         *
         * businessId is used to find the business to add the employee to
         */
        var newEmployee = {
            businessId: businessInfo._id,
            employeeId: id,
            businessName: businessInfo.name
        };

        notificationFactory.addNotification(newEmployee.employeeId,
                'You have been added to ' + businessInfo.name +
                ' as an employee!', 'alert', true)
            .then(function () {

            }, function (err) {
                console.log(err);
            });

        businessFactory.addEmployee(newEmployee)
            .then(function () {
                //tell the employee to update dynamically
                socketService.emit('isEmployee', newEmployee.employeeId);
                $uibModalInstance.close(businessInfo._id);
            });
    };

    /**
     * Called when adding a new employee to a business.
     * Search for the employee by email and display the relevant result.
     * @param email - Email address of employee to search for.
     */
    $scope.findEmployee = function (email) {
        $scope.searched = false;
        $scope.searching = true;
        delete $scope.employee;
        userFactory.search(email).then(function (data) {
            $scope.searched = true;
            $scope.employee = data;
            $scope.searching = false;
        }, function (error) {
            $scope.searched = true;
            $scope.searching = false;
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
    $scope.$on('$destroy', function (event) {
        socketService.removeAllListeners();
    });
};