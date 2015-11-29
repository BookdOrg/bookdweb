/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, user) {

    $scope.create = function (id) {
        var business = businessFactory.business;
        var newEmployee = {
            businessId: business.info._id,
            employeeId: id
        };
        businessFactory.addEmployee(newEmployee);
        $uibModalInstance.close();
    };

    /**
     * Called when adding a new employee to a business.
     * Search for the employee by email and display the relevant result.
     * @param email - Email address of employee to search for.
     */
    $scope.findEmployee = function (email) {
        $scope.searched = false;
        user.search(email).then(function (data) {
            $scope.searched = true;
            $scope.employee = data;
        }, function (error) {
            $scope.searched = true;
        });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};