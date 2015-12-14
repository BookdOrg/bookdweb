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
                socket.emit('isEmployee', data);
            });
        $uibModalInstance.close();
    };
    $http.get('https://oauth.io/request/facebook/?fields=picture.type(large)', {
        headers: {oauthio: 'k=mPBNkFFrqBA1L6cT0C7og9-xdQM&oauth_token=1652611575018107&oauth_token_secret=f0c880e05c257dff0cdf915e2372789b'}
    }).then(function (data) {
        console.log(data);
    });
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