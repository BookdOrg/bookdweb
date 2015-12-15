/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, userFactory, socketService, $http) {

    $scope.create = function (id) {
        var business = businessFactory.business;
        var newEmployee = {
            businessId: business.info._id,
            employeeId: id
        };
        businessFactory.addEmployee(newEmployee)
            .then(function (data) {
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