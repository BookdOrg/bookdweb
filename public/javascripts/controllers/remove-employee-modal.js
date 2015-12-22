/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, employee, businessInfo) {
    $scope.employee = employee;
    $scope.employeeHasService = false;
    $scope.associatedServices = [];

    var business = businessInfo;
    var services = businessInfo.services;
    for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
        var employees = services[serviceIndex].employees;
        //If a service only has 1 employee, check if the employee being removed is part of the service.
        //If true, cannot remove employee, otherwise, remove employee from business & from services he may be a part of.
        if (employee && employees.length == 1) {
            if (employee._id === employees[0] || employee._id === employees[0]._id) {
                $scope.associatedServices.push(services[serviceIndex].name);
                $scope.employeeHasService = true;
            }
        }
        //for (var employeeIndex = 0; employeeIndex < employees.length; employeeIndex++) {
        //    if (employee._id === employees[employeeIndex]._id) {
        //        $scope.associatedServices.push(services[serviceIndex].name);
        //        $scope.employeeHasService = true;
        //    }
        //}
    }

    $scope.remove = function () {
        var business = businessInfo;
        var services = businessInfo.services;
        var associatedServices = [];

        //When removing employee, go through the list of services
        //Go through each employee of that service
        //If removing employee is part of service, get the serviceId and remove employee from service.
        for (var serviceIndex = 0; serviceIndex < services.length; serviceIndex++) {
            var service = services[serviceIndex];
            var employees = service.employees;
            for (var employeeIndex = 0; employeeIndex < employees.length; employeeIndex++) {
                if (employee._id === employees[employeeIndex]._id || employee._id === employees[employeeIndex]) {
                    associatedServices.push(service._id);
                }
            }
        }
        var selectedEmployee = {
            businessId: business._id,
            employeeId: employee._id,
            serviceList: associatedServices
        };

        businessFactory.removeEmployee(selectedEmployee);
        $uibModalInstance.close(businessInfo._id);
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};