/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, service, business, serviceIndex) {

    $scope.editService = service;
    $scope.business = business;

    $scope.serviceEmployees = [];

    var duration = parseInt(service.duration);
    var durationAsMinutes = moment.duration(duration, 'minutes');
    $scope.editService.hours = moment.duration(durationAsMinutes).hours();
    $scope.editService.minutes = moment.duration(durationAsMinutes).minutes();
    /**
     *
     * Create the serviceEmployees array we're going to use as the model for the multi-select
     *
     * What's going on with the condition on line 23? lol
     *
     */
    for (var employeeIndex = 0; employeeIndex < business.employees.length; employeeIndex++) {
        var tempObject = {
            "_id": business.employees[employeeIndex]._id
        };
        for (var serviceEmployeeIndex = 0; serviceEmployeeIndex < $scope.editService.employees.length; serviceEmployeeIndex++) {
            if ($scope.editService.employees[serviceEmployeeIndex]._id === business.employees[employeeIndex]._id || $scope.editService.employees[serviceEmployeeIndex] === business.employees[employeeIndex]._id) {
                $scope.serviceEmployees.push(tempObject);
            }
        }
    }
    /**
     * Settings for the employee multiselect dropdown
     *
     * @type {{displayProp: string, idProp: string, externalIdProp: string, smartButtonMaxItems: number, smartButtonTextConverter: Function}}
     */
    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        smartButtonTextConverter: function (itemText, originalItem) {
            return itemText;
        }
    };
    /**
     * Update the service
     *
     * @param service - the service object being updated
     */
    $scope.ok = function (service) {
        service.businessId = business._id;
        //Set the services array of employees equal to the ones selected in the multi-select. Array of _id;s
        service.employees = _.pluck($scope.serviceEmployees, '_id');
        businessFactory.updateService(service)
            .then(function (data) {
                business.services[serviceIndex] = data;
                $uibModalInstance.close();
            });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};