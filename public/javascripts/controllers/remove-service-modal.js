/**
 * Created by Jonfor on 12/25/15.
 */
module.exports = function ($scope, $uibModalInstance, businessFactory, service, serviceIndex, business) {
    $scope.service = service;

    //Delete the service
    $scope.remove = function () {
        var serviceObj = {
            serviceId: service._id,
            businessId: business._id
        };
        businessFactory.removeService(serviceObj)
            .then(function (response) {
                $uibModalInstance.close();
            });
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
};