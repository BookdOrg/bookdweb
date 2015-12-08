/**
 * Created by Jonfor on 11/28/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, business) {

    $scope.business = business;

    // $scope.service = {
    //   employees: []
    // }
    $scope.serviceEmployees = [];
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
        businessFactory.addService(service);
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};
