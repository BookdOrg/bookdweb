/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, business, $timeout) {

    $scope.business = business;

    $scope.serviceEmployees = [];
    /**
     * Defines the settings we want to use in the angularjs-dropdown-multiselect
     *
     * Documentation can be found here: http://dotansimha.github.io/angularjs-dropdown-multiselect/#/
     *
     * @type {{displayProp: string, idProp: string, externalIdProp: string, smartButtonMaxItems: number, smartButtonTextConverter: Function}}
     */
    $scope.settings = {
        displayProp: 'name',
        idProp: '_id',
        externalIdProp: '_id',
        smartButtonMaxItems: 3,
        smartButtonTextConverter: function (itemText, originalItem) {
            return originalItem.firstName;
        }
    };
    $scope.customTexts = {
        buttonDefaultText: 'Select Associates'
    };
    /**
     *
     * Method to confirm the creation of a new service
     *
     * @param service - The service object the B-Owner wants to
     * have added to their business
     */
    $scope.ok = function (service) {
        var hours = moment.duration(service.hours, 'hours');
        var minutes = moment.duration(hours).asMinutes();
        service.duration = minutes + service.minutes;
        service.businessId = business._id;
        /**
         * For each employee in the serviceEmployees array, we grab their id and put them
         * in the service.employees array since they will be object references in the DB
         *
         * @type {*|Array}
         */
        service.employees = _.map($scope.serviceEmployees, '_id');
        if (service.employees.length == 0) {
            $scope.showServiceError = true;
            $timeout(function () {
                $scope.showServiceError = false;
            }, 3000);
            return;
        }
        businessFactory.addService(service)
            .then(function (serviceResponse) {
                $uibModalInstance.close(serviceResponse);
            });
    };

    /**
     *
     * Dismiss the modal without taking further actions
     *
     */
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};
