/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, service, business, serviceIndex) {

    $scope.editService = service;
    $scope.business = business;

    $scope.serviceEmployees = [];

    for (var employeeIndex = 0; employeeIndex < business.employees.length; employeeIndex++) {
        var tempObject = {
            "_id": business.employees[employeeIndex]._id
        };
        for (var serviceEmployeeIndex = 0; serviceEmployeeIndex < $scope.editService.employees.length; serviceEmployeeIndex++) {
            if ($scope.editService.employees[serviceEmployeeIndex]._id === business.employees[employeeIndex]._id) {
                $scope.serviceEmployees.push(tempObject);
            }
        }
    }

    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        smartButtonTextConverter: function (itemText, originalItem) {
            return itemText;
        }
    };
    $scope.ok = function (service) {
        service.businessId = business._id;
        service.employees = _.pluck($scope.serviceEmployees, '_id');
        businessFactory.updateService(service)
            .then(function (data) {
                business.services[serviceIndex] = data;
            });
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};