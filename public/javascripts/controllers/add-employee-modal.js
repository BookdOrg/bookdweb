/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, userFactory, socketService, $http) {
    /**
     * Creates a new employee,
     *
     * @param id - ID of the user to be added as an employee
     */
    $scope.create = function (id) {
        var business = businessFactory.business;
        //The employee object being sent to the backend
        var newEmployee = {
            businessId: business.info._id,
            employeeId: id
        };
        businessFactory.addEmployee(newEmployee)
            .then(function (data) {
                //Let the server know that a user has been set as an employee
                socketService.emit('isEmployee', newEmployee.employeeId);
            });
        $uibModalInstance.close();
    };
    //TODO come back to integrating profile pictures
    //OAuth.callback('facebook','',function(data){
    //    console.log(data)
    //})

    /**
     * Called when adding a new employee to a business.
     * Search for the employee by email and display the relevant result.
     * @param email - Email address of employee to search for.
     */
    $scope.findEmployee = function (email) {
        $scope.searched = false;
        userFactory.search(email).then(function (data) {
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